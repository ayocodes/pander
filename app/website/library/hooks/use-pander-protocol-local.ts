import { useQuery } from "@tanstack/react-query";
import {
  readContract,
  simulateContract,
  waitForTransactionReceipt,
  writeContract,
  getBlockNumber,
  getPublicClient,
} from "@wagmi/core";
import { format } from "date-fns";
import { useCallback, useReducer } from "react";
import {
  Hash,
  erc20Abi,
  formatEther,
  parseUnits,
  Log,
  decodeEventLog,
} from "viem";

import { config } from "@/library/providers/wagmi/config";
import { CONTRACT_ADDRESSES } from "@/library/types/contracts";
import capyCore from "@/library/types/contracts/capy-core";
import capyPoll from "@/library/types/contracts/capy-poll";

const CAPY_POLL_ABI = capyPoll.abi;
const CAPY_CORE_ABI = capyCore.abi;
const CAPY_CORE_ADDRESS = CONTRACT_ADDRESSES.CAPY_CORE;
const TEST_TOKEN_ADDRESS = CONTRACT_ADDRESSES.TEST_TOKEN;

// Types for events
interface PollCreatedEvent extends Log {
  args: {
    creator: string;
    pollAddress: string;
    yesToken: string;
    noToken: string;
    question: string;
    avatar: string;
    description: string;
  };
  blockNumber: bigint;
}

interface StakeAddedEvent extends Log {
  args: {
    user: string;
    amount: bigint;
    position: boolean;
    epoch: bigint;
  };
  blockNumber: bigint;
}

// Keep your existing types
type FunctionParams = {
  createPoll: {
    question: string;
    avatar: string;
    rule: string;
    duration: bigint;
    yesTokenName: string;
    yesTokenSymbol: string;
    noTokenName: string;
    noTokenSymbol: string;
  };
  stake: {
    pollAddress: Hash;
    amount: number;
    position: boolean;
  };
  withdrawFunds: {
    pollAddress: Hash;
  };
  getPollDetails: {
    pollAddress: Hash;
  };
  approve: {
    token: Hash;
    spender: Hash;
    amount: bigint;
  };
  resolvePoll: {
    pollAddress: Hash;
    winningPosition: boolean;
  };
};

// Keep your existing interfaces
interface PredictionMarket {
  pollAddress: Hash;
  avatar: string;
  question: string;
  status: "active" | "resolved";
  poolSize: number;
  participants: number;
  endDate: number;
  tags: never[];
  recentActivity: {
    id: string;
    user: string;
    action: string;
    choice: string;
    amount: number;
    timestamp: number;
    avatar: string;
    question: string;
  }[];
}

interface Poll {
  id: string;
  question: string;
  blockTimestamp: string;
  creator: string;
  pollAddress: Hash;
  avatar: string;
  description: string;
  yesToken: string;
  noToken: string;
  status: "active" | "resolved";
  startDate: number;
  endDate: number;
  poolSize: number;
  winner: "Yes" | "No";
  radialData: Array<{
    type: string;
    yes: number;
    no: number;
  }>;
  timeSeriesData: Array<{
    date: string;
    yes: number;
    no: number;
  }>;
  recentActivity: {
    id: string;
    user: string;
    action: string;
    choice: string;
    amount: number;
    timestamp: number;
    avatar: string;
  }[];
}

interface QueryState {
  marketParams: any;
  activityParams: any;
  pollAddress: string | null;
  pollActivityParams: any;
}

type QueryAction = {
  type: "UPDATE_PARAMS";
  payload: Partial<QueryState>;
};

const initialState: QueryState = {
  marketParams: {},
  activityParams: {},
  pollAddress: null,
  pollActivityParams: {},
};

const queryReducer = (state: QueryState, action: QueryAction): QueryState => {
  switch (action.type) {
    case "UPDATE_PARAMS":
      return { ...state, ...action.payload };
    default:
      return state;
  }
};

