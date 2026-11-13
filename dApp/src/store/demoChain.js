// Demo mode: the real Royal Flush contracts running on an in-browser chain.
//
// Ganache 7.9.2's browser build (vendored in public/vendor/ganache-7.9.2, see the README there) is
// loaded as a same-origin script only when a demo starts. The contracts are deployed from the
// bytecode in ./contracts/ABIs, in the order ethereum/scripts/deployers.js uses and from Hardhat's
// public test account #0, so they land at the .env.development addresses (contracts/addresses.js).
// Nothing here changes contract behavior: the demo plays exactly like the deployed contracts,
// including their known bugs (see the vendor README).
//
// Persistence: Ganache keeps the chain in IndexedDB (database.dbPath), so a reload resumes the
// same chain. The player's key, the setup marker and the demo clock skew live in localStorage.
// Blocks are mined one per transaction with explicit, strictly increasing timestamps
// (wall clock + skew), so "Skip ahead a day" survives reloads.
import { ethers } from "ethers"
// ?raw keeps the bytecode in this lazy chunk; the app's own imports of these files take only the ABI.
import CARDCoinRaw from "./contracts/ABIs/CARDCoin.json?raw"
import BaseCardsRaw from "./contracts/ABIs/BaseCards.json?raw"
import YieldCardsRaw from "./contracts/ABIs/YieldCards.json?raw"
import GameRaw from "./contracts/ABIs/Game.json?raw"
import DeckRaw from "./contracts/ABIs/Deck.json?raw"
import MarketplaceRaw from "./contracts/ABIs/Marketplace.json?raw"
import { DEMO_ADDRESSES } from "./contracts/addresses"
import { DEMO_STARTED_KEY, reloadAt } from "./mode"

const GANACHE_SRC = `${import.meta.env.BASE_URL}vendor/ganache-7.9.2/ganache.min.js`
// Subresource integrity of the vendored file (sha384 of ganache.min.js from ganache@7.9.2).
const GANACHE_SRI = "sha384-7ZJuPSJycTVhi/25CY7DMzaD94WbBbDu4G0f8YzNRISN1guhFB9NpF8UlXf7ul6Y"

// Bump SETUP_VERSION when the setup below changes: older demo chains are then rebuilt from scratch.
const SETUP_VERSION = "1"
const DB_NAME = "royalflush-demo-v1"
const KEYS = {
    PLAYER: "RF_DEMO_PLAYER_KEY", // the player's private key: random per browser, worthless
    READY: "RF_DEMO_READY",       // SETUP_VERSION once the chain in IndexedDB is fully set up
    SKEW: "RF_DEMO_SKEW",         // seconds the demo clock runs ahead of the wall clock
}

// Hardhat's public, well-known test account #0. Deploying from it (nonce 0..5) reproduces the
// .env.development contract addresses. It only ever exists inside this browser's demo chain.
const DEPLOYER_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
// Other players at the table, who seed the marketplace. Deterministic, demo-only keys.
const NPC_KEYS = [1, 2, 3].map(i => ethers.utils.id(`royal-flush-demo-npc-${i}`))

const STARTING_CARD = "10000"
// The deck as minted by deployers.js: base card id -> amount.
const DECK_AMOUNTS = [4732, 4685, 4638, 4591, 4544, 3373, 3326, 3279, 3232, 3186, 2014, 1968, 1921, 1874, 1827, 656, 609, 562, 515, 468, 777]

const storage = {
    get: (k) => { try { return window.localStorage.getItem(k) } catch (e) { return null } },
    set: (k, v) => { try { window.localStorage.setItem(k, v) } catch (e) { /* private mode */ } },
    remove: (k) => { try { window.localStorage.removeItem(k) } catch (e) { /* private mode */ } },
}

let current = null // { ganache, player } of the booted chain, for reset

