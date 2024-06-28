<script setup>
    import Banner from "../components/Banner.vue"
    import NavPills from "../components/NavPills.vue";
</script>


<template>
    <div class="collection">
        <Banner
            title="Card Collections"
            :no-margin="true"
        ></Banner>

        <NavPills
            :links="[
                { to: '/dapp/collections/base_cards', title: 'Base Cards' },
                { to: '/dapp/collections/yield_cards', title: 'Yield Cards' },
            ]"
        ></NavPills>

        <section>
            <router-view></router-view>
        </section>
    </div>
</template>
