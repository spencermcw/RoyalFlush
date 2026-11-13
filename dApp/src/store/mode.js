import { reactive } from "vue"

// Which chain the dApp talks to, chosen once per page load (switching sets the flag and reloads):
//   "wallet": the visitor's injected wallet (MetaMask) on BSC testnet, as before.
//   "demo":   an in-browser chain (Ganache, see demoChain.js) running the same contract bytecode.
// localStorage RF_MODE picks it; without a flag, demo is the default when there is no window.ethereum.
export const MODE_KEY = "RF_MODE"
// Set when the visitor presses "Play the demo"; until then demo mode loads nothing heavy.
export const DEMO_STARTED_KEY = "RF_DEMO_STARTED"

const read = (key) => { try { return window.localStorage.getItem(key) } catch (e) { return null } }
const write = (key, value) => { try { window.localStorage.setItem(key, value) } catch (e) { /* private mode */ } }

const resolveMode = () => {
    const flag = read(MODE_KEY)
    if (flag === "demo" || flag === "wallet")
        return flag
    return window.ethereum ? "wallet" : "demo"
}

export const mode = resolveMode()
export const isDemo = mode === "demo"

// Reactive demo state for the UI: started, booting progress, errors and the demo clock skew.
export const demo = reactive({
    started: isDemo && read(DEMO_STARTED_KEY) === "1",
    booting: false,
    step: "",
    error: null,
    // Seconds the demo chain's clock runs ahead of the wall clock ("Skip ahead a day").
    skewSeconds: 0,
})

// Seconds to add to Date.now() to get the chain's notion of "now" (0 on a real chain).
export const clockSkewSeconds = () => (isDemo ? demo.skewSeconds : 0)

export const markDemoStarted = () => {
    write(DEMO_STARTED_KEY, "1")
    demo.started = true
}

// Switch mode: set the flag and reload, since the provider is chosen at page load. Switching to the
// demo starts it and lands on the Draw page; switching to a wallet lands on the login steps.
export const switchMode = (next) => {
    write(MODE_KEY, next)
    if (next === "demo")
        write(DEMO_STARTED_KEY, "1")
    reloadAt(next === "demo" ? "#/dapp/play/draw" : "#/login")
}

// Reload onto a route without the router reacting to the hash change first.
export const reloadAt = (hash) => {
    window.history.replaceState(null, "", hash)
    window.location.reload()
}
