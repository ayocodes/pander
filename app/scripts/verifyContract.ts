import { createPublicClient, http } from "viem";
import { foundry } from "viem/chains";
import capyCore from "../library/types/contracts/capy-core.js";

async function verifyContract() {
  const client = createPublicClient({
    chain: foundry,
    transport: http("http://127.0.0.1:8545"),
  });

  try {
    // First check if there's code at the address
    const code = await client.getBytecode({
      address: capyCore.address as `0x${string}`,
    });

    if (!code || code === "0x") {
      console.error("No contract code found at address:", capyCore.address);
      return;
    }

    console.log("Contract code found at address:", capyCore.address);

    // Try to call a simple view function
    const owner = await client.readContract({
      address: capyCore.address as `0x${string}`,
      abi: capyCore.abi,
      functionName: "owner",
    });

    console.log("Contract owner:", owner);
  } catch (error) {
    console.error("Error verifying contract:", error);
  }
}

verifyContract().catch(console.error);
