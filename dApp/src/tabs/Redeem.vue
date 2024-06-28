<script setup>
    import { ref, computed } from "vue"
    import { useStore } from "vuex"
    import { suits, indexForSuit, cardForId, biClassForSuit, values as cardValues } from "../store/static/cards"
    import CardsTable from "../components/CardsTable.vue"
    import CardVue from "../components/Card.vue"
    import Metamask from "../components/Metamask.vue"
    import { playSound, Sounds } from "../store/Audio"

    const store = useStore();
    const balances = computed(() => store.getters["BaseCards/adjustedBalances"]);
    const pending = computed(() => store.state.MetaMask.pendingSignature);

    const selectedSuit = ref(suits.CLUBS);

    const staticIds = {
        [suits.CLUBS]: [0,1,2,3,4],
        [suits.DIAMONDS]: [5,6,7,8,9],
        [suits.HEARTS]: [10,11,12,13,14],
        [suits.SPADES]: [15,16,17,18,19],
    };

    const cardIds = computed(() => {
        let ids = [...staticIds[selectedSuit.value]];
        if (wildcardChecked.value) {
            ids.splice(wildcardIndex.value, 1, 20);
        }
        return ids;
    })

    const validIds = computed(() => {
        return cardIds.value.every(id => balances.value[id].gt(0))
    });

    const suitOptions = [{
        title: "Clubs",
        value: suits.CLUBS,
    }, {
        title: "Diamonds",
        value: suits.DIAMONDS,
    }, {
        title: "Hearts",
        value: suits.HEARTS,
    }, {
        title: "Spades",
        value: suits.SPADES,
    }]

    const wildcardIndex = ref(0);
    const wildcardChecked = ref(false);

    const wildcardOptions = [{
        title: "10",
        index: 0,
    }, {
        title: "Jack",
        index: 1,
    }, {
        title: "Queen",
        index: 2,
    }, {
        title: "King",
        index: 3,
    }, {
        title: "Ace",
        index: 4,
    }]

    const redeem = () => {
        playSound(Sounds.SHUFFLE);
        const ids = cardIds.value;
        const suit = indexForSuit(selectedSuit.value);
        store.dispatch("YieldCards/mint", {ids, suit})
            .then(() => wildcardChecked.value = false )
            .catch(console.error);
    }
</script>


<template>
    <div class="redeem-rf">
        <div class="container">
            <div class="row justify-content-evenly">
                <div class="col-12 col-md-9 col-lg-7">
                    <p class="h2">REDEEMING CARDS</p>
                    <div class="row row-cols-3 row-cols-md-5 mb-2 g-2 justify-content-center">
                        <div class="col" v-for="id in cardIds" :key="id">
                            <CardVue :card-shape="{
                                    value: cardForId(id).value,
                                    classes: cardForId(id).classes,
                                    tokenId: cardForId(id).tokenId,
                                }" :show-balance="false" :show-title="balances[id].eq(0)" :show-art="balances[id].gt(0)" class="mb-3"></CardVue>
                        </div>
                    </div>
                    <div class="d-grid gap-3 mb-5">
                        <div class="input-group">
                            <label class="input-group-text" for="suitSelect">Suit</label>
                            <select @click.prevent="playSound(Sounds.DROPDOWN)" name="suitSelect" id="suitSelect" class="form-select" v-model="selectedSuit">
                                <option v-for="(option, index) in suitOptions" :value="option.value" :key="index">
                                    {{ option.title }}
                                </option>
                            </select>
                            <span class="input-group-text">
                                <i :class="biClassForSuit(selectedSuit)"></i>
                            </span>
                        </div>

                        <div class="form-check">
                            <input @click="playSound(Sounds.CHECK)" v-model="wildcardChecked" class="form-check-input" id="use-wildcard-checkbox" type="checkbox" aria-label="Use wildcard checkbox" :disabled="balances[20].eq(0)">
                            <label for="use-wildcard-checkbox" class="form-check-label">Use&nbsp;<strong>WILDCARD</strong></label>
                        </div>

                        <div class="input-group" v-if="wildcardChecked">
                            <label for="wildcardReplacement" class="input-group-text">To Replace</label>
                            <select @click="playSound(Sounds.DROPDOWN)" name="wildcardReplacement" id="wildcardReplacement" class="form-select" v-model="wildcardIndex">
                                <option v-for="(option, index) in wildcardOptions" :value="option.index" :key="index">
                                    {{ option.title }}
                                </option>
                            </select>
                        </div>

                        <button class="btn btn-red" :disabled="pending || !validIds" @click="redeem">
                            <i class="bi bi-trophy-fill"></i>&nbsp;
                            Redeem
                        </button>

                        <Metamask btn-class="btn-secondary form-control" disabled></Metamask>
                    </div>
                </div>

                <div class="col-12 col-lg-5">
                    <CardsTable title="Your Base Cards" :balances="balances"></CardsTable>
                </div>
            </div>
        </div>
    </div>
</template>
