import { ethers, BigNumber, providers, utils , Contract} from "ethers";
import Head from "next/head";
import React, { useEffect, useRef, useState } from "react";
import Web3Modal from "web3modal";
import styles from "../styles/Home.module.css";
import { ATT_CONTRACT_ABI, ATT_CONTRACT_ADDRESS , USDC_CONTRACT_ABI , USDC_CONTRACT_ADDRESS } from "../constants";
import WalletConnectProvider from "@walletconnect/web3-provider";
import CoinbaseWalletSDK from '@coinbase/wallet-sdk';

const toHex = (num) => {
  const val = Number(num);
  return "0x" + val.toString(16);
};

const providerOptions = {
  walletlink: {
    package: CoinbaseWalletSDK, // Required
    options: {
      appName: "Frigg ATT", // Required
      infuraId: "9aa3d95b3bc440fa88ea12eaa4456161" // Required unless you provide a JSON RPC url; see `rpc` below
    }
  },
  walletconnect: {
    package: WalletConnectProvider,
    options: {
      infuraId: "9aa3d95b3bc440fa88ea12eaa4456161" // from kewl-club
    }
  }
};

let web3Modal;

export default function Home() {
  /** General state variables */
  // loading is set to true when the transaction is mining and set to false when the transaction has mined
  const [loading, setLoading] = useState(false);
  // This variable is the `0` number in form of a BigNumber
  const zero = BigNumber.from(0);

  /** Variables to keep track of amount */
  // `attBalance` keeps track of the amount of ATT held by the user's account
  const [attBalance, setATTBalance] = useState(zero);

  // amount of the ATT that the user wants to buy
  const [purchaseATTAmount, setTokenAmount] = useState(zero)

  useEffect(() => {
    web3Modal = new Web3Modal({
      providerOptions,
      disableInjectedProvider: false,
      cacheProvider: false
    });
  }, []);

  const getProviderOrSigner = async (needSigner = false) => {
    // Connect to Metamask
    // Since we store `web3Modal` as a reference, we need to access the `current` value to get access to the underlying object
    const provider = await web3Modal.connect();
    const web3Provider = new providers.Web3Provider(provider);

    // If user is not connected to the Goerli network, let them know and throw an error
    const { chainId } = await web3Provider.getNetwork();
    if (chainId !== 5) {
      window.alert("Change the network to Goerli");
      throw new Error("Change network to Goerli");
    }

    if (needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }
    return web3Provider;
  };

  /**
   * getATTBalance: checks the balance of ATT held by an address
   */
   const getATTBalance = async () => {
    try {
      // Get the provider from web3Modal, which in our case is MetaMask
      // No need for the Signer here, as we are only reading state from the blockchain
      const provider = await getProviderOrSigner();
      // Create an instace of token contract
      const attContract = new Contract(
        ATT_CONTRACT_ADDRESS,
        ATT_CONTRACT_ABI,
        provider
      );
      // We will get the signer now to extract the address of the currently connected MetaMask account
      const signer = await getProviderOrSigner(true);
      // Get the address associated to the signer which is connected to  MetaMask
      const address = await signer.getAddress();
      // call the balanceOf from the token contract to get the number of tokens held by the user
      const balance = await attContract.balanceOf(address);
      // balance is already a big number, so we dont need to convert it before setting it
      setATTBalance(balance);
    } catch (err) {
      console.error(err);
      setATTBalance(zero);
    }
  };

  /**
   * buyATTWithUSDC: buy `amount` number of ATT to a given address with USDC transfer
   */
   const buyATTWithUSDC = async (purchaseATTAmount) => {
    try {
      // We need a Signer here since this is a 'write' transaction.
      const signer = await getProviderOrSigner(true);
      // Create an instance of attContract
      const attContract = new Contract(
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
        ATT_CONTRACT_ADDRESS,
        purchaseATTAmount * 1 * 10**6
      );

      await tx.wait();

      tx = await attContract.buyATTWithUSDC(purchaseATTAmount);
      const final_tx = await tx.wait();
      console.log(tx, final_tx)
      } catch (err) {
        console.error(err);
      };

      setLoading(true);
      window.alert("Sucessfully bought ATT tokens");
      await getATTBalance()
  };

  /**** END ****/

  /*
      connectWallet: Connects MetaMask wallet if present and otherwise prompts
      to connect to providers specified above via providerOptions
  */
  const [walletConnected, setWalletConnected] = useState(false);
  const connectWallet = async () => {
    try {
      // Get the provider from web3Modal, which in our case is MetaMask
      // When used for the first time, it prompts the user to connect their wallet
      console.log(web3Modal)
      const instance = await web3Modal.connect();
      const provider = new ethers.providers.Web3Provider(instance);
      const signer = provider.getSigner();
      const { chainId } = await provider.getNetwork();
      if (chainId !== 5) {
        try {
          await provider.provider.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: toHex(5) }]
          });
        } catch (switchError) {
          console.log(error)
        }
      }
      setWalletConnected(true);
    } catch (err) {
      console.error(err);
    }
  };

  // useEffects are used to react to changes in state of the website
  // The array at the end of function call represents what state changes will trigger this effect
  // In this case, whenever the value of `walletConnected` changes - this effect will be called
  useEffect(() => {
    // if wallet is not connected, create a new instance of Web3Modal and connect the MetaMask wallet
    if (!walletConnected) {
      // Assign the Web3Modal class to the reference object by setting it's `current` value
      // The `current` value is persisted throughout as long as this page is open
      connectWallet();
    }
  }, [walletConnected]);

  /*
      renderButton: Returns a button based on the state of the dapp
  */
  const renderButton = () => {
    // If wallet is not connected, return a button which allows them to connect their wllet
    if (!walletConnected) {
      return (
        <button onClick={connectWallet} className={styles.button}>
          Connect your wallet
        </button>
      );
    }
    //END OF WALLET CONNECTION LOGIC

    // If we are currently waiting for something, return a loading button
    if (loading) {
      return <button className={styles.button}>Loading...</button>;
    }

    // If user doesn't have any tokens to claim, show the mint button
    return (
      <div style={{ display: "flex-col" }}>
        <div>
          <input
            type="number"
            placeholder="Amount of Tokens"
            // BigNumber.from converts the `e.target.value` to a BigNumber
            onChange={(e) => setTokenAmount(BigNumber.from(e.target.value))}
            className={styles.input}
          />
        </div>

        <button
          className={styles.button}
          disabled={!(purchaseATTAmount > 0)}
          onClick={() => buyATTWithUSDC(purchaseATTAmount)}
        >
          buy ATT tokens with USDC
        </button>
      </div>
    );
  };

  return (
    <div>
      <Head>
        <title>ATT token issuance</title>
        <meta name="description" content="ICO-Dapp" />
        <link rel="icon" href="/friggCover.jpg" />
      </Head>
      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Welcome to ATT token issuance!</h1>
          <div className={styles.description}>
            You can buy ATT tokens with USDC here
          </div>
          {walletConnected ? (
            <div>
              <div className={styles.description}>
                {/* Format Ether helps us in converting a BigNumber to string */}
                You have  {setATTBalance} ATTs
              </div>
              <div className={styles.description}>
                {/* Format Ether helps us in converting a BigNumber to string */}
                Overall 10000 have been minted!!!
              </div>
              {renderButton()}
            </div>
          ) : (
            <button onClick={connectWallet} className={styles.button}>
              Connect your wallet
            </button>
          )}
        </div>
      </div>
      <footer className={styles.footer}>
        Made with &#10084; by Frigg.eco
      </footer>
    </div>
  );
}
