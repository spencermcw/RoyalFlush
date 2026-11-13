<script setup>
    import { ref, reactive, computed, onMounted } from "vue";
    import { useStore } from "vuex";
    import { ethers } from "ethers";
    import AlertContainerVue from "../components/AlertContainer.vue";
    // import FooterVue from "../components/Footer.vue";
    import Logo from "../assets/images/logo.png";
    import "bootstrap-icons/font/bootstrap-icons.css"
    import MetamaskVue from "../components/Metamask.vue";
    import { playSound, Sounds } from "../store/Audio";
    import { isDemo, demo, switchMode } from "../store/mode";
    import { skipAheadDay, resetDemo } from "../store/ethers";

    const store = useStore()

    // Demo mode controls
    const showDemoBanner = computed(() => isDemo && demo.started);
    const skipping = ref(false);
    const onSkipAhead = async () => {
        skipping.value = true;
        try {
            await skipAheadDay();
            store.commit("Alerts/ADD_ALERT", { autoDismiss: 5, text: "The demo clock moved ahead one day." });
            playSound(Sounds.CLAIM);
        } catch (e) {
            store.commit("Alerts/ADD_ERROR_ALERT", e.message);
        } finally {
            skipping.value = false;
        }
    };
    const onResetDemo = async () => {
        if (!window.confirm("Reset the demo? Your demo cards, Yield Cards and $CARD are wiped and a new demo starts."))
            return;
        await resetDemo();
    };

    const packs = computed(() => store.state.Packs.unopenedPacks.length);
    store.dispatch("initialize");

    const balance = computed(() => store.state.CARDCoin.balance);
    const totalYieldEstimate = store.getters["YieldCards/totalYieldEstimate"];

    const audioEnabled = computed(() => store.state.audioEnabled);
    const contentRef = ref(null);
    const drawerRef = ref(null);
    const drawerOpen = ref(false);
    const innerWidth = ref(window.innerWidth)
    const secondsNow = ref(0);
    
    window.addEventListener('resize', () => { innerWidth.value = window.innerWidth });

    const toggleClass = computed(() => {
        return (drawerOpen.value ? 'bi-arrow-left-short' : 'bi-list')
    })

    const isMobile = computed(() => {
        return innerWidth.value < 992;
    })

    const onToggle = () => {
        if (drawerRef.value.classList.contains("open"))
            closeNav();
        else
            openNav();
        playSound(Sounds.DRAWER);

    }

    const onNav = () => {
        if (isMobile.value)
            onToggle();
        playSound(Sounds.NAVIGATE);
    }

    const openNav = () => {
        drawerRef.value.classList.add("open");
        contentRef.value.classList.add("nav-open");
        drawerOpen.value = true;
    }

    const closeNav = () => {
        drawerRef.value.classList.remove("open");
        contentRef.value.classList.remove("nav-open");
        drawerOpen.value = false;
    }

    const navLinks = reactive([{
        title: "Play",
        links: [{
            title: "Draw Base Cards",
            to: "/dapp/play/draw",
            icon: "bi-file-plus-fill",
        }, {
            title: "Meld Base Cards",
            to: "/dapp/play/meld",
            icon: "bi-hurricane",
        }, {
            title: "Redeem Royal Flush",
            to: "/dapp/play/redeem",
            icon: "bi-trophy-fill",
        }, {
            title: "Level Up",
            to: "/dapp/play/levelup",
            icon: "bi-graph-up",
        }, {
            title: computed(() => `Open Packs (${packs.value})`),
            to: "/dapp/play/packs",
            icon: "bi bi-layers",
        }],
    }, {
        title: "Card Collections",
        links: [{
            title: computed(() => `Base Cards (${store.getters["BaseCards/totalCards"]})`),
            to: "/dapp/collections/base_cards",
            icon: "bi-grid-fill"
        },{
            title: computed(() => `Yield Cards (${store.getters["YieldCards/adjustedBalances"].length})`),
            to: "/dapp/collections/yield_cards",
            icon: "bi-grid",
        }],
    }, {
        title: "Marketplace",
        links: [{
            title: "Browse Listings",
            to: "/dapp/marketplace/buy",
            icon: "bi-binoculars-fill",
        }, {
            title: "Create a Listing",
            to: "/dapp/marketplace/sell",
            icon: "bi-cloud-plus-fill",
        }, {
            title: "Collect Sales",
            to: "/dapp/marketplace/collect",
            icon: "bi-piggy-bank-fill",
        }]
    }, {
        title: "Resources",
        links: [{
            title: "How to Play",
            href: "https://royalflush.nftcardgames.io/#instructions",
            icon: "bi-question-square-fill",
        }, {
            title: "Whitepaper",
            href: "https://whitepaper.royalflushnft.com/",
            icon: "bi-book-fill",
        }]
    }]);

    const toggleAudio = () => {
        store.commit("TOGGLE_AUDIO");
        if (audioEnabled.value) {
            playSound(Sounds.POP_CLICK);
        }
    }

    onMounted(() => {
        if (!isMobile.value)
            openNav();
        setInterval(() => secondsNow.value++, 1000);
    });
