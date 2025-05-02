import { getDefaultConfig } from "connectkit";
import { createConfig, http } from "wagmi";
import { anvil, opBNBTestnet } from "wagmi/chains";

const isDev = process.env.NODE_ENV === "development";

// Configure anvil chain with the correct values
const localAnvil = {
  ...anvil,
  id: 31337,
  rpcUrls: {
    default: { http: ["http://127.0.0.1:8545"] },
    public: { http: ["http://127.0.0.1:8545"] },
  },
};

export const config = createConfig(
  getDefaultConfig({
    appName: "pander",
    walletConnectProjectId:
      process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "",
    chains: isDev ? [localAnvil] : [opBNBTestnet],
    multiInjectedProviderDiscovery: true,
    transports: {
      [localAnvil.id]: http("http://127.0.0.1:8545"),
      [opBNBTestnet.id]: http(
        "https://opbnb-testnet.g.alchemy.com/v2/wmmPIFmPi700hZkT_QuBCKRvsCpJ-J9"
      ),
    },
  })
);
