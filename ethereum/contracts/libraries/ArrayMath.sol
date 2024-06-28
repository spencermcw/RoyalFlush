// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

library ArrayMath {
    function sum(uint256[] memory _deck) internal pure returns (uint256) {
        uint _sum;
        for (uint i; i < _deck.length; i++)
            _sum+= _deck[i];
        return _sum;
    }
}