</script>


<template>
    <div class="app">
        <AlertContainerVue></AlertContainerVue>

        <div class="demo-boot" v-if="demo.booting" role="status" aria-live="polite">
            <div class="demo-boot__panel">
                <img :src="Logo" alt="" class="demo-boot__logo">
                <div class="spinner-border text-light mb-3"></div>
                <div class="h4 mb-1">Setting up your demo table</div>
                <div class="demo-boot__step">{{ demo.step || "Almost ready" }}</div>
            </div>
        </div>

        <div class="app-viewport">

            <nav class="app-nav">
                <i class="bi nav-toggle" :class="toggleClass" @click="onToggle"></i>
                <!-- <img :src="Logo" alt="" class="logo"> -->
                <div class="d-flex align-items-center">
                    <i class="me-2 fs-2 bi" :class="audioEnabled ? 'bi-volume-down-fill' : 'bi-volume-mute-fill'" @click="toggleAudio"></i>
                    <MetamaskVue btn-class="btn btn-sm btn-red"></MetamaskVue>
                </div>
            </nav>

            <div class="app-nav__drawer" ref="drawerRef">
                <div class="d-grid gap-2">
                    <div class="d-flex gap-2 align-items-center nav-branding">
                        <img :src="Logo" alt="" class="logo">
                        <span>Royal Flush</span>
                    </div>

                    <div v-for="(s, i) in navLinks" :key="i">
                        <span class="section-title">{{ s.title }}</span>
                        
                        <div class="d-grid">
                            <div class="d-block" v-for="(l, j) in s.links" :key="j">
                                <router-link v-if="l.to"
                                    :to="l.to"
                                    class="link link--child"
                                    :class="{'active':($route.fullPath===l.to)}"
                                    @click="onNav"
                                >
                                    <i class="bi" :class="l.icon"></i>
                                    {{ l.title }}
                                </router-link>

                                <a :href="l.href" target="_blank" class="link link--child" v-if="l.href">
                                    <i class="bi" :class="l.icon"></i>
                                    {{ l.title }}
                                </a>
                            </div>
                        </div>
                    </div>

                    <span class="link">Wallet Balance</span>
                    <button class="btn btn-red" disabled>
                        {{ Number(ethers.utils.formatEther(balance || 0)).toFixed(4) }} <strong>$CARD</strong>
                    </button>

                    <span class="link">Unclaimed Yield</span>
                    <router-link to="/dapp/collections/yield_cards" class="btn btn-red" disabled :key="secondsNow" @click="onNav">
                        {{ Number(ethers.utils.formatEther(totalYieldEstimate())).toFixed(4) }} $CARD
                    </router-link>

                    <template v-if="showDemoBanner">
                        <span class="link">Demo Clock</span>
                        <button class="btn btn-outline-light" :disabled="skipping" @click="onSkipAhead">
                            <i class="bi-fast-forward-fill"></i> Skip ahead a day
                        </button>
                    </template>

                    <span class="link">$CARD Faucet</span>
                    <button class="btn btn-red" @click="store.dispatch('CARDCoin/tapFaucet')">
                        Get 10,000 $CARD
                    </button>

                    <a class="btn btn-discord my-3" href="https://discord.gg/royalflushnft" target="_blank">
                        <div class="d-flex justify-content-evenly align-items-center">
                            <i class="bi bi-discord fs-4"></i>
                            <span class="h4 mb-0">JOIN DISCORD</span>
                        </div>
                    </a>
                </div>
            </div>

            <div class="app-content" ref="contentRef" @click="() => { if(isMobile && drawerOpen) closeNav() }">
                <div class="demo-banner" v-if="showDemoBanner" role="status">
                    <span class="demo-banner__text">
                        <strong>Demo mode:</strong> practice chips, nothing is on a real chain.
                    </span>
                    <span class="demo-banner__actions">
                        <button class="btn btn-sm btn-outline-light" @click.stop="onResetDemo">Reset demo</button>
                        <button class="btn btn-sm btn-red" @click.stop="switchMode('wallet')">Connect a real wallet</button>
                    </span>
                </div>
                <router-view></router-view>
            </div>

            <!-- <FooterVue></FooterVue> -->
        </div>

    </div>
</template>