const loadGanache = () => {
    if (window.Ganache)
        return Promise.resolve(window.Ganache)
    return new Promise((resolve, reject) => {
        const script = document.createElement("script")
        script.src = GANACHE_SRC
        script.integrity = GANACHE_SRI
        script.async = true
        script.onload = () => window.Ganache ? resolve(window.Ganache) : reject(new Error("Demo chain failed to initialize"))
        script.onerror = () => reject(new Error("Could not load the demo chain"))
        document.head.appendChild(script)
    })
}

const deleteDatabase = () => new Promise(resolve => {
    try {
        const req = window.indexedDB.deleteDatabase(DB_NAME)
        req.onsuccess = req.onerror = () => resolve()
        // Another tab still has the demo open: give up waiting; the next boot starts clean anyway.
        req.onblocked = () => setTimeout(resolve, 500)
    } catch (e) {
        resolve()
    }
})

const hexWei = (ether) => ethers.utils.parseEther(ether).toHexString()

export async function bootDemoChain({ onStep = () => {}, onSkew = () => {} } = {}) {
    onStep("Loading the demo chain")
    const Ganache = await loadGanache()

    let playerKey = storage.get(KEYS.PLAYER)
    const ready = storage.get(KEYS.READY) === SETUP_VERSION && Boolean(playerKey)
    if (!ready) {
        // Fresh start (or an interrupted/older setup): drop any half-built chain first.
        await deleteDatabase()
        playerKey = playerKey || ethers.Wallet.createRandom().privateKey
        storage.set(KEYS.PLAYER, playerKey)
        storage.set(KEYS.SKEW, "0")
    }
    let skew = Number(storage.get(KEYS.SKEW)) || 0
    onSkew(skew)

    const deployer = new ethers.Wallet(DEPLOYER_KEY)
    const player = new ethers.Wallet(playerKey)
    const npcs = NPC_KEYS.map(k => new ethers.Wallet(k))

    const ganache = Ganache.provider({
        logging: { quiet: true },
        chain: { chainId: 97, hardfork: "shanghai" },
        database: { dbPath: DB_NAME },
        // Gas money only; on a resumed chain the balances come from the stored state instead.
        wallet: {
            accounts: [
                { secretKey: DEPLOYER_KEY, balance: hexWei("1000000") },
                { secretKey: playerKey, balance: hexWei("1000") },
                ...NPC_KEYS.map(secretKey => ({ secretKey, balance: hexWei("1000") })),
            ],
        },
    })
    current = { ganache, player: player.address }
    const raw = (method, params = []) => ganache.request({ method, params })

    // Mine explicitly: one block per transaction at wall clock + skew, never going backwards.
    await raw("miner_stop")
    if (skew > 0)
        await raw("evm_increaseTime", [skew])
    let lastTimestamp = parseInt((await raw("eth_getBlockByNumber", ["latest", false])).timestamp, 16)
    const nextTimestamp = () => {
        lastTimestamp = Math.max(lastTimestamp + 1, Math.floor(Date.now() / 1000) + skew)
        return lastTimestamp
    }
    let queue = Promise.resolve()
    const serialize = (fn) => {
        const run = queue.then(fn)
        queue = run.catch(() => {})
        return run
    }
    const sendTransaction = (tx) => serialize(async () => {
        const hash = await raw("eth_sendTransaction", [tx])
        await raw("evm_mine", [{ timestamp: nextTimestamp() }])
        return hash
    })

    // ethers view of the chain for setup (any of the local accounts can sign). Setup skips gas
    // estimation (it would run every transaction twice); a failed setup transaction still throws,
    // from its receipt.
    const SETUP_GAS = "0x" + (8000000).toString(16)
    const setupProvider = new ethers.providers.Web3Provider({
        request: ({ method, params }) => {
            if (method === "eth_sendTransaction")
                return sendTransaction(params[0])
            if (method === "eth_estimateGas")
                return Promise.resolve(SETUP_GAS)
            return raw(method, params)
        },
    }, 97)

    const deckCode = await raw("eth_getCode", [DEMO_ADDRESSES.Deck, "latest"])
    if (!ready || deckCode === "0x") {
        if (ready) {
            // The stored chain is gone (site data partly cleared): rebuild from scratch.
            await ganache.disconnect()
            storage.remove(KEYS.READY)
            return bootDemoChain({ onStep, onSkew })
        }
        await setUpChain({ provider: setupProvider, deployer, player, npcs, onStep })
        storage.set(KEYS.READY, SETUP_VERSION)
    }
    onStep("")

    const playerAddress = player.address
    const isPlayer = (addr) => typeof addr === "string" && addr.toLowerCase() === playerAddress.toLowerCase()

    return {
        player: playerAddress,

        // The app's view: only the player's account exists and only it can send.
        request: async (method, params = []) => {
            switch (method) {
                case "eth_accounts":
                case "eth_requestAccounts":
                    return [playerAddress]
                case "eth_sendTransaction":
                    if (!isPlayer(params[0] && params[0].from))
                        throw Object.assign(new Error("Demo: only the demo player can send transactions"), { code: 4100 })
                    return sendTransaction(params[0])
                default:
                    if (/^(evm|miner|debug|personal|eth_sign)/.test(method))
                        throw Object.assign(new Error(`Demo: ${method} is unavailable`), { code: 4200 })
                    return raw(method, params)
            }
        },

        // "Skip ahead": move the demo clock forward and mine a block at the new time.
        skipAhead: async (seconds) => {
            skew += seconds
            storage.set(KEYS.SKEW, String(skew))
            onSkew(skew)
            await serialize(async () => {
                await raw("evm_increaseTime", [seconds])
                await raw("evm_mine", [{ timestamp: nextTimestamp() }])
            })
        },
    }
}

