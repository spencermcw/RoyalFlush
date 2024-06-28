// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.3;

library Melder {
    function estimatePriceQuantity(uint tokenId, uint cardQty)
        internal pure
        returns (uint price, uint quantity)
    {
        require(tokenId != 20, "Cannot meld Wildcards.");
        require(cardQty >= 2, "Cannot meld fewer than 2 cards.");
        require(cardQty <= 5, "Cannot meld more than 5 cards.");
        // Meld Draw Quantities
        uint[20][4] memory drawQuantities = [
            [uint(3), uint(3), uint(3), uint(4), uint(4), uint(6), uint(6), uint(6), uint(6), uint(7), uint(11), uint(11), uint(11), uint(11), uint(11), uint(17), uint(18), uint(18), uint(18), uint(18)],
            [uint(6), uint(6), uint(6), uint(7), uint(7), uint(11), uint(11), uint(12), uint(12), uint(12), uint(20), uint(20), uint(21), uint(21), uint(21), uint(33), uint(33), uint(33), uint(34), uint(34)],
            [uint(9), uint(10), uint(10), uint(11), uint(11), uint(17), uint(18), uint(19), uint(19), uint(20), uint(32), uint(32), uint(33), uint(34), uint(34), uint(52), uint(53), uint(53), uint(54), uint(55)],
            [uint(14), uint(14), uint(15), uint(16), uint(17), uint(26), uint(27), uint(28), uint(29), uint(30), uint(48), uint(49), uint(50), uint(50), uint(51), uint(78), uint(79), uint(80), uint(81), uint(82)]
        ];
        // Meld Prices
        uint[20][4] memory prices = [
            [uint(248 ether), uint(248 ether), uint(248 ether), uint(495 ether), uint(495 ether), uint(985 ether), uint(985 ether), uint(985 ether), uint(985 ether), uint(1229 ether), uint(2190 ether), uint(2190 ether), uint(2190 ether), uint(2190 ether), uint(2190 ether), uint(3595 ether), uint(3824 ether), uint(3824 ether), uint(3824 ether), uint(3824 ether)],
            [uint(739 ether), uint(739 ether), uint(739 ether), uint(983 ether), uint(983 ether), uint(1946 ether), uint(1946 ether), uint(2184 ether), uint(2184 ether), uint(2184 ether), uint(4043 ether), uint(4043 ether), uint(4270 ether), uint(4270 ether), uint(4270 ether), uint(6896 ether), uint(6896 ether), uint(6896 ether), uint(7107 ether), uint(7107 ether)],
            [uint(1223 ether), uint(1463 ether), uint(1463 ether), uint(1703 ether), uint(1703 ether), uint(3115 ether), uint(3346 ether), uint(3576 ether), uint(3576 ether), uint(3805 ether), uint(6454 ether), uint(6454 ether), uint(6666 ether), uint(6878 ether), uint(6878 ether), uint(10478 ether), uint(10666 ether), uint(10666 ether), uint(10854 ether), uint(11040 ether)],
            [uint(2173 ether), uint(2173 ether), uint(2409 ether), uint(2643 ether), uint(2876 ether), uint(4917 ether), uint(5138 ether), uint(5357 ether), uint(5576 ether), uint(5793 ether), uint(9491 ether), uint(9685 ether), uint(9878 ether), uint(9878 ether), uint(10070 ether), uint(14778 ether), uint(14935 ether), uint(15091 ether), uint(15246 ether), uint(15400 ether)]
        ];
        // Computation
        uint meldIndex = cardQty - 2;
        quantity = drawQuantities[meldIndex][tokenId];
        price = prices[meldIndex][tokenId];
    }
}
