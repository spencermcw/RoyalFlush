// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import "hardhat/console.sol";

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";


contract CARDCoin is Ownable, Pausable, AccessControl, ReentrancyGuard, ERC20 {
    // Roles
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    uint public constant tokenCap = 1000000000000 ether;
    uint public constant PERCENT_TO_BURN = 0.5 ether;
    uint public constant PERCENT_TO_RETURN_TO_LP = 0.35 ether;
    uint public constant PERCENT_TO_DEV = 0.1 ether;
    uint public constant PERCENT_TO_COMMUNITY_VAULT = 0.05 ether;


    constructor()
    Ownable(_msgSender())
    ERC20("NFT Card Games: CARD Coin", "CARD") {
        _mint(address(this), tokenCap);
        _grantRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _setRoleAdmin(MINTER_ROLE, DEFAULT_ADMIN_ROLE);
    }


    function deflate(uint amount)
        external
    {
        require(allowance(_msgSender(), address(this)) >= amount);
        _burn(_msgSender(), amount);
    }


    function decimals()
        public
        view
        virtual
        override
        returns (uint8)
    {
        return 18;
    }


    function approveMax(address _spender)
        public
    {
        approve(_spender, 2**256-1);
    }


    function mint(address account, uint amount)
        external whenNotPaused nonReentrant onlyRole(MINTER_ROLE)
    {
        require(balanceOf(address(this)) >= amount);
        _approve(address(this), account, amount);
        _transfer(address(this), account, amount);
    }


    function tapFaucet(uint amount)
        external
    {
        _approve(address(this), _msgSender(), amount);
        _transfer(address(this), _msgSender(), amount);
    }


    function togglePause()
        external
        onlyOwner
    {
        if (paused()) _unpause();
        else _pause();
    }
}
