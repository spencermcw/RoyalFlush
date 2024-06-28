// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

import "./Types.sol";


// TODO: Consider uint8s

contract BaseCards is Pausable, Ownable, ERC1155 {
    string public name;
    string public symbol;
    uint256 public constant TOTAL_CARDS = 21;
    // CLUBS
    uint256 public constant TEN_OF_CLUBS = 0;
    uint256 public constant JACK_OF_CLUBS = 1;
    uint256 public constant QUEEN_OF_CLUBS = 2;
    uint256 public constant KING_OF_CLUBS = 3;
    uint256 public constant ACE_OF_CLUBS = 4;
    // DIAMONDS
    uint256 public constant TEN_OF_DIAMONDS = 5;
    uint256 public constant JACK_OF_DIAMONDS = 6;
    uint256 public constant QUEEN_OF_DIAMONDS = 7;
    uint256 public constant KING_OF_DIAMONDS = 8;
    uint256 public constant ACE_OF_DIAMONDS = 9;
    // HEARTS
    uint256 public constant TEN_OF_HEARTS = 10;
    uint256 public constant JACK_OF_HEARTS = 11;
    uint256 public constant QUEEN_OF_HEARTS = 12;
    uint256 public constant KING_OF_HEARTS = 13;
    uint256 public constant ACE_OF_HEARTS = 14;
    // SPADES
    uint256 public constant TEN_OF_SPADES = 15;
    uint256 public constant JACK_OF_SPADES = 16;
    uint256 public constant QUEEN_OF_SPADES = 17;
    uint256 public constant KING_OF_SPADES = 18;
    uint256 public constant ACE_OF_SPADES = 19;
    // WILD
    uint256 public constant WILDCARD = 20;


    constructor()
    Ownable(_msgSender())
    ERC1155("https://premiumsignals.info/nft/{id}.json") {
        name = "NFTCG Royal Flush Base Cards";
        symbol = "RFPC";
    }


    function allBalances(address _address)
        external
        view
        returns (uint[] memory)
    {
        uint256[] memory ids = new uint256[](TOTAL_CARDS);
        address[] memory accounts = new address[](TOTAL_CARDS);
        for (uint i; i < TOTAL_CARDS; i++) {
            ids[i] = i;
            accounts[i] = _address;
        }
        return balanceOfBatch(accounts, ids);
    }


    function allIds()
        public
        pure
        returns (uint256[] memory)
    {
        uint256[] memory ids = new uint256[](TOTAL_CARDS);
        for (uint i; i < TOTAL_CARDS; i++) {
            ids[i] = i;
        }
        return ids;
    }


    function mintBatch(
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) external onlyOwner {
        _mintBatch(to, ids, amounts, data);
    }


    function matchAllAgainst(uint[] memory ids, Suit targetSuit, Value targetValue)
        external
        pure
        returns (bool mSuit, bool mValue) 
    {
        // Matching Suit & Value (to be returned)
        mSuit = true;
        mValue = true;
        // Check every card/id
        for (uint i = 0; i < ids.length; i++) {
            (bool cmSuit, bool cmValue) = matchAgainst(ids[i], targetSuit, targetValue);
            // Attempt to match
            mSuit = mSuit && cmSuit;
            mValue = mValue && cmValue;
            // Break early if both failed
            if (!mSuit && !mValue) {
                break;
            }
        }
    }


    function matchAgainst(uint id, Suit targetSuit, Value targetValue)
        public
        pure
        returns (bool mSuit, bool mValue)
    {
        mSuit = true;
        mValue = true;
        (Suit s, Value v) = shapeForId(id);
        mSuit = (s == Suit.WILD || s == targetSuit);
        mValue = (v == Value.WILD || v == targetValue);
    }


    function shapeForId(uint id)
        public
        pure
        returns (Suit cSuit, Value cValue)
    {
        if (id == WILDCARD) {
            cSuit = Suit.WILD;
            cValue = Value.WILD;
        } else {
            cSuit = Suit(id / 5);
            cValue = Value(id % 5);
        }
    }


    function togglePause()
        external
        onlyOwner
    {
        if (paused()) _unpause();
        else _pause();
    }
}
