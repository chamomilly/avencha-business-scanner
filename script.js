const SUPABASE_URL = 'https://xtduanvxbgcnnwvkuiwp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0ZHVhbnZ4Ymdjbm53dmt1aXdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMzYzMDAsImV4cCI6MjA3NTcxMjMwMH0.ZRpcpe2Vg2AOrxsEkFxSCSKIYMZYwtvC8PFllNAnNMU';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentRedemptionData = null;

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

        // Get user name from profiles table
        let userName = 'Customer';
        try {
            const { data: profileData } = await supabase
                .from('profiles')
                .select('name')
                .eq('id', userId)
                .single();
            userName = profileData?.name || 'Customer';
        } catch (error) {
            // If we can't access user data, just use the user ID
            userName = `User: ${userId.substring(0, 8)}...`;
        }

        // Get map and step details
        const { data: mapData } = await supabase
            .from('adventure_maps')
            .select('name')
            .eq('id', mapId)
            .single();

        const { data: stepData } = await supabase
            .from('map_steps')
            .select('location')
            .eq('map_id', mapId)
            .eq('step_number', stepNumber)
            .single();

        // Get payment date
        const { data: purchaseData } = await supabase
            .from('user_map_purchases')
            .select('created_at')
            .eq('user_id', userId)
            .eq('map_id', mapId)
            .single();

        // Store redemption data
        currentRedemptionData = {
            userId,
            mapId,
            stepNumber,
            userName: userName,
            mapName: mapData?.name || 'Unknown Map',
            stepLocation: stepData?.location || 'Unknown Location',
            paymentDate: purchaseData?.created_at ? new Date(purchaseData.created_at).toLocaleDateString() : 'Unknown',
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
    if (currentRedemptionData.isAlreadyRedeemed) {
        button.style.display = 'none';
        disclaimer.style.display = 'none';
        showError('This inclusion has already been redeemed!');
    }

    // Set inclusion details (you may need to adjust based on your data structure)
    document.getElementById('inclusion-title').textContent = '1 drink'; // Default
    document.getElementById('inclusion-options').textContent = 'Choose from available options';

    document.getElementById('redemption-section').classList.remove('hidden');
}

async function processRedemption() {
    const button = document.getElementById('redeem-button');
    button.disabled = true;
    button.textContent = 'Processing...';

    try {
        const businessLocation = prompt('Enter your business location:') || 'Unknown Location';

        const { error } = await supabase
            .from('user_redemptions')
            .insert({
                user_id: currentRedemptionData.userId,
                map_id: currentRedemptionData.mapId,
                step_number: currentRedemptionData.stepNumber,
                inclusion_type: 'drink',
                inclusion_title: '1 drink',
                location: businessLocation,
                qr_code: `advencha://redeem?user=${currentRedemptionData.userId}&map=${currentRedemptionData.mapId}&step=${currentRedemptionData.stepNumber}`,
                created_at: new Date().toISOString()
            });

        if (error) throw error;

        // Update redemption date display
        document.getElementById('redemption-date').textContent = new Date().toLocaleDateString();
        showSuccess('Redemption processed successfully!');
        button.textContent = 'REDEEMED';

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
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('user');
    const mapId = urlParams.get('map');
    const stepNumber = urlParams.get('step');

    if (userId && mapId && stepNumber) {
        // Load redemption data directly from URL
        loadRedemptionData(userId, parseInt(mapId), parseInt(stepNumber));
    } else {
        // Show dummy data
        currentRedemptionData = {
            userId: '123',
            mapId: 1,
            stepNumber: 2,
            userName: 'John Doe',
            mapName: 'Downtown Food Tour',
            stepLocation: 'Main Street Cafe',
            paymentDate: new Date().toLocaleDateString()
        };
        displayRedemptionData();
    }
};