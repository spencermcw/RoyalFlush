<script setup>
    import { ref } from 'vue'
    import faceDownCard from '../assets/facedown_empty.png'
    import Card from "./Card.vue"

    const props = defineProps({
        cardShape: {
            default: undefined,
        },
        imgSrc: {
            default: undefined,
        },
        gold: {
            type: Boolean,
            default: false,
        },
    });

    const emit = defineEmits(["card-flipped"]);

    const faceUp = ref(false);

    const flipCard = () => {
        if (!faceUp.value) {
            emit("card-flipped", props.cardShape);
            faceUp.value = true;
        }
    }

    defineExpose({ flipCard });
</script>


<template>
    <div class="flippable-card-cell" :class="{'face-up':faceUp}" @click="flipCard">
        <div class="flippable-card-cell__inner">
            <!-- Invisible placeholder to maintiain card size -->
            <div class="card-cell card-cell--invisible">
                <img :src="faceDownCard" alt="Hidden Face Down Card" class="card-cell__image">
            </div>

            <div class="card-cell flippable-card-cell__back">
                <div class="card-cell__title">
                    <strong>CLICK TO<br>REVEAL</strong>
                </div>
                <img :src="faceDownCard" alt="Card Back" class="card-cell__image">
            </div>

            <div class="flippable-card-cell__face">
                <Card
                    :card-shape="cardShape"
                    :img-src="imgSrc"
                    :show-balance="false"
                    :gold="gold"
                ></Card>
            </div>
        </div>
    </div>  
</template>
