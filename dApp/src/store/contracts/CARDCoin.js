import { ethers } from "ethers";
import { addresses } from "./addresses";
import { abi as ABI } from "./ABIs/CARDCoin.json";
import { signer } from "../ethers";

export const address = addresses.CARDCoin;
export const contract = new ethers.Contract(address, ABI, signer);
export const abi = ABI;

export default contract;
