<script setup>
    import { ref } from "vue";
    const drawerRef = ref(null);
    const toggle = () => {
        console.log(drawerRef.value);
        if (drawerRef.value.classList.contains("open")) {
            drawerRef.value.classList.remove("open");
        } else {
            drawerRef.value.classList.add("open");
        }
    }
</script>

<template>
    <nav class="nav-drawer" ref="drawerRef">
        <i class="bi-list" @click="toggle"></i>
    </nav>
</template>