const usePanderProtocol = () => {
  const [state, dispatch] = useReducer(queryReducer, initialState);

  // Query fetcher functions
  const fetchMarkets = useCallback(async () => {
    try {
      const publicClient = getPublicClient(config);
      if (!publicClient) throw new Error("Failed to get public client");
      const currentBlock = await getBlockNumber(config);

      // Get all PollCreated events
      const pollCreatedLogs = await publicClient.getLogs({
        address: CAPY_CORE_ADDRESS as Hash,
        event: {
          type: "event",
          name: "PollCreated",
          inputs: [
            { indexed: true, name: "creator", type: "address" },
            { indexed: false, name: "pollAddress", type: "address" },
            { indexed: false, name: "yesToken", type: "address" },
            { indexed: false, name: "noToken", type: "address" },
            { indexed: false, name: "question", type: "string" },
            { indexed: false, name: "avatar", type: "string" },
            { indexed: false, name: "description", type: "string" },
          ],
        },
        fromBlock: BigInt(0),
        toBlock: currentBlock,
      });

      const pollCreatedEvents = pollCreatedLogs.map((log) => ({
        ...log,
        args: decodeEventLog({
          abi: CAPY_CORE_ABI,
          data: log.data,
          topics: log.topics,
        }).args,
      })) as PollCreatedEvent[];

      // Transform events into PredictionMarket objects
      const markets = await Promise.all(
        pollCreatedEvents.map(async (event) => {
          const pollAddress = event.args.pollAddress as Hash;

          // Get poll info
          const pollInfo = await readContract(config, {
            address: pollAddress,
            abi: CAPY_POLL_ABI,
            functionName: "pollInfo",
            args: [],
          });

          // Get stake events for this poll
          const stakeLogs = await publicClient.getLogs({
            address: pollAddress,
            event: {
              type: "event",
              name: "StakeAdded",
              inputs: [
                { indexed: true, name: "user", type: "address" },
                { indexed: false, name: "amount", type: "uint256" },
                { indexed: false, name: "position", type: "bool" },
                { indexed: false, name: "epoch", type: "uint256" },
              ],
            },
            fromBlock: BigInt(0),
            toBlock: currentBlock,
          });

          const stakeEvents = stakeLogs.map((log) => ({
            ...log,
            args: decodeEventLog({
              abi: CAPY_POLL_ABI,
              data: log.data,
              topics: log.topics,
            }).args,
          })) as StakeAddedEvent[];

          // Calculate total yes/no amounts
          let totalYes = 0;
          let totalNo = 0;
          stakeEvents.forEach((stake) => {
            const amount = Number(formatEther(stake.args.amount));
            if (stake.args.position) {
              totalYes += amount;
            } else {
              totalNo += amount;
            }
          });

          // Transform stake events into recent activity
          const recentActivity = await Promise.all(
            stakeEvents.map(async (stake) => ({
              id: `${stake.transactionHash}-${stake.logIndex}`,
              user: stake.args.user,
              action: "staked",
              choice: stake.args.position ? "Yes" : "No",
              amount: Number(formatEther(stake.args.amount)),
              timestamp:
                Number(
                  (
                    await publicClient.getBlock({
                      blockNumber: stake.blockNumber,
                    })
                  ).timestamp
                ) * 1000,
              avatar: event.args.avatar,
              question: event.args.question,
            }))
          );

          return {
            pollAddress,
            avatar: event.args.avatar,
            question: event.args.question,
            status: pollInfo[4] ? "resolved" : "active",
            poolSize: Number(formatEther(pollInfo[3])),
            participants: new Set(stakeEvents.map((e) => e.args.user)).size,
            endDate: Number(pollInfo[0]) * 1000,
            tags: [],
            recentActivity: recentActivity
              .sort((a, b) => b.timestamp - a.timestamp)
              .slice(0, 3),
          } as PredictionMarket;
        })
      );

      return markets;
    } catch (error) {
      console.error("Error fetching markets:", error);
      throw error;
    }
  }, []);

  const fetchPoll = useCallback(async () => {
    if (!state.pollAddress) throw new Error("Poll ID required");

    try {
      const publicClient = getPublicClient(config);
      if (!publicClient) throw new Error("Failed to get public client");
      const currentBlock = await getBlockNumber(config);

      // Get poll creation event
      const pollCreatedLogs = await publicClient.getLogs({
        address: CAPY_CORE_ADDRESS as Hash,
        event: {
          type: "event",
          name: "PollCreated",
          inputs: [
            { indexed: true, name: "creator", type: "address" },
            { indexed: false, name: "pollAddress", type: "address" },
            { indexed: false, name: "yesToken", type: "address" },
            { indexed: false, name: "noToken", type: "address" },
            { indexed: false, name: "question", type: "string" },
            { indexed: false, name: "avatar", type: "string" },
            { indexed: false, name: "description", type: "string" },
          ],
        },
        fromBlock: BigInt(0),
        toBlock: currentBlock,
      });

      const [pollCreatedEvent] = pollCreatedLogs.map((log) => ({
        ...log,
        args: decodeEventLog({
          abi: CAPY_CORE_ABI,
          data: log.data,
          topics: log.topics,
        }).args,
      })) as PollCreatedEvent[];

      // Get poll info
      const pollInfo = await readContract(config, {
        address: state.pollAddress as Hash,
        abi: CAPY_POLL_ABI,
        functionName: "pollInfo",
        args: [],
      });

      // Get all stake events
      const stakeLogs = await publicClient.getLogs({
        address: state.pollAddress as Hash,
        event: {
          type: "event",
          name: "StakeAdded",
          inputs: [
            { indexed: true, name: "user", type: "address" },
            { indexed: false, name: "amount", type: "uint256" },
            { indexed: false, name: "position", type: "bool" },
            { indexed: false, name: "epoch", type: "uint256" },
          ],
        },
        fromBlock: BigInt(0),
        toBlock: currentBlock,
      });

      const stakeEvents = stakeLogs.map((log) => ({
        ...log,
        args: decodeEventLog({
          abi: CAPY_POLL_ABI,
          data: log.data,
          topics: log.topics,
        }).args,
      })) as StakeAddedEvent[];

      // Calculate total yes/no amounts
      let totalYes = 0;
      let totalNo = 0;
      stakeEvents.forEach((stake) => {
        const amount = Number(formatEther(stake.args.amount));
        if (stake.args.position) {
          totalYes += amount;
        } else {
          totalNo += amount;
        }
      });

      // Create time series data
      const timeSeriesMap = new Map<string, { yes: number; no: number }>();
      await Promise.all(
        stakeEvents.map(async (stake) => {
          const date = format(
            new Date(
              Number(
                (
                  await publicClient.getBlock({
                    blockNumber: stake.blockNumber,
                  })
                ).timestamp
              ) * 1000
            ),
            "yyyy-MM-dd"
          );
          const amount = Number(formatEther(stake.args.amount));

          const existing = timeSeriesMap.get(date) || { yes: 0, no: 0 };
          if (stake.args.position) {
            existing.yes += amount;
          } else {
            existing.no += amount;
          }
          timeSeriesMap.set(date, existing);
        })
      );

      const timeSeriesData = [
        { date: format(new Date(), "yyyy-MM-dd"), yes: 0, no: 0 },
        ...Array.from(timeSeriesMap.entries()).map(([date, data]) => ({
          date,
          yes: data.yes,
          no: data.no,
        })),
      ].sort((a, b) => a.date.localeCompare(b.date));

      // Get recent activity
      const recentActivity = await Promise.all(
        stakeEvents.map(async (stake) => ({
          id: `${stake.transactionHash}-${stake.logIndex}`,
          user: stake.args.user,
          action: "staked",
          choice: stake.args.position ? "Yes" : "No",
          amount: Number(formatEther(stake.args.amount)),
          timestamp:
            Number(
              (
                await publicClient.getBlock({ blockNumber: stake.blockNumber })
              ).timestamp
            ) * 1000,
          avatar: pollCreatedEvent.args.avatar,
        }))
      );

      const blockTimestamp = Number(
        (
          await publicClient.getBlock({
            blockNumber: pollCreatedEvent.blockNumber,
          })
        ).timestamp
      );

      return {
        id: state.pollAddress,
        question: pollCreatedEvent.args.question,
        blockTimestamp: blockTimestamp.toString(),
        creator: pollCreatedEvent.args.creator,
        pollAddress: state.pollAddress as Hash,
        avatar: pollCreatedEvent.args.avatar,
        description: pollCreatedEvent.args.description,
        yesToken: pollCreatedEvent.args.yesToken,
        noToken: pollCreatedEvent.args.noToken,
        status: pollInfo[4] ? "resolved" : "active",
        startDate: blockTimestamp * 1000,
        endDate: Number(pollInfo[0]) * 1000,
        poolSize: Number(formatEther(pollInfo[3])),
        winner: pollInfo[5] ? "Yes" : "No",
        radialData: [{ type: "vote", yes: totalYes, no: totalNo }],
        timeSeriesData,
        recentActivity: recentActivity
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 3),
      } as Poll;
    } catch (error) {
      console.error("Error fetching poll:", error);
      throw error;
    }
  }, [state.pollAddress]);

  // Keep your existing contract interaction functions
  const approve = useCallback(async (params: FunctionParams["approve"]) => {
    try {
      const { request } = await simulateContract(config, {
        abi: erc20Abi,
        address: params.token,
        functionName: "approve",
        args: [params.spender, params.amount],
      });

      const hash = await writeContract(config, request);

      return waitForTransactionReceipt(config, {
        hash,
      });
    } catch (error) {
      console.error("Error approving token:", error);
      throw error;
    }
  }, []);

  const createPoll = async (params: FunctionParams["createPoll"]) => {
    try {
      const formattedAmount = parseUnits("2", 18);
      await approve({
        token: TEST_TOKEN_ADDRESS,
        spender: CAPY_CORE_ADDRESS,
        amount: formattedAmount,
      });

      const { request } = await simulateContract(config, {
        abi: CAPY_CORE_ABI,
        address: CAPY_CORE_ADDRESS,
        functionName: "createPoll",
        args: [
          params.question,
          params.avatar,
          params.rule,
          params.duration,
          params.yesTokenName,
          params.yesTokenSymbol,
          params.noTokenName,
          params.noTokenSymbol,
        ],
      });

      const hash = await writeContract(config, request);
      return waitForTransactionReceipt(config, {
        hash,
      });
    } catch (error) {
      console.error("Error creating poll:", error);
      throw error;
    }
  };

  const stake = async (params: FunctionParams["stake"]) => {
    try {
      const formattedAmount = parseUnits(params.amount.toString(), 18);

      await approve({
        token: TEST_TOKEN_ADDRESS,
        spender: params.pollAddress,
        amount: formattedAmount,
      });

      const { request } = await simulateContract(config, {
        abi: CAPY_POLL_ABI,
        address: params.pollAddress,
        functionName: "stake",
        args: [formattedAmount, params.position],
      });

      return writeContract(config, request);
    } catch (error) {
      console.error("Error staking:", error);
      throw error;
    }
  };

  const withdrawFunds = useCallback(
    async (params: FunctionParams["withdrawFunds"]) => {
      try {
        const { request } = await simulateContract(config, {
          abi: CAPY_POLL_ABI,
          address: params.pollAddress,
          functionName: "withdrawStake",
          args: [],
        });
        const hash = await writeContract(config, request);

        return waitForTransactionReceipt(config, {
          hash,
        });
      } catch (error) {
        console.error("Error withdrawing funds:", error);
        throw error;
      }
    },
    []
  );

  const updateParams = useCallback((updates: Partial<QueryState>) => {
    dispatch({ type: "UPDATE_PARAMS", payload: updates });
  }, []);

  const resolvePoll = async (params: FunctionParams["resolvePoll"]) => {
    try {
      const { request } = await simulateContract(config, {
        abi: CAPY_POLL_ABI,
        address: params.pollAddress,
        functionName: "resolvePoll",
        args: [params.winningPosition],
      });
      const hash = await writeContract(config, request);
      return waitForTransactionReceipt(config, {
        hash,
      });
    } catch (error) {
      console.error("Error resolving poll:", error);
      throw error;
    }
  };

  const addTokenToWallet = async (walletAddress: string) => {
    if (!window.ethereum) return;
    try {
      const symbol = await readContract(config, {
        address: walletAddress as Hash,
        abi: erc20Abi,
        functionName: "symbol",
        args: [],
      });

      await window.ethereum.request({
        method: "wallet_watchAsset",
        params: {
          type: "ERC20",
          options: {
            address: walletAddress,
            symbol: symbol as string,
            decimals: 18,
          },
        },
      });
    } catch (err) {
      console.error("Failed to add token to wallet:", err);
    }
  };

  const getCurrentEpoch = useCallback(async (pollAddress: Hash) => {
    try {
      const currentEpoch = await readContract(config, {
        address: pollAddress,
        abi: CAPY_POLL_ABI,
        functionName: "currentEpoch",
        args: [],
      });

      return currentEpoch;
    } catch (error) {
      console.error("Error getting current epoch:", error);
      throw error;
    }
  }, []);

  const getEpochInfo = useCallback(
    async (pollAddress: Hash, epochNumber: number) => {
      try {
        const epochInfo = await readContract(config, {
          address: pollAddress,
          abi: CAPY_POLL_ABI,
          functionName: "getEpochInfo",
          args: [BigInt(epochNumber)],
        });

        return {
          startTime: Number(epochInfo[0]),
          endTime: Number(epochInfo[1]),
          totalDistribution: formatEther(epochInfo[2]),
          isDistributed: epochInfo[3],
          numStakers: Number(epochInfo[4]),
        };
      } catch (error) {
        console.error("Error getting epoch info:", error);
        throw error;
      }
    },
    []
  );

  // Queries using React Query
  const predictionMarkets = useQuery({
    queryKey: ["prediction-markets", state.marketParams],
    queryFn: fetchMarkets,
  });

  const poll = useQuery({
    queryKey: ["poll", state.pollAddress],
    queryFn: fetchPoll,
    enabled: !!state.pollAddress,
  });

  return {
    predictionMarkets,
    poll,
    createPoll,
    stake,
    withdrawFunds,
    updateParams,
    resolvePoll,
    addTokenToWallet,
    getCurrentEpoch,
    getEpochInfo,
  };
};

export default usePanderProtocol;
