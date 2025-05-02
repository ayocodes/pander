// scripts/checkContract.ts
import "dotenv/config";
import { ContractService } from "../library/services/contracts.js";

async function checkContractConnectivity() {
  const service = new ContractService();

  try {
    console.log("Checking contract connectivity...");

    // Test poll count
    const count = await service.getPollCount();
    console.log("Total polls:", count);

    if (count > 0) {
      // Get the most recent poll
      const polls = await service.getNewPolls(count - 1, count);
      console.log("Most recent poll:", polls[0]);

      // Get poll details
      const details = await service.getPollDetails(polls[0] as `0x${string}`);
      console.log("Poll details:", details);
    }

    console.log("Contract connectivity check successful!");
  } catch (error) {
    console.error("Contract connectivity check failed:", error);
  }
}

checkContractConnectivity().catch(console.error);
