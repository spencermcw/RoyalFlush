<script setup>
    import logo from "../assets/images/LogoDark.png"
    import Metamask from "./Metamask.vue"
    import { computed } from "vue"
    import { useStore } from "vuex";

    const store = useStore()
    const connected = computed(() => store.getters["MetaMask/connected"])
    // const totalSpent = computed(() => store.state.CARDCoin.totalSpent)

    const links = [{
        to: "/dapp/play/draw",
        title: "Play"
    }, {
        to: "/dapp/base_cards/cards",
        title: "Base Cards"
    }, {
        to: "/dapp/yield_cards/redeem",
        title: "Yield Cards"
    }, {
        to: "/dapp/marketplace/buy",
        title: "Marketplace"
    }]
</script>


<template>
    <nav class="navbar navbar-light navbar-expand-md">
        <div class="container-fluid">
            <!-- Brand -->
            <router-link to="/login">
                <img class="navbar-brand" :src="logo">
            </router-link>

            <!-- Toggle -->
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
                <span class="navbar-toggler-icon"></span>
            </button>

            <!-- Content -->
            <div class="collapse navbar-collapse" id="navbarSupportedContent">
                <ul class="navbar-nav me-auto mb-2 mb-lg-0">
                    <div v-for="(l, i) in links" :key="i">
                        <li class="nav-item" v-if="connected">
                            <router-link class="nav-link" :to="l.to">{{ l.title }}</router-link>
                        </li>
                    </div>
                    <!-- <li class="nav-item" v-if="connected">
                        <span class="nav-link">
                            <strong>$CARD Spent:</strong>
                            {{ ethers.utils.formatUnits(totalSpent) }}
                        </span>
                    </li> -->
                    <!-- <li class="nav-item"><a target="_blank" href="https://royalflush.nftcardgames.io/instructions.html#" class="nav-link">How to Play</a></li> -->
                    <li class="nav-item"><a target="_blank" href="https://whitepaper.royalflushnft.com/" class="nav-link">Whitepaper</a></li>
                </ul>
                
                <div class="d-flex">
                    <Metamask></Metamask>
                </div>
            </div>
        </div>
    </nav> 
</template>
