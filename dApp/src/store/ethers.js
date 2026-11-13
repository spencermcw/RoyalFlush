import { ethers } from 'ethers'
import MetaMaskOnboarding from '@metamask/onboarding'
import { isDemo, demo, markDemoStarted } from './mode'

// Visitors without MetaMask get a stand-in EIP-1193 provider instead of a blank page: it reports no
// accounts, so the app renders its Login steps, and "Connect" starts MetaMask onboarding instead of
// failing. With MetaMask installed, window.ethereum is used exactly as before.
const noWalletProvider = {
    isStandIn: true,
    request: async ({ method }) => {
        switch (method) {
            case 'eth_accounts':
                return []
            case 'eth_chainId':
                return '0x61' // BSC testnet (97), the chain this build's contract addresses live on
            case 'net_version':
                return '97'
            case 'eth_requestAccounts':
                new MetaMaskOnboarding().startOnboarding()
                throw Object.assign(new Error('MetaMask is required to play Royal Flush'), { code: 4001 })
            default:
                throw Object.assign(new Error(`No wallet: ${method} is unavailable`), { code: 4200 })
        }
    },
    on: () => {},
    removeListener: () => {},
}

// Demo mode: an EIP-1193 provider backed by the in-browser chain. Nothing heavy loads until the
// visitor starts the demo; after that, the first request boots the chain (lazy chunk + vendored
// Ganache script) and every request waits for it.
let chainPromise = null

export const loadDemoChain = () => {
    if (!chainPromise) {
        demo.booting = true
        demo.error = null
        chainPromise = import('./demoChain.js')
            .then(m => m.bootDemoChain({
                onStep: (step) => { demo.step = step },
                onSkew: (seconds) => { demo.skewSeconds = seconds },
            }))
            .then(chain => {
                demo.booting = false
                return chain
            })
            .catch(e => {
                console.error('demoChain#boot', e)
                demo.booting = false
                demo.error = e.message || String(e)
                chainPromise = null
                throw e
            })
    }
    return chainPromise
}

// Start the demo (the "Play the demo" button) and resolve once the chain is ready.
export const startDemo = () => {
    markDemoStarted()
    return loadDemoChain()
}

const demoProvider = {
    isRoyalFlushDemo: true,
    request: async ({ method, params = [] }) => {
        switch (method) {
            case 'eth_chainId':
                return '0x61'
            case 'net_version':
                return '97'
            case 'eth_accounts':
                if (!demo.started)
                    return []
                return [(await loadDemoChain()).player]
            case 'eth_requestAccounts':
                return [(await startDemo()).player]
            default:
                return (await loadDemoChain()).request(method, params)
        }
    },
    on: () => {},
    removeListener: () => {},
}

export const provider = new ethers.providers.Web3Provider(isDemo ? demoProvider : (window.ethereum ?? noWalletProvider), "any")
// Blocks are mined instantly in demo, so poll for events more often than the 4 s default.
if (isDemo)
    provider.pollingInterval = 1000
export const signer = provider.getSigner()

// Demo-only actions, loaded on demand so wallet mode never pulls in the demo chunk.
export const skipAheadDay = async () => (await loadDemoChain()).skipAhead(86400)

export const resetDemo = async () => {
    const m = await import('./demoChain.js')
    await m.resetDemoData()
}
