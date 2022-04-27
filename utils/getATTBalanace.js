import { Contract } from "ethers";
import {
  ATT_CONTRACT_ABI,
  ATT_CONTRACT_ADDRESS,
} from "../constants";

/**
 * getATTBalance: Retrieves the ATT balance of the user or the contract
 */
export const getATTBalance = async (
  provider,
  address,
  contract = false
) => {
  try {
    
    const tokenContract = new Contract(
        ATT_CONTRACT_ADDRESS,
        ATT_CONTRACT_ABI,
        signer
    );
    
    let tx = await tokenContract.approve
    if (contract) {
      const balance = await provider.getBalance(EXCHANGE_CONTRACT_ADDRESS);
      return balance;
    } else {
      const balance = await provider.getBalance(address);
      return balance;
    }
  } catch (err) {
    console.error(err);
    return 0;
  }
};