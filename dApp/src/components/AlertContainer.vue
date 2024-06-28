<script setup>
    import AlertVue from "./Alert.vue";
    import { computed } from "vue";
    import { useStore } from "vuex";

    const store = useStore();

    const alerts = computed(() => store.state.Alerts.alerts)
</script>


<template>
    <div class="alert-container">
        <AlertVue
            v-for="(alert, index) in alerts"
            :key="index"
            v-bind="alert"
        >
        </AlertVue>
    </div>
</template>
