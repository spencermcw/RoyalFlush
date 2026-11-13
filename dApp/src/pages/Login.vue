<script setup>
    import Banner from "../components/Banner.vue"
    import { useStore } from "vuex"
    import { reactive, computed, watch } from "vue"
    import Logo from "../assets/images/logo.png"
    import { playSound, Sounds } from "../store/Audio";
    import { useRouter } from "vue-router";
    import { isDemo, demo, switchMode } from "../store/mode";
    import { startDemo } from "../store/ethers";

    const store = useStore();
    const router = useRouter();

    // Demo: start (or resume) the in-browser chain and go straight to the table. In wallet mode the
    // provider is fixed for this page load, so switch modes (sets the flag and reloads).
    const playDemo = async () => {
        if (!isDemo)
            return switchMode("demo");
        try {
            await startDemo();
            await store.dispatch("MetaMask/updateAccounts");
            playSound(Sounds.WELCOME);
            router.push("/dapp/play/draw");
        } catch (e) {
            // demo.error is shown below the button
        }
    };

    const pending = computed(() => store.getters["MetaMask/pending"]);
    const connected = computed(() => store.getters["MetaMask/connected"]);

    watch(connected, () => {
        if(!connected.value)
            return;
        store.dispatch("CARDCoin/fetchAllowance");
        store.dispatch("BaseCards/fetchApproval");
        store.dispatch("YieldCards/fetchApproval");
    });

    const steps = reactive([{
        title: "Connect Your Wallet",
        subtext: "Connect your MetaMask Wallet with the Royal Flush dApp.",
        buttonText: "Connect",
        computedCompletion: connected,
        action: () => {
            store.dispatch("MetaMask/connect");
        },
    }, {
        title: "Manage $CARD Coin",
        subtext: "Authorize the Royal Flush Game to transact $CARD Coin on your behalf.",
        buttonText: "Authorize",
        computedCompletion: computed(() => store.state.CARDCoin.gameAllowance.gt(0)),
        action: () => {
            store.dispatch("CARDCoin/requestAllowance");
        },
    }, {
        title: "Manage Base Cards",
        subtext: "Authorize the Royal Flush Game to transact Base Cards on your behalf.",
        buttonText: "Authorize",
        computedCompletion: computed(() => store.state.BaseCards.gameApproval),
        action: () => {
            store.dispatch("BaseCards/requestApproval");
        },
    }, {
        title: "Manage Yield Cards",
        subtext: "Authorize the Royal Flush Game to transact Yield Cards on your behalf.",
        buttonText: "Authorize",
        computedCompletion: computed(() => store.state.YieldCards.gameApproval),
        action: () => {
            store.dispatch("YieldCards/requestApproval");
        },
    }]);
</script>


<template>
    <div class="landing-page">
        <Banner :no-margin="true"></Banner>

        <section>
            <div class="container">
                <div class="row justify-content-evenly mb-5">
                    <div class="col-lg-10 col-xxl-8">
                        <div class="d-grid gap-4 authorizations">
                            <img :src="Logo" alt="">
                            <h1 class="h1 text-center">Play Royal Flush</h1>

                            <div class="d-grid gap-2 demo-cta">
                                <button class="btn btn-red btn-lg" :disabled="demo.booting" @click="playDemo">
                                    <span class="spinner-border spinner-border-sm text-light me-2" v-if="demo.booting"></span>
                                    <strong class="h3">{{ isDemo && demo.started ? "Continue the demo" : "Play the demo, no wallet needed" }}</strong>
                                </button>
                                <p class="text-center mb-0 demo-cta__note">
                                    The real game contracts run in your browser with practice chips. Nothing to install, nothing on a real chain.
                                </p>
                                <p class="text-center text-danger mb-0" v-if="demo.error">
                                    The demo could not start: {{ demo.error }}
                                </p>
                            </div>

                            <div class="demo-cta__or"><span>or</span></div>

                            <div class="d-grid" v-if="isDemo">
                                <button class="btn btn-outline-light" @click="switchMode('wallet')">
                                    <i class="bi-wallet2 me-2"></i>Connect MetaMask (BSC testnet)
                                </button>
                            </div>

                            <template v-else>
                            <h2 class="h4 text-center mb-0">Connect MetaMask (BSC testnet)</h2>

                            <div class="d-block authorizations__step"
                                v-for="(step, i) in steps" :key="i"
                                :class="{
                                    'complete': step.computedCompletion,
                                    'active': !step.computedCompletion && (i > 0 ? steps[i-1].computedCompletion : true),
                                    'locked': i > 0 && !steps[i-1].computedCompletion,
                                }"
                            >
                                <div class="d-flex">
                                    <span class="h4 fw-bold flex-grow-1 me-2">
                                        {{ i + 1 }}.
                                        {{ step.title }}
                                    </span>
                                    <button class="btn btn-red align-self-start"
                                        v-if="!step.computedCompletion && (i == 0 || steps[i-1].computedCompletion)"
                                        :disabled="pending"
                                        @click="step.action"
                                    >
                                        <div class="spinner-border spinner-border-sm text-light" v-if="pending">
                                            <span class="visually-hidden">Loading...</span>
                                        </div>
                                        <span v-else>{{ step.buttonText }}</span>
                                    </button>
                                    <i class="bi-check-circle-fill authorizations__check" v-if="step.computedCompletion"></i>
                                    <i class="bi bi-shield-lock-fill authorizations__lock" v-if="i > 0 && !steps[i-1].computedCompletion"></i>
                                </div>
                                <p class="mb-0">{{ step.subtext }}</p>
                            </div>

                            <router-link to="/dapp/play/draw" class="btn btn-red btn-lg" @click.prevent="playSound(Sounds.WELCOME)" v-if="steps.every(s => s.computedCompletion)">
                                <strong class="h2">Play</strong>
                            </router-link>
                            </template>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    </div>
</template>
