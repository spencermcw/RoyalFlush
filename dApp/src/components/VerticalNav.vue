<script setup>
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
    <div class="vertical-nav">
        <nav>
            <ul class="nav-list">
                <li class="nav-list__item" v-for="(l,i) in links" :key="i">
                    <router-link :to="l.to">{{ l.title }}</router-link>
                </li>
            </ul>
        </nav>
    </div>
</template>
