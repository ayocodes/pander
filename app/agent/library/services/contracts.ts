import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { foundry } from "viem/chains";

import capyCore from "../../../website/library/types/contracts/capy-core.js";
import capyPoll from "../../../website/library/types/contracts/capy-poll.js";
import { logger } from "../../utils/logger.js";

// For local development with Anvil
const publicClient = createPublicClient({
  chain: foundry,
  transport: http("http://localhost:8545"),
});

// Use one of Anvil's default private keys
const privateKey =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const account = privateKeyToAccount(privateKey as `0x${string}`);

const walletClient = createWalletClient({
  account,
  chain: foundry,
  transport: http("http://localhost:8545"),
});

export class ContractService {
  private readonly CAPY_CORE_ADDRESS = capyCore.address;
  private readonly CAPY_CORE_ABI = capyCore.abi;
  private readonly CAPY_POLL_ABI = capyPoll.abi;
  private readonly serviceLogger = logger.child({
    component: "ContractService",
  });
  private readonly SUBGRAPH_URL = "http://192.168.0.199:42069/";

  async getPollCount(): Promise<number> {
    try {
      const count = await publicClient.readContract({
        address: this.CAPY_CORE_ADDRESS,
        abi: this.CAPY_CORE_ABI,
        functionName: "getPollCount",
      });
      this.serviceLogger.info("Current poll count: " + Number(count));
      return Number(count);
    } catch (error) {
      this.serviceLogger.error("Failed to get poll count", { error });
      throw error;
    }
  }

  async getNewPolls(startIndex: number, endIndex: number) {
    this.serviceLogger.info(
      `Fetching polls from index ${startIndex} to ${endIndex}`
    );
    const polls = [];
    for (let i = startIndex; i < endIndex; i++) {
      try {
        const pollAddress = await publicClient.readContract({
          address: this.CAPY_CORE_ADDRESS,
          abi: this.CAPY_CORE_ABI,
          functionName: "getPollAt",
          args: [BigInt(i)],
        });
        this.serviceLogger.info(`Found poll at index ${i}: ${pollAddress}`);
        polls.push(pollAddress);
      } catch (error) {
        this.serviceLogger.error(`Failed to get poll at index ${i}`, { error });
        throw error;
      }
    }
    return polls;
  }

  async getPollInfo(pollAddress: `0x${string}`) {
    return publicClient.readContract({
      address: pollAddress,
      abi: this.CAPY_POLL_ABI,
      functionName: "getPollInfo",
    });
  }

  async getCurrentEpoch(pollAddress: `0x${string}`) {
    return publicClient.readContract({
      address: pollAddress,
      abi: this.CAPY_POLL_ABI,
      functionName: "currentEpoch",
    });
  }

  async getEpochParticipantCount(
    pollAddress: `0x${string}`,
    epochNumber: number
  ): Promise<number> {
    try {
      const epochInfo = await this.getEpochInfo(pollAddress, epochNumber);
      return Number(epochInfo.numStakers);
    } catch (error) {
      this.serviceLogger.error(
        `Failed to get participant count for poll ${pollAddress}, epoch ${epochNumber}`,
        { error }
      );
      throw error;
    }
  }

  async getEpochInfo(pollAddress: `0x${string}`, epochNumber: number) {
    try {
      const epochInfo = await publicClient.readContract({
        address: pollAddress,
        abi: this.CAPY_POLL_ABI,
        functionName: "getEpochInfo",
        args: [BigInt(epochNumber)],
      });

      return {
        startTime: Number(epochInfo[0]),
        endTime: Number(epochInfo[1]),
        totalDistribution: Number(epochInfo[2]),
        isDistributed: epochInfo[3],
        numStakers: Number(epochInfo[4]),
      };
    } catch (error) {
      this.serviceLogger.error(
        `Failed to get epoch info for poll ${pollAddress}, epoch ${epochNumber}`,
        { error }
      );
      throw error;
    }
  }

