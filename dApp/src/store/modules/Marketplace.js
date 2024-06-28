import { ethers } from "ethers";
import * as Marketplace from "../contracts/Marketplace";
import * as YieldCards from "../contracts/YieldCards";
import { signer } from "../ethers";
import { playSound, Sounds } from "../Audio";


export default {
    namespaced: true,

    state: () => ({
        listings: [],
        escrowBalance: ethers.constants.Zero,
    }),

    getters: {
        listingById: (state) => (id) => state.listings.find(l => l[0].toString() === id)
    },

    mutations: {
        SET_LISTINGS: (state, listings) => {
            state.listings = [ ...listings ];
        },
        SET_APPROVED: (state, approved) => {
            state.approved = approved;
        },
        SET_ESCROW_BALANCE: (state, balance) => {
            state.escrowBalance = balance;
        },
    },

    actions: {
        fetchListings: ({ commit, dispatch, rootGetters }) => {
            // TODO: pagination
            return new Promise((resolve, reject) => {
                Marketplace.contract
                    .getListings()
                    .then(listings => {
                        return Promise.all(listings.map(listing => {
                            return new Promise((resolve2, reject2) => {
                                dispatch("YieldCards/fetchYieldCards", listing.yieldCardIds, { root: true })
                                    .then(() => {
                                        resolve2({
                                            ...listing,
                                            yieldCards: listing.yieldCardIds.map(id => rootGetters["YieldCards/getById"](id))
                                        });
                                    })
                                    .catch(reject2)
                            });
                        }))
                    })
                    .then(listings => {
                        commit("SET_LISTINGS", listings);
                        resolve();
                    })
                    .catch(e => {
                        console.error(e);
                        reject(e);
                    });
            });
        },

        getEscrowBalance: ({ commit }) => {
            signer.getAddress()
                .then(address => Marketplace.contract.depositsOf(address))
                .then(balance => commit("SET_ESCROW_BALANCE", balance))
                .catch(e => console.error("Marketplace#getEscrowBalance", e))
        },

        claimEscrow: ({ commit, dispatch }) => {
            return new Promise((resolve, reject) => {
                commit("MetaMask/SET_PENDING_SIGNATURE", true, { root: true })
                // Send Transaction
                const overrides = { }
                Marketplace.contract
                    .connect(signer)
                    .collect(overrides)
                    .then(() => {
                        commit("MetaMask/ADD_PENDING_TXN", null, { root: true })
                        return signer.getAddress()
                    })
                    .then(player_ => {
                        // Listen for Event
                        Marketplace.contract.removeAllListeners(Marketplace.contract.filters.EscrowTransfer);
                        Marketplace.contract.once(
                            Marketplace.contract.filters.EscrowTransfer(player_),
                            (account, balance) => {
                                commit("MetaMask/SUB_PENDING_TXN", null, { root: true });
                                dispatch("getEscrowBalance");
                                const alert = { autoDismiss: 5, text: `${ethers.utils.formatEther(balance)} $CARD Coin Claimed from Marketplace!` };
                                playSound(Sounds.CLAIM);
                                commit("Alerts/ADD_ALERT", alert, { root:  true });
                            }
                        );
                        resolve();
                    })
                    .finally(() => commit("MetaMask/SET_PENDING_SIGNATURE", false, { root: true }))
                    .catch(e => {
                        commit("Alerts/ADD_ERROR_ALERT", e.message, { root:  true })
                        reject(e);
                    });
            });
        },

        createListing: ({ commit, dispatch }, payload) => {
            return new Promise((resolve, reject) => {
                const { BCAmounts, YCIDs, price } = payload;
                commit("MetaMask/SET_PENDING_SIGNATURE", true, { root: true });
                // Send Transaction
                const overrides = { }
                Marketplace.contract
                    .connect(signer)
                    .createListing(BCAmounts, YCIDs, price, overrides)
                    .then(() => {
                        commit("MetaMask/ADD_PENDING_TXN", null, { root: true })
                        return signer.getAddress();
                    })
                    .then(player_ => {
                        // Listen for Event
                        Marketplace.contract.removeAllListeners(Marketplace.contract.filters.ListingUpdated);
                        Marketplace.contract.once(
                            Marketplace.contract.filters.ListingUpdated(player_),
                            (account, listing) => {
                                dispatch("fetchListings");
                                commit("MetaMask/SUB_PENDING_TXN", null, { root: true })
                                playSound(Sounds.NEW_LISTING);
                                const alert = { autoDismiss: 5, text: "Listing Posted!" }
                                commit("Alerts/ADD_ALERT", alert, { root:  true })
                            }
                        );
                        resolve();
                    })
                    .finally(() => commit("MetaMask/SET_PENDING_SIGNATURE", false, { root: true }))
                    .catch(e => {
                        commit("Alerts/ADD_ERROR_ALERT", e.message, { root:  true });
                        reject(e);
                    });
            });
        },

        purchaseListing: ({ commit, dispatch }, payload) => {
            return new Promise((resolve, reject) => {
                commit("MetaMask/SET_PENDING_SIGNATURE", true, { root: true })
                // Send Transaction
                const { id } = payload
                const overrides = { }
                Marketplace.contract.connect(signer).purchaseListing(id, overrides)
                    .then(() => {
                        commit("MetaMask/ADD_PENDING_TXN", null, { root: true });
                        return signer.getAddress();
                    })
                    .then(player_ => {
                        // Listen for Event
                        Marketplace.contract.removeAllListeners(Marketplace.contract.filters.ListingUpdated);
                        Marketplace.contract.once(
                            Marketplace.contract.filters.ListingUpdated(null, player_),
                            (account, listing) => {
                                dispatch("fetchListings");
                                commit("MetaMask/SUB_PENDING_TXN", null, { root: true });
                                const alert = {
                                    autoDismiss: 5,
                                    text: "Listing Purchased!",
                                    links: [{
                                        to: "/dapp/play/packs",
                                        text: "Open Now"
                                    }]
                                };
                                commit("Alerts/ADD_ALERT", alert, { root:  true })
                                playSound(Sounds.PURCHASE);
                            }
                        );
                        resolve();
                    })
                    .finally(() => commit("MetaMask/SET_PENDING_SIGNATURE", false, { root: true }))
                    .catch(e => {
                        // console.error("Marketplace#purchaseListing", e);
                        commit("Alerts/ADD_ERROR_ALERT", e.message, { root: true });
                        reject(e);
                    });
            });
        },

        cancelListing: ({ commit, dispatch, rootGetters }, payload) => {
            return new Promise((resolve, reject) => {
                commit("MetaMask/SET_PENDING_SIGNATURE", true, { root: true })
                // Send Transaction
                const { id } = payload
                const overrides = { }
                Marketplace.contract.connect(signer).closeListing(id, overrides)
                    .then(() => {
                        commit("MetaMask/ADD_PENDING_TXN", null, { root: true })
                        // Listen for Event
                        const activeAccount = rootGetters["MetaMask/activeAccount"]
                        Marketplace.contract.once(
                            Marketplace.contract.filters.ListingUpdated(activeAccount),
                            (account, listing) => {
                                dispatch("fetchListings");
                                commit("MetaMask/SUB_PENDING_TXN", null, { root: true })
                                const alert = { autoDismiss: 5, text: "Listing Cancelled." }
                                playSound(Sounds.PURCHASE);
                                commit("Alerts/ADD_ALERT", alert, { root:  true })
                            }
                        );
                        resolve();
                    })
                    .finally(() => commit("MetaMask/SET_PENDING_SIGNATURE", false, { root: true }))
                    .catch(e => {
                        // console.error("Marketplace#cancelListing", e);
                        commit("Alerts/ADD_ERROR_ALERT", e.message, { root:  true });
                        reject(e);
                    });
            });
        },
    }
}

