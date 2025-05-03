import React, { useEffect } from "react";
import { WagmiProvider as _WagmiProvider, useAccount } from "wagmi";
//
import { switchChain as switchChainAction } from "@wagmi/core/actions";
import { config, localAnvil, pharosDevnet } from "./config";

const isDev = process.env.NODE_ENV === "development";
const targetChain = isDev ? localAnvil : pharosDevnet;

const AutoChainSwitcher = ({ children }: { children: React.ReactNode }) => {
  const { chainId, isConnected } = useAccount();

  useEffect(() => {
    const attemptSwitch = async () => {
      if (isConnected && chainId !== targetChain.id) {
        try {
          console.log(`Attempting to switch to ${targetChain.name}`);
          await switchChainAction(config, { chainId: targetChain.id });
        } catch (error) {
          console.error(
            `Failed to switch chain to ${targetChain.name}:`,
            error
          );
        }
      }
    };

    attemptSwitch();
    // Dependencies are isConnected and chainId. targetChain is stable based on build env.
  }, [isConnected, chainId]);

  return <>{children}</>;
};

const WagmiProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <_WagmiProvider config={config}>
      <AutoChainSwitcher>{children}</AutoChainSwitcher>
    </_WagmiProvider>
  );
};

export default WagmiProvider;
