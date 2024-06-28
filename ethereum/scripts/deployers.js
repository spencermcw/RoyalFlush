const { ethers } = require("hardhat");

const DO_LOGGING = true;

async function deployCARDCoin() {
  const CARDCoinFactory = await ethers.getContractFactory("CARDCoin");
  const cardCoin = await CARDCoinFactory.deploy();
  if (DO_LOGGING)
    console.log("CARD Coin delpoyed to:", cardCoin.target);
  return cardCoin;
}

async function deployBaseCards() {
  const BaseCardsFactory = await ethers.getContractFactory("BaseCards");
  const baseCards = await BaseCardsFactory.deploy();
  if (DO_LOGGING)
    console.log("Base Cards deployed to:", baseCards.target);
  return baseCards;
}

async function deployDeck(cardCoin, baseCards, game) {
  const DeckFactory = await ethers.getContractFactory("Deck");
  const deck = await DeckFactory.deploy(cardCoin, baseCards, game);
  if (DO_LOGGING)
    console.log("Deck deployed to:", deck.target);
  return deck;
}

async function deployGame(cardCoin, baseCards, yieldCards) {
  const GameFactory = await ethers.getContractFactory("Game");
  const game = await GameFactory.deploy(cardCoin, baseCards, yieldCards);
  if (DO_LOGGING)
    console.log("Game deployed to:", game.target);
  return game;
}

async function deployMarketplace(cardCoin, baseCards, yieldCards, game) {
  const MarketplaceFactory = await ethers.getContractFactory("Marketplace");
  const marketplace = await MarketplaceFactory.deploy(cardCoin, baseCards, yieldCards, game);
  if (DO_LOGGING)
    console.log("Marketplace deployed to:", marketplace.target);
  return marketplace;
}

async function deployYieldCards() {
  const YieldCardsFactory = await ethers.getContractFactory("YieldCards");
  const yieldCards = await YieldCardsFactory.deploy();
  if (DO_LOGGING)
    console.log("YieldCards deployed to:", yieldCards.target);
  return yieldCards;
}

async function deploy() {
  console.log("Deploying Base");
  // Get Owner/Default Signer
  const owner = (await ethers.getSigners())[0];
  // Deploy CardCoin
  const cardCoin = await deployCARDCoin();
  // Deploy BaseCards
  const baseCards = await deployBaseCards();
  // Deploy YieldCards
  const yieldCards = await deployYieldCards();
  await cardCoin.connect(owner).grantRole(
    await cardCoin.MINTER_ROLE(),
    yieldCards.target
  );

  // Deploy Game
  const game = await deployGame(cardCoin.target, baseCards.target, yieldCards.target);
  // await cardCoin.connect(owner).initialMint(game.target);
  // Deploy Deck
  const deck = await deployDeck(cardCoin.target, baseCards.target, game.target);
  // Deploy Marketplace
  const marketplace = await deployMarketplace(cardCoin.target, baseCards.target, yieldCards.target, game.target);

  // Grant RF Roles
  await game.connect(owner).grantRFRole(deck.target);
  await game.connect(owner).grantRFRole(yieldCards.target);
  await game.connect(owner).grantRFRole(marketplace.target);

  // Tie Yield Card Contracts
  await yieldCards.connect(owner).setContracts(cardCoin.target, baseCards.target, deck.target, game.target);

  // Minting
  const deckValues = [
    { id: 0, amount: 4732 },
    { id: 1, amount: 4685 },
    { id: 2, amount: 4638 },
    { id: 3, amount: 4591 },
    { id: 4, amount: 4544 },
    { id: 5, amount: 3373 },
    { id: 6, amount: 3326 },
    { id: 7, amount: 3279 },
    { id: 8, amount: 3232 },
    { id: 9, amount: 3186 },
    { id: 10, amount: 2014 },
    { id: 11, amount: 1968 },
    { id: 12, amount: 1921 },
    { id: 13, amount: 1874 },
    { id: 14, amount: 1827 },
    { id: 15, amount: 656 },
    { id: 16, amount: 609 },
    { id: 17, amount: 562 },
    { id: 18, amount: 515 },
    { id: 19, amount: 468 },
    { id: 20, amount: 777 },
  ];
  let ids = deckValues.map(v => v.id)
  let amounts = deckValues.map(v => v.amount)
  await baseCards.connect(owner).mintBatch(deck.target, ids, amounts, "0x00");

  console.log(`
VITE_CARD_ERC20_ADDRESS=${cardCoin.target}
VITE_BASE_CARDS_ADDRESS=${baseCards.target}
VITE_YIELD_CARDS_ADDRESS=${yieldCards.target}
VITE_GAME_ADDRESS=${game.target}
VITE_DECK_ADDRESS=${deck.target}
VITE_MARKETPLACE_ADDRESS=${marketplace.target}
`)

  return { owner, cardCoin, baseCards, deck, yieldCards, game, marketplace };
}

module.exports.deploy = deploy