  async distributeEpochRewards(
    pollAddress: `0x${string}`,
    epochNumber: number,
    offset: number = 0,
    batchSize: number = 100
  ) {
    try {
      this.serviceLogger.info(
        `Distributing rewards for poll ${pollAddress}, epoch ${epochNumber}, offset ${offset}, batch size ${batchSize}`
      );

      const { request } = await publicClient.simulateContract({
        address: pollAddress,
        abi: this.CAPY_POLL_ABI,
        functionName: "distributeEpochRewards",
        args: [BigInt(epochNumber)],
        account: account.address,
      });

      const hash = await walletClient.writeContract(request);
      this.serviceLogger.info(`Transaction submitted: ${hash}`);

      // Wait for transaction with shorter timeout for local network
      const receipt = await publicClient.waitForTransactionReceipt({
        hash,
        timeout: 5000, // 5 seconds timeout for local network
      });

      this.serviceLogger.info(`Transaction confirmed: ${hash}`, {
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed,
      });

      return hash;
    } catch (error) {
      this.serviceLogger.error(
        `Failed to distribute rewards for poll ${pollAddress}, epoch ${epochNumber}`,
        { error }
      );
      throw error;
    }
  }

  async resolvePoll(pollAddress: `0x${string}`, winningPosition: boolean) {
    try {
      const pollInfo = await this.getPollInfo(pollAddress);
      const currentTime = Math.floor(Date.now() / 1000);

      if (Number(pollInfo.endTimestamp) > currentTime) {
        throw new Error(
          `Poll ${pollAddress} cannot be resolved yet. Current time: ${currentTime}, Poll end: ${pollInfo.endTimestamp}`
        );
      }

      this.serviceLogger.info(
        `Resolving poll ${pollAddress} with winning position: ${winningPosition}`
      );

      const { request } = await publicClient.simulateContract({
        address: pollAddress,
        abi: this.CAPY_POLL_ABI,
        functionName: "resolvePoll",
        args: [winningPosition],
        account: account.address,
      });

      const hash = await walletClient.writeContract(request);
      this.serviceLogger.info(`Resolution transaction submitted: ${hash}`);

      // Wait for transaction with shorter timeout for local network
      const receipt = await publicClient.waitForTransactionReceipt({
        hash,
        timeout: 5000,
      });

      this.serviceLogger.info(`Resolution transaction confirmed: ${hash}`, {
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed,
      });

      return hash;
    } catch (error) {
      this.serviceLogger.error(`Failed to resolve poll ${pollAddress}`, {
        error,
      });
      throw error;
    }
  }

  async getPollDetails(pollAddress: `0x${string}`) {
    try {
      // Define the GraphQL query
      const query = `{
        pollCreateds(where: { pollAddress: "${pollAddress}" }) {
          items {
            blockTimestamp
            creator
            pollAddress
            avatar
            question
            description
            yesToken
            noToken
          }
          pageInfo {
            endCursor
            hasNextPage
            hasPreviousPage
            startCursor
          }
        }
      }`;

      // Define the expected response type
      type PollDetailsResponse = {
        data: {
          pollCreateds: {
            items: Array<{
              pollAddress: string;
              avatar: string;
              question: string;
              blockTimestamp: string;
              creator: string;
              description: string;
              yesToken: string;
              noToken: string;
            }>;
            pageInfo: {
              endCursor: string;
              hasNextPage: boolean;
              hasPreviousPage: boolean;
              startCursor: string;
            };
          };
        };
      };

      // Query the indexer using fetch
      const fetchResponse = await fetch(this.SUBGRAPH_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
      });

      if (!fetchResponse.ok) {
        throw new Error(
          `Subgraph request failed with status ${
            fetchResponse.status
          }: ${await fetchResponse.text()}`
        );
      }

      const response = (await fetchResponse.json()) as PollDetailsResponse;

      // Check if poll exists
      if (
        !response.data ||
        !response.data.pollCreateds ||
        response.data.pollCreateds.items.length === 0
      ) {
        throw new Error(`Poll ${pollAddress} does not exist in the indexer`);
      }

      const poll = response.data.pollCreateds.items[0];

      // Get poll info from contract
      const contractPollInfo = await this.getPollInfo(pollAddress);

      this.serviceLogger.info(`Found poll details for ${pollAddress}`, {
        question: poll.question,
        creator: poll.creator,
      });

      return {
        pollAddress: poll.pollAddress,
        avatar: poll.avatar,
        question: poll.question,
        description: poll.description,
        creator: poll.creator,
        yesToken: poll.yesToken,
        noToken: poll.noToken,
        startDate: Number(poll.blockTimestamp),
        endDate: Number(contractPollInfo.endTimestamp),
        poolSize: Number(contractPollInfo.totalStaked),
        winner: contractPollInfo.winningPosition ? "Yes" : "No",
        exists: true,
      };
    } catch (error) {
      this.serviceLogger.error(
        `Failed to get poll details for ${pollAddress}`,
        { error: error instanceof Error ? error.message : String(error) }
      );
      throw error;
    }
  }
}
