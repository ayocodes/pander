import { Hash } from "viem";

let network: "pharosDevnet" | "anvil" = "pharosDevnet";
let capyCoreAddress: Hash = "0x0000000000000000000000000000000000000000";
let startBlock: number = 0;

if (process.env.NODE_ENV === "development") {
  network = "anvil";
  capyCoreAddress = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";
  startBlock = 0;
}

export { network, capyCoreAddress, startBlock };
