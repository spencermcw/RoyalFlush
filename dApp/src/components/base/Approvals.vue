<script setup>
    import { reactive, computed } from "vue"
    import { useStore } from "vuex"
    import { shortAddress } from "../../store/static/lib"

    const store = useStore()

    store.dispatch('deck/checkApproval')
    store.dispatch('marketplace/checkApproval')
    const PCApprovals = reactive([{
        name: "Deck",
        address: computed(() => store.state.deck.address),
        approved: computed(() => store.state.deck.approved),
        requestApproval: () => store.dispatch('deck/requestApproval'),
    }, {
        name: "Marketplace",
        address: computed(() => store.state.marketplace.address),
        approved: computed(() => store.state.marketplace.approved),
        requestApproval: () => store.dispatch('marketplace/requestApproval'),
    }])
    const erc20 = computed(() => store.state.erc20.contracts)

    const requestERC20Approval = (address) => {
        console.log(address)
        store.dispatch('erc20/requestApproval', address)
    }

</script>


<template>
    <div class="approvals">
        <h2>Approvals</h2>

        <div class="mb-3">
            <p class="h4">Base Cards Approvals</p>
            <ul class="list-group">
                <li class="list-group-item" v-for="(contract, index) in PCApprovals" :key="index">
                    <code>
                        {{ contract.name }}
                        [{{ shortAddress(contract.address) }}]
                        {{ contract.approved }}
                    </code>
                    <button class="btn btn-link" v-if="!contract.approved" @click="contract.requestApproval">Grant Approval</button>
                </li>
            </ul>
        </div>

        <p class="h4">ERC20 Allowances</p>
        <ul class="list-group">
            <li class="list-group-item" v-for="(contract, index) in erc20" :key="index">
                <code>
                    {{ contract.name }}
                    [{{ shortAddress(contract.address) }}]
                    {{ contract.allowance }}
                    {{ contract.hasAllowance() }}
                </code>
                <button class="btn btn-link" v-if="!contract.hasAllowance()" @click="requestERC20Approval(contract.address)">Grant Allowance</button>
            </li>
        </ul>
    </div>
</template>


<style scoped>
.approvals {
    border-radius: 6px;
    border: 2px solid #0d6efd;
    padding: 15px;
    margin: 10px 0;
}
</style>
