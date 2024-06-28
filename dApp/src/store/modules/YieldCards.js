import * as YieldCards from "../contracts/YieldCards";
import { signer } from "../ethers";
import { suitForIndex } from "../static/cards";
import { ethers } from "ethers";
import * as Game from "../contracts/Game";
import { playSound, Sounds } from "../Audio";


const initialState = {
    yieldCards: [],
    gameApproval: false,
}


const buildCard = (card) => {
    return {
        ...card,
        suit: suitForIndex(card.suit),
        imgSrc: `/yield_cards/yc_${suitForIndex(card.suit).toLowerCase()}_${Number(card.level)}.png`,
        videoSrc: `/animations/yc/${suitForIndex(card.suit).toLowerCase()}_${Number(card.level)}.mp4`,
        yieldEstimate: () => {
            const yieldScale = 2.05;
            const multiplier = Math.ceil(Math.pow(yieldScale, Number(card.level.sub(1)))*100);
            const yieldPerSecond = card.yield.mul(multiplier).div(100);
            const secondsNow = ethers.BigNumber.from((Date.now()/1000).toFixed(0));
            const elapsedSeconds = secondsNow.sub(card.lastClaimed);
            const estimate = yieldPerSecond.mul(elapsedSeconds);
            if (estimate.lt(0)) {
                return 0;
            } else {
                return estimate;
            }
        }
    }
}


