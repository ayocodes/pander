import { getDefaultConfig } from "connectkit";
import { type Chain } from "viem";
import { createConfig, http } from "wagmi";
import { anvil } from "wagmi/chains";

const isDev = process.env.NODE_ENV === "development";

// Configure anvil chain for local development
export const localAnvil = {
  ...anvil,
  id: 31337,
  rpcUrls: {
    default: { http: ["http://127.0.0.1:8545"] },
    public: { http: ["http://127.0.0.1:8545"] },
  },
};

// Configure Pharos Devnet

export const pharosDevnet = {
  id: 50002,
  name: "Pharos Devnet",
  nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://devnet.dplabs-internal.com"] },
    public: { http: ["https://devnet.dplabs-internal.com"] },
  },
  blockExplorers: {
    default: { name: "PharosScan", url: "https://pharosscan.xyz" },
  },
  contracts: {}, // Added missing contracts field as an empty object
  testnet: true,
} as const satisfies Chain;

export const config = createConfig(
  getDefaultConfig({
    appName: "pander",
    walletConnectProjectId:
      process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "",
    // Use localAnvil in development, otherwise use pharosDevnet
    chains: isDev ? [localAnvil] : [pharosDevnet],
    multiInjectedProviderDiscovery: true,
    transports: {
      // Transport for local anvil
      [localAnvil.id]: http("http://127.0.0.1:8545"),
      // Transport for Pharos Devnet
      [pharosDevnet.id]: http("https://devnet.dplabs-internal.com"),
    },
  })
);
