import { createConfig, factory, loadBalance, rateLimit } from "ponder";
import { http, parseAbiItem, webSocket } from "viem";
import dotenv from "dotenv";

dotenv.config();

import { CapyCoreAbi, CapyPollAbi } from "./abis/pandpoll-abi";
import { capyCoreAddress, startBlock, network } from "./constants";

export default createConfig({
  networks: {
    pharosDevnet: {
      chainId: 50002,
      transport: loadBalance([
        // rateLimit(http(process.env.PONDER_RPC_URL), {
        //   requestsPerSecond: Number(
        //     process.env.PONDER_REQUESTS_PER_SECOND || 50
        //   ),
        // }),
        rateLimit(webSocket(process.env.PONDER_RPC_WS_URL), {
          requestsPerSecond: Number(
            process.env.PONDER_REQUESTS_PER_SECOND || 50
          ),
        }),
      ]),
    },
    anvil: {
      chainId: 31337,
      transport: http("http://localhost:8545"),
      disableCache: true,
    },
  },
  contracts: {
    CapyCore: {
      network: network,
      abi: CapyCoreAbi,
      address: capyCoreAddress,
      startBlock: startBlock,
    },
    CapyPoll: {
      network: network,
      abi: CapyPollAbi,
      address: factory({
        address: capyCoreAddress,
        event: parseAbiItem(
          "event PollCreated(address indexed creator, address pollAddress, address yesToken, address noToken, string question, string avatar, string description)"
        ),
        parameter: "pollAddress",
      }),
      startBlock: startBlock,
    },
  },
});
