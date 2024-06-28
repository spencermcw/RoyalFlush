<script setup>
    import { ethers } from "ethers"
    import { ref, computed, onMounted } from "vue"
    import { useStore } from "vuex"
    import { allCards, suits, values, suitForIndex, biClassForSuit, cardForId } from "../store/static/cards"
    import CardVue from "../components/Card.vue";
    import CardCollectionVue from "../components/CardCollection.vue";
    import MetamaskVue from "../components/Metamask.vue";
    import { Modal } from "bootstrap";
    import { playSound, Sounds } from "../store/Audio";

    const store = useStore();
    store.dispatch("Marketplace/fetchListings");

    const ListingStatus = ["Open", "Sold", "Cancelled"];

    const FilterTypes = {
        STATUS: {
            OPEN: "Open",
            SOLD: "Sold",
            CLOSED: "Cancelled",
        },
        NUM_CARDS: {
            SINGLE: "Single",
            BUNDLE: "Bundle",
        },
        CARD_TYPES: {
            BASE_CARDS: "Base Cards",
            YIELD_CARDS: "Yield Cards",
        },
        SUITS: {
            [suits.CLUBS]: suits.CLUBS,
            [suits.DIAMONDS]: suits.DIAMONDS,
            [suits.HEARTS]: suits.HEARTS,
            [suits.SPADES]: suits.SPADES,
        },
        BC_VALUES: {
            [values.TEN]: values.TEN,
            [values.JACK]: values.JACK,
            [values.QUEEN]: values.QUEEN,
            [values.KING]: values.KING,
            [values.ACE]: values.ACE,
            [values.WILD]: values.WILD,
        },
        YIELD_DAILY: {
            MIN: "MIN",
            MAX: "MAX",
        },
        YIELD_ACCRUED: {
            MIN: "MIN",
            MAX: "MAX",
        }
    }

    const DEFAULT_FILTERS = {
        ADDRESS: {
            "My Listings": false,
        },
        STATUS: {
            [FilterTypes.STATUS.OPEN]: true,
            [FilterTypes.STATUS.SOLD]: false,
            [FilterTypes.STATUS.CLOSED]: false,
        },
        NUM_CARDS: {
            [FilterTypes.NUM_CARDS.SINGLE]: false,
            [FilterTypes.NUM_CARDS.BUNDLE]: false,
        },
        CARD_TYPES: {
            [FilterTypes.CARD_TYPES.BASE_CARDS]: false,
            [FilterTypes.CARD_TYPES.YIELD_CARDS]: false,
        },
        SUITS: {
            [FilterTypes.SUITS.CLUBS]: false,
            [FilterTypes.SUITS.DIAMONDS]: false,
            [FilterTypes.SUITS.HEARTS]: false,
            [FilterTypes.SUITS.SPADES]: false,
        },
        BC_VALUES: {
            [FilterTypes.BC_VALUES.TEN]: false,
            [FilterTypes.BC_VALUES.JACK]: false,
            [FilterTypes.BC_VALUES.QUEEN]: false,
            [FilterTypes.BC_VALUES.KING]: false,
            [FilterTypes.BC_VALUES.ACE]: false,
            [FilterTypes.BC_VALUES.WILD]: false,
        },
        YIELD_DAILY: {
            [FilterTypes.YIELD_DAILY.MIN]: 0,
            [FilterTypes.YIELD_DAILY.MAX]: 69000,
        },
        SINGLES: {
            [suits.CLUBS]: {
                [values.TEN]: false,
                [values.JACK]: false,
                [values.QUEEN]: false,
                [values.KING]: false,
                [values.ACE]: false,
            },
            [suits.DIAMONDS]: {
                [values.TEN]: false,
                [values.JACK]: false,
                [values.QUEEN]: false,
                [values.KING]: false,
                [values.ACE]: false,
            },
            [suits.HEARTS]: {
                [values.TEN]: false,
                [values.JACK]: false,
                [values.QUEEN]: false,
                [values.KING]: false,
                [values.ACE]: false,
            },
            [suits.SPADES]: {
                [values.TEN]: false,
                [values.JACK]: false,
                [values.QUEEN]: false,
                [values.KING]: false,
                [values.ACE]: false,
            },
        },
        PRICE: {
            MIN: 500,
            MAX: 50000,
        },
    }

    // Hack for nested object copy
    const activeFilters = ref(JSON.parse(JSON.stringify(DEFAULT_FILTERS)));
    const resetFilters = () => {
        activeFilters.value = JSON.parse(JSON.stringify(DEFAULT_FILTERS));
    }

    const activeListing = ref(null);
    const listingModal = ref(null);
    const listingModalRef = ref(null);

    const activeAccount = computed(() => store.getters["MetaMask/activeAccount"]);
    const pending = computed(() => store.getters["MetaMask/pending"]);
    const balance = computed(() => store.state.CARDCoin.balance);

    const filteredListings = computed(() => {
        // return store.state.Marketplace.listings;
        return store.state.Marketplace.listings.filter(listing => {
            const filters_ = [
                // Status
                (activeFilters.value.STATUS[[
                        FilterTypes.STATUS.OPEN,
                        FilterTypes.STATUS.SOLD,
                        FilterTypes.STATUS.CLOSED
                    ][listing.status]
                ]),
                // Addressese
                (activeFilters.value.ADDRESS["My Listings"] ? listing.creator === activeAccount.value : true),
                // Bundle/Single
                (activeFilters.value.NUM_CARDS[FilterTypes.NUM_CARDS.SINGLE] ? listingSum(listing) < 2 : true),
                (activeFilters.value.NUM_CARDS[FilterTypes.NUM_CARDS.BUNDLE] ? listingSum(listing) > 1 : true),
                // Card Types
                (activeFilters.value.CARD_TYPES[FilterTypes.CARD_TYPES.BASE_CARDS] ? BCSum(listing) > 0 : true),
                (activeFilters.value.CARD_TYPES[FilterTypes.CARD_TYPES.YIELD_CARDS] ? YCSum(listing) > 0 : true),
                // Suits
                (activeFilters.value.SUITS[FilterTypes.SUITS.CLUBS] ? listingContainsSuit(listing, suits.CLUBS) : true),
                (activeFilters.value.SUITS[FilterTypes.SUITS.DIAMONDS] ? listingContainsSuit(listing, suits.DIAMONDS) : true),
                (activeFilters.value.SUITS[FilterTypes.SUITS.HEARTS] ? listingContainsSuit(listing, suits.HEARTS) : true),
                (activeFilters.value.SUITS[FilterTypes.SUITS.SPADES] ? listingContainsSuit(listing, suits.SPADES) : true),
                // Values
                (activeFilters.value.BC_VALUES[FilterTypes.BC_VALUES.TEN] ? listingContainsValue(listing, values.TEN) : true),
                (activeFilters.value.BC_VALUES[FilterTypes.BC_VALUES.JACK] ? listingContainsValue(listing, values.JACK) : true),
                (activeFilters.value.BC_VALUES[FilterTypes.BC_VALUES.QUEEN] ? listingContainsValue(listing, values.QUEEN) : true),
                (activeFilters.value.BC_VALUES[FilterTypes.BC_VALUES.KING] ? listingContainsValue(listing, values.KING) : true),
                (activeFilters.value.BC_VALUES[FilterTypes.BC_VALUES.ACE] ? listingContainsValue(listing, values.ACE) : true),
                (activeFilters.value.BC_VALUES[FilterTypes.BC_VALUES.WILD] ? listingContainsValue(listing, values.WILD) : true),
                // Singles
                // (activeFilters.value.SINGLES[suits.CLUBS][values.TEN] ? listingContainsCard(listing, suits.CLUBS, values.TEN) : true),
                ...singlesFilters(listing),
                // Price
                (typeof activeFilters.value.PRICE.MIN === "number" &&
                    listing.price.gte(ethers.utils.parseEther(activeFilters.value.PRICE.MIN.toString()))),
                (typeof activeFilters.value.PRICE.MAX === "number" &&
                    listing.price.lte(ethers.utils.parseEther(activeFilters.value.PRICE.MAX.toString()))),
                // Yield
                // These can get really hairy (is it the sum of all YC?)
                // Couldn't they just select "level x?"
                // (YCSum(listing) > 0 ? )
            ];
            // console.log(filters_)
            // Match all filters
            return filters_.every(f => f);
        });
    });

    const singlesFilters = (listing) => {
        const fs = Object.keys(activeFilters.value.SINGLES).map(k1 => {
            return Object.keys(activeFilters.value.SINGLES[k1]).map(k2 => {
                return (activeFilters.value.SINGLES[k1][k2] ? listingContainsCard(listing, k1, k2) : true)
            });
        });
        const allFilters = [...fs[0], ...fs[1], ...fs[2], ...fs[3]];
        return allFilters;
    }

    const purchaseListing = () => {
        store.dispatch("Marketplace/purchaseListing", { id: activeListing.value.id })
            .then(() => closeListingModal());
    };
    const cancelListing = () => {
        store.dispatch("Marketplace/cancelListing", { id: activeListing.value.id })
        .then(() => closeListingModal());
    };

    const listingSum = (listing) => {
        return BCSum(listing) + YCSum(listing);
    }

    const BCSum = (listing) => {
        return Number(listing.baseCardAmounts.reduce((p, c) => c.add(p), ethers.constants.Zero));
    }

    const YCSum = (listing) => {
        return listing.yieldCardIds.length;
    }

    const listingPrice = (listing) => {
        return Math.trunc(Number(ethers.utils.formatEther(listing.price)));
    }

    const reducedCards = (listing) => {
        const balances = listing.baseCardAmounts;
        // Parse Base Cards
        const baseCards = [...allCards]
            .map(c => ({
                cardShape: {...c},
                balance: balances[c.tokenId],
                showBalance: balances[c.tokenId].gt(1),
                gold: c.tokenId === 20,
            }))
            .filter(c => c.balance.gt(0));
        // Parse Yield Cards
        const yieldCards = listing.yieldCards
            .map(yc => ({
                cardShape: {
                    ...yc,
                    value: `L${yc.level}`,
                    classes: biClassForSuit(suitForIndex(yc.suit))
                },
                gold: true,
                imgSrc: yc.imgSrc,
                showBalance: false,
            }));
        // Aggregate
        return [...baseCards, ...yieldCards];
    }

    const listingContainsSuit = (listing, suit) => {
        const BCHit = listing.baseCardAmounts.find((amount, tokenId) =>
            cardForId(tokenId).suit === suit && amount.gt(0)
        ) !== undefined;
        const YCHit = listing.yieldCards.find((yc) =>
            yc.suit === suit
        ) !== undefined;
        return BCHit || YCHit;
    }

    const listingContainsValue = (listing, value) => {
        const BCHit = listing.baseCardAmounts.find((amount, tokenId) =>
            cardForId(tokenId).value === value && amount.gt(0)
        ) !== undefined;
        return BCHit;
    }

    const listingContainsCard = (listing, suit, value) => {
        const cardShape = allCards.find(c => c.suit === suit && c.value === value)
        return cardShape !== undefined && listing.baseCardAmounts[cardShape.tokenId].gt(0);
    }

    const openListingModal = (listing) => {
        activeListing.value = listing;
        listingModal.value.show();
        playSound(Sounds.OPEN_MODAL);
    }

    const closeListingModal = () => {
        activeListing.value = null;
        listingModal.value.hide();
        playSound(Sounds.CLOSE_MODAL);
    }

    onMounted(() => {
        listingModal.value = new Modal(listingModalRef.value, { keyboard: false });
    })
