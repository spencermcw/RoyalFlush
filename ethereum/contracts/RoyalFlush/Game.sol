// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import "hardhat/console.sol";

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import "../libraries/Counters.sol";

import "../CARDCoin.sol";
import "./BaseCards.sol";
import "./YieldCards.sol";


struct Pack {
    uint id;
    address player;
    uint[] yieldCardIds;
    uint[] baseCardAmounts;
}


contract Game is Ownable, AccessControl, Pausable, ReentrancyGuard {
    // Libraries
    using Counters for Counters.Counter;
    // Roles
    bytes32 private RF_CONTRACT_ROLE = keccak256("RF_CONTRACT_ROLE");
    // Tracking
    Counters.Counter private packIdCounter;
    mapping(address => Pack[]) private packsByPlayer;
    // Contracts
    CARDCoin CARDCoin_;
    BaseCards BaseCards_;
    YieldCards YieldCards_;
    // Events
    event PackIssued(address indexed player);

    // Constructor
    constructor (address cardCoin, address baseCards, address yc)
        Ownable(_msgSender())
    {
        _grantRole(DEFAULT_ADMIN_ROLE, _msgSender());
        CARDCoin_ = CARDCoin(cardCoin);
        BaseCards_ = BaseCards(baseCards);
        YieldCards_ = YieldCards(yc);
    }


    function grantRFRole (address account)
        external onlyRole(DEFAULT_ADMIN_ROLE)
    {
        grantRole(RF_CONTRACT_ROLE, account);
    }


    function transferCARD (address from, address to, uint amount)
        external onlyRole(RF_CONTRACT_ROLE)
        returns (bool success)
    {
        success = CARDCoin_.transferFrom(from, to, amount);
    }


    function transferBC (address from, address to, uint[] memory amounts)
        external onlyRole(RF_CONTRACT_ROLE)
    {
        uint[] memory ids = BaseCards_.allIds();
        BaseCards_.safeBatchTransferFrom(from, to, ids, amounts, "");
    }


    function transferYC (address from, address to, uint[] memory ids)
        external onlyRole(RF_CONTRACT_ROLE)
    {
        for (uint i; i < ids.length; i++) {
            YieldCards_.safeTransferFrom(from, to, ids[i]);
        }
    }


    function issuePack (address player_, uint[] memory baseCardAmounts_, uint[] calldata yieldCardIds_)
        external onlyRole(RF_CONTRACT_ROLE)
        returns (uint newPackId)
    {
        newPackId = packIdCounter.current();
        Pack memory pack_ = Pack({
            id: newPackId,
            player: player_,
            yieldCardIds: yieldCardIds_,
            baseCardAmounts: baseCardAmounts_ 
        });
        packsByPlayer[player_].push(pack_);
        packIdCounter.increment();
        emit PackIssued(player_);
    }


    function allPacksIssuedToPlayer (address player_)
        external view
        returns (Pack[] memory)
    {
        return packsByPlayer[player_];
    }


    // Toggle Pause
    function togglePause()
        external onlyRole(DEFAULT_ADMIN_ROLE)
    {
        if (paused()) _unpause();
        else _pause();
    }
}
