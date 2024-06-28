<script setup>
    import { ref, computed, onMounted } from "vue"
    import { useStore } from "vuex"
    import { ethers } from "ethers"
    import { Modal } from "bootstrap";
    import FlippableCardVue from "../components/FlippableCard.vue";
    import CardsTableVue from "../components/CardsTable.vue";
    import YieldCardsTableVue from "../components/YieldCardsTable.vue";
    import { suitForIndex, cardForId } from "../store/static/cards";
    import { playRandom, playSound, Sounds } from "../store/Audio";
    import AnimationVue from "../components/Animation.vue";

    const store = useStore();

    const VideoModal = ref(null);
    const VideoSource = ref(null);

    const allPacks = computed(() => store.state.Packs.unopenedPacks);

    const audioPlaybacks = ref([]);

    const packModal = ref(null);
    const activePack = ref(null);
    const activePackCardRefs = ref([]);

    const hasBaseCards = computed(() => (
        activePack.value !== null && 
        activePack.value.baseCardAmounts.reduce((p,c) => p.add(c), ethers.constants.Zero).gt(0)
    ));

    const hasYieldCards = computed(() => (
        activePack.value !== null &&
        activePack.value.yieldCardIds.length > 0
    ));

    const flippedCards = ref([]);
    const allFlipped = computed(() => flippedCards.value.every(c => c));
    const flippingAll = ref(false);
    const flipTimeouts = ref([]);
    const flipAllClicked = ref(false);

    const tableView = ref(false);

    const setCardRef = (el) => {
        if (el && activePackCardRefs.value.length < expandedCards.value.length) {
            activePackCardRefs.value.push(el);
        }
    }

    const flipCard = (index) => {
        flippedCards.value[index] = true;
        const card = expandedCards.value[index];
        if (card.type === "YC") {
            VideoSource.value = card.cardShape.videoSrc;
            VideoModal.value.show();
            audioPlaybacks.value.forEach(audio => audio.pause());
        } 
        if (card.type === "BC") {
            if (card.cardShape.value === "WILD") {
                VideoSource.value = "/animations/wc_reveal.mp4";
                VideoModal.value.show();
                audioPlaybacks.value.forEach(audio => audio.pause());
            }
            playRandom([Sounds.CARD_FLIP_1, Sounds.CARD_FLIP_2, Sounds.CARD_FLIP_3]);
        }
    }

    const doFlipAll = () => {
        if (flippingAll.value) {
            pauseFlipping();
            flipAllClicked.value = false;
        }
        else {
            flipAll();
            flipAllClicked.value = true;
        }
    }

    const pauseFlipping = () => {
        flippingAll.value = false;
        flipTimeouts.value.forEach(timeout => {
            clearTimeout(timeout);
        })
    }

    const tryToFlip = (index) => {
        const card = expandedCards.value[index];
        if (
            card.type === "YC" ||
            (card.type === "BC" && card.cardShape.value === "WILD")
        ) {
            audioPlaybacks.value.forEach(audio => audio.pause());
            audioPlaybacks.value = [];
            audioPlaybacks.value.push(playSound(Sounds.RUMBLE, { loop: true }));
            if (card.type === "BC" && card.cardShape.value === "WILD") {
                audioPlaybacks.value.push(playSound(Sounds.GROWL, { loop: true }));
            }
            pauseFlipping();
            activePackCardRefs.value[index].$el.classList.add("vibrate-1");
            activePackCardRefs.value[index].$el.classList.add("glow");
        } else {
            activePackCardRefs.value[index].flipCard();
        }
    }

    const flipAll = () => {
        flippingAll.value = true;
        let numFlipped = 0;
        flippedCards.value.forEach((flipped, index) => {
            if (!flipped) {
                const timeout = setTimeout(() => {
                    if (activePackCardRefs.value[index]) {
                        activePackCardRefs.value[index].$el.scrollIntoView({ behavior: "smooth" });
                        tryToFlip(index);
                    }
                }, numFlipped++ * 500);
                flipTimeouts.value.push(timeout);
            }
        });
    }

    const packTotal = (pack) => {
        let sum = 0;
        sum += Number(pack.baseCardAmounts.reduce((p, c) => p.add(c), ethers.constants.Zero));
        sum += pack.yieldCardIds.length;
        return sum;
    }

    const reset = () => {
        activePack.value = null;
        activePackCardRefs.value = [];
        flippedCards.value = [];
        flippingAll.value = false;
        audioPlaybacks.value.forEach(audio => audio.pause());
        pauseFlipping();
    }

    const expandedCards = computed(() => {
        const cards = [];
        if (activePack.value === null)
            return cards;
        // Base Cards
        activePack.value.baseCardAmounts.forEach((amount, index) => {
            const card = {
                cardShape: cardForId(index),
                imageSource: undefined,
                gold: (index === 20),
                faceUp: false,
                type: "BC",
            };
            for (let i = 0; i < Number(amount); i++) {
                cards.push({...card});
            }
        });
        // Yield Cards
        activePack.value.yieldCardIds.forEach(id => {
            const yc = store.getters["YieldCards/getById"](id);
            cards.push({
                cardShape: {
                    yieldEstimate: yc.yieldEstimate,
                    videoSrc: yc.videoSrc,
                },
                imgSrc: yc.imgSrc,
                gold: true,
                faceUp: false,
                type: "YC",
            })
        })
        // Auto-Shuffle
        cards.sort(() => Math.random() - 0.5);
        return cards;
    });

    const openPackModal = (pack) => {
        activePack.value = pack;
        flippedCards.value = new Array(expandedCards.value.length).fill(false);
        packModal.value.show();
    }

    const closePackModal = () => {
        packModal.value.hide();
        reset();
    }

    const animationDismissed = () => {
        if (flipAllClicked.value) {
            flipAll();
        }
    }

    const openPack = () => {
        playSound(Sounds.ADD_TO_COLLECTION);
        store.dispatch("Packs/openPack", activePack.value.id);
        reset();
    }

    const openAll = () => {
        allPacks.value.forEach(pack => {
            store.dispatch("Packs/openPack", pack.id);
        });
    }

    onMounted(() => {
        packModal.value = new Modal(document.getElementById("openPackModal"), { keyboard: false });
    });
