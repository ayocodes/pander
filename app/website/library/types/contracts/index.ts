// Local Anvil addresses
export const CONTRACT_ADDRESSES = {
  TEST_TOKEN: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  CAPY_CORE: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
  POLL_IMPLEMENTATION: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
  TOKEN_IMPLEMENTATION: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
} as const;

// Network Configuration
export const NETWORK_CONFIG = {
  LOCAL: {
    chainId: 31337,
    name: "Anvil Local",
    rpcUrl: "http://localhost:8545",
  },
} as const;

// Re-export contract types
export * from "./capy-core";
export * from "./capy-poll";
export * from "./poll-token";
