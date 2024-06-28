<script setup>
    import { playSound, Sounds } from "../store/Audio";

    defineProps({
        links: {
            type: Array,
            default: [{
                to: "/path/1",
                title: "Path 1"
            }, {
                to: "/path/2",
                title: "Path 2",
                badge: 5
            }]
        }
    })
</script>


<template>
    <div class="container-fluid nav-pills-container">
        <div class="row row-cols-2 row-cols-md-3 row-cols-xl-5 g-2 justify-content-evenly">
            <div class="col-6 flex-grow-1" v-for="(l,i) in links">
                <router-link
                    @click="playSound(Sounds.NAVIGATE)"
                    :key="i"
                    :to="l.to"
                    class="btn nav-link"
                    :class="$route.fullPath === l.to ? 'btn-red' : 'btn-dark'"
                >
                    <i class="bi" :class="l.icon" v-if="l.icon"></i>&nbsp;
                    {{ l.title }}
                    <div class="badge nav-badge" v-if="l.badge">{{ l.badge }}</div>
                </router-link>
            </div>
        </div>
    </div>
</template>
