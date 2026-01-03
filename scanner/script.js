var SUPABASE_URL = 'https://xtduanvxbgcnnwvkuiwp.supabase.co';
var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0ZHVhbnZ4Ymdjbm53dmt1aXdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMzYzMDAsImV4cCI6MjA3NTcxMjMwMH0.ZRpcpe2Vg2AOrxsEkFxSCSKIYMZYwtvC8PFllNAnNMU';

var supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentRedemptionData = null;
let businessAuthenticated = false;

async function checkBusinessPassword() {
    const password = prompt('Enter business access code:');
    if (!password) return false;

    const { data } = await supabase
        .from('business_access')
        .select('business_name')
        .eq('access_code', password);

    if (data && data.length > 0) {
        businessAuthenticated = true;
        return true;
    } else {
        alert('Invalid access code');
        return false;
    }
}

async function loadRedemptionData(userId, mapId, stepNumber) {
    try {
        // Check if already redeemed
        const { data: existingRedemption } = await supabase
            .from('user_redemptions')
            .select('*')
            .eq('user_id', userId)
            .eq('map_id', mapId)
            .eq('step_number', stepNumber);

        let isAlreadyRedeemed = false;
        let redemptionDate = 'Not redeemed yet';

        if (existingRedemption && existingRedemption.length > 0) {
            isAlreadyRedeemed = true;
            redemptionDate = new Date(existingRedemption[0].created_at).toLocaleDateString();
        }

        /// get from profiles table
        let userName = 'Customer';
        try {
            const { data: profileData } = await supabase
                .from('profiles')
                .select('name')
                .eq('id', userId);

            userName = profileData?.[0]?.name || 'Customer';
        } catch (error) {
            // If we can't access profile data, just use the user ID
            userName = `User: ${userId.substring(0, 8)}...`;
        }

        // Get map and step details
        const { data: mapData } = await supabase
            .from('adventure_maps')
            .select('name')
            .eq('id', mapId);

        const { data: stepData } = await supabase
            .from('map_steps')
            .select('location, inclusion_title, inclusion_options, inclusion_instructions, substitutions')
            .eq('map_id', mapId)
            .eq('step_number', stepNumber);

        // Get payment date
        const { data: purchaseData, error: purchaseError } = await supabase
            .from('user_purchases')
            .select('purchase_date')
            .eq('user_id', userId.toString())
            .eq('map_id', parseInt(mapId));

        console.log('Purchase query result:', { purchaseData, purchaseError, userId: userId.toString(), mapId: parseInt(mapId) });
        console.log('URL Parameters:', { userId, mapId, stepNumber });

        // Store redemption data
        currentRedemptionData = {
            userId,
            mapId,
            stepNumber,
            userName: userName,
            mapName: mapData?.[0]?.name || 'Unknown Map',
            stepLocation: stepData?.[0]?.location || 'Unknown Location',
            inclusionTitle: stepData?.[0]?.inclusion_title || '',
            inclusionOptions: (stepData?.[0]?.inclusion_options || '').replace(/,/g, '<br>'),
            substitutions: stepData?.[0]?.substitutions || '',
            paymentDate: (purchaseData && purchaseData.length > 0 && purchaseData[0].purchase_date) ? new Date(purchaseData[0].purchase_date).toLocaleDateString() : 'Unknown',
            isAlreadyRedeemed,
            redemptionDate
        };

        // Show redemption interface
        displayRedemptionData();

    } catch (error) {
        showError('Error loading redemption data: ' + error.message);
    }
}

function displayRedemptionData() {
    document.getElementById('user-id').textContent = currentRedemptionData.userName;
    document.getElementById('step-location').textContent = currentRedemptionData.stepLocation;
    document.getElementById('payment-date').textContent = currentRedemptionData.paymentDate;
    document.getElementById('redemption-date').textContent = currentRedemptionData.redemptionDate;

    // Hide button if already redeemed
    const button = document.getElementById('redeem-button');
    const disclaimer = document.getElementById('disclaimer');
    const redeemedCard = document.getElementById('redeemed-card');
    if (currentRedemptionData.isAlreadyRedeemed) {
        button.style.display = 'none';
        disclaimer.style.display = 'none';
        redeemedCard.style.display = 'block';
    }

    // Set inclusion details from database
    document.getElementById('inclusion-title').textContent = currentRedemptionData.inclusionTitle;
    document.getElementById('inclusion-options').innerHTML = currentRedemptionData.inclusionOptions;
    document.getElementById('substitutions').textContent = currentRedemptionData.substitutions;

    document.getElementById('redemption-section').classList.remove('hidden');
}

async function processRedemption() {
    if (!businessAuthenticated) {
        const authenticated = await checkBusinessPassword();
        if (!authenticated) return;
    }

    const button = document.getElementById('redeem-button');
    button.disabled = true;
    button.textContent = 'Processing...';

    try {
        const { error } = await supabase
            .from('user_redemptions')
            .insert({
                user_id: currentRedemptionData.userId,
                map_id: currentRedemptionData.mapId,
                step_number: currentRedemptionData.stepNumber,
                inclusion_type: currentRedemptionData.inclusionOptions,
                inclusion_title: currentRedemptionData.inclusionTitle,
                location: currentRedemptionData.stepLocation,
                qr_code: `avencha://redeem?user=${currentRedemptionData.userId}&map=${currentRedemptionData.mapId}&step=${currentRedemptionData.stepNumber}`,
                created_at: new Date().toISOString()
            });

        if (error) throw error;

        // Update redemption date display and show redeemed card
        document.getElementById('redemption-date').textContent = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' });
        document.getElementById('redeemed-card').style.display = 'block';
        button.style.display = 'none';
        document.getElementById('disclaimer').style.display = 'none';
    } catch (error) {
        showError('Error processing redemption: ' + error.message);
        button.disabled = false;
        button.textContent = 'TRY AGAIN';
    }
}

function showSuccess(message) {
    document.getElementById('status-message').innerHTML = `<div class="success">${message}</div>`;
}

function showError(message) {
    document.getElementById('status-message').innerHTML = `<div class="error">${message}</div>`;
}

// Auto-load redemption data from URL parameters or show dummy data
window.onload = function () {
    // Set version from config
    document.getElementById('version').textContent = `v${CONFIG.VERSION}`;
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('user');
    const mapId = urlParams.get('map');
    const stepNumber = urlParams.get('step');

    if (userId && mapId && stepNumber) {
        // Load redemption data directly from URL
        loadRedemptionData(userId, mapId, parseInt(stepNumber));
    } else {
        // Show QR scan message
        document.querySelector('.container').innerHTML = '<img src="resources/logo.svg"><h2>Use your camera to scan a QR code to get started</h2>';
        document.getElementById('version').textContent = `v${CONFIG.VERSION}`;
    }
};