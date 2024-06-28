import { createApp } from 'vue'

import 'bootstrap/dist/js/bootstrap.bundle'
import 'bootstrap-icons/font/bootstrap-icons.css'

import './assets/style/index.scss'

import App from './App.vue'
import store from './store'
import router from './router'

const app = createApp(App)
app.use(store)
app.use(router)
app.mount('#app')

const { ethereum } = window

ethereum.on("accountsChanged", async () => {
    await store.dispatch("MetaMask/updateAccounts");
    router.go({ name: "login" });
});


