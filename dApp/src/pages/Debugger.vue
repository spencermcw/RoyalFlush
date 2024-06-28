<script setup>
  import { computed } from "vue"
  import { useStore } from "vuex"
  import Metamask from "./components/Metamask.vue"
  import Cards from "./components/Cards.vue"
  import Deck from "./components/Deck.vue"
  import Melding from "./components/Melding.vue"
  import Approvals from "./components/Approvals.vue"
  import Marketplace from "./components/Marketplace.vue"

  import "bootstrap-icons/font/bootstrap-icons.css"

  const store = useStore()
  const connected = computed(() => store.getters["metamask/connected"])
</script>

<template>
  <div class="container">
    <h1>App</h1>
    <Metamask></Metamask>
    <Cards v-if="connected"></Cards>
    <Deck v-if="connected"></Deck>
    <Melding v-if="connected"></Melding>
    <Marketplace v-if="connected"></Marketplace>
    <Approvals v-if="connected"></Approvals>
  </div>
</template>

<style>
i.red-suit {
    color: #bd0000;
}
</style>
