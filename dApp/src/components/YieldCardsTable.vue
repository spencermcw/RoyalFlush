<script setup>
    import { computed, ref, onMounted, watch } from "vue";
    import { useStore } from "vuex";
    import { suits, biClassForSuit } from "../store/static/cards";

    const store = useStore();

    const props = defineProps({
        title: {
            type: String,
            default: "Cards Table"
        },
        yieldCardIds: {
            type: Array,
            default: []
        },
        showTotal: {
            type: Boolean,
            default: true
        }
    })

    const ycBySuitLevel = ref(null);

    const resetYCSuitLevel = () => {
        ycBySuitLevel.value = [
            new Array(10).fill(0),
            new Array(10).fill(0),
            new Array(10).fill(0),
            new Array(10).fill(0),
        ]
        ycBySuitLevel.value[suits.CLUBS] = ycBySuitLevel.value[0];
        ycBySuitLevel.value[suits.DIAMONDS] = ycBySuitLevel.value[1];
        ycBySuitLevel.value[suits.HEARTS] = ycBySuitLevel.value[2];
        ycBySuitLevel.value[suits.SPADES] = ycBySuitLevel.value[3];
    }

    const total = computed(() => props.yieldCardIds.length)

    const tableSuits = [
        suits.CLUBS,
        suits.DIAMONDS,
        suits.HEARTS,
        suits.SPADES
    ];

    watch(total, () => {
        resetYCSuitLevel();
        props.yieldCardIds.forEach(id => {
            const yc = store.getters["YieldCards/getById"](id);
            ycBySuitLevel.value[yc.suit][Number(yc.level)-1] += 1;
        });
    })

    onMounted(() => {
        props.yieldCardIds.forEach(id => {
            const yc = store.getters["YieldCards/getById"](id);
            ycBySuitLevel.value[yc.suit][Number(yc.level)-1] += 1;
        });
    });

    resetYCSuitLevel();
</script>

<template>
    <div class="cards-table">
        <div class="table-container">
            <p class="h2 cards-table__title" v-if="title.length">{{ title }} <span v-if="showTotal"> ({{ total }})</span></p>
            <table class="table">
                <thead>
                    <tr>
                        <th scope="col"></th>
                        <th scope="col" v-for="i in 10">{{i}}</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="s in tableSuits" :key="s">
                        <th scope="row"><i :class="biClassForSuit(s)"></i></th>
                        <td v-for="l in 10" :key="l">
                            <span :class="ycBySuitLevel[s][l-1] < 1 ? 'text-secondary' : ''">{{ ycBySuitLevel[s][l-1] }}</span>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>
