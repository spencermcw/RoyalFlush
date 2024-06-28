import { ethers } from "ethers"
import { abi as ABI } from "./ABIs/Game.json"
import { signer } from "../ethers"

export const address = import.meta.env.VITE_GAME_ADDRESS;
export const contract = new ethers.Contract(address, ABI, signer);
export const abi = ABI;

export default contract;
