// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import "hardhat/console.sol";

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
// import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import "../libraries/Counters.sol";

import "../CARDCoin.sol";
import "./BaseCards.sol";
import "./Deck.sol";
import "./Game.sol";
import "./Types.sol";


struct YieldCard {
    uint id;
    // address owner;
    uint level;
    Suit suit;
    uint lastClaimed;
    uint yield;
}


// TODO: Change to ERC721Enumerable


contract YieldCards is Ownable, Pausable, ReentrancyGuard, ERC721Enumerable {
    // Librarires
    using Counters for Counters.Counter;
    // Roles
    bytes32 public constant GAME_ROLE = keccak256("GAME_ROLE");
    // Constants
    uint private constant YIELD_SCALE = 2.05 ether;
    CARDCoin private CARDCoin_;
    BaseCards private BaseCards_;
    Deck private Deck_;
    Game private Game_;
    // Tracking
    Counters.Counter private idCounter;
    mapping(Suit => uint) public suitYield;
    // mapping(address => uint[]) public tokensByOwner;
    // TODO: Rename to tokenMeatadataById;
    mapping(uint => YieldCard) public tokenById;
    // Events
    event Minted(address indexed account, uint tokenId);
    event YieldClaimed(address indexed account, uint yield);


    constructor ()
        Ownable(_msgSender())
        ERC721("NFTCG Royal Flush Yield Cards", "RFYC")
    {
        suitYield[Suit.CLUBS] = 0.000173611 ether;
        suitYield[Suit.DIAMONDS] = 0.000347222 ether;
        suitYield[Suit.HEARTS] = 0.000752315 ether;
        suitYield[Suit.SPADES] = 0.001157407 ether;
    }


    function setContracts(address cardCoin, address baseCards, address payable deck, address game)
        external onlyOwner
    {
        CARDCoin_ = CARDCoin(cardCoin);
        BaseCards_ = BaseCards(baseCards);
        Deck_ = Deck(deck);
        Game_ = Game(game);
    }


    // function getTokensByOwner(address owner)
    //     external view
    //     returns (uint[] memory)
    // {
    //     return tokensByOwner[owner];
    // }


    function claim(uint tokenId, uint tokenToBurn)
        external whenNotPaused nonReentrant
    {
        // Claim Yield from YC
        YieldCard storage token = tokenById[tokenId];
        (bool matchingSuit, ) = BaseCards_.matchAgainst(tokenToBurn, token.suit, Value.WILD);
        require(matchingSuit, "Base Card to burn has invalid suit");
        // Consume BC
        uint[] memory amounts = new uint[](21);
        amounts[tokenToBurn] = 1;
        Game_.transferBC(_msgSender(), address(Deck_), amounts);
        // Claim Yield
        _claim(tokenId);
    }


    function mint(uint[] memory ids, Suit requestedSuit)
        external whenNotPaused nonReentrant
    {
        // Requirements
        require(requestedSuit != Suit.WILD, "Cannot redeem WILD suit");
        require(ids.length == 5, "Not enough Base Cards");
        (bool matchingSuit, ) = BaseCards_.matchAllAgainst(ids, requestedSuit, Value.WILD);
        require(matchingSuit, "Provided cards do not have matching suit");
        // Compile Batch Transfer amounts
        uint8 numWilds = 0;
        bool valid = true;
        uint sIndex = uint(requestedSuit) * 5;
        uint[] memory amounts = new uint[](21);
        for (uint i; i < ids.length; i++) {
            // Wildcard or next token in order
            valid = (ids[i] == 20 || ids[i] == sIndex + i);
            // Count wildcards
            if (ids[i] == 20)
                numWilds++;
            // Break if invalidated
            if (!valid || numWilds > 1)
                break;
            // Increment id amounts for Batch Transfer
            amounts[ids[i]]++;
        }
        // Validate
        require(numWilds <= 1, "YieldCards#mint - Too many wildcards provided");
        require(valid, "YieldCards#mint - Invalid cards provided for suit");
        Game_.transferBC(_msgSender(), address(Deck_), amounts);
        // Mint
        _mint(_msgSender(), 1, requestedSuit);
    }


    function levelUp(uint idA, uint idB)
        public whenNotPaused nonReentrant
    {
        require(idA != idB);
        YieldCard storage ycA = tokenById[idA];
        YieldCard storage ycB = tokenById[idB];
        require(ycA.level < 10);
        require(ycB.level < 10);
        require(_ownerOf(idA) == _msgSender());
        require(_ownerOf(idB) == _msgSender());
        // require(ycA.owner == _msgSender());
        // require(ycB.owner == _msgSender());
        require(ycA.suit == ycB.suit);
        require(ycA.level == ycB.level);
        // Game_.transferYC(_msgSender(), address(this), ids);
        _mint(_msgSender(), ycA.level + 1, ycA.suit);
        _burn(idA);
        _burn(idB);
    }


    function _mint(address account, uint level, Suit suit)
        private
        returns (uint tokenId)
    {
        tokenId = idCounter.current();
        YieldCard memory token = YieldCard({
            id: tokenId,
            // owner: account,
            level: level,
            suit: suit,
            lastClaimed: block.timestamp,
            yield: suitYield[suit]
        });
        tokenById[tokenId] = token;
        // Increment and emit
        _safeMint(account, tokenId);
        idCounter.increment();
        // Emit
        emit Minted(account, tokenId);
        // Package
        uint[] memory ycIds = new uint[](1);
        ycIds[0] = tokenId;
        Game_.issuePack(_msgSender(), new uint[](21), ycIds);
    }


    // function _removeFromOwner(address owner, uint tokenId)
    //     private
    // {
    //     uint[] storage tokens = tokensByOwner[owner];
    //     for (uint i; i < tokens.length; i++) {
    //         if (tokens[i] == tokenId) {
    //             tokens[i] = tokens[tokens.length - 1];
    //             tokens.pop();
    //             break;
    //         }
    //     }
    //     tokenById[tokenId].owner = address(0);
    // }


    function _claim(uint tokenId)
        private
    {
        YieldCard storage token = tokenById[tokenId];
        // Determine elapsedTime
        uint elapsedTime = block.timestamp - token.lastClaimed;
        require(elapsedTime > 0, "YieldCard#claim - elapsedTime invalid");
        uint maxElapsed = 90 days;
        if (elapsedTime > maxElapsed) {
            elapsedTime = maxElapsed;
        }
        // Calculate Yield
        uint scaler = YIELD_SCALE;
        if (token.level == 1) {
            scaler = 1 ether;
        } else {
            for (uint i; i < token.level - 2; i++) {
                scaler = scaler * scaler / 1 ether;
            }
        }
        uint yield = token.yield * scaler * elapsedTime / 1 ether;
        // Issue CARD
        CARDCoin_.mint(_msgSender(), yield);
        // Update Timestamp
        token.lastClaimed = block.timestamp;
        // Emit
        emit YieldClaimed(_msgSender(), yield);
    }


    // Toggle Pause
    function togglePause()
        external onlyOwner
    {
        if (paused()) _unpause();
        else _pause();
    }
}
