<script setup>
    import { ref, computed, onMounted } from "vue";
    import { useStore } from "vuex";
    import { ethers } from "ethers";
    import { suits, allCards, biClassForSuit } from "../store/static/cards";
    import CardVue from "../components/Card.vue";
    import { Modal } from "bootstrap";
    import { playSound, Sounds } from "../store/Audio";

    import ProgressVue from "../components/Progress.vue";

    const store = useStore();

    const yieldCards = computed(() => store.getters["YieldCards/adjustedBalances"]);
      
    const balances = computed(() => store.getters["BaseCards/adjustedBalances"]);

    const secondsNow = ref(0);
    const cardToBurnId = ref(null);
    const cardSelectModal = ref(null);
    const cardToClaim = ref(null);
    const cardsToSelect = ref([]);


    const selectCard = (card) => {
        if (card.balance.lt(1))
            return;
        cardToBurnId.value = card.cardShape.tokenId;
        playSound(Sounds.CHOICE);
    }

    const openModal = (card) => {
        cardToClaim.value = card;
        const cards = allCards
            .filter(c => c.suit === card.suit)
            .map(c => ({
                cardShape: { ...c },
                balance: balances.value[c.tokenId],
            }));
        cardsToSelect.value = cards;
        cardSelectModal.value.show();
        playSound(Sounds.OPEN_MODAL);
    }

    const closeModal = () => {
        cardToClaim.value = null;
        cardToBurnId.value = null;
        cardsToSelect.value = [];
        cardSelectModal.value.hide();
        playSound(Sounds.CLOSE_MODAL);
    }

    const claim = () => {
        const payload = {
            tokenId: cardToClaim.value.id,
            tokenToBurn: cardToBurnId.value
        };
        store.dispatch("YieldCards/claim", payload);
        closeModal();
    }

    onMounted(() => {
        setInterval(() => secondsNow.value++, 1000);
        cardSelectModal.value = new Modal(document.getElementById("cardSelectModal"), { keyboard: false });
    })

</script>


<template>
    <div class="container">
        <div class="row mb-5">
            <ProgressVue></ProgressVue>
        </div>

        <h2 class="text-center" >{{ yieldCards.length === 0 ? 'No Yield Cards... 😢' : 'Your Yield Cards' }}</h2>
        <div class="row row-cols-2 row-cols-lg-5 g-3 justify-content-evenly my-3">
            <div class="col mb-3" v-for="(card, index) in yieldCards" :key="card.id">
                <CardVue
                    type="YIELD_CARD"
                    :card-shape="{
                        yieldEstimate: card.yieldEstimate,
                        value: `L${card.level.toString()}`,
                        classes: biClassForSuit(card.suit),
                        suit: card.suit,
                    }"
                    :gold="true"
                    :interactive="true"
                    :img-src="card.imgSrc"
                    :show-balance="false"
                    @card-clicked="openModal(card)"
                >
                </CardVue>
                <button class="btn btn-red form-control mt-3" @click.prevent="openModal(card)">
                    Claim Yield
                </button>
            </div>
        </div>

        <!-- Modal -->
        <div class="modal fade" id="cardSelectModal" tabindex="-1" aria-labelledby="cardSelectModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-scrollable modal-fullscreen">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="cardSelectModalLabel">Select Base Card to Burn</h5>
                    </div>

                    <div class="modal-body">
                        <div class="container-fluid">
                            <div class="row row-cols-2 row-cols-lg-5 g-2 justify-content-evenly">
                                <div class="col" v-for="(card, i) in cardsToSelect" :key="i">
                                    <CardVue
                                        @click.prevent="selectCard(card)"
                                        :card-shape="card.cardShape"
                                        :balance="card.balance"
                                        :show-balance="card.balance.gt(0)"
                                        :show-art="card.balance.gt(0)"
                                        :show-title="card.balance.eq(0)"
                                        :interactive="card.balance.gt(0)"
                                        :highlight="card.cardShape.tokenId === cardToBurnId"
                                    ></CardVue>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="modal-footer">
                        <div class="d-grid gap-2 flex-grow-1">
                            <button class="btn btn-red" @click="claim" :disabled="cardToBurnId === null">Claim Yield</button>
                            <button class="btn btn-secondary" @click.prevent="closeModal">Cancel</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    </div>
</template>
