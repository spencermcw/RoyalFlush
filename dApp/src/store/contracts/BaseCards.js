import { ethers } from "ethers"
import { abi as ABI } from "./ABIs/BaseCards.json"
import { signer } from "../ethers"

export const address = import.meta.env.VITE_BASE_CARDS_ADDRESS;
export const contract = new ethers.Contract(address, ABI, signer);
export const abi = ABI;

export default contract;