// Same steps as ethereum/scripts/deployers.js, then the demo-only extras: turn the presale off,
// fund and approve the player, and seat a few other players who list cards on the marketplace.
async function setUpChain({ provider, deployer, player, npcs, onStep }) {
    const [CARDCoinJSON, BaseCardsJSON, YieldCardsJSON, GameJSON, DeckJSON, MarketplaceJSON] =
        [CARDCoinRaw, BaseCardsRaw, YieldCardsRaw, GameRaw, DeckRaw, MarketplaceRaw].map(raw => JSON.parse(raw))
    const signer = (wallet) => provider.getSigner(wallet.address)
    const owner = signer(deployer)
    const deploy = async (json, ...args) => {
        const contract = await new ethers.ContractFactory(json.abi, json.bytecode, owner).deploy(...args)
        await contract.deployed()
        return contract
    }
    const send = async (txPromise) => (await txPromise).wait()

    onStep("Deploying the contracts")
    const cardCoin = await deploy(CARDCoinJSON)
    const baseCards = await deploy(BaseCardsJSON)
    const yieldCards = await deploy(YieldCardsJSON)
    await send(cardCoin.grantRole(await cardCoin.MINTER_ROLE(), yieldCards.address))
    const game = await deploy(GameJSON, cardCoin.address, baseCards.address, yieldCards.address)
    const deck = await deploy(DeckJSON, cardCoin.address, baseCards.address, game.address)
    const marketplace = await deploy(MarketplaceJSON, cardCoin.address, baseCards.address, yieldCards.address, game.address)

    const deployed = { CARDCoin: cardCoin, BaseCards: baseCards, YieldCards: yieldCards, Game: game, Deck: deck, Marketplace: marketplace }
    for (const [name, contract] of Object.entries(deployed)) {
        if (contract.address !== DEMO_ADDRESSES[name])
            throw new Error(`Demo setup: ${name} deployed to ${contract.address}, expected ${DEMO_ADDRESSES[name]}`)
    }

    await send(game.grantRFRole(deck.address))
    await send(game.grantRFRole(yieldCards.address))
    await send(game.grantRFRole(marketplace.address))
    await send(yieldCards.setContracts(cardCoin.address, baseCards.address, deck.address, game.address))

    onStep("Shuffling the deck")
    await send(baseCards.mintBatch(deck.address, DECK_AMOUNTS.map((_, id) => id), DECK_AMOUNTS, "0x00"))
    // The presale needs whitelisting and tBNB per card; the demo plays the post-presale game.
    await send(deck.setPresale(false))

    // Faucet $CARD and the three approvals the Login page would otherwise ask for.
    const seat = async (wallet, card) => {
        const s = signer(wallet)
        await send(cardCoin.connect(s).tapFaucet(ethers.utils.parseEther(card)))
        await send(cardCoin.connect(s).approveMax(game.address))
        await send(baseCards.connect(s).setApprovalForAll(game.address, true))
        await send(yieldCards.connect(s).setApprovalForAll(game.address, true))
        return s
    }
    const draw = async (s, quantity) => send(deck.connect(s).draw(quantity))
    const list = async (s, amounts, yieldCardIds, price) => {
        await send(marketplace.connect(s).createListing(amounts, yieldCardIds, ethers.utils.parseEther(price)))
    }
    const balancesOf = async (wallet) => (await baseCards.allBalances(wallet.address)).map(n => n.toNumber())
    const amountsFor = (picks) => {
        const amounts = new Array(21).fill(0)
        picks.forEach(([id, n]) => { amounts[id] += n })
        return amounts
    }

    onStep("Seating the other players")
    await seat(player, STARTING_CARD)

    // NPC 1 and 2 draw a pack each, like any player, and list part of it.
    for (const [i, npc] of npcs.slice(0, 2).entries()) {
        const s = await seat(npc, "30000")
        await draw(s, 20)
        const held = (await balancesOf(npc)).map((n, id) => [id, n]).filter(([, n]) => n > 0)
        held.sort((a, b) => b[1] - a[1] || b[0] - a[0])
        if (i === 0) {
            // A pair of its most common card, then a single of its rarest.
            const [id, n] = held[0]
            await list(s, amountsFor([[id, Math.min(2, n)]]), [], Math.min(2, n) === 2 ? "1250" : "650")
            const [rareId] = held[held.length - 1]
            if (rareId !== id)
                await list(s, amountsFor([[rareId, 1]]), [], "900")
        } else {
            // A bundle of up to four different cards.
            const picks = held.slice(0, 4).map(([id]) => [id, 1])
            await list(s, amountsFor(picks), [], String(picks.length * 550))
        }
    }

    // NPC 3 redeems a Clubs straight (dealt by the owner, as deployers.js deals the deck) for a
    // level 1 Yield Card and lists it.
    const npc3 = npcs[2]
    const s3 = await seat(npc3, "30000")
    await send(baseCards.mintBatch(npc3.address, [0, 1, 2, 3, 4], [1, 1, 1, 1, 1], "0x00"))
    await send(yieldCards.connect(s3).mint([0, 1, 2, 3, 4], 0))
    const tokenId = await yieldCards.tokenOfOwnerByIndex(npc3.address, 0)
    await list(s3, new Array(21).fill(0), [tokenId], "3000")
}

// "Reset demo": forget the player, the chain and the demo clock, then start over at the login page.
export async function resetDemoData() {
    const playerKey = storage.get(KEYS.PLAYER)
    if (current) {
        try { await current.ganache.disconnect() } catch (e) { /* already closed */ }
        current = null
    }
    if (playerKey) {
        // Opened-pack bookkeeping (store/modules/Packs.js) is keyed by the player's address.
        try { storage.remove(new ethers.Wallet(playerKey).address) } catch (e) { /* bad key */ }
    }
    Object.values(KEYS).forEach(storage.remove)
    storage.remove(DEMO_STARTED_KEY)
    await deleteDatabase()
    reloadAt("#/login")
}
