<script setup>
    import { computed } from "vue"
    import { useStore } from "vuex"
    import { ethers } from "ethers"

    const store = useStore()
    store.dispatch("Marketplace/getEscrowBalance")

    const escrowBalance = computed(() => store.state.Marketplace.escrowBalance)

    const claimMarketplaceEscrow = () => {
        store.dispatch("Marketplace/claimEscrow")
    }

</script>


<template>
    <div class="container">
        <div class="row justify-content-evenly">
            <div class="col-lg-8">
                <p class="h1">MARKET SALES</p>
                <p>
                    <strong>Balance:</strong>
                    {{ ethers.utils.formatUnits(escrowBalance) }} $CARD
                </p>
                <button class="btn btn-red" @click="claimMarketplaceEscrow">Claim</button>
            </div>
        </div>
    </div>
</template>
