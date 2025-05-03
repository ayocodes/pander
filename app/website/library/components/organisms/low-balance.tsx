"use client";

import { readContract, waitForTransaction, writeContract } from "@wagmi/core";
import React, { useEffect, useState } from "react";
import { useAccount } from "wagmi";

import { config } from "@/library/providers/wagmi/config";
import data from "@/library/types/contracts/test-token";
import usePanderProtocol from "@/library/hooks/use-pander-protocol-new";
import { parseEther } from "viem";

const LowBalanceModal: React.FC = () => {
  const { addTokenToWallet } = usePanderProtocol();
  const [balance, setBalance] = useState<bigint>();
  const [isVisible, setIsVisible] = useState(false);
  const { address } = useAccount();

  const checkFaucetBalance = async () => {
    try {
      if (!address) return;
      const balance = await readContract(config, {
        address: data.address,
        abi: data.abi,
        functionName: "balanceOf",
        args: [address],
      });
      setBalance(balance);
    } catch (err) {
      console.error("Failed to check user balance:", err);
    }
  };

  const mintTestTokens = async () => {
    try {
      if (!address) return;

      const hash = await writeContract(config, {
        address: data.address,
        abi: data.abi,
        functionName: "mint",
      });

      await waitForTransaction(config, { hash });
      await checkFaucetBalance(); // Refresh balance after minting
      addTokenToWallet(data.address);
    } catch (err) {
      console.error("Failed to mint tokens:", err);
    }
  };

  useEffect(() => {
    checkFaucetBalance();
  }, [address]);

  useEffect(() => {
    if (balance !== undefined && balance < parseEther("2")) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [balance]);

  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/50 z-50"
      onClick={() => setIsVisible(false)}
    >
      <div
        className="bg-white rounded-lg p-6 w-80 shadow-lg text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src="https://assets.coingecko.com/coins/images/33613/standard/usde.png?1733810059"
          alt="Test Token"
          className="mx-auto mb-4 w-16 h-16"
        />
        <h2 className="text-lg font-semibold mb-2">Low Balance!</h2>
        <p className="text-sm text-gray-600 mb-3">
          Click below to receive 5 test tokens for testing
        </p>
        <button
          onClick={mintTestTokens}
          className="inline-block px-4 py-2 text-white rounded bg-[#33CB82] hover:bg-[#33CB82]/80 transition"
        >
          Mint Test Tokens
        </button>
      </div>
    </div>
  );
};

export default LowBalanceModal;
