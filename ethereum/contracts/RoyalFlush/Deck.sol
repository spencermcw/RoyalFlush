// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import "hardhat/console.sol";

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";

import "../CARDCoin.sol";
import "./BaseCards.sol";
import "./Game.sol";
import "./Melder.sol";


contract Deck is Ownable, Pausable, ReentrancyGuard, ERC1155Holder {
    // Constants
    uint constant DRAW_MIN = 5;
    uint constant DRAW_MAX = 100;
    uint constant DECK_MIN = 5000;
    uint constant PRESALE_PRICE = 0.03 ether;
    uint constant GENERIC_PRICE = 500 ether;
    uint constant PRESALE_CUTOFF = 25000;
    // Contracts
    CARDCoin private CardERC20;
    BaseCards private BaseCardsERC1155;
    Game private GameContract;
    // Tracking
    mapping(address => bool) private whitelist_;
    bool public PRESALE_ACTIVE = true;
    uint public cardsDrawn;
    Counters.Counter private packId;


    constructor(address cardERC20_, address baseCards_, address game_)
        Ownable(_msgSender())
    {
        CardERC20 = CARDCoin(cardERC20_);
        BaseCardsERC1155 = BaseCards(baseCards_);
        GameContract = Game(game_);
    }


    // Toggle Pause
    function togglePause()
        external onlyOwner
    {
        if (paused()) _unpause();
        else _pause();
    }


    // Whitelist
    // Maybe hardcode this to avoid gas?
    // Alternatively change to bulk upload
    function whitelist(address addr, bool value)
        external onlyOwner
    {
        whitelist_[addr] = value;
    }


    // Manually Flag Presale
    function setPresale(bool value)
        external onlyOwner
    {
        PRESALE_ACTIVE = value;
    }


    // Draw
    function draw(uint quantity)
        external payable whenNotPaused nonReentrant
    {
        require(quantity >= DRAW_MIN, "Attempting to draw too few cards.");
        require(quantity <= DRAW_MAX, "Attempting to draw too many cards.");
        if (PRESALE_ACTIVE) {
            require(whitelist_[_msgSender()], "Account not whitelisted.");
            require(msg.value >= PRESALE_PRICE * quantity, "Invalid draw payment.");
            if (cardsDrawn + quantity >= PRESALE_CUTOFF)
                PRESALE_ACTIVE = false;
        } else {
            bool success = GameContract.transferCARD(_msgSender(), address(this), GENERIC_PRICE * quantity);
            require(success, "Game could not transfer CARD Coin.");
        }
        drawPack(quantity);
    }



    function drawPack(uint quantity)
        private
    {
        // Fetch Deck Balance
        // Index = Card (According to BaseCards.sol)
        // Value = Balance
        // [0, 10, 2, 7, ...]
        uint[] memory deck = BaseCardsERC1155.allBalances(address(this));
        uint deckSize;
        for (uint i; i < deck.length; i++)
            deckSize += deck[i];
        require(deckSize > DECK_MIN, "Not enough cards in deck to draw.");
        // Card Amounts Drawn
        uint[] memory baseCardAmounts = new uint[](21);
        // Get "random" seed
        bytes32 seed = keccak256(abi.encodePacked(block.timestamp));
        // Pick "random" card `quantity` times
        for (uint i; i < quantity; i++) {
            uint roll = uint(keccak256(abi.encodePacked(seed >> i % 3)));
            uint deckRoll = roll % deckSize;
            uint tokenId;
            bool underflow;
            // console.log("Roll %s of %s", i+1, quantity);
            // console.log("roll = %s", roll);
            // console.log("deckSize = %s", deckSize);
            // console.log("deckRoll = %s", deckRoll);
            // Determine which card was rolled (weighted)
            for (uint j; j < deck.length; j++) {
                (underflow, deckRoll) = Math.trySub(deckRoll, deck[j]);
                if (underflow) {
                    tokenId = j;
                }
            }
            // console.log("tokenId = %s", tokenId);
            // Record Draw
            baseCardAmounts[tokenId]++;
            deck[tokenId]--;
            deckSize--;
        }

        // Transfer drawn cards to player
        BaseCardsERC1155.safeBatchTransferFrom(
            address(this),
            _msgSender(),
            BaseCardsERC1155.allIds(),
            baseCardAmounts,
            ""
        );
        // Track cards drawn
        cardsDrawn += quantity;
        // Logging
        GameContract.issuePack(_msgSender(), baseCardAmounts, new uint[](0));
    }


    // Melding
    function meld(uint baseCardId, uint baseCardQty, bool useWildcard)
        external whenNotPaused nonReentrant
    {
        (uint price, uint quantity) = Melder.estimatePriceQuantity(baseCardId, baseCardQty + (useWildcard ? 1 : 0));
        // Consume CARD Coin
        bool success = GameContract.transferCARD(_msgSender(), address(this), price);
        require(success, "Game could not consume CARD Coin");
        // Take Base Cards
        uint[] memory baseCardAmounts = new uint[](21);
        baseCardAmounts[baseCardId] = baseCardQty;
        if (useWildcard)
            baseCardAmounts[20] = 1;
        GameContract.transferBC(_msgSender(), address(this), baseCardAmounts);
        // Draw cards to sender
        drawPack(quantity);
    }


    // Withdraw
    function withdraw()
        external nonReentrant onlyOwner
    {
        // Network Token
        uint balance = address(this).balance;
        (bool success, ) = owner().call{value: balance}("");
        require(success, "Failed to withdraw balance");
        // Withdraw CARD
        uint CARDBalance = CardERC20.balanceOf(address(this));
        CardERC20.transfer(owner(), CARDBalance);
    }


    receive() external payable {}
    fallback() external payable {}
}
