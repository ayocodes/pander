// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {CapyCore} from "./../src/CapyCore.sol";
import {CapyPoll} from "./../src/CapyPoll.sol";
import {PollToken} from "./../src/PollToken.sol";
import {TestToken} from "./../src/TestToken.sol";

contract DeployCapyPolls is Script {
    CapyPoll public pollImplementation;
    PollToken public tokenImplementation;
    CapyCore public capyCore;
    TestToken public testToken;

    function run() external {
        // Load configuration from environment
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Starting deployment with deployer:", deployer);

        vm.startBroadcast(deployerPrivateKey);

        // Deploy TestToken first
        testToken = new TestToken();
        console.log("TestToken deployed at:", address(testToken));

        // Deploy implementation contracts
        pollImplementation = new CapyPoll();
        console.log(
            "Poll Implementation deployed at:",
            address(pollImplementation)
        );

        tokenImplementation = new PollToken();
        console.log(
            "Token Implementation deployed at:",
            address(tokenImplementation)
        );

        // Deploy CapyCore with implementations
        capyCore = new CapyCore(
            address(pollImplementation), // Poll implementation for cloning
            address(tokenImplementation), // Token implementation for cloning
            address(testToken), // TestToken as the main token
            address(0), // No sUSDe token needed
            deployer // Initial owner
        );
        console.log("CapyCore deployed at:", address(capyCore));

        // Mint some test tokens to the deployer
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

        // Verify key configurations
        verify();
    }

    function verify() internal view {
        // Verify CapyCore configuration
        require(address(capyCore) != address(0), "CapyCore not deployed");
        require(address(testToken) != address(0), "TestToken not deployed");

        // Verify implementations are set
        (bool exists, ) = capyCore.getPollDetails(address(pollImplementation));
        require(
            !exists,
            "Poll implementation should not be registered as a poll"
        );

        // Verify core functionality
        require(
            capyCore.cloneablePoll() == address(pollImplementation),
            "Invalid poll implementation"
        );
        require(
            capyCore.cloneableToken() == address(tokenImplementation),
            "Invalid token implementation"
        );
        require(
            capyCore.usdeToken() == address(testToken),
            "Invalid test token"
        );

        console.log("Verification passed");
    }
}

/*
# Deployment Instructions:

1. Start local Anvil chain:
anvil

2. Set environment variables:
export PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

3. Run deployment:
forge script script/DeployContracts.s.sol:DeployCapyPolls \
--rpc-url http://localhost:8545 \
--broadcast -vvvv
*/
