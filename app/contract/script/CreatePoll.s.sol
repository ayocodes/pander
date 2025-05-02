// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {CapyCore} from "./../src/CapyCore.sol";
import {CapyPoll} from "./../src/CapyPoll.sol";
import {TestToken} from "./../src/TestToken.sol";

contract CreatePoll is Script {
    function run() public {
        console.log("\nStarting deployment script...");
        this.executeScript();
    }

    function executeScript() external {
        address capyCoreAddress = vm.envAddress("CAPY_CORE_ADDRESS");
        address testTokenAddress = vm.envAddress("TEST_TOKEN_ADDRESS");
        uint256 duration = vm.envUint("POLL_DURATION");
        string memory question = vm.envString("POLL_QUESTION");
        string memory avatar = vm.envString("POLL_AVATAR");
        string memory description = vm.envString("POLL_DESCRIPTION");
        uint256 privateKey = vm.envUint("PRIVATE_KEY");

        console.log("Creating poll...");
        console.log("Question:", question);
        console.log("Duration:", duration);

        vm.startBroadcast(privateKey);

        CapyCore capyCore = CapyCore(capyCoreAddress);
        IERC20 testToken = IERC20(testTokenAddress);

        // Mint test tokens if needed
        TestToken(testTokenAddress).mint();

        // Set allowance if needed
        uint256 allowance = testToken.allowance(
            vm.addr(privateKey),
            capyCoreAddress
        );
        if (allowance < capyCore.initialFee()) {
            testToken.approve(capyCoreAddress, type(uint256).max);
        }

        // Create poll with simple token names
        address pollAddress = capyCore.createPoll(
            question,
            avatar,
            description,
            duration,
            "Celtic YES Token", // Simple static names
            "YCEL",
            "Celtic NO Token",
            "NCEL"
        );

        console.log("Poll created at:", pollAddress);

        vm.stopBroadcast();
    }
}

/*
Deployment Instructions:

1. Set environment variables:
export PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
export CAPY_CORE_ADDRESS=<deployed_core_address>
export TEST_TOKEN_ADDRESS=<deployed_token_address>
export POLL_DURATION=604800
export POLL_QUESTION="What is your opinion on this topic?"
export POLL_AVATAR="https://picsum.photos/200/200?random=100"
export POLL_DESCRIPTION="This is a detailed description of the poll question that explains the context"

2. Run script:
forge script script/CreatePoll.s.sol:CreatePoll \
--rpc-url http://localhost:8545 \
--broadcast -vvvv
*/
