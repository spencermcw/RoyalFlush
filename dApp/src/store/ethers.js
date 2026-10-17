import { ethers } from 'ethers'
import MetaMaskOnboarding from '@metamask/onboarding'

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

export const provider = new ethers.providers.Web3Provider(window.ethereum ?? noWalletProvider, "any")
export const signer = provider.getSigner()
