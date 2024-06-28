// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";

import "../CARDCoin.sol";
import "./BaseCards.sol";
import "./YieldCards.sol";
import "./Game.sol";
import "../libraries/ArrayMath.sol";


contract Marketplace is Ownable, Pausable, ReentrancyGuard, ERC1155Holder, ERC721Holder {
    enum ListingStatus { OPEN, SOLD, CLOSED }
    // Librarires
    using ArrayMath for uint[];
    // Structs
    struct Listing {
        uint id;
        address creator;
        address buyer;
        uint[] baseCardAmounts;
        uint[] yieldCardIds;
        uint price;
        ListingStatus status;
    }
    // Storage
    Listing[] private listings;
    mapping(address => uint) private deposits_;
    // Contracts
    CARDCoin private CARDCoin_;
    BaseCards private BaseCards_;
    YieldCards private YieldCards_;
    Game private Game_;
    // Events
    event ListingUpdated(address indexed creator, address indexed buyer, Listing listing);
    event EscrowTransfer(address indexed payee, uint256 amount);


    constructor (address cardCoin, address baseCards, address yieldCards, address game)
        Ownable(_msgSender())
    {
        CARDCoin_ = CARDCoin(cardCoin);
        BaseCards_ = BaseCards(baseCards);
        YieldCards_ = YieldCards(yieldCards);
        Game_ = Game(game);
    }


    function getListings ()
        external view
        returns (Listing[] memory)
    {
        return listings;
    }


    function createListing (uint[] memory _baseCardAmounts, uint[] memory _yieldCardIds, uint _price)
        external whenNotPaused nonReentrant
    {
        uint baseCardsSum = _baseCardAmounts.sum();
        require(baseCardsSum > 0 || _yieldCardIds.length > 0, "Marketplace#createListing - No cards provided");
        require(_baseCardAmounts.length == 21, "Marketplace#createListing - Invalid number of card quantities");
        require(_price >= ((baseCardsSum * 500 ether) + (_yieldCardIds.length * 500 ether)), "Marketplace#createListing - Invalid price");
        // Take Base Cards
        Game_.transferBC(_msgSender(), address(this), _baseCardAmounts);
        // Take Yield Cards
        Game_.transferYC(_msgSender(), address(this), _yieldCardIds);
        // Create Listing
        Listing memory newListing = Listing({
            id: listings.length,
            creator: _msgSender(),
            buyer: address(0),
            baseCardAmounts: _baseCardAmounts,
            yieldCardIds: _yieldCardIds,
            price: _price,
            status: ListingStatus.OPEN
        });
        // Save Listing
        listings.push(newListing);
        // Events
        emit ListingUpdated(_msgSender(), address(0), newListing);
    }


    function closeListing (uint _id)
        external
    {
        Listing storage listing = listings[_id];
        // Requirements
        require(_id < listings.length, "Listing does not exist");
        require(listing.creator == _msgSender(), "Cannot delete Listing you do not own");
        require(listing.status == ListingStatus.OPEN, "Listing must be OPEN.");
        // Return Cards
        BaseCards_.safeBatchTransferFrom(
            address(this),
            _msgSender(),
            BaseCards_.allIds(),
            listing.baseCardAmounts,
            ""
        );
        // Transfer Yield Cards
        for (uint i; i < listing.yieldCardIds.length; i++) {
            YieldCards_.safeTransferFrom(
                address(this),
                _msgSender(),
                listing.yieldCardIds[i]
            );
        }
        // Close Listing
        listing.status = ListingStatus.CLOSED;
        emit ListingUpdated(_msgSender(), address(0), listing);
    }


    function purchaseListing (uint _id)
        external nonReentrant
    {
        Listing storage listing = listings[_id];
        // Requirements
        require(_id < listings.length, "Marketplace#purchaseListing - Listing does not exist.");
        require(listing.status == ListingStatus.OPEN, "Marketplace#purchaseListing - Listing is not available for purchase.");
        // Commission
        deposit(_msgSender(), owner(), listing.price / 20); // 5%
        deposit(_msgSender(), listing.creator, (listing.price / 20) * 19); // 95%
        // Transfer Base Cards
        BaseCards_.safeBatchTransferFrom(
            address(this),
            _msgSender(),
            BaseCards_.allIds(),
            listing.baseCardAmounts,
            ""
        );
        // Transfer Yield Cards
        for (uint i; i < listing.yieldCardIds.length; i++) {
            YieldCards_.safeTransferFrom(
                address(this),
                _msgSender(),
                listing.yieldCardIds[i]
            );
        }
        // Update Listing
        listing.status = ListingStatus.SOLD;
        listing.buyer = _msgSender();
        // Package
        Game_.issuePack(_msgSender(), listing.baseCardAmounts, listing.yieldCardIds);
        // Emit
        emit ListingUpdated(listing.creator, _msgSender(), listing);
    }


    // TODO
    // function findListings ()
    //     external view
    //     returns (uint[] listingIds)
    // {}


    // ESCROW
    function depositsOf (address payee)
        public view
        returns (uint256)
    {
        return deposits_[payee];
    }


    function collect ()
        external
    {
        withdraw(_msgSender());
    }


    function deposit (address from, address payee, uint256 amount)
        private
    {
        bool success = Game_.transferCARD(from, address(this), amount);
        require(success, "Could not consume CARD");
        deposits_[payee] += amount;
        emit EscrowTransfer(payee, amount);
    }


    function withdraw (address payee)
        private
    {
        uint256 amount = depositsOf(payee);
        require(amount > 0, "Nothing to withdraw");
        bool success = CARDCoin_.transfer(payee, amount);
        require(success, "Could not withdraw ERC20");
        deposits_[payee] -= amount;
        emit EscrowTransfer(payee, amount);
    }


    // Toggle Pause
    function togglePause ()
        external onlyOwner
    {
        if (paused()) _unpause();
        else _pause();
    }
}
