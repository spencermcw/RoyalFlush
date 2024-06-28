import { ethers } from "ethers";
import { signer, provider } from "../ethers";
import { playSound, Sounds } from "../Audio";
import * as CARDCoin from "../contracts/CARDCoin";
import * as Game from "../contracts/Game";


const initialState = {
    balance: ethers.constants.Zero,
    totalSpent: ethers.constants.Zero,
    gameAllowance: ethers.constants.Zero,
};


export default {
    namespaced: true,
    state: () => ({ ...initialState }),
    mutations: {
        RESET: (state) => {
            const { balance, totalSpent, gameAllowance } = initialState;
            state.balance = balance;
            state.totalSpent = totalSpent;
            state.gameAllowance = gameAllowance;
        },
        SET_ALLOWANCE: (state, allowance) => {
            state.gameAllowance = allowance;
        },
        SET_TOTAL_SPENT: (state, amount) => {
            state.totalSpent = amount;
        },
        SET_BALANCE: (state, balance) => {
            state.balance = balance;
        }
    },
    actions: {
        setupListeners: ({ dispatch }) => {
            signer.getAddress()
                .then(player => {
                    CARDCoin.contract.on(
                        CARDCoin.contract.filters.Transfer(null, player),
                        (from, to, value) => {
                            dispatch("fetchBalance");
                        }
                    );
                    CARDCoin.contract.on(
                        CARDCoin.contract.filters.Transfer(player),
                        (from, to, value) => {
                            dispatch("fetchBalance");
                        }
                    );
                })
                .catch(console.error);
        },

        tapFaucet: ({ commit }) => {
            commit("MetaMask/SET_PENDING_SIGNATURE", true, { root: true });
            CARDCoin.contract.tapFaucet(ethers.utils.parseEther("10000").toString())
                .then(() => {
                    commit("MetaMask/ADD_PENDING_TXN", null, { root: true });
                    return signer.getAddress();
                })
                .then((player) => {
                    CARDCoin.contract.once(
                        CARDCoin.contract.filters.Transfer(null, player),
                        (from, to, value) => {
                            commit("MetaMask/SUB_PENDING_TXN", null, { root: true });
                            commit(
                                "Alerts/ADD_ALERT",
                                { autoDismiss: 5, text: "$CARD Coin Faucet Tapped! Spend it wisely!" },
                                { root:  true }
                            );
                            playSound(Sounds.CLAIM);
                        }
                    );
                })
                .finally(() => commit("MetaMask/SET_PENDING_SIGNATURE", false, { root: true }))
                .catch(e => {
                    commit("Alerts/ADD_ERROR_ALERT", e.message, { root:  true });
                    console.error(e);
                });
        },

        fetchAllowance: ({ commit }) => {
            return new Promise((resolve, reject) => {
                signer.getAddress()
                    .then(addr => CARDCoin.contract.allowance(addr, Game.address))
                    .then(allowance => commit("SET_ALLOWANCE", allowance))
                    .then(() => resolve())
                    .catch(e => {
                        commit("SET_ALLOWANCE", ethers.constants.Zero);
                        reject(e);
                    });
            });
        },

        fetchBalance: ({ commit }) => {
            return signer.getAddress()
                .then(player => {
                    return CARDCoin.contract.balanceOf(player)
                })
                .then(balance => commit("SET_BALANCE", balance))
                .catch(e => {
                    commit("SET_BALANCE", ethers.constants.Zero);
                    console.error(e);
                });
        },

        requestAllowance: ({ commit }) => (
            new Promise((resolve, reject) => {
                commit("MetaMask/SET_PENDING_SIGNATURE", true, { root: true });
                // Send Transaction
                CARDCoin.contract.approveMax(Game.address)
                    .then(() => {
                        commit("MetaMask/ADD_PENDING_TXN", null, { root: true });
                        return signer.getAddress();
                    })
                    .then(player => {
                        // Listen for Event
                        CARDCoin.contract.once(
                            CARDCoin.contract.filters.Approval(player),
                            (owner, spender, allowance) => {
                                commit('SET_ALLOWANCE', allowance);
                                playSound(Sounds.MELD_SUCCESS);
                                commit("MetaMask/SUB_PENDING_TXN", null, { root: true });
                                commit(
                                    "Alerts/ADD_ALERT",
                                    { autoDismiss: 5, text: "$CARD Coin Approved!" },
                                    { root:  true }
                                );
                            }
                        );
                        resolve();
                    })
                    .finally(() => commit("MetaMask/SET_PENDING_SIGNATURE", false, { root: true }))
                    .catch(e => {
                        commit("Alerts/ADD_ERROR_ALERT", e.message, { root:  true });
                        console.error(e);
                        reject(e);
                    });
            })
        )
    }
}

