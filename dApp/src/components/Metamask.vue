<script setup>
    import { ref, computed, watch } from "vue"
    import { useStore } from "vuex"
    import MetaMaskOnboarding from "@metamask/onboarding"
    import { shortAddress } from "../store/static/lib"

    defineProps({
        btnClass: {
            type: String,
            default: "btn-red"
        },
        disabled: {
            type: Boolean,
            default: false
        }
    })

    const { ethereum } = window

    const store = useStore()

    const pending = computed(() => store.getters["MetaMask/pending"])
    const account = computed(() => store.getters["MetaMask/activeAccount"])
    const connected = computed(() => store.getters["MetaMask/connected"])

    const pendingSignature = computed(() => store.state.MetaMask.pendingSignature)
    const pendingTransactions = computed(() => store.state.MetaMask.pendingTransactions)

    const MetaMaskIsInstalled = computed(() => Boolean(ethereum && ethereum.isMetaMask))

    const timerSeconds = ref(0)

    watch(
        () => pendingTransactions.value,
        (currentCount, previousCount) => {
            let interval;
            // Start Timer
            if (currentCount > 0) {
                // Add 30 seconds if adding a transaction
                if (currentCount > previousCount) {
                    timerSeconds.value += 30;
                }
                // Sub 30 seconds if adding a transaction
                if (currentCount < previousCount) {
                    timerSeconds.value -= 30;
                }
                // Decrement seconds
                interval = setInterval(() => {
                    timerSeconds.value -= 1;
                    // Stop Timer if out of time
                    if (timerSeconds.value < 1)
                        clearInterval(interval);
                }, 1000);
            }
            // Stop Timer
            else {
                timerSeconds.value = 0;
                clearInterval(interval);
            }
        }
    )

    // Install or connect MetaMask
    const connectWallet = async () => {
        // Abort if already connected
        if (connected.value)
            return;
        // Check MetaMask Installation
        if (!MetaMaskIsInstalled.value) { // Install Metamask
            new MetaMaskOnboarding().startOnboarding()
        } else { // Request Account
            await store.dispatch("MetaMask/connect")
        }
    }

</script>

<template>
    <div class="MetaMask d-grid">
        <button class="btn" :class="btnClass" :disabled="pending || disabled" @click="connectWallet">
            <!-- Pending Signature -->
            <div v-if="pendingSignature">
                <span class="me-2">Pending Signature</span>
                <div class="spinner-border spinner-border-sm text-light">
                    <span class="visually-hidden">Loading...</span>
                </div>
            </div>

            <!-- Pending Transactions -->
            <div v-if="pendingTransactions > 0">
                Pending Transactions:
                {{ pendingTransactions }}
                <div class="spinner-border spinner-border-sm text-light mx-2">
                    <span class="visually-hidden">Loading...</span>
                </div>
                {{ timerSeconds }}s
            </div>

            <div v-if="!pending">
                <i class="bi-wallet2 me-2"></i>
                <span v-if="connected">{{ shortAddress(account) }}</span>
                <span v-else>Connect MetaMask</span>
            </div>
        </button>
    </div>
</template>
