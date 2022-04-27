import { Contract } from "ethers";
import {
  ATT_CONTRACT_ABI,
  ATT_CONTRACT_ADDRESS,
  USDC_CONTRACT_ABI,
  USDC_CONTRACT_ADDRESS,
} from "../constants";

/**
 * getEtherBalance: Retrieves the ether balance of the user or the contract
 */
export const buyATTWithUSDC = async (
  signer,
  purchaseATTAmount
) => {
  try {
    
    const tokenContract = new Contract(
        ATT_CONTRACT_ADDRESS,
        ATT_CONTRACT_ABI,
        signer
    );

    const usdcContract = new Contract(
        USDC_CONTRACT_ADDRESS,
        USDC_CONTRACT_ABI,
        signer
    );
    
    let tx = await usdcContract.approve(
        USDC_CONTRACT_ADDRESS,
        purchaseATTAmount.toString()
    );
    
    await tx.wait();
    tx = await tokenContract.buyATTWithUSDC(purchaseATTAmount);
    await tx.wait();
    } catch (err) {
        console.error(err);
    };
}    