import { isDemo } from "../mode"

// Demo mode deploys the contracts into the in-browser chain from Hardhat's public test account #0,
// in ethereum/scripts/deployers.js order, so they land at the same addresses as .env.development.
export const DEMO_ADDRESSES = {
    CARDCoin: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    BaseCards: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
    YieldCards: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
    Game: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9",
    Deck: "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707",
    Marketplace: "0x0165878A594ca255338adfa4d48449f69242Eb8F",
}

// Wallet mode uses the build's env addresses (.env.testnet: BSC testnet, chain 97).
const WALLET_ADDRESSES = {
    CARDCoin: import.meta.env.VITE_CARD_ERC20_ADDRESS,
    BaseCards: import.meta.env.VITE_BASE_CARDS_ADDRESS,
    YieldCards: import.meta.env.VITE_YIELD_CARDS_ADDRESS,
    Game: import.meta.env.VITE_GAME_ADDRESS,
    Deck: import.meta.env.VITE_DECK_ADDRESS,
    Marketplace: import.meta.env.VITE_MARKETPLACE_ADDRESS,
}

export const addresses = isDemo ? DEMO_ADDRESSES : WALLET_ADDRESSES

export default addresses
