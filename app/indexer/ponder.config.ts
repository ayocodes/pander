import { createConfig, factory } from "ponder";
import { http, parseAbiItem } from "viem";

import { CapyCoreAbi, CapyPollAbi } from "./abis/pandpoll-abi";
import { capyCoreAddress, startBlock, network } from "./constants";

export default createConfig({
  networks: {
    pharosDevnet: {
      chainId: 50002,
      transport: http("https://devnet.dplabs-internal.com/"),
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
