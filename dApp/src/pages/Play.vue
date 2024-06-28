<script setup>
    import { computed } from "vue"
    import { useStore } from "vuex"
    import Banner from "../components/Banner.vue"
    import NavPills from "../components/NavPills.vue"

    const store = useStore()
    const packs = computed(() => store.state.Packs.unopenedPacks.length);

    defineProps({
        breadCrumbs: {
            type: Array,
            default: []
        }
    })
</script>

<template>
    <div class="play-page">
        <Banner
            title="Play"
            :bread-crumbs="breadCrumbs"
            :no-margin="true"
        ></Banner>

        <NavPills
            :links="[
                { to: '/dapp/play/draw', title: 'DRAW' },
                { to: '/dapp/play/meld', title: 'MELD' },
                { to: '/dapp/play/redeem', title: 'REDEEM' },
                { to: '/dapp/play/levelup', title: 'LEVEL UP' },
                { to: '/dapp/play/packs', title: 'PACKS', badge: packs },
            ]"
        ></NavPills>

        <section>
            <router-view></router-view>
        </section>
    </div>
</template>