export default {
    namespaced: true,

    state: () => ({ ...initialState }),

    getters: {
        getById: (state) => (id) => {
            return state.yieldCards.find(yc => yc.id.toString() === id.toString());
        },

        adjustedBalances: (state, getters, rootState, rootGetters) => {
            const player = rootGetters["MetaMask/activeAccount"];
            // This getter should almost always be used
            const unopenedPacks = rootState.Packs.unopenedPacks;
            const unopenedCardIds = unopenedPacks
                .filter(pack => pack.yieldCardIds.length > 0)
                .reduce((p, c) => [...p, ...(c.yieldCardIds).map(id => id.toString())], []);
            const cards = [
                ...state.yieldCards.filter(yc => {
                    return (
                        unopenedCardIds.indexOf(yc.id.toString()) === -1
                    );
                })
            ];
            return cards;
        },

        totalYieldEstimate: (state, getters) => () => {
            const yieldCards = getters.adjustedBalances;
            const sum = yieldCards.reduce((p, c) => p.add(c.yieldEstimate()), ethers.constants.Zero);
            return sum;
        }
    },

    mutations: {
        RESET: (state) => {
            const { yieldCards, gameApproval } = initialState;
            state.yieldCards = [...yieldCards];
            state.gameApproval = gameApproval;
        },
        SET_APPROVAL: (state, approval) => {
            state.gameApproval = approval;
        },
        APPEND_YIELD_CARDS: (state, cards) => {
            cards.forEach(card => {
                const compiledCard = buildCard(card);
                state.yieldCards.push(compiledCard);
            });
        },
        SET_YIELD_CARDS: (state, cards) => {
            const compiledCards = cards.map(card => buildCard(card));
            state.yieldCards = [...compiledCards];
        }
    },

    actions: {
        setupListeners: ({ dispatch }) => {
            signer.getAddress()
                .then(player => {
                    YieldCards.contract.on( // From Player
                        YieldCards.contract.filters.Transfer(player),
                        (from, to, id) => {
                            dispatch("fetchBalance");
                        }
                    );
                    YieldCards.contract.on( // To Player
                        YieldCards.contract.filters.Transfer(null, player),
                        (from, to, id) => {
                            dispatch("fetchBalance");
                        }
                    );
                })
                .catch(console.error);
        },

        fetchYieldCards: ({ commit, getters }, yieldCardIds) => {
            return new Promise((resolve, reject) => {
                const newIds = yieldCardIds.filter(id => getters.getById(id) === undefined);
                Promise.all(newIds.map(id => YieldCards.contract.tokenById(id)))
                    .then(yieldCards => commit("APPEND_YIELD_CARDS", yieldCards))
                    .then(() => resolve())
                    .catch(reject);
            })
        },

        fetchBalance: async ({ commit, dispatch }) => {
            const playerAddress = await signer.getAddress();
            const playerBalance = await YieldCards.contract.balanceOf(playerAddress);
            if (playerBalance.eq(ethers.constants.Zero)) {
              return;
            }
            const tokenIds = await Promise.all(
                Array.from(Array(playerBalance.toNumber()).keys()) // [0..(playerBalance-1)]
                    .map(tokenIndex => YieldCards.contract.tokenOfOwnerByIndex(playerAddress, tokenIndex)));
            const tokenDataPromises = tokenIds.map(tokenId => YieldCards.contract.tokenById(tokenId));
            const tokenData = await Promise.all(tokenDataPromises);
            commit("SET_YIELD_CARDS", tokenData);
            await dispatch("Packs/sync", null, { root: true });
        },

        fetchApproval: ({ commit }) => {
            return new Promise((resolve, reject) => {
                signer.getAddress()
                    .then(addr => YieldCards.contract.isApprovedForAll(addr, Game.address))
                    .then(approval => commit("SET_APPROVAL", approval))
                    .then(() => resolve())
                    .catch(e => {
                        commit("SET_APPROVAL", false);
                        reject(e);
                    });
            });
        },

        requestApproval({ commit }) {
            return new Promise((resolve, reject) => {
                commit("MetaMask/SET_PENDING_SIGNATURE", true, { root: true })
                // Set Approval
                YieldCards.contract.setApprovalForAll(Game.address, true)
                    .then(() => {
                        commit("MetaMask/ADD_PENDING_TXN", null, { root: true })
                        return signer.getAddress();
                    })
                    .then(player => {
                        // Listen for Event
                        YieldCards.contract.removeAllListeners(YieldCards.contract.filters.ApprovalForAll);
                        YieldCards.contract.once(
                            YieldCards.contract.filters.ApprovalForAll(player, Game.address),
                            (account, operator, approved) => {
                                commit("SET_APPROVAL", approved);
                                commit("MetaMask/SUB_PENDING_TXN", null, { root: true });
                                playSound(Sounds.MELD_SUCCESS);
                                commit(
                                    "Alerts/ADD_ALERT",
                                    { autoDismiss: 5, text: "Yield Cards Approved!" },
                                    { root:  true }
                                );
                            });
                        resolve();
                    })
                    .finally(() => commit("MetaMask/SET_PENDING_SIGNATURE", false, { root: true }))
                    .catch(e => {
                        commit("Alerts/ADD_ERROR_ALERT", e.message, { root:  true })
                        reject(e);
                    });
            })
        },

        mint: ({ commit }, payload) => (
            new Promise((resolve, reject) => {
                commit("MetaMask/SET_PENDING_SIGNATURE", true, { root: true })
                // Send Transaction
                const { ids, suit } = payload
                const overrides = { }
                YieldCards.contract
                    .connect(signer)
                    .mint(ids, suit, overrides)
                    .then(() => {
                        commit("MetaMask/ADD_PENDING_TXN", null, { root: true });
                        return signer.getAddress();
                    })
                    .then(player_ => {
                        // Listen for Event
                        YieldCards.contract.removeAllListeners(YieldCards.contract.filters.Minted);
                        YieldCards.contract.once(
                            YieldCards.contract.filters.Minted(player_),
                            (account, tokenId) => {
                                commit("MetaMask/SUB_PENDING_TXN", null, { root: true });
                                const alert = {
                                    autoDismiss: 5,
                                    text: "Yield Card minted!",
                                    links: [{
                                        to: "/dapp/play/packs",
                                        text: "Open Now"
                                    }]
                                }
                                commit("Alerts/ADD_ALERT", alert, { root:  true });
                                playSound(Sounds.ROYAL_FLUSH);
                                resolve();
                            }
                        );
                        resolve();
                    })
                    .finally(() => commit("MetaMask/SET_PENDING_SIGNATURE", false, { root: true }))
                    .catch(e => {
                        commit("Alerts/ADD_ERROR_ALERT", e.message, { root:  true });
                        reject(e);
                    })
            })
        ),

        levelUp: ({ commit }, payload) => {
            return new Promise((resolve, reject) => {
                commit("MetaMask/SET_PENDING_SIGNATURE", true, { root: true })
                // Send Transaction
                const { ids } = payload
                const overrides = { }
                YieldCards.contract
                    .connect(signer)
                    .levelUp(ids[0], ids[1], overrides)
                    .then(() => {
                        commit("MetaMask/ADD_PENDING_TXN", null, { root: true });
                        return signer.getAddress();
                    })
                    .then(player_ => {
                        // Listen for Event
                        YieldCards.contract.removeAllListeners(YieldCards.contract.filters.Minted);
                        YieldCards.contract.once(
                            YieldCards.contract.filters.Minted(player_),
                            (account, tokenId) => {
                                // dispatch("Packs/sync", null, { root: true });
                                commit("MetaMask/SUB_PENDING_TXN", null, { root: true });
                                const alert = {
                                    autoDismiss: 5,
                                    text: "Yield Card Leveled Up!",
                                    links: [{
                                        to: "/dapp/play/packs",
                                        text: "Open Now"
                                    }]
                                }
                                commit("Alerts/ADD_ALERT", alert, { root:  true });
                                playSound(Sounds.ROYAL_FLUSH);
                            }
                        );
                        resolve();
                    })
                    .finally(() => commit("MetaMask/SET_PENDING_SIGNATURE", false, { root: true }))
                    .catch(e => {
                        commit("Alerts/ADD_ERROR_ALERT", e.message, { root:  true });
                        reject(e);
                    })
            })
        },

        claim: ({ commit, dispatch }, payload) => {
            return new Promise((resolve, reject) => {
                commit("MetaMask/SET_PENDING_SIGNATURE", true, { root: true })
                // Send Transaction
                const { tokenId, tokenToBurn } = payload;
                const overrides = {};
                YieldCards.contract
                    .connect(signer)
                    .claim(tokenId, tokenToBurn)
                    .then(() => {
                        commit("MetaMask/ADD_PENDING_TXN", null, { root: true })
                        return signer.getAddress()
                    })
                    .then(player_ => {
                        // Listen for Event
                        YieldCards.contract.removeAllListeners(YieldCards.contract.filters.YieldClaimed);
                        YieldCards.contract.once(
                            YieldCards.contract.filters.YieldClaimed(player_),
                            (account, amount) => {
                                commit("MetaMask/SUB_PENDING_TXN", null, { root: true });
                                dispatch("fetchBalance");
                                const alert = {
                                    autoDismiss: 5,
                                    text: `${Number(ethers.utils.formatUnits(amount)).toFixed(5)} $CARD Claimed!`
                                }
                                commit("Alerts/ADD_ALERT", alert, { root:  true })
                                playSound(Sounds.CLAIM);
                            }
                        );
                        resolve();
                    })
                    .finally(() => commit("MetaMask/SET_PENDING_SIGNATURE", false, { root: true }))
                    .catch(e => {
                        commit("Alerts/ADD_ERROR_ALERT", e.message, { root:  true })
                        reject(e);
                    });
            })
        },
    }
}
