import { createStore } from "vuex"
import { provider } from "./ethers"

import CARDCoin from "./modules/CARDCoin"
import BaseCards from "./modules/BaseCards"
import YieldCards from "./modules/YieldCards"
import Deck from "./modules/Deck"
import Marketplace from "./modules/Marketplace"
import MetaMask from "./modules/MetaMask"
import Alerts from "./modules/Alerts"
import Packs from "./modules/Packs"

const { localStorage } = window;

export const keys = {
    AUDIO_ENABLED: "AUDIO_ENABLED",
};

const initAudioEnabled = () => {
    const audioEnabled = JSON.parse(localStorage.getItem(keys.AUDIO_ENABLED))
    if (audioEnabled === null)
        return true;
    else
        return audioEnabled;
}


export default createStore({
    state: () => ({
        audioEnabled: initAudioEnabled()
    }),

    modules: {
        MetaMask,
        BaseCards,
        Deck,
        Marketplace,
        CARDCoin,
        YieldCards,
        Alerts,
        Packs,
    },

    mutations: {
        TOGGLE_AUDIO: (state) => {
            state.audioEnabled = !state.audioEnabled;
            localStorage.setItem(keys.AUDIO_ENABLED, state.audioEnabled);
        }
    },

    actions: {
        // TODO: revisit
        initialize: ({ commit, dispatch }) => {
            return new Promise(async (resolve, reject) => {
                const accounts = await provider.send("eth_accounts");
                if (accounts.length === 0) {
                    commit("CARDCoin/RESET");
                    commit("BaseCards/RESET");
                    commit("YieldCards/RESET");
                    return resolve();
                }
                await Promise.all([
                    // CardERC20
                    dispatch("CARDCoin/fetchAllowance"),
                    dispatch("CARDCoin/fetchBalance"),
                    dispatch("CARDCoin/setupListeners"),
                    // BaseCardsERC1155
                    dispatch("BaseCards/fetchApproval"),
                    dispatch("BaseCards/fetchBalance"),
                    dispatch("BaseCards/setupListeners"),
                    // YieldCard721
                    dispatch("YieldCards/fetchApproval"),
                    dispatch("YieldCards/fetchBalance"),
                    dispatch("YieldCards/setupListeners"),
                    // General
                    // dispatch("Packs/sync"),
                ]);
                return resolve();

                // If we want to use this it needs to be done for diff environment
                // try {
                //     // console.log("Checking MetaMask Network...")
                //     await ethereum.request({
                //         method: 'wallet_switchEthereumChain',
                //         params: [{ chainId: '0x539' }],
                //     });
                // } catch (switchError) {
                //     // This error code indicates that the chain has not been added to MetaMask.
                //     if (switchError.code === 4902) {
                //         try {
                //             await ethereum.request({
                //                 method: 'wallet_addEthereumChain',
                //                 params: [{ chainId: '0x539', rpcUrl: 'http://127.0.0.1:8545' }],
                //             });
                //         } catch (addError) {
                //             // handle "add" error
                //         }
                //     }
                //     // handle other "switch" errors
                // }
            })
        }
    }
})
