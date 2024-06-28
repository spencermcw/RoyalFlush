<script setup>
    import { ref, computed } from "vue";
    import { useStore } from "vuex";
    import { playSound, Sounds } from "../store/Audio";

    import Metamask from "./Metamask.vue";

    const store = useStore();

    const pending = computed(() => store.state.MetaMask.pendingSignature);
    const hasAllowance = computed(() => store.state.CARDCoin.gameAllowance);
    const drawQuantity = ref(5);

    const price = 500;
   
    const draw = () => {
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
            <button
                :disabled="pending || drawQuantity < 5 || drawQuantity > 100"
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

