// --- DIAGNOSTIC: Check if ethers is defined immediately ---
console.log("pay_now.js loaded. Checking if 'ethers' is defined:", typeof ethers);
// If this logs "undefined", the problem is with ethers.js loading.

// --- Configuration ---
// IMPORTANT: Replace with your deployed contract address and ABI
const CONTRACT_ADDRESS = '0x0EDAC9bD34906720b41164232fe6cBd978a7b667'; // e.g., '0xAbc123...'
const CONTRACT_ABI = [ // This is a minimal ABI for receiving Ether and getting balance
    [
	{
		"inputs": [],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "payer",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "PaymentReceived",
		"type": "event"
	},
	{
		"inputs": [],
		"name": "withdraw",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"stateMutability": "payable",
		"type": "receive"
	},
	{
		"inputs": [],
		"name": "getBalance",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "owner",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
]
];

// Amount to pay in Ether (e.g., 0.01 Ether). This will be fetched from localStorage.
let PAYMENT_AMOUNT_ETH = '0.001'; // Default value, will be updated

// --- DOM Elements ---
let metaMaskStatus;
let accountAddress;
let networkStatus;
let paymentAmountDisplay;
let connectMetaMaskBtn;
let payWithEthBtn;
let transactionStatus;
let transactionHash;

// --- Ethers.js Variables ---
let provider;
let signer;
let contract;
let currentAccount = null;

// --- Functions ---

/**
 * Fetches the payment amount from localStorage (from the booked appointment)
 * and displays it.
 */
function loadPaymentAmount() {
    const appointmentData = JSON.parse(localStorage.getItem("appointmentData"));
    if (appointmentData && appointmentData.doctor && appointmentData.doctor.price) {
        PAYMENT_AMOUNT_ETH = (appointmentData.doctor.price * 0.0001).toFixed(4); // Example conversion
        paymentAmountDisplay.textContent = `Payment Amount: ${PAYMENT_AMOUNT_ETH} ETH (for ₹${appointmentData.doctor.price})`;
    } else {
        paymentAmountDisplay.textContent = `Payment Amount: ${PAYMENT_AMOUNT_ETH} ETH (Default)`;
    }
}

/**
 * Checks if MetaMask is installed and updates UI.
 */
function checkMetaMaskAvailability() {
    if (typeof window.ethereum !== 'undefined') {
        metaMaskStatus.textContent = 'MetaMask is installed!';
        metaMaskStatus.style.color = 'green';
        connectMetaMaskBtn.disabled = false;
    } else {
        metaMaskStatus.textContent = 'MetaMask is not installed. Please install it to use this feature.';
        metaMaskStatus.style.color = 'red';
        connectMetaMaskBtn.disabled = true;
        payWithEthBtn.disabled = true;
    }
}

/**
 * Connects to MetaMask and sets up the provider and signer.
 */
async function connectMetaMask() {
    try {
        if (!window.ethereum) {
            transactionStatus.textContent = 'MetaMask is not installed.';
            transactionStatus.style.color = 'red';
            return;
        }

        // Request account access
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        currentAccount = accounts[0];
        accountAddress.textContent = `Account: ${currentAccount.substring(0, 6)}...${currentAccount.substring(currentAccount.length - 4)}`;
        accountAddress.style.color = 'blue';

        // Initialize ethers provider and signer
        // This is the line that would fail if 'ethers' is not defined
        provider = new ethers.providers.Web3Provider(window.ethereum);
        signer = provider.getSigner();

        // Get network details
        const network = await provider.getNetwork();
        networkStatus.textContent = `Network: ${network.name} (Chain ID: ${network.chainId})`;
        networkStatus.style.color = 'blue';

        // Initialize contract instance
        if (CONTRACT_ADDRESS === 'YOUR_DEPLOYED_CONTRACT_ADDRESS' || CONTRACT_ABI.length === 0) {
            transactionStatus.textContent = 'ERROR: Please update CONTRACT_ADDRESS and CONTRACT_ABI in pay_now.js!';
            transactionStatus.style.color = 'red';
            payWithEthBtn.disabled = true;
            return;
        }
        contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

        payWithEthBtn.disabled = false;
        transactionStatus.textContent = 'MetaMask connected successfully!';
        transactionStatus.style.color = 'green';

    } catch (error) {
        console.error("Error connecting to MetaMask:", error);
        transactionStatus.textContent = `Error connecting: ${error.message || error.code}`;
        transactionStatus.style.color = 'red';
        currentAccount = null;
        accountAddress.textContent = 'Account: Not Connected';
        networkStatus.textContent = 'Network: Not Connected';
        payWithEthBtn.disabled = true;
    }
}

/**
 * Handles the payment transaction to the smart contract.
 */
async function payWithEther() {
    if (!signer || !contract) {
        transactionStatus.textContent = 'Please connect MetaMask first.';
        transactionStatus.style.color = 'red';
        return;
    }

    transactionStatus.textContent = 'Initiating payment... Please confirm in MetaMask.';
    transactionStatus.style.color = 'orange';
    transactionHash.textContent = ''; // Clear previous hash

    try {
        // Convert Ether amount to Wei (smallest unit of Ether)
        const amountInWei = ethers.utils.parseEther(PAYMENT_AMOUNT_ETH);

        // Send transaction to the contract's receive() function
        const tx = await signer.sendTransaction({
            to: contract.address, // Send to the contract address
            value: amountInWei,   // The amount of Ether to send
        });

        transactionStatus.textContent = `Transaction sent! Waiting for confirmation...`;
        transactionStatus.style.color = 'blue';
        transactionHash.textContent = `Hash: ${tx.hash.substring(0, 10)}...${tx.hash.substring(tx.hash.length - 8)}`;
        console.log("Transaction sent:", tx);

        // Wait for the transaction to be mined
        const receipt = await tx.wait();
        console.log("Transaction confirmed:", receipt);

        transactionStatus.textContent = `Payment successful! Transaction confirmed.`;
        transactionStatus.style.color = 'green';
        transactionHash.innerHTML = `Hash: <a href="https://sepolia.etherscan.io/tx/${receipt.transactionHash}" target="_blank">${receipt.transactionHash.substring(0, 10)}...${receipt.transactionHash.substring(receipt.transactionHash.length - 8)}</a> (View on Etherscan)`;

        // Clear appointment data from local storage after successful payment
        localStorage.removeItem("appointmentData");
        localStorage.removeItem("currentAppointmentId");


    } catch (error) {
        console.error("Error during payment:", error);
        if (error.code === 4001) { // User rejected transaction
            transactionStatus.textContent = 'Transaction rejected by user.';
        } else {
            transactionStatus.textContent = `Payment failed: ${error.message || error.code}`;
        }
        transactionStatus.style.color = 'red';
        transactionHash.textContent = '';
    }
}

// --- Initial Setup (wrapped in DOMContentLoaded) ---
document.addEventListener('DOMContentLoaded', () => {
    // Initialize DOM elements here, after the DOM is fully loaded
    metaMaskStatus = document.getElementById('metaMaskStatus');
    accountAddress = document.getElementById('accountAddress');
    networkStatus = document.getElementById('networkStatus');
    paymentAmountDisplay = document.getElementById('paymentAmount');
    connectMetaMaskBtn = document.getElementById('connectMetaMaskBtn');
    payWithEthBtn = document.getElementById('payWithEthBtn');
    transactionStatus = document.getElementById('transactionStatus');
    transactionHash = document.getElementById('transactionHash');

    loadPaymentAmount();
    checkMetaMaskAvailability();
    // Re-connect MetaMask if already authorized on page load
    if (typeof window.ethereum !== 'undefined' && window.ethereum.selectedAddress) {
        connectMetaMask();
    }

    // --- Event Listeners ---
    connectMetaMaskBtn.addEventListener('click', connectMetaMask);
    payWithEthBtn.addEventListener('click', payWithEther);

    // Listen for MetaMask account changes
    if (typeof window.ethereum !== 'undefined') {
        window.ethereum.on('accountsChanged', (accounts) => {
            if (accounts.length > 0) {
                currentAccount = accounts[0];
                accountAddress.textContent = `Account: ${currentAccount.substring(0, 6)}...${currentAccount.substring(currentAccount.length - 4)}`;
                transactionStatus.textContent = 'Account changed. Ready to pay.';
                payWithEthBtn.disabled = false;
            } else {
                // User disconnected all accounts
                currentAccount = null;
                accountAddress.textContent = 'Account: Not Connected';
                networkStatus.textContent = 'Network: Not Connected';
                transactionStatus.textContent = 'MetaMask disconnected.';
                transactionStatus.style.color = 'orange';
                payWithEthBtn.disabled = true;
            }
        });

        // Listen for MetaMask network changes
        window.ethereum.on('chainChanged', (chainId) => {
            window.location.reload();
        });
    }
});
