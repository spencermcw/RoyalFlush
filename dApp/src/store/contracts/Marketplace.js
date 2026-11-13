import { ethers } from 'ethers'
import { addresses } from "./addresses";
import { abi as ABI } from './ABIs/Marketplace.json'
import { provider } from '../ethers'

export const address = addresses.Marketplace;
export const contract = new ethers.Contract(address, ABI, provider);
export const abi = ABI;

export default contract;
