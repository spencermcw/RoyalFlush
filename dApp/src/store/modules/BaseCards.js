import { ethers } from "ethers";
import { signer } from "../ethers";
import { playSound, Sounds } from "../Audio";

import * as BaseCards from "../contracts/BaseCards";
import * as Game from "../contracts/Game";



const initialState = {
    balances: new Array(21).fill(ethers.constants.Zero),
    gameApproval: false,
}


export default {
    namespaced: true,

    state: () => ({ ...initialState }),

    getters: {
        // Balances Adjusted by Packs Drawn
        // This getter should almost always be used
        adjustedBalances: (state, getters, rootState) => {
            const unopenedPacks = rootState.Packs.unopenedPacks;
            const balances = [ ...state.balances ];
            // For each Pack Drawn
            unopenedPacks.forEach(pack => pack.baseCardAmounts
                // Subtract amount from balance
                .forEach((amount, index) => balances[index] = balances[index].sub(amount))
            );
            // Return altered balances
            return balances;
        },
        totalCards: (state, getters) => {
            return getters.adjustedBalances.reduce((a, c) => a + c.toNumber(), 0);
        },
    },

    mutations: {
        RESET(state) {
            const { balances, gameApproval } = initialState;
            state.balances = [...balances];
            state.gameApproval = gameApproval;
        },
        SET_BALANCES(state, balances) {
            state.balances = [ ...balances ];
        },
        SET_APPROVAL(state, approved) {
            state.gameApproval = approved;
        }
    },

    actions: {
        setupListeners: ({ dispatch }) => {
            signer.getAddress()
                .then(player => {
                    BaseCards.contract.on( // From Player
                        BaseCards.contract.filters.TransferBatch(null, player),
                        (operator, from, to, ids, values) => {
                            dispatch("fetchBalance");
                        });
                    BaseCards.contract.on( // To Player
                        BaseCards.contract.filters.TransferBatch(null, null, player),
                        (operator, from, to, ids, values) => {
                            dispatch("fetchBalance");
                        });
                })
                .catch(console.error);
        },

        fetchBalance({ commit, dispatch }) {
            return new Promise((resolve, reject) => {
                dispatch("Packs/sync", null, { root: true })
                    .then(() => signer.getAddress())
                    .then(addr => BaseCards.contract.allBalances(addr))
                    .then(balances => commit("SET_BALANCES", balances))
                    .then(() => resolve())
                    .catch(e => {
                        commit("SET_BALANCES", new Array(21).fill(ethers.constants.Zero))
                        reject(e);
                    });
            })
        },

        fetchApproval({ commit }) {
            return new Promise((resolve, reject) => {
                signer.getAddress()
                    .then(addr => BaseCards.contract.isApprovedForAll(addr, Game.address))
                    .then(approval => commit("SET_APPROVAL", approval))
                    .then(() => resolve())
                    .catch(e => {
                        commit("SET_APPROVAL", false);
                        reject(e);
                    });
            })
        },

        requestApproval({ commit }) {
            return new Promise((resolve, reject) => {
                commit("MetaMask/SET_PENDING_SIGNATURE", true, { root: true })
                // Set Approval
                BaseCards.contract
                    .setApprovalForAll(Game.address, true)
                    .then(() => {
                        commit("MetaMask/ADD_PENDING_TXN", null, { root: true })
                        return signer.getAddress()
                    })
                    .then(player_ => {
                        // Listen for Event
                        BaseCards.contract.removeAllListeners(BaseCards.contract.filters.ApprovalForAll);
                        BaseCards.contract.once(
                            BaseCards.contract.filters.ApprovalForAll(player_, Game.address),
                            (account, operator, approved) => {
                                commit("SET_APPROVAL", approved);
                                commit("MetaMask/SUB_PENDING_TXN", null, { root: true });
                                playSound(Sounds.MELD_SUCCESS);
                                commit(
                                    "Alerts/ADD_ALERT",
                                    { autoDismiss: 5, text: "Base Cards Approved!" },
                                    { root:  true }
                                );
                            });
                    })
                    .finally(() => commit("MetaMask/SET_PENDING_SIGNATURE", false, { root: true }))
                    .catch(e => {
                        commit("Alerts/ADD_ERROR_ALERT", e.message, { root:  true })
                        reject(e)
                    });
            });
        }
    }
}
