import { Contract, providers, utils } from "ethers";
import Web3Modal from "web3modal";
import { abi, NFT_CONTRACT_ADDRESS } from "./constants";

export default class WalletController {
    constructor() {
        this.walletConnected = false;
        this.transactionInProgress = false;

        this.web3Modal = new Web3Modal({
            network: "Blast",
            cacheProvider: true,
            providerOptions: {},
        });

        this.errorMessage = document.getElementById('error-message');
    }

    /**
     * Update the error message on the page
     */
    updateErrorMessage(message) {
        this.errorMessage.innerText = message;
    }

    /**
     * this.setLoading: Set the transactionInProgress state
     */
    setLoading(bool) {
        this.transactionInProgress = bool;
    }
      
    /**
     * #setWalletConnected: Set the walletConnected state
     */
    #setWalletConnected(bool) {
        this.walletConnected = bool;
    }

    /**
     * connectWallet: Connects the MetaMask wallet
     */
    async connectWallet() {
        try {
            // Get the provider from web3Modal, which in our case is MetaMask
            // When used for the first time, it prompts the user to connect their wallet
            await this.#getProviderOrSigner();
            this.#setWalletConnected(true);
        } catch (err) {
            console.error(err);
            this.updateErrorMessage(err);
        }
    };

    /**
     * #getProviderOrSigner: Get the provider or signer object representing the Ethereum RPC
     */
    async #getProviderOrSigner(needSigner = false) {
        // Connect to Metamask
        // Since we store `web3Modal` as a reference, we need to access the `current` value to get access to the underlying object
        let provider = await this.web3Modal.connect();
        const web3Provider = new providers.Web3Provider(provider);
      
        // If user is not connected to the Mumbai network, let them know and throw an error
        const { chainId } = await web3Provider.getNetwork();

        // console.log(chainId)
        if (chainId !== 81457) {
            await this.#changeNetwork();
            // window.alert("Change the network to Mumbai");
            // throw new Error("Change network to Mumbai");
            console.warn('Connect to Blast!')
        }
      
        if (needSigner) {
            let signer = web3Provider.getSigner();
            return signer;
        }
        return web3Provider;
    };

    /**
     * #changeNetwork: Change the network to Blast Sepolia
     * Not using for now as broken
     */
    async #changeNetwork() {
        
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0x13E31' }], // 0xA066FD7 is the hexadecimal equivalent of 168587773
            });
        } catch (switchError) {
            if (switchError.code === 4902) {
                try {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [{
                            chainId: '81457',
                            chainName: 'Blast',
                            nativeCurrency: {
                                name: 'Ethereum',
                                symbol: 'ETH',
                                decimals: 18,
                            },
                            rpcUrls: ['https://blast.blockpi.network/v1/rpc/public'],
                            blockExplorerUrls: ['https://blastscan.io'],
                        }],
                    });
                } catch (addError) {
                    // handle "add" error
                    console.error('Unable to switch networks, please switch manually', addError)
                    this.updateErrorMessage('Unable to switch networks, please switch manually')
                }
            }
        }
    }

    async getTokensLeft() {
        try {
            // We need a Signer here since this is a 'write' transaction.
            let signer = await this.#getProviderOrSigner(true);
            // Create a new instance of the Contract with a Signer, which allows
            // update methods
            const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, signer);
            // call the mint function in the smart contract, payable amount 0.005 ETH
            const tokensLeft = await nftContract.getCurrent();
            return tokensLeft
        } catch (err) {
            console.error(err);
            return 0
        }
    }

    /**
     * Call the function claimTokens in the smart contract
     */
    async mint() {
        try {
            // We need a Signer here since this is a 'write' transaction.
            let signer = await this.#getProviderOrSigner(true);
            // Create a new instance of the Contract with a Signer, which allows
            // update methods
            const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, signer);
            // call the mint function in the smart contract, payable amount 0.005 ETH
            const tx = await nftContract.mint({ value: utils.parseEther('0.005') });
            this.setLoading(true);
            // wait for the transaction to get mined
            await tx.wait();
            this.setLoading(false);
            return true
        } catch (err) {
            console.error(err);
            this.updateErrorMessage(err.data.message);
            return false
        }
    }
}