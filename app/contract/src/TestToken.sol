// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestToken is ERC20 {
    uint256 public constant AMOUNT_PER_MINT = 5 * 10 ** 18;

    constructor() ERC20("PanderTestToken", "PTK") {}

    function mint() public {
        _mint(msg.sender, AMOUNT_PER_MINT);
    }
}
