import { ethers } from "ethers"
import { provider } from "../ethers"
import { playSound, Sounds } from "../Audio"

export default {
    namespaced: true,

    state: () => ({
        accounts: [],
        pendingTransactions: 0,
        pendingSignature: false,
    }),

    getters: {
        connected: (state) => Boolean(state.accounts.length),
        activeAccount: (state) => (state.accounts.length ? ethers.utils.getAddress(state.accounts[0]) : null),
        pending: (state) => state.pendingTransactions > 0 || state.pendingSignature,
    },

    mutations: {
        SET_ACCOUNTS(state, _accounts) {
            state.accounts = _accounts.map(acc => ethers.utils.getAddress(acc))
        },
        SET_PENDING_SIGNATURE(state, _pending) {
            state.pendingSignature = _pending
        },
        ADD_PENDING_TXN(state) {
            state.pendingTransactions++
        },
        SUB_PENDING_TXN(state) {
            if (state.pendingTransactions > 0)
                state.pendingTransactions--
        },
    },

    actions: {
        connect({ commit }) {
            commit("SET_PENDING_SIGNATURE", true)
            provider.send("eth_requestAccounts")
                .then(() => playSound(Sounds.MELD_SUCCESS))
                .finally(() => commit("SET_PENDING_SIGNATURE", false))
                .catch(e => console.error("MetaMask#connect", e))
        },

        updateAccounts({ commit, dispatch }) {
            return new Promise((resolve, reject) => {
                provider.send("eth_accounts")
                    .then(accounts => {
                        commit("SET_ACCOUNTS", accounts)
                        return dispatch("initialize", null, { root: true });
                    })
                    .then(() => resolve())
                    .catch(e => {
                        console.error("MetaMask#updateAccounts", e)
                        reject(e);
                    });
            })
        },
    }
}
