<script setup>
    import { ref, computed, onMounted } from "vue"
    import { useStore } from "vuex"
    import { allCards, suits } from "../store/static/cards";
    import CardCollection from "../components/CardCollection.vue"
    import CardsTableVue from "../components/CardsTable.vue";
    import CardVue from "../components/Card.vue";
    import { playSound, Sounds } from "../store/Audio";
    import { Modal } from "bootstrap";


    const store = useStore();

    const suitFilter = ref("ALL");
    const showUncollected = ref(true);
    const lightboxModal = ref(null);
    const lightboxModalRef = ref(null);
    const lightboxCardShape = ref(null);

    const balances = computed(() => store.getters["BaseCards/adjustedBalances"]);

    const cards = computed(() => {
        let _baseCards = allCards.map(c => ({
            cardShape: { ...c },
            balance: balances.value[c.tokenId],
            showBalance: balances.value[c.tokenId].gt(0),
            showTitle: balances.value[c.tokenId].lt(1),
            showArt: balances.value[c.tokenId].gt(0),
            interactive: balances.value[c.tokenId].gt(0),
            highlight: (
                lightboxCardShape.value !== null &&
                lightboxCardShape.value.tokenId == c.tokenId
            ),
            gold: (c.tokenId === 20)
        }));

        if (!showUncollected.value) {
            _baseCards = _baseCards.filter(card => card.balance.gt(0));
        }

        if (suitFilter.value !== "ALL") {
            _baseCards = _baseCards.filter(card => card.cardShape.suit === suitFilter.value);
        }

        return _baseCards;
    })

    const openLightbox = (card) => {
        if (balances.value[card.tokenId].lt(1))
            return;
        lightboxCardShape.value = card;
        lightboxModal.value.show();
    }

    onMounted(() => {
        lightboxModal.value = new Modal(lightboxModalRef.value);
    })
</script>


<template>
    <div class="cards">
        <div class="modal fade" id="exampleModal" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true" ref="lightboxModalRef">
            <div class="modal-dialog modal-dialog-centered">
                <CardVue :card-shape="lightboxCardShape" :show-balance="false" v-if="lightboxCardShape"></CardVue>
            </div>
        </div>


        <div class="container">
            <div class="row mb-3">
                <div class="col-auto">
                    <div class="form-check mb-3">
                        <input @click="playSound(Sounds.CHECK)" class="form-check-input" type="checkbox" value="" id="flexCheckChecked" v-model="showUncollected">
                        <label @click="playSound(Sounds.CHECK)" class="form-check-label" for="flexCheckChecked">
                            Show Uncollected
                        </label>
                    </div>
                </div>
            </div>

            <div class="row justify-content-evenly">
                <div class="col-xl-8 mb-5">
                    <CardCollection
                        title="Base Cards"
                        :cards="cards"
                        @card-clicked="openLightbox"
                    ></CardCollection>
                </div>
                <div class="col-xl-4">
                    <CardsTableVue
                        title="Table View"
                        :balances="balances"
                    ></CardsTableVue>
                </div>
            </div>
        </div>
    </div>
</template>
