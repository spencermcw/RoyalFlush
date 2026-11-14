<script setup>
    import { ref, computed } from "vue";
    import { useStore } from "vuex";
    import { ethers } from "ethers";
    import { playSound, Sounds } from "../store/Audio";

    import Metamask from "./Metamask.vue";

    const store = useStore();

    const pending = computed(() => store.state.MetaMask.pendingSignature);
    const hasAllowance = computed(() => store.state.CARDCoin.gameAllowance);
    const drawQuantity = ref(5);

    const price = 500;

    // Deck.draw reverts without enough $CARD: say so up front and offer the faucet instead.
    const balance = computed(() => store.state.CARDCoin.balance);
    const cost = computed(() => ethers.utils.parseEther(String(price)).mul(Math.max(0, Math.floor(Number(drawQuantity.value) || 0))));
    const shortOfCard = computed(() => Boolean(balance.value) && balance.value.lt(cost.value));
    const balanceText = computed(() => Math.floor(Number(ethers.utils.formatEther(balance.value || 0))).toLocaleString("en-US"));

    const draw = () => {
        if (shortOfCard.value)
            return;
        playSound(Sounds.SHUFFLE);
        store.dispatch("Deck/draw", drawQuantity.value);
    }

    const presetQuantities = [5, 25, 50, 100];
</script>

<template>
    <div class="draw">
        <p class="h2">DRAW BASE CARDS</p>
        <form @submit.prevent="draw" v-if="hasAllowance">
            <div class="input-group mb-3 w-100">
                <button
                    class="btn form-control" 
                    :class="{'btn-red':(drawQuantity===q), 'btn-secondary':(drawQuantity!==q)}"
                    v-for="(q,i) in presetQuantities" :key="i" @click.prevent="drawQuantity=q; playSound(Sounds.POP_CLICK)"
                >
                    {{q}}
                </button>
            </div>
            <div class="input-group">
                <input type="number" class="form-control text-center" id="drawQuantityInput" step="1" min="5" max="100" v-model="drawQuantity" placeholder="# of">
                <label for="drawQuantityInput" class="input-group-text"> Base Cards</label>
            </div>
            <p class="text-center my-3">
                You will receive one <strong><i class="bi bi-layers"></i> PACK</strong> containing <strong>{{ drawQuantity }} BASE CARDS</strong> for <strong>{{ price * drawQuantity }} $CARD Coin</strong>
            </p>
            <div class="alert alert-warning text-center" role="alert" v-if="shortOfCard" data-test="draw-short">
                Not enough $CARD Coin: this pack costs {{ (price * drawQuantity).toLocaleString("en-US") }} and you have {{ balanceText }}.
                <button class="btn btn-sm btn-red ms-2" type="button" :disabled="pending" @click="store.dispatch('CARDCoin/tapFaucet')">
                    Get 10,000 $CARD
                </button>
            </div>
            <button
                :disabled="pending || shortOfCard || drawQuantity < 5 || drawQuantity > 100"
                class="btn btn-red form-control mb-3"
                type="submit"
            >
                <i class="bi bi-layers"></i>
                Draw Pack
            </button>
        </form>

        <Metamask btn-class="btn-secondary form-control" :disabled="true"></Metamask>
    </div>
</template>

