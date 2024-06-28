const deployBase = require("./deployers").deploy

const deploy = async () => {
  console.log("Deploying DEV");
  const { owner, cardCoin, baseCards, melder, deck, game, marketplace, yieldCards } = await deployBase();

  // CARD
  const MINT_CARD_COIN_TO_OWNER = true;
  const AMOUNT_CARD_COIN_TO_MINT = "1000000";

  // Base Cards
  const MINT_BASE_CARDS_TO_OWNER = false;
  const AMOUNT_BASE_CARDS_TO_MINT = 10;

  // Approvals
  const AUTO_APPROVE_CARD_COIN = true;
  const AUTO_APPROVE_BASE_CARDS = true;
  const AUTO_APPROVE_YIELD_CARDS = true;

  // Presale
  const DISABLE_PRESALE = true;

  // Mint cardCoin
  if (MINT_CARD_COIN_TO_OWNER) {
    // console.log("Minting cardCoin to owner");
    await cardCoin.tapFaucet(
      ethers.parseUnits(AMOUNT_CARD_COIN_TO_MINT).toString()
    );
  }

  if (MINT_BASE_CARDS_TO_OWNER) {
    // console.log("Minting Base Cards to owner");
    // Mint BaseCards
    const cards = [
      { id: 0, amount: AMOUNT_BASE_CARDS_TO_MINT },
      { id: 1, amount: AMOUNT_BASE_CARDS_TO_MINT },
      { id: 2, amount: AMOUNT_BASE_CARDS_TO_MINT },
      { id: 3, amount: AMOUNT_BASE_CARDS_TO_MINT },
      { id: 4, amount: AMOUNT_BASE_CARDS_TO_MINT },
      { id: 5, amount: AMOUNT_BASE_CARDS_TO_MINT },
      { id: 6, amount: AMOUNT_BASE_CARDS_TO_MINT },
      { id: 7, amount: AMOUNT_BASE_CARDS_TO_MINT },
      { id: 8, amount: AMOUNT_BASE_CARDS_TO_MINT },
      { id: 9, amount: AMOUNT_BASE_CARDS_TO_MINT },
      { id: 10, amount: AMOUNT_BASE_CARDS_TO_MINT },
      { id: 11, amount: AMOUNT_BASE_CARDS_TO_MINT },
      { id: 12, amount: AMOUNT_BASE_CARDS_TO_MINT },
      { id: 13, amount: AMOUNT_BASE_CARDS_TO_MINT },
      { id: 14, amount: AMOUNT_BASE_CARDS_TO_MINT },
      { id: 15, amount: AMOUNT_BASE_CARDS_TO_MINT },
      { id: 16, amount: AMOUNT_BASE_CARDS_TO_MINT },
      { id: 17, amount: AMOUNT_BASE_CARDS_TO_MINT },
      { id: 18, amount: AMOUNT_BASE_CARDS_TO_MINT },
      { id: 19, amount: AMOUNT_BASE_CARDS_TO_MINT },
      { id: 20, amount: AMOUNT_BASE_CARDS_TO_MINT },
    ];
    const ids = cards.map(v => v.id)
    const amounts = cards.map(v => v.amount)
    await baseCards.connect(owner).mintBatch(owner.target, ids, amounts, "0x00");
  }

  // Approvals
  if (AUTO_APPROVE_CARD_COIN) {
    console.log("Approving cardCoin")
    await cardCoin.connect(owner).approveMax(game.target);
  }

  if (AUTO_APPROVE_BASE_CARDS) {
    console.log("Approving Base Cards")
    await baseCards.connect(owner).setApprovalForAll(game.target, true);
  }

  if (AUTO_APPROVE_YIELD_CARDS) {
    console.log("Approving Yield Cards")
    await yieldCards.connect(owner).setApprovalForAll(game.target, true);
  }

  if (DISABLE_PRESALE) {
    console.log("Disabling Presale");
    await deck.connect(owner).setPresale(false);
  }

  return { owner, cardCoin, baseCards, melder, deck, game, marketplace, yieldCards };
}

module.exports.deploy = deploy