</script>


<template>
    <section class="container">
        <!-- Modal -->
        <div class="modal fade" id="listingModal" tabindex="-1" aria-labelledby="listingModalLabel" aria-hidden="true" ref="listingModalRef">
            <div class="modal-dialog modal-fullscreen">
                <div class="modal-content" v-if="activeListing">
                    <div class="modal-header">
                        <div class="d-grid">
                            <p class="h1 modal-title" id="listingModalLabel">LISTING DETAILS</p>
                            <span class="d-block" v-if="BCSum(activeListing) > 0">{{ BCSum(activeListing) }} Base {{ BCSum(activeListing) > 1 ? 'Cards' : 'Card'}}</span>
                            <span class="d-block" v-if="YCSum(activeListing) > 0">{{ YCSum(activeListing) }} Yield {{ YCSum(activeListing) > 1 ? 'Cards' : 'Card'}}</span>
                        </div>
                        <button @click="playSound(Sounds.CLOSE_MODAL)" type="button" class="btn btn-dark" data-bs-dismiss="modal">
                            <i class="bi-x-lg"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <CardCollectionVue
                            title=""
                            :cards="reducedCards(activeListing)"
                        >
                        </CardCollectionVue>
                    </div>
                    <div class="modal-footer justify-content-between align-items-end text-center">
                        <div class="d-grid flex-grow-1 gap-2">
                            <span class="d-block">Wallet Balance: {{ Math.trunc(Number(ethers.utils.formatEther(balance))) }} <strong>$CARD</strong> Coin</span>
                            <MetamaskVue btn-class="btn-secondary" :disabled="true"></MetamaskVue>
                        </div>
                        <div class="d-grid flex-grow-1 gap-2">
                            <span class="d-block">Listing Price: {{ listingPrice(activeListing) }} <strong>$CARD</strong> Coin</span>
                            <button type="button" class="btn btn-red" @click="purchaseListing"
                                :disabled="pending || activeListing.status !== 0 /* not OPEN */">
                                    {{ activeListing.status === 0 ? "Buy Listing" : ListingStatus[activeListing.status] }}
                            </button>
                        </div>
                        <div class="d-grid flex-grow-1" v-if="activeListing.creator === activeAccount && activeListing.status === 0">
                            <button class="btn btn-secondary" @click="cancelListing" :disabled="pending">
                            <i class="bi bi-trash-fill"></i> Cancel Listing</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="row justify-content-evenly">
            <div class="col-12 col-md-9 col-xl-8">
                <h2>Listings</h2>
                <h2 class="text-center" v-if="filteredListings.length === 0">No Listings Found...</h2>
                <div class="row g-2 row-cols-2 row-cols-md-3 row-cols-lg-4">
                    <div class="col" v-for="(listing, i) in filteredListings" :key="i">
                        <div class="marketplace-listing">
                            <div v-if="listingSum(listing) > 1" class="card-pack" @click="openListingModal(listing)">
                                <img src="/bundle_trans.png" alt="Bundle Art">
                                <span class="badge">{{ listingSum(listing) }}</span>
                            </div>

                            <CardVue
                                v-else
                                :card-shape="reducedCards(listing)[0].cardShape"
                                :imgSrc="reducedCards(listing)[0].imgSrc"
                                :show-balance="false"
                                :interactive="true"
                                :gold="reducedCards(listing)[0].gold"
                                @card-clicked="openListingModal(listing)"
                            >
                            </CardVue>

                            <div class="marketplace-listing__info d-grid mt-2 align-items-center text-center">
                                <span class="d-block" v-if="BCSum(listing) > 0">{{ BCSum(listing) }} Base {{ BCSum(listing) > 1 ? 'Cards' : 'Card' }}</span>
                                <span class="d-block" v-if="YCSum(listing) > 0">{{ YCSum(listing) }} Yield {{ YCSum(listing) > 1 ? 'Cards' : 'Card' }}</span>
                                <span class="d-block">{{ listingPrice(listing) }} <strong>$CARD</strong></span>
                                <button class="btn btn-red mt-2" @click="openListingModal(listing)">View Listing</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-12 col-md-3 col-xl-4">
                <h2 class="text-center">Filters</h2>
                <div class="market-filters d-grid gap-3">
                    <div>
                        <h3>Price</h3>
                        <div class="input-group">
                            <input type="number" min="500" name="" id="" class="form-control text-center" v-model="activeFilters.PRICE.MIN">
                            <span class="input-group-text">to</span>
                            <input type="number" min="500" name="" id="" class="form-control text-center" v-model="activeFilters.PRICE.MAX">
                            <span class="input-group-text"><strong>$CARD</strong></span>
                        </div>
                    </div>
                    <div>
                        <h3>Owner</h3>
                        <div class="form-check" v-for="filter_ in Object.keys(activeFilters.ADDRESS)" :key="filter_">
                            <input class="form-check-input" type="checkbox" role="switch" :id="`${filter_}-checkbox`" v-model="activeFilters.ADDRESS[filter_]">
                            <label class="form-check-label" :for="`${filter_}-checkbox`">{{ filter_ }}</label>
                        </div>
                    </div>
                    <div>
                        <h3>Listing Status</h3>
                        <div class="form-check" v-for="filter_ in Object.keys(activeFilters.STATUS)" :key="filter_">
                            <input class="form-check-input" type="checkbox" role="switch" :id="`${filter_}-checkbox`" v-model="activeFilters.STATUS[filter_]">
                            <label class="form-check-label" :for="`${filter_}-checkbox`">{{ filter_ }}</label>
                        </div>
                    </div>
                    <div>
                        <h3>Listing Type</h3>
                        <div class="form-check" v-for="filter_ in Object.keys(activeFilters.NUM_CARDS)" :key="filter_">
                            <input class="form-check-input" type="checkbox" role="switch" :id="`${filter_}-checkbox`" v-model="activeFilters.NUM_CARDS[filter_]">
                            <label class="form-check-label" :for="`${filter_}-checkbox`">{{ filter_ }}</label>
                        </div>
                    </div>
                    <div>
                        <h3>Card Types</h3>
                        <div class="form-check" v-for="filter_ in Object.keys(activeFilters.CARD_TYPES)" :key="filter_">
                            <input class="form-check-input" type="checkbox" role="switch" :id="`${filter_}-checkbox`" v-model="activeFilters.CARD_TYPES[filter_]">
                            <label class="form-check-label" :for="`${filter_}-checkbox`">{{ filter_ }}</label>
                        </div>
                    </div>
                    <div>
                        <h3>Suits</h3>
                        <div class="form-check" v-for="filter_ in Object.keys(activeFilters.SUITS)" :key="filter_">
                            <input class="form-check-input" type="checkbox" role="switch" :id="`${filter_}-checkbox`" v-model="activeFilters.SUITS[filter_]">
                            <label class="form-check-label" :for="`${filter_}-checkbox`">{{ filter_ }}</label>
                        </div>
                    </div>
                    <div>
                        <h3>Values</h3>
                        <div class="form-check" v-for="filter_ in Object.keys(activeFilters.BC_VALUES)" :key="filter_">
                            <input class="form-check-input" type="checkbox" role="switch" :id="`${filter_}-checkbox`" v-model="activeFilters.BC_VALUES[filter_]">
                            <label class="form-check-label" :for="`${filter_}-checkbox`">{{ filter_ }}</label>
                        </div>
                    </div>
                    <div>
                        <h3>Base Cards</h3>
                        <div class="row row-cols-5 g-2 mb-2" v-for="suit in Object.keys(activeFilters.SINGLES)" :key="suit">
                            <div class="col d-grid" v-for="value in Object.keys(activeFilters.SINGLES[suit])" :key="value">
                                <button class="btn btn-sm" :class="activeFilters.SINGLES[suit][value] ? 'btn-secondary' : 'btn-outline-secondary'" @click="activeFilters.SINGLES[suit][value] = !activeFilters.SINGLES[suit][value]">
                                    {{ value.slice(0,1) }}
                                    <i class="bi" :class="biClassForSuit(suit)"></i>
                                </button>
                            </div>
                        </div>
                    </div>


                    <button class="btn btn-secondary" @click="resetFilters">Reset</button>
                </div>
            </div>
        </div>

    </section>
</template>
