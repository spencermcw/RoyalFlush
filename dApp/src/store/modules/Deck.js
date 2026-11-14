import { signer } from "../ethers"
import * as Deck from "../contracts/Deck"
import * as Game from "../contracts/Game"
import { ethers } from "ethers"
import { playSound, Sounds } from "../Audio"
import { txErrorMessage } from "../txErrors"

const packAlert = {
    autoDismiss: 5,
    text: `New Pack ready to open!`,
    links: [{
        to: "/dapp/play/packs",
        text: "Open Now"
    }]
}

const sendPackTransaction = async (commit, { send, estimate, failure, sound }) => {
    commit("MetaMask/SET_PENDING_SIGNATURE", true, { root: true })
    let tx
    try {
        const gasLimit = await estimate()
        tx = await send({ gasLimit: gasLimit.add(1_000_000) })
    } catch (e) {
        console.error(failure, e)
        commit("Alerts/ADD_ERROR_ALERT", `${failure}: ${txErrorMessage(e)}`, { root: true })
        return false
    } finally {
        commit("MetaMask/SET_PENDING_SIGNATURE", false, { root: true })
    }

    commit("MetaMask/ADD_PENDING_TXN", null, { root: true })
    const player = await signer.getAddress()
    const filter = Game.contract.filters.PackIssued(player)
    Game.contract.removeAllListeners(Game.contract.filters.PackIssued)
    Game.contract.once(filter, (_) => {
        commit("MetaMask/SUB_PENDING_TXN", null, { root: true })
        playSound(sound)
        commit("Alerts/ADD_ALERT", packAlert, { root: true })
    })
    // A transaction that reverts once mined never emits PackIssued: stop waiting for it.
    tx.wait().catch(e => {
        console.error(failure, e)
        Game.contract.removeAllListeners(filter)
        commit("MetaMask/SUB_PENDING_TXN", null, { root: true })
        commit("Alerts/ADD_ERROR_ALERT", `${failure}: ${txErrorMessage(e)}`, { root: true })
    })
    return true
}

export default {
    namespaced: true,

    state: () => ({
        // totalDrawn: 0,
        // Melding
        drawQuantities: [
            [3, 3, 3, 4, 4, 6, 6, 6, 6, 7, 11, 11, 11, 11, 11, 17, 18, 18, 18, 18],
            [6, 6, 6, 7, 7, 11, 11, 12, 12, 12, 20, 20, 21, 21, 21, 33, 33, 33, 34, 34],
            [9, 10, 10, 11, 11, 17, 18, 19, 19, 20, 32, 32, 33, 34, 34, 52, 53, 53, 54, 55],
            [14, 14, 15, 16, 17, 26, 27, 28, 29, 30, 48, 49, 50, 50, 51, 78, 79, 80, 81, 82]
        ],
        prices: [
            [248, 248, 248, 495, 495, 985, 985, 985, 985, 1229, 2190, 2190, 2190, 2190, 2190, 3595, 3824, 3824, 3824, 3824],
            [739, 739, 739, 983, 983, 1946, 1946, 2184, 2184, 2184, 4043, 4043, 4270, 4270, 4270, 6896, 6896, 6896, 7107, 7107],
            [1223, 1463, 1463, 1703, 1703, 3115, 3346, 3576, 3576, 3805, 6454, 6454, 6666, 6878, 6878, 10478, 10666, 10666, 10854, 11040],
            [2173, 2173, 2409, 2643, 2876, 4917, 5138, 5357, 5576, 5793, 9491, 9685, 9878, 9878, 10070, 14778, 14935, 15091, 15246, 15400]
        ],
        meldTypeIndex: {
            TWO_OF_A_KIND: 0,
            THREE_OF_A_KIND: 1,
            FOUR_OF_A_KIND: 3,
            FIVE_OF_A_KIND: 4,
        },
    }),

    getters: {
        meldPrice: (state) => (meldType, tokenId) => state.prices[meldType][tokenId],
        meldDrawQuantity: (state) => (meldType, tokenId) => state.drawQuantities[meldType][tokenId],
    },

    actions: {
        // Draw and meld send one transaction, then wait for Game's PackIssued event. Any failure on
        // the way (a revert caught by gas estimation, such as too little $CARD, a rejected
        // signature, or a transaction that reverts once mined) ends the pending state and shows an
        // error, instead of leaving the wallet button on "Pending Signature" for good.
        draw: async ({ commit }, quantity) => {
            return sendPackTransaction(commit, {
                send: (overrides) => Deck.contract.connect(signer).draw(quantity, overrides),
                estimate: () => Deck.contract.estimateGas.draw(quantity),
                failure: "Could not draw a pack",
                sound: Sounds.PURCHASE,
            })
        },

        meld: async ({ commit }, payload) => {
            const { tokenId, numBaseCards, useWildcard } = payload;
            return sendPackTransaction(commit, {
                send: (overrides) => Deck.contract.connect(signer).meld(tokenId, numBaseCards, useWildcard, overrides),
                estimate: () => Deck.contract.estimateGas.meld(tokenId, numBaseCards, useWildcard),
                failure: "Could not meld",
                sound: Sounds.MELD_SUCCESS,
            })
        }
    }
}
