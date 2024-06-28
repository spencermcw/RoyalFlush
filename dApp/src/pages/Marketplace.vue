<script setup>
    import Banner from "../components/Banner.vue";
    import NavPills from "../components/NavPills.vue"

    defineProps({
        breadCrumbs: {
            type: Array,
            default: []
        }
    })
</script>

<template>
    <div class="marketplace-page">
        <Banner
            title="Marketplace"
            :bread-crumbs="breadCrumbs"
            :no-margin="true"
        ></Banner>

        <NavPills
            :links="[
                { to: '/dapp/marketplace/buy', title: 'BUY CARDS' },
                { to: '/dapp/marketplace/sell', title: 'SELL CARDS' },
                { to: '/dapp/marketplace/collect', title: 'COLLECT SALES' },
            ]"
        ></NavPills>

        <section>
            <router-view></router-view>
        </section>
    </div>
</template>
