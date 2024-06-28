import { signer } from "../ethers"
import * as Deck from "../contracts/Deck"
import * as Game from "../contracts/Game"
import { ethers } from "ethers"
import { playSound, Sounds } from "../Audio"

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
        draw: async ({ commit }, quantity) => {
            commit("MetaMask/SET_PENDING_SIGNATURE", true, { root: true })
            // Send Transaction
            const gasLimit = await Deck.contract.estimateGas.draw(quantity);
            const overrides = {
                gasLimit: gasLimit.add(1_000_000)
            };
            //console.dir(gasLimit, overrides);
            await Deck.contract.connect(signer).draw(quantity, overrides);
            commit("MetaMask/SET_PENDING_SIGNATURE", false, { root: true })
            commit("MetaMask/ADD_PENDING_TXN", null, { root: true })
            const player = await signer.getAddress();
            Game.contract.removeAllListeners(Game.contract.filters.PackIssued);
            Game.contract.once(
                Game.contract.filters.PackIssued(player),
                (_) => {
                    commit("MetaMask/SUB_PENDING_TXN", null, { root: true });
                    const alert = {
                        autoDismiss: 5,
                        text: `New Pack ready to open!`,
                        links: [{
                            to: "/dapp/play/packs",
                            text: "Open Now"
                        }]
                    }
                    playSound(Sounds.PURCHASE);
                    commit("Alerts/ADD_ALERT", alert, { root:  true })
                }
            );
        },

        meld: async ({ commit, dispatch, rootGetters }, payload) => {
            commit("MetaMask/SET_PENDING_SIGNATURE", true, { root: true });
            // Send Transaction
            const { tokenId, numBaseCards, useWildcard } = payload;
            const gasLimit = await Deck.contract.estimateGas
                .meld(tokenId, numBaseCards, useWildcard);
            const overrides = {
                gasLimit: gasLimit.add(1_000_000)
            };
            await Deck.contract.connect(signer)
                .meld(tokenId, numBaseCards, useWildcard, overrides);
            commit("MetaMask/ADD_PENDING_TXN", null, { root: true });
            const player = await signer.getAddress();
            Game.contract.removeAllListeners(Game.contract.filters.PackIssued);
            Game.contract.once(
                Game.contract.filters.PackIssued(player),
                (_) => {
                    commit("MetaMask/SUB_PENDING_TXN", null, { root: true })
                    const alert = {
                        autoDismiss: 5,
                        text: `New Pack ready to open!`,
                        links: [{
                            to: "/dapp/play/packs",
                            text: "Open Now"
                        }]
                    }
                    commit("Alerts/ADD_ALERT", alert, { root:  true })
                    playSound(Sounds.MELD_SUCCESS);
                }
            );
            commit("MetaMask/SET_PENDING_SIGNATURE", false, { root: true });
        }
    }
}
