import { signer } from "../ethers";
import * as Game from "../contracts/Game";


const { localStorage } = window;


export default {
    namespaced: true,

    state: () => ({
        openedPacks: [],
        issuedPacks: [],
        unopenedPacks: [],
    }),

    mutations: {
        UPDATE_STORAGE: (state, player_) => {
            localStorage.setItem(player_, JSON.stringify({
                openedPacks: state.openedPacks.map(packId => packId.toString())
            }));
        },
        SET_ISSUED_PACKS: (state, issuedPacks_) => {
            state.issuedPacks = [...issuedPacks_];
        },
        SET_OPENED_PACKS: (state, opendPacks_) => {
            state.openedPacks = [...opendPacks_];
        },
        SET_UNOPENED_PACKS: (state, unopendPacks_) => {
            state.unopenedPacks = [...unopendPacks_];
        },
        OPEN_PACK: (state, packId_) => {
            state.openedPacks.push(packId_.toString());
        },
    },

    actions: {
        sync: ({ state, commit }) => {
            return new Promise((resolve, reject) => {
                signer.getAddress()
                    .then(player_ => {
                        // Initialize (from) localStorage
                        const storage = JSON.parse(localStorage.getItem(player_));
                        if (storage !== null) {
                            commit("SET_OPENED_PACKS", storage.openedPacks);
                        } else {
                            commit("UPDATE_STORAGE", player_);
                        }
                        // Fetch Packs Issued
                        return Game.contract.allPacksIssuedToPlayer(player_);
                    })
                    .then(issuedPacks_ => {
                        commit("SET_ISSUED_PACKS", issuedPacks_);
                        const unopenedPacks = state.issuedPacks
                            .filter(pack_ => state.openedPacks.indexOf(pack_.id.toString()) === -1)
                        commit("SET_UNOPENED_PACKS", unopenedPacks);
                    })
                    .then(() => resolve())
                    .catch(reject)
            });
        },

        openPack: ({ commit, dispatch }, packId_) => {
            return new Promise((resolve, reject) => {
                signer.getAddress()
                    .then(player => {
                        commit("OPEN_PACK", packId_)
                        commit("UPDATE_STORAGE", player);
                    })
                    .then(() => dispatch("sync"))
                    .then(() => resolve())
                    .catch(reject)
            })
        }
    }
}
