<script setup>
    import { ref, computed } from "vue"
    import { shortAddress } from "../store/static/lib";

    const props = defineProps({
        showTitle: {
            type: Boolean,
            default: true
        },
        drawHistory: {
            type: Array,
            default: []
        },
        pageSize: {
            type: Number,
            default: 5
        }
    })

    const pageIndex = ref(0)
    // const numPages = computed(() => Math.ceil(props.drawHistory.length/props.pageSize))

    const formattedHistory = computed(() => [ ...props.drawHistory ].reverse().map(e => ({
        cards: [ ...e.args[1] ],
        total: e.args[1].reduce((p, c) => Number(p) + Number(c), 0),
        transactionHash: e.transactionHash
    })))
</script>


<template>
    <div class="draw-history">
        <p class="h2" v-if="showTitle">DRAWING HISTORY</p>

        <div class="table-container">
            <table class="table table-dark table-hover">
                <thead>
                    <tr>
                        <th scope="col">Transaction #</th>
                        <th scope="col">Total</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(e, i) in formattedHistory.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize)" :key="i">
                        <th scope="col">
                            <a href="" class="text-white">
                                {{ shortAddress(e.transactionHash) }}
                            </a>
                        </th>
                        <td>{{ e.total }}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>
