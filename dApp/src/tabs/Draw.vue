<script setup>
    import { computed } from "vue"
    import { useStore } from "vuex"
    import Draw from "../components/Draw.vue"
    import CardsTable from "../components/CardsTable.vue"

    const store = useStore();
    const balances = computed(() => store.getters["BaseCards/adjustedBalances"]);

</script>


<template>
    <div class="container">
        <div class="row justify-content-evenly">
            <div class="col-12 col-md-5 col-xl-7 mb-5">
                <Draw></Draw>
            </div>
            <div class="col-12 col-md-7 col-xl-5">
                <CardsTable
                    title="Your Base Cards"
                    :balances="balances"
                ></CardsTable>
            </div>
        </div>
    </div>
</template>
