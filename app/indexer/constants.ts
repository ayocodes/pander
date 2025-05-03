import { Hash } from "viem";

let network: "pharosDevnet" | "anvil" = "pharosDevnet";
let capyCoreAddress: Hash = "0x75b15246FCbB43Fca85CEe40cDdEF5125CB4A814";
let startBlock: number = 19037259;

if (process.env.NODE_ENV === "development") {
  network = "anvil";
  capyCoreAddress = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";
  startBlock = 0;
}

export { network, capyCoreAddress, startBlock };
