<script setup>
    import { ref, computed, defineProps, onMounted } from "vue";
    import { useStore } from "vuex";

    const container = ref(null);
    const video = ref(null);

    const store = useStore();

    const audioEnabled = computed(() => store.state.audioEnabled);

    const props = defineProps({
        source: {
            required: true
        },
        autoplay: {
            default: false
        },
        controls: {
            default: false
        },
        autoDismiss: {
            default: true
        }
    });

    const pause = () => {
        video.value.pause();
    }

    const play = () => {
        video.value.play();
    }

    const show = () => {
        container.value.classList.add("show");
        video.value.load();
        video.value.muted = !audioEnabled.value;
        video.value.currentTime = 0;
        play();
    }
    
    const hide = () => {
        pause();
        container.value.classList.remove("show");
        emit("dismissed");
    }

    defineExpose({ show, hide });

    const emit = defineEmits(["dismissed"]);

    const ended = () => {
        if (props.autoDismiss) {
            hide();
        }
    }

</script>

<template>
    <div class="fullscreen-animation" ref="container">
        <video :controls="controls" :autoplay="autoplay" ref="video" @ended="ended">
            <source :src="source" type="video/mp4" v-if="source">
            This browser does not display the video tag.
        </video>

        <div class="controls">
            <!-- <button class="btn btn-red" @click="pause">Pause</button>
            <button class="btn btn-red" @click="play">Play</button> -->
            <button class="btn btn-outline-secondary" @click="hide">
                Continue
                <i class="bi bi-chevron-right"></i>
            </button>
        </div>
    </div>
</template>

