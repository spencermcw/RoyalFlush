<script setup>
    import Banner from "../components/Banner.vue"
    import { useStore } from "vuex"
    import { reactive, computed, watch } from "vue"
    import Logo from "../assets/images/logo.png"
    import { playSound, Sounds } from "../store/Audio";

    const store = useStore();

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
                        </div>
                    </div>
                </div>
            </div>
        </section>
    </div>
</template>
