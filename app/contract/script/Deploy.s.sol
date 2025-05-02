// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {TestToken} from "../src/TestToken.sol";
import {CapyCore} from "../src/CapyCore.sol";
import {CapyPoll} from "../src/CapyPoll.sol";
import {PollToken} from "../src/PollToken.sol";

contract Deploy is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Starting deployment with deployer:", deployer);

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy TestToken first
        TestToken testToken = new TestToken();
        console.log("TestToken deployed at:", address(testToken));

        // 2. Deploy implementation contracts
        CapyPoll pollImplementation = new CapyPoll();
        console.log(
            "Poll Implementation deployed at:",
            address(pollImplementation)
        );

        PollToken tokenImplementation = new PollToken();
        console.log(
            "Token Implementation deployed at:",
            address(tokenImplementation)
        );

        // 3. Deploy CapyCore with implementations
        CapyCore capyCore = new CapyCore(
            address(pollImplementation),
            address(tokenImplementation),
            address(testToken),
            address(0), // No sUSDe token needed for testing
            deployer
        );
        console.log("CapyCore deployed at:", address(capyCore));

        // 4. Mint some test tokens to the deployer
        testToken.mint();
        console.log("Minted test tokens to deployer");

        vm.stopBroadcast();

        // Log final configuration
        console.log("\nDeployment completed!");
        console.log("-------------------");
        console.log("TestToken:", address(testToken));
        console.log("Poll Implementation:", address(pollImplementation));
        console.log("Token Implementation:", address(tokenImplementation));
        console.log("CapyCore:", address(capyCore));

        // Save deployment addresses to environment
        vm.setEnv("TEST_TOKEN_ADDRESS", vm.toString(address(testToken)));
        vm.setEnv("CAPY_CORE_ADDRESS", vm.toString(address(capyCore)));
    }
}

/*
# Deployment Instructions:

1. Start local Anvil chain (in a separate terminal):
anvil

2. Set environment variables:
export PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

3. Run deployment:
forge script script/Deploy.s.sol:Deploy \
--rpc-url http://localhost:8545 \
--broadcast -vvvv
*/
