import { createApp } from 'vue'

import 'bootstrap/dist/js/bootstrap.bundle'
import 'bootstrap-icons/font/bootstrap-icons.css'

// Self-hosted fonts (latin subset), the weights index.scss used to request from Google Fonts
import '@fontsource/chakra-petch/latin-300'
import '@fontsource/chakra-petch/latin-400'
import '@fontsource/chakra-petch/latin-500'
import '@fontsource/chakra-petch/latin-600'
import '@fontsource/chakra-petch/latin-700'
import '@fontsource/roboto/latin-100'
import '@fontsource/roboto/latin-300'
import '@fontsource/roboto/latin-400'
import '@fontsource/roboto/latin-500'
import '@fontsource/roboto/latin-700'
import '@fontsource/roboto/latin-900'

import './assets/style/index.scss'

import App from './App.vue'
import store from './store'
import router from './router'

const app = createApp(App)
app.use(store)
app.use(router)
app.mount('#app')

const { ethereum } = window

// Without a wallet (see store/ethers.js) there are no account changes to follow.
ethereum?.on("accountsChanged", async () => {
    await store.dispatch("MetaMask/updateAccounts");
    router.go({ name: "login" });
});


