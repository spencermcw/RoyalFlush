import { ethers } from 'ethers'
import { abi as ABI } from './ABIs/Marketplace.json'
import { provider } from '../ethers'

export const address = import.meta.env.VITE_MARKETPLACE_ADDRESS;
export const contract = new ethers.Contract(address, ABI, provider);
export const abi = ABI;

export default contract;
