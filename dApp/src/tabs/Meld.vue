<script setup>
    import { ethers } from "ethers"
    import { computed, ref  } from "vue"
    import { useStore } from "vuex"
    import { orderBySuit } from "../store/static/cards";
    import Card from "../components/Card.vue"
    import CardCollection from "../components/CardCollection.vue"
    import Metamask from "../components/Metamask.vue";
    import { playSound, Sounds } from "../store/Audio";

    
    const meldOptions = [{
        title: "2 OF A KIND",
        cardsRequired: 2,
    }, {
        title: "3 OF A KIND",
        cardsRequired: 3,
    }, {
        title: "4 OF A KIND",
        cardsRequired: 4,
    }, {
        title: "5 OF A KIND",
        cardsRequired: 5,
    }];

    const useWildcard = ref(false);
    const cardToMeldShape = ref(undefined);
    const selectedMeld = ref(0);

    const store = useStore();

    const balances = computed(() => store.getters["BaseCards/adjustedBalances"]);
    const pending = computed(() => store.getters["MetaMask/pending"]);

    const price = computed(() => store.getters["Deck/meldPrice"](selectedMeld.value, cardToMeldShape.value.tokenId));
    const drawQuantity = computed(() => store.getters["Deck/meldDrawQuantity"](selectedMeld.value, cardToMeldShape.value.tokenId));
    const numBaseCards = computed(() => meldOptions[selectedMeld.value].cardsRequired - (useWildcard.value ? 1 : 0 ));

    const cards = computed(() => orderBySuit().slice(0,20).map(c => ({
            cardShape: { ...c },
            highlight: (cardToMeldShape.value && cardToMeldShape.value.tokenId === c.tokenId),
            balance: balances.value[c.tokenId],
            showTitle: balances.value[c.tokenId].eq(0),
            showArt: balances.value[c.tokenId].gt(0),
            showBalance: balances.value[c.tokenId].gt(0),
            showControls: false,
            interactive: balances.value[c.tokenId].gt(0),
        }))
    )

    const meldReady = computed(() => {
        return (
            cardToMeldShape.value &&
            balances.value[cardToMeldShape.value.tokenId]
                .add(useWildcard.value ? 1 : 0)
                .gte(meldOptions[selectedMeld.value].cardsRequired)
        );
    });

    const meldAvailable = (cardsRequired) => {
        return (
            cardToMeldShape.value &&
            balances.value[cardToMeldShape.value.tokenId]
                .add(useWildcard.value ? 1 : 0)
                .gte(cardsRequired)
        );
    }

    const cardClicked = (card) => {
        playSound(Sounds.CHOICE);
        if(balances.value[card.tokenId].lt(1))
            return;
        cardToMeldShape.value = { ...card };
        selectedMeld.value = 0;
        useWildcard.value = false;
        if (window.innerWidth < 992)
            document.getElementById("melding-top").scrollIntoView({ behavior: "smooth" });
    }

    const submitMeld = () => {
        playSound(Sounds.SHUFFLE);
        store.dispatch("Deck/meld", {
            tokenId: cardToMeldShape.value.tokenId,
            numBaseCards: numBaseCards.value,
            useWildcard: useWildcard.value,
        })
        .then(() => cardToMeldShape.value = null);
    }

</script>

<template>
    <div class="container" id="melding-top">
        <!-- Do Melding -->
        <div class="row justify-content-evenly">
            <div class="col-12 col-lg-5 mb-5">
                <div class="row align-items-center justify-content-center">
                    <p class="h2 text-center">Melding</p>
                    <!-- Card Display -->
                    <div class="col-9">
                        <Card :show-balance="false"
                            :card-shape="cardToMeldShape ? cardToMeldShape : { value: 'Select a Card' }"
                            :show-title="!cardToMeldShape" :show-art="!!cardToMeldShape" class="mb-3"></Card>
                        <div class="form-check mb-3" v-if="balances[20].gt(0)">
                            <input @click="playSound(Sounds.CHECK)" class="form-check-input" type="checkbox" value=""
                                id="useWildcardCheck" v-model="useWildcard">
                            <label @click="playSound(Sounds.CHECK)" class="form-check-label" for="useWildcardCheck">
                                Use WILDCARD
                                ({{ balances[20] }} owned)
                            </label>
                        </div>

                        <button @click.prevent="playSound(Sounds.POP_CLICK)" v-for="(o, i) in meldOptions" :key="i"
                            :disabled="!meldAvailable(o.cardsRequired)" :class="{
                            'btn-red': selectedMeld === i && meldAvailable(o.cardsRequired),
                            'btn-secondary': selectedMeld !== i && meldAvailable(o.cardsRequired),
                            'btn-dark': !meldAvailable(o.cardsRequired),
                        }" class="btn form-control mb-3" @click="selectedMeld=i">
                            {{ o.title }}
                        </button>
                    </div>

                    <div class="col-12" v-if="cardToMeldShape">
                        <p class="h4 text-center">{{ meldOptions[selectedMeld].title }}</p>
                        <p class="text-center mb-0">
                            <strong>Requires:</strong>
                            {{ meldOptions[selectedMeld].cardsRequired }}x {{ cardToMeldShape.value }} <i
                                :class="cardToMeldShape.classes"></i>
                        </p>
                        <p class="text-center mb-0">
                            <strong>Fee:</strong>
                            {{ price }} <strong>$CARD</strong> Coin
                        </p>
                        <p class="text-center mb-3">
                            <strong>Reward:</strong>
                            {{ drawQuantity }}x Base Cards
                        </p>

                        <div>
                            <p class="h5">Disclaimer</p>
                            <p>
                                {{ numBaseCards }}x {{ cardToMeldShape.value }} <i :class="cardToMeldShape.classes"
                                    class="me-1"></i>
                                <span v-if="useWildcard">+ 1x WILDCARD</span>
                                from your Collection will be sent back to the Deck in exchange for
                                {{ drawQuantity }}x random Base Cards for the price of
                                {{ price }} <strong>$CARD</strong> Coin.
                            </p>
                        </div>

                        <button class="btn btn-red form-control mb-3" :disabled="!meldReady || pending"
                            @click="submitMeld">
                            <i class="bi bi-hurricane"></i>&nbsp;
                            Submit Meld
                        </button>
                        <Metamask btn-class="btn-secondary form-control" :disabled="true"></Metamask>
                    </div>
                </div>
        </div>

                <div class="col-lg-7">
                    <CardCollection title="YOUR BASE CARDS" :cards="cards" @card-clicked="cardClicked"></CardCollection>
                </div>
            </div>

    </div>

</template>
