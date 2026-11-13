import { ethers } from "ethers"
import { addresses } from "./addresses";
import { abi as ABI } from "./ABIs/BaseCards.json"
import { signer } from "../ethers"

export const address = addresses.BaseCards;
export const contract = new ethers.Contract(address, ABI, signer);
export const abi = ABI;

export default contract;
