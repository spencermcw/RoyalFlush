<script setup>
    import { ethers } from "ethers"
    import { computed, ref, watch, onMounted } from "vue"
    import { useStore } from "vuex"
    import { biClassForSuit } from "../store/static/cards";
    import Card from "../components/Card.vue"
    import Metamask from "../components/Metamask.vue";
    import { playSound, Sounds } from "../store/Audio";


    const store = useStore();

    const yieldCards = computed(() => store.getters["YieldCards/adjustedBalances"]);
    const ycToBurn = ref([null, null]);

    const txnReady = computed(() => (
        ycToBurn.value.every(yc => yc !== null) &&
        [
            ycToBurn.value[0].suit === ycToBurn.value[1].suit,
            ycToBurn.value[0].level.eq(ycToBurn.value[1].level),
        ].every(i => i)
    ));

    const cardSelectedIndex = (yc) => (
        ycToBurn.value
            .map(_yc => (_yc !== null && _yc.id.toString()))
            .indexOf(yc.id.toString())
    )

    const cardClicked = (yc) => {
        playSound(Sounds.CHOICE);

        const ycIndex = cardSelectedIndex(yc);
        if (ycIndex !== -1) {
            ycToBurn.value[ycIndex] = null;
        } else {
            ycToBurn.value[ycToBurn.value.indexOf(null)] = { ...yc };
        }

        if (window.innerWidth < 992 && txnReady.value)
            document.getElementById("melding-top").scrollIntoView({ behavior: "smooth" });
    }

    const submitTxn = () => {
        playSound(Sounds.SHUFFLE);
        store.dispatch("YieldCards/levelUp", { ids: ycToBurn.value.map(yc => yc.id) })
            .then(() => ycToBurn.value = [null, null]);
    }

    watch(yieldCards, () => {
        ycToBurn.value = [null, null];
    })
</script>

<template>
    <div class="container" id="melding-top">
        <div class="row justify-content-evenly">
            <div class="col-12 col-lg-5">
                <div class="row align-items-center justify-content-center">
                    <p class="h1 text-center">Level Up</p>
                    <!-- Card Display -->
                    <div class="col-6" v-for="(yc, i) in ycToBurn">
                        <Card
                            :show-balance="false"
                            :card-shape="yc || { value: 'Select a Card' }"
                            :img-src="yc === null ? undefined : yc.imgSrc"
                            :show-title="yc === null"
                            :show-art="yc !== null"
                        ></Card>
                    </div>
                </div>
            </div>
        </div>    

        <div class="row justify-content-evenly">
            <div class="col-12 col-lg-6 my-5">
                <p v-if="txnReady">
                    <strong>Disclaimer:</strong><br>
                    <ol>
                        <li>The Yield Cards above will be <strong>burned</strong>.</li>
                        <li>
                            Any <strong>$CARD</strong> (Yield) accumulated by the Yield Cards
                            above will be claimed and sent to your wallet automatically.
                        </li>
                        <li>You will recieve one
                            <strong>Level {{ ycToBurn[0].level.add(1) }}
                                <i class="bi" :class="biClassForSuit(ycToBurn[0].suit)"></i>
                                {{ ycToBurn[0].suit }}
                            </strong> Yield Card
                        </li>
                    </ol>
                </p>
                <p class="text-center" v-else>
                    Please select <u>two identical Yield Cards</u> from your collection below!<br>&nbsp;
                </p>
                <button class="btn btn-red form-control mb-3" :disabled="!txnReady"
                    @click="submitTxn">
                    <i class="bi bi-hurricane"></i>&nbsp;
                    Level Up
                </button>
                <Metamask btn-class="btn-secondary form-control" :disabled="true"></Metamask>
            </div>

            <div class="col-12">
                <h2 class="text-center">{{ yieldCards.length === 0 ? 'No Yield Cards... 😢' : 'Your Yield Cards' }}</h2>
                <div class="row row-cols-3 row-cols-md-5 justify-content-center">
                    <div class="col" v-for="yc in yieldCards" :key="yc.id">
                        <Card
                            :card-shape="yc"
                            :img-src="yc.imgSrc"
                            :show-balance="false"
                            :highlight="cardSelectedIndex(yc) !== -1"
                            :interactive="true"
                            @card-clicked="cardClicked(yc)"
                        ></Card>
                    </div>
                </div>
            </div>
        </div>
    </div>

</template>
