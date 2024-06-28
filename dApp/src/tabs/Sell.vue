<script setup>
    import { computed, ref, reactive, onMounted } from "vue"
    import { useStore } from "vuex"
    import { ethers } from "ethers"
    import { orderBySuit } from "../store/static/cards";
    import CardCollection from "../components/CardCollection.vue"
    import CardsTable from "../components/CardsTable.vue";
    import YieldCardsTableVue from "../components/YieldCardsTable.vue";
    import MetaMask from "../components/Metamask.vue";
    import { playSound, Sounds } from "../store/Audio";

    const BASE_CARD = "BASE_CARD";
    const YIELD_CARD = "YIELD_CARD";

    const store = useStore();

    const topRef = ref(null);
    const askingPrice = ref(500);
    const minAskingPrice = computed(() => listingBalancesSum.value.mul(500));
    const balances = computed(() => store.getters["BaseCards/adjustedBalances"]);
    const yieldCards = computed(() => store.getters["YieldCards/adjustedBalances"]);

    const activeCardsTab = ref(0);

    const pending = computed(() => store.getters["MetaMask/pending"]);
    const listingBalances = reactive(new Array(21).fill(ethers.constants.Zero));
    const listingYCIDs = ref([]);
    const listingBalancesSum = computed(() => {
        return listingBalances.reduce((c, p) => c.add(p), ethers.constants.Zero).add(listingYCIDs.value.length);
    });


    const createListing = () => {
        store.dispatch("Marketplace/createListing", {
            BCAmounts: listingBalances,
            YCIDs: listingYCIDs.value,
            price: ethers.utils.parseUnits(askingPrice.value.toString())
        })
        .then(() => resetAll());
    }

    const addCard = (card) => {
        playSound(Sounds.ADD);
        if (card.type === BASE_CARD) {
            if (listingBalances[card.tokenId].lt(balances.value[card.tokenId]))
                listingBalances[card.tokenId] = listingBalances[card.tokenId].add(1)
        } else if (card.type === YIELD_CARD) {
            if (listingYCIDs.value.indexOf(card.id) === -1)
                listingYCIDs.value.push(card.id);
        }
        askingPrice.value = minAskingPrice.value;
    }

    const resetAll = () => {
        playSound(Sounds.REMOVE);
        askingPrice.value = 500;
        listingBalances.forEach((b, i) => listingBalances[i] = ethers.constants.Zero);
        listingYCIDs.value.splice(0, listingYCIDs.value.length);
    }

    const cards = computed(() => {
        if (activeCardsTab.value === 0) {
            return orderBySuit().map(c => ({
                cardShape: {
                    ...c,
                    type: BASE_CARD,
                },
                balance: balances.value[c.tokenId].sub(listingBalances[c.tokenId]),
                showArt: balances.value[c.tokenId].sub(listingBalances[c.tokenId]).gt(0),
                showTitle: balances.value[c.tokenId].sub(listingBalances[c.tokenId]).eq(0),
                showBalance: balances.value[c.tokenId].gt(0),
                interactive: balances.value[c.tokenId].gt(0),
                highlight: listingBalances[c.tokenId].gt(0),
            }));
        } else if (activeCardsTab.value === 1) {
            return yieldCards.value.map(yc => ({
                cardShape: {
                    ...yc,
                    type: YIELD_CARD,
                },
                imgSrc: yc.imgSrc,
                showBalance: false,
                interactive: true,
                gold: (listingYCIDs.value.indexOf(yc.id) >= 0)
            }));
        }
    })
</script>


<template>
    <div class="listing-counter" v-if="listingBalancesSum > 0" @click="topRef.scrollIntoView({ behavior: 'smooth' })">
        <i class="bi bi-cart2"></i>&nbsp;
        <span>Cards in Listing: {{ listingBalancesSum }}</span>
    </div>

    <div class="container" ref="topRef">
        <div class="row justify-content-evenly">
            <div class="col-xl-4 mb-5">
                <h2>New Listing</h2>
                <div class="row justify-content-evenly">
                    <div class="col-12 col-md-6 col-xl-12">
                        <CardsTable
                            class="mb-2"
                            title="Base Cards"
                            :balances="listingBalances"
                        ></CardsTable>
                    </div>
                    <div class="col-12 col-md-6 col-xl-12">
                        <YieldCardsTableVue
                            class="mb-3"
                            title="Yield Cards"
                            :yield-card-ids="listingYCIDs"
                            :key="listingYCIDs.length"
                        ></YieldCardsTableVue>
                    </div>
                    <div class="col-12 col-md-6 col-xl-12">
                        <form class="d-grid gap-2 mb-3" @submit.prevent="createListing">
                            <button class="btn btn-dark" @click.prevent="resetAll">
                                Reset Listing
                                <i class="bi-arrow-counterclockwise ms-1"></i>
                            </button>

                            <div class="input-group">
                                <label for="marketplace-price-input" class="input-group-text">Asking Price</label>
                                <input type="number" id="marketplace-price-input" class="form-control"
                                    :min="minAskingPrice" step="1"
                                    v-model="askingPrice">
                                <span class="input-group-text"><strong>$CARD</strong>&nbsp;Coin</span>
                            </div>

                            <button class="btn btn-red" type="submit"
                                :disabled="pending || listingBalancesSum.isZero()">
                                <i class="bi bi-cloud-plus"></i>&nbsp;
                                Create Listing
                            </button>

                            <MetaMask btn-class="btn-secondary" :disabled="true"></MetaMask>
                        </form>
                    </div>
                </div>
            </div>

            <div class="col-xl-8 mb-5">
                <div class="row mb-2">
                    <h2>Card Collections</h2>
                    <div class="col-12 col-md-6 mb-2 d-grid">
                        <button class="btn"
                            :class="activeCardsTab===0?'btn-red':'btn-dark'"
                            @click="activeCardsTab = 0"
                        >
                            Base Cards
                        </button>
                    </div>
                    <div class="col-12 col-md-6 mb-2 d-grid">
                        <button class="btn"
                            :class="activeCardsTab===1?'btn-red':'btn-dark'"
                            @click="activeCardsTab = 1"
                        >
                            Yield Cards
                        </button>
                    </div>
                </div>

                <CardCollection
                    title="YOUR CARDS"
                    :show-controls="true"
                    :cards="cards"
                    :key="cards.length"
                    ds-per-row="2"
                    @card-clicked="addCard"
                ></CardCollection>
            </div>
        </div>
    </div>
</template>
