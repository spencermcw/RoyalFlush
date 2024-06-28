<script setup>
    import { computed } from "vue"
    import Card from '../components/Card.vue'

    const props = defineProps({
        title: {
            type: String,
            default: "CARDS COLLECTION"
        },
        cardsPerRow: {
            type: Number,
            default: 3
        },
        cards: {
            type: Array,
            default: []
        },
        showZeroBalance: {
            type: Boolean,
            default: true
        },
    })

    const filteredCards = computed(() => {
        if (props.showZeroBalance)
            return props.cards
        else
            return props.cards.filter(c => c.balance.gt(0))
    })
</script>


<template>
    <div class="card-collection">
        <p class="h2 card-collection__title" v-if="title.length">{{ title }}</p>
        <div class="row g-2 row-cols-md-5 justify-content-evenly" :class="`row-cols-${cardsPerRow}`">
            <div v-for="(card, i) in filteredCards" :key="i" class="col mb-2 card-cell-container">
                <Card
                    v-bind="card"
                    @card-clicked="$attrs.onCardClicked"
                >
                </Card>
            </div>
        </div>
    </div>
</template>
