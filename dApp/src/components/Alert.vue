<script setup>
    import { ref, onMounted } from "vue"
    import { Alert } from "bootstrap"
    import { playSound, Sounds } from "../store/Audio";

    const props = defineProps({
        type: {
            type: String,
            default: "success"
        },
        text: {
            type: String,
            required: true,
        },
        links: {
            type: Array,
            default: []
        },
        dismissible: {
            type: Boolean,
            default: true
        },
        autoDismiss: {
            type: Number,
            default: 0
        }
    });

    const emit = defineEmits(['dismissed']);

    const rootEl = ref(null);
    const timer = ref(props.autoDismiss);
    const interval = ref(undefined);

    const dismiss = () => {
        new Alert(rootEl.value).close();
        clearInterval(interval.value);
        emit('dismissed');
        // playSound(Sounds.DISMISS);
    }

    onMounted(() => {
        // Start timer if desired
        if (props.autoDismiss > 0) {
            interval.value = setInterval(() => {
                timer.value -= 1;
                if (timer.value < 0) {
                    dismiss();
                }
            }, 1000);
        }
    })
</script>


<template>
    <div
        class="alert fade show"
        :class="{
            [`alert-${type}`]: true,
            'alert-dismissible': dismissible
        }"
        role="alert"
        ref="rootEl"
    >

        <span>{{ text }}</span>

        <div v-if="links.length">
            <router-link v-for="(link, index) in links" :key="index" :to="link.to" @click="dismiss">
                {{ link.text }}
            </router-link>
        </div>

        <button
            v-if="dismissible"
            type="button"
            class="btn-close"
            aria-label="Close"
            @click="dismiss"
        ></button>

        <div class="progress" v-if="autoDismiss > 0">
            <div
                class="progress-bar"
                :class="`bg-${type}`"
                role="progressbar"
                :style="`width: ${timer/autoDismiss*100}%;`"
                :aria-valuenow="timer"
                aria-valuemin="0"
                aria-valuemax="100">
            </div>
        </div>
    </div>
</template>
