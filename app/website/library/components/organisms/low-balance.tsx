"use client"
import React, { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { readContract, writeContract, waitForTransaction } from "@wagmi/core";
import { config } from "../../providers/wagmi/config";
import { Input } from "../atoms/input";

const TEST_TOKEN_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const TEST_TOKEN_ABI = [
  {
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "transfer",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "mint",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  }
] as const;

const LowBalanceModal: React.FC = () => {
  const [balance, setBalance] = useState<number>();
  const [isVisible, setIsVisible] = useState(false);
  const { address } = useAccount();

  const checkFaucetBalance = async () => {
    try {
      if (!address) return;
      const balance = await readContract(config, {
        address: TEST_TOKEN_ADDRESS,
        abi: TEST_TOKEN_ABI,
        functionName: "balanceOf",
        args: [address],
      });
      setBalance(Number(balance));
    } catch (err) {
      console.error("Failed to check user balance:", err);
    }
  };

  const mintTestTokens = async () => {
    try {
      if (!address) return;

      const hash = await writeContract(config, {
        address: TEST_TOKEN_ADDRESS,
        abi: TEST_TOKEN_ABI,
        functionName: "mint",
      });

      await waitForTransaction(config, { hash });
      await checkFaucetBalance(); // Refresh balance after minting
    } catch (err) {
      console.error("Failed to mint tokens:", err);
    }
  };

  useEffect(() => {
    checkFaucetBalance();
  }, [address]);

  useEffect(() => {
    if (balance !== undefined && balance < 1) {
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