<script setup>
    import { computed } from "vue"
    import { useStore } from "vuex"
    import { suits, biClassForSuit } from "../store/static/cards"

    const store = useStore()

    const yieldCards = computed(() => store.getters["YieldCards/adjustedBalances"]);

    const maxLevel = (suit) => {
        return Math.max(
            0,
            ...yieldCards.value
                .filter(card => card.suit === suit)
                .map(card => Number(card.level))
        );
    }

    const rfNeeded = (suit) => {
        // Total RF Needed
        const rfRequired = Math.pow(2, maxLevel(suit));
        // Sum RF acquired
        const acquired = yieldCards.value
            .filter(card => card.suit === suit)
            .map(card => Math.pow(2, Number(card.level) - 1))
            .reduce((p, c) => p + c, 0)
        // Difference
        return rfRequired - acquired;
    }

    const progress = computed(() => {
        let _progress = [{
            suit: suits.CLUBS,
            maxLevel: maxLevel(suits.CLUBS),
            rfNeeded: rfNeeded(suits.CLUBS),
            biClass: biClassForSuit(suits.CLUBS),
        }, {
            suit: suits.DIAMONDS,
            maxLevel: maxLevel(suits.DIAMONDS),
            rfNeeded: rfNeeded(suits.DIAMONDS),
            biClass: biClassForSuit(suits.DIAMONDS),
        }, {
            suit: suits.HEARTS,
            maxLevel: maxLevel(suits.HEARTS),
            rfNeeded: rfNeeded(suits.HEARTS),
            biClass: biClassForSuit(suits.HEARTS),
        }, {
            suit: suits.SPADES,
            maxLevel: maxLevel(suits.SPADES),
            rfNeeded: rfNeeded(suits.SPADES),
            biClass: biClassForSuit(suits.SPADES),
        }]

        return _progress;
    })

</script>


<template>
    <div class="container">
        <p class="h1">Level Progress</p>
        <div class="row yield-progress row-cols-1 row-cols-md-2 row-cols-xl-4">
            <div class="col mb-3 d-grid gap-2" v-for="(p, index) in progress" :key="index">
                <div class="d-flex align-items-center">
                    <div class="d-flex align-items-center flex-grow-1">
                        <span class="h2 mb-0">{{ p.suit }}</span>
                        <i class="mx-2 bi" :class="biClassForSuit(p.suit)"></i>
                        <span class="h3 mb-0 me-3" v-if="p.maxLevel > 0">L{{ p.maxLevel }}</span>
                    </div>
                </div>

                <div class="progress-bar">
                    <span v-for="i in 10" :class="p.maxLevel >= i ? 'active' : ''">{{ i }}</span>
                </div>
                <router-link :to="{ name: 'levelup' }" class="btn-sm btn-red" v-if="p.rfNeeded <= 0">
                    Level Up Now!
                </router-link>
                <span v-else>{{ p.rfNeeded }} Royal Flush{{p.rfNeeded>1?'es':''}} until Level {{ p.maxLevel + 1 }}</span>
            </div>
        </div>
    </div>
</template>
