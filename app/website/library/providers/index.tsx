"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

import ConnectKitProvider from "./connectkit";
import { ThemeProvider } from "./theme";
import WagmiProvider from "./wagmi";

const queryClient = new QueryClient();

const RootProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider>
          <ConnectKitProvider>{children}</ConnectKitProvider>
        </WagmiProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
};

export default RootProvider;
