import { backend } from 'declarations/backend';
import { AuthClient } from '@dfinity/auth-client';
import { Principal } from '@dfinity/principal';

let authClient;
let principal;

async function init() {
    authClient = await AuthClient.create();
    if (await authClient.isAuthenticated()) {
        handleAuthenticated();
    }

    const loginButton = document.getElementById('login-button');
    loginButton.onclick = login;

    const logoutButton = document.getElementById('logout-button');
    logoutButton.onclick = logout;
}

async function login() {
    await authClient.login({
        identityProvider: "https://identity.ic0.app/#authorize",
        onSuccess: handleAuthenticated
    });
}

async function logout() {
    await authClient.logout();
    handleUnauthenticated();
}

async function handleAuthenticated() {
    principal = await authClient.getIdentity().getPrincipal();
    document.getElementById('principal-id').textContent = `Principal ID: ${principal.toString()}`;
    document.getElementById('login-button').style.display = 'none';
    document.getElementById('logout-button').style.display = 'inline-block';
    document.getElementById('merchant-info').style.display = 'block';
    document.getElementById('transaction-monitor').style.display = 'block';
    document.getElementById('payment-processor').style.display = 'block';

    document.getElementById('update-merchant').addEventListener('click', updateMerchant);
    document.getElementById('generate-qr').addEventListener('click', generateQRCode);
    await fetchMerchantInfo();
    startTransactionMonitor();
}

function handleUnauthenticated() {
    principal = null;
    document.getElementById('principal-id').textContent = '';
    document.getElementById('login-button').style.display = 'inline-block';
    document.getElementById('logout-button').style.display = 'none';
    document.getElementById('merchant-info').style.display = 'none';
    document.getElementById('transaction-monitor').style.display = 'none';
    document.getElementById('payment-processor').style.display = 'none';

    document.getElementById('merchant-details').innerHTML = '';
    document.getElementById('transaction-list').innerHTML = '';
    document.getElementById('qr-code').innerHTML = '';
}

async function fetchMerchantInfo() {
    try {
        const response = await backend.getMerchant();
        if (response.status === 200 && response.data) {
            displayMerchantInfo(response.data);
        } else {
            console.error('Error fetching merchant info:', response.error_text);
        }
    } catch (error) {
        console.error('Error fetching merchant info:', error);
    }
}

function displayMerchantInfo(merchant) {
    const merchantDetails = document.getElementById('merchant-details');
    merchantDetails.innerHTML = `
        <p><strong>Name:</strong> ${merchant.name}</p>
        <p><strong>Email:</strong> ${merchant.email_address}</p>
        <p><strong>Phone:</strong> ${merchant.phone_number}</p>
        <p><strong>Email Notifications:</strong> ${merchant.email_notifications ? 'Enabled' : 'Disabled'}</p>
        <p><strong>Phone Notifications:</strong> ${merchant.phone_notifications ? 'Enabled' : 'Disabled'}</p>
    `;
}

async function updateMerchant() {
    const name = prompt('Enter merchant name:');
    const email = prompt('Enter merchant email:');
    const phone = prompt('Enter merchant phone:');
    const emailNotifications = confirm('Enable email notifications?');
    const phoneNotifications = confirm('Enable phone notifications?');

    const updatedMerchant = {
        name,
        email_address: email,
        phone_number: phone,
        email_notifications: emailNotifications,
        phone_notifications: phoneNotifications
    };

    try {
        const response = await backend.updateMerchant(updatedMerchant);
        if (response.status === 200 && response.data) {
            displayMerchantInfo(response.data);
            alert('Merchant information updated successfully!');
        } else {
            console.error('Error updating merchant info:', response.error_text);
            alert('Failed to update merchant information. Please try again.');
        }
    } catch (error) {
        console.error('Error updating merchant info:', error);
        alert('An error occurred while updating merchant information.');
    }
}

function startTransactionMonitor() {
    setInterval(async () => {
        try {
            const logs = await backend.getLogs();
            displayTransactions(logs);
        } catch (error) {
            console.error('Error fetching transaction logs:', error);
        }
    }, 10000); // Check every 10 seconds
}

function displayTransactions(logs) {
    const transactionList = document.getElementById('transaction-list');
    transactionList.innerHTML = logs.map(log => `<p>${log}</p>`).join('');
}

function generateQRCode() {
    const amount = document.getElementById('payment-amount').value;
    if (!amount) {
        alert('Please enter a valid amount.');
        return;
    }

    // In a real application, you would generate a QR code here
    // For this example, we'll just display the amount
    const qrCode = document.getElementById('qr-code');
    qrCode.innerHTML = `<p>QR Code for ${amount} ckBTC payment would be generated here.</p>`;
}

init();
