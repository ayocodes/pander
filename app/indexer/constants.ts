import { Hash } from "viem";

let network: "pharosDevnet" | "anvil" = "pharosDevnet";
let capyCoreAddress: Hash = "0x75b15246FCbB43Fca85CEe40cDdEF5125CB4A814";
let startBlock: number = Number(process.env.PONDER_START_BLOCK || 0);

if (process.env.NODE_ENV === "development") {
  network = "anvil";
  capyCoreAddress = "0x66Db6d191cd163F56197b767928A507dF8b47AA7";
  startBlock = 0;
}

export { network, capyCoreAddress, startBlock };
