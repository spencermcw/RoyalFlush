import { createRouter, createWebHashHistory } from "vue-router"
import store from "../store"

const updateAccounts = async (to, from, next) => {
    await store.dispatch("MetaMask/updateAccounts");
    next()
}

const requireConnection = async (to, from, next) => {
    await store.dispatch("MetaMask/updateAccounts");

    const setupSteps = [
        store.getters["MetaMask/connected"],
        store.state.CARDCoin.gameAllowance.gt(0),
        store.state.BaseCards.gameApproval,
        store.state.YieldCards.gameApproval,
    ];

    const setupComplete = setupSteps.every(s => s);

    if (!setupComplete) {
        next({ name: "login" });
    } else {
        next();
    }
}

const routes = [{
    path: "/",
    redirect: { name: "login" }
}, {
    path: "/login",
    name: "login",
    beforeEnter: updateAccounts,
    component: () => import("../pages/Login.vue"),
}, {
    path: "/dapp/play",
    component: () => import("../pages/Play.vue"),
    beforeEnter: requireConnection,
    children: [{
        path: "",
        redirect: { name: "notFound" }
    }, {
        path: "draw",
        component: () => import("../tabs/Draw.vue"),
    }, {
        path: "meld",
        component: () => import("../tabs/Meld.vue"),
    }, {
        path: "redeem",
        component: () => import("../tabs/Redeem.vue"),
    }, {
        path: "levelup",
        name: "levelup",
        component: () => import("../tabs/LevelUp.vue"),
    }, {
        path: "packs",
        component: () => import("../tabs/OpenPacks.vue"),
    }],
}, {
    path: "/dapp/collections",
    component: () => import("../pages/Collection.vue"),
    beforeEnter: requireConnection,
    children: [{
        path: "",
        redirect: { name: "notFound" }
    }, {
        path: "base_cards",
        component: () => import("../tabs/BaseCards.vue"),
    }, {
        path: "yield_cards",
        component: () => import("../tabs/YieldCards.vue"),
    }]
}, {
    path: "/dapp/marketplace",
    component: () => import("../pages/Marketplace.vue"),
    beforeEnter: requireConnection,
    children: [{
        path: "",
        redirect: { name: "notFound" }
    }, {
        path: "buy",
        component: () => import("../tabs/Buy.vue"),
    }, {
        path: "sell",
        component: () => import("../tabs/Sell.vue"),
    }, {
        path: "collect",
        component: () => import("../tabs/Collect.vue"),
    }],
}, {
    path: "/:pathMatch(.*)*",
    name: "notFound",
    component: () => import("../pages/NotFound.vue")
}]

const router = createRouter({
    history: createWebHashHistory(),
    routes
})

// router.beforeEach(updateAccounts)

export default router
