<script setup>
    import { ethers } from "ethers";
    import { computed, watchEffect } from "vue";
    import { splitBySuit } from "../store/static/cards";
    import { suits, biClassForSuit } from "../store/static/cards";

    const props = defineProps({
        title: {
            type: String,
            default: "Cards Table"
        },
        balances: {
            type: Array,
            default: new Array(21).fill(ethers.constants.Zero)
        },
        showTotal: {
            type: Boolean,
            default: true
        }
    })

    const emit = defineEmits([
        'totalChanged'
    ])

    const cards = splitBySuit()
    const total = computed(() => props.balances.reduce((c, p) => c.add(p), ethers.constants.Zero))

    watchEffect(() => emit("totalChanged", total.value))

    const tableSuits = [
        biClassForSuit(suits.CLUBS),
        biClassForSuit(suits.DIAMONDS),
        biClassForSuit(suits.HEARTS),
        biClassForSuit(suits.SPADES),
    ];
</script>

<template>
    <div class="cards-table">
        <div class="table-container">
            <p class="h2 cards-table__title" v-if="title.length">{{ title }} <span v-if="showTotal"> ({{ total }})</span></p>
            <table class="table">
                <thead>
                    <tr>
                        <th scope="col"></th>
                        <th scope="col">10</th>
                        <th scope="col">J</th>
                        <th scope="col">Q</th>
                        <th scope="col">K</th>
                        <th scope="col">A</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(s,i) in tableSuits" :key="i">
                        <th scope="row"><i :class="s"></i></th>
                        <td v-for="(c,j) in cards[i]" :key="j">
                            <span :class="{'text-secondary':balances[c.tokenId].eq(0)}">{{ balances[c.tokenId] }}</span>
                        </td>
                    </tr>
                </tbody>

            </table>
            <div class="row justify-content-between align-items-center">
                <div class="col">
                    <strong>WILDCARDS:&nbsp;</strong>
                    <span>{{ balances[cards[4][0].tokenId] }}</span>
                </div>
            </div>
        </div>
    </div>
</template>
