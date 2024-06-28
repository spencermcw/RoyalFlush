<script setup>
    import { ethers } from 'ethers'
    import faceDownCard from '../assets/facedown.png'
    import faceDownTitleCard from '../assets/facedown_empty.png'
    import { ref, onMounted } from "vue";
    
    const props = defineProps({
        cardShape: {
            type: [Object, undefined],
        },
        imgSrc: {
            default: undefined
        },
        balance: {
            // type: ethers.BigNumber,
            default: ethers.constants.Zero
        },
        showArt: {
            type: Boolean,
            default: true
        },
        showTitle: {
            type: Boolean,
            default: false
        },
        showBalance: {
            type: Boolean,
            default: true
        },
        highlight: {
            type: Boolean,
            default: false
        },
        gold: {
            type: Boolean,
            default: false
        },
        interactive: {
            type: Boolean,
            default: false
        }
    })

    const emits = defineEmits(['card-clicked']);

    const secondsNow = ref(0);

    const imageSource = () => {
        if (!props.showArt) {
            return props.showTitle ? faceDownTitleCard : faceDownCard;
        }
        else if (props.imgSrc !== undefined)
            return props.imgSrc;
        else
            return `/cards/${imageSources[props.cardShape.tokenId]}`;
    }

    const imageSources = [
        // Clubs
        "ten_of_clubs.png",
        "jack_of_clubs.png",
        "queen_of_clubs.png",
        "king_of_clubs.png",
        "ace_of_clubs.png",
        // Diamonds
        "ten_of_diamonds.png",
        "jack_of_diamonds.png",
        "queen_of_diamonds.png",
        "king_of_diamonds.png",
        "ace_of_diamonds.png",
        // Hearts
        "ten_of_hearts.png",
        "jack_of_hearts.png",
        "queen_of_hearts.png",
        "king_of_hearts.png",
        "ace_of_hearts.png",
        // Spades
        "ten_of_spades.png",
        "jack_of_spades.png",
        "queen_of_spades.png",
        "king_of_spades.png",
        "ace_of_spades.png",
        // Wild
        "wildcard.png"
    ];

    onMounted(() => {
        setInterval(() => secondsNow.value++, 1000);
    });
</script>


<template>
    <div class="card-cell"
        :class="{
            'card-cell--highlight': highlight,
            'card-cell--gold': gold,
            'card-cell--interactive': interactive,
        }"
        @click="$emit('card-clicked', cardShape)"
    >
        <!-- Card Title -->
        <div class="card-cell__title" v-if="showTitle">
            <span>{{ cardShape.value }}<br><i :class="cardShape.classes"></i></span>
        </div>
        <!-- Quantity -->
        <span class="card-cell__quantity" v-if="showBalance">{{ balance }}</span>
        <span class="card-cell__quantity" v-if="cardShape.yieldEstimate" :key="secondsNow">
            {{ Number(ethers.utils.formatEther(cardShape.yieldEstimate())).toFixed(4) }}
            <strong>$CARD</strong>
        </span>
        <!-- Image -->
        <img
            :src="imageSource()"
            class="card-cell__image"
            alt="Card Art"
        >
    </div>  
</template>