</script>


<template>
    <div class="container mb-5">
        <button class="btn btn-red d-none" @click="openAll">Open All!</button>
        <p class="h1 text-center mb-5" v-if="allPacks.length === 0">No Packs to Open... 😢</p>
        <div class="row row-cols-2 row-cols-md-4 g-2 justify-content-evenly row-cols-xl-6">
            <div class="col mb-4" v-for="(pack, index) in allPacks"
                :key="index">
                <div class="card-pack" @click="openPackModal(pack)"
                    @click.prevent="playSound(Sounds.OPEN_MODAL)">
                    <img src="/Open.png" alt="Listing Image">
                    <span class="badge">{{ packTotal(pack) }}</span>
                </div>
            </div>
        </div>

        <AnimationVue :source="VideoSource" ref="VideoModal"
            @dismissed="animationDismissed"></AnimationVue>

        <!-- Modal -->
        <div class="open-pack">
            <div class="modal fade" id="openPackModal" tabindex="-1"
                aria-labelledby="openPackModalLabel" aria-hidden="true">
                <div
                    class="modal-dialog modal-dialog-scrollable modal-fullscreen">
                    <div class="modal-content" v-if="activePack">
                        <div class="modal-body">
                            <div id="openPackCarousel" class="carousel slide"
                                data-bs-ride="carousel"
                                data-bs-interval="false">
                                <div class="carousel-inner">
                                    <div class="carousel-item active">
                                        <div class="container my-5">
                                            <div
                                                class="row row-cols-2 row-cols-md-3 row-cols-lg-5 g-3 justify-content-center">
                                                <div class="col mb-3" v-for="(card, index) in expandedCards" :key="index">
                                                    <FlippableCardVue
                                                        :ref="setCardRef"
                                                        :card-shape="card.cardShape"
                                                        :img-src="card.imgSrc"
                                                        :gold="card.gold"
                                                        @card-flipped="flipCard(index)">
                                                    </FlippableCardVue>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="carousel-item">
                                        <div class="conatiner my-5">
                                            <div class="row justify-content-center" v-if="hasBaseCards">
                                                <div class="col-12 col-md-8 col-lg-6 my-3">
                                                    <CardsTableVue
                                                        title="Base Cards"
                                                        :balances="activePack.baseCardAmounts">
                                                    </CardsTableVue>
                                                </div>
                                            </div>
                                            <div class="row justify-content-center" v-if="hasYieldCards">
                                                <div class="col-12 col-md-8 col-lg-6 my-3">
                                                    <YieldCardsTableVue
                                                        title="Yield Cards"
                                                        :yield-card-ids="activePack.yieldCardIds">
                                                    </YieldCardsTableVue>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="modal-footer">
                            <div class="open-pack-buttons">
                                <button type="button" class="btn btn-red"
                                    data-bs-dismiss="modal" @click="openPack"
                                    :disabled="!flippedCards.every(card => card)">
                                    <i class="bi bi-bag-plus"></i>
                                    Add All to Collection
                                </button>
                                <button type="button" class="btn btn-secondary"
                                    v-if="packTotal(activePack) > 1"
                                    @click="doFlipAll"
                                    :disabled="allFlipped">
                                    <span v-if="flippingAll && !allFlipped"><i class="bi bi-pause-fill"></i>&nbsp;Pause Flipping</span>
                                    <span v-if="!flippingAll && !allFlipped"><i class="bi bi-file-earmark"></i>&nbsp;Flip All</span>
                                    <span v-if="allFlipped">All Flipped</span>
                                </button>
                                <button type="button" class="btn btn-secondary"
                                    data-bs-target="#openPackCarousel"
                                    data-bs-slide="next"
                                    :disabled="!allFlipped"
                                    @click="tableView = !tableView"
                                    @click.prevent="playSound(Sounds.VIEW)">
                                    <div v-if="tableView">
                                        <i class="bi bi-grid-3x3-gap-fill"></i>
                                        Grid
                                    </div>
                                    <div v-else>
                                        <i class="bi bi-table"></i>
                                        Table
                                    </div>
                                </button>
                                <button type="button" class="btn btn-secondary"
                                    @click="closePackModal"
                                    @click.prevent="playSound(Sounds.CLOSE_MODAL)">
                                    <i class="bi bi-x-lg"></i>
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
