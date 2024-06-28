<script setup>
    import defaultBannerImage from "../assets/images/header-banner.png";

    defineProps({
        title: String,
        bannerImage: {
            default: defaultBannerImage
        },
        breadCrumbs: {
            type: Array,
            default: []
        },
        noMargin: {
            type: Boolean,
            default: false
        }
    })
</script>

<template>
    <div class="banner" :class="{ 'banner--no-margin': noMargin }">
        <img :src="bannerImage" alt="" class="banner__image">

        <!-- <div class="banner__content">
            <h1 class="rf">Royal Flush</h1>
            <h2>{{ title }}</h2>
        </div> -->
    </div>
</template>

