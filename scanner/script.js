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
                qr_code: `advencha://redeem?user=${currentRedemptionData.userId}&map=${currentRedemptionData.mapId}&step=${currentRedemptionData.stepNumber}`,
                created_at: new Date().toISOString()
            });

        if (error) throw error;

        // Update redemption date display and show redeemed card
        document.getElementById('redemption-date').textContent = new Date().toLocaleDateString();
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

async function startCamera() {
    try {
        const video = document.getElementById('camera');
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        video.srcObject = stream;
        video.style.display = 'block';
        video.play();
        
        document.querySelector('h2').textContent = 'Point camera at QR code';
        
        // Start QR code scanning
        scanQRCode(video);
    } catch (error) {
        alert('Camera access denied or not available');
    }
}

function scanQRCode(video) {
    const canvas = document.getElementById('canvas');
    const context = canvas.getContext('2d');
    
    function tick() {
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
            canvas.height = video.videoHeight;
            canvas.width = video.videoWidth;
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height);
            
            if (code) {
                handleScannedUrl(code.data);
                return;
            }
        }
        requestAnimationFrame(tick);
    }
    tick();
}

function handleScannedUrl(scannedUrl) {
    try {
        const url = new URL(scannedUrl);
        const userId = url.searchParams.get('user');
        const mapId = url.searchParams.get('map');
        const stepNumber = url.searchParams.get('step');
        
        if (userId && mapId && stepNumber) {
            // Stop camera
            const video = document.getElementById('camera');
            if (video.srcObject) {
                video.srcObject.getTracks().forEach(track => track.stop());
            }
            
            // Restore original HTML structure
            document.querySelector('.container').innerHTML = `
                <img src="resources/logo.svg">
                <div id="redemption-section">
                    <div class="redemption-card">
                        <h2><span id="step-location"></span></h2>
                        <div class="user-info">
                            <p>Participant Name <span class="details" id="user-id"></span></p>
                            <p>Payment Date <span class="details" id="payment-date"></span></p>
                        </div>
                        <div class="inclusion-info">
                            <p>Included, For Each Paid Participant <span class="details" id="inclusion-title"></span></p>
                            <p>Options to choose from<span class="details" id="inclusion-options"></span></p>
                            <p>If sold out or dietary issues <span class="details" id="substitutions"></span></p>
                        </div>
                        <div id="status-message"></div>
                        <div id="redeemed-card">
                            <img src="resources/redeemed_icon.svg"><span>REDEEMED</span>
                            <p><span class="details" id="redemption-date"></span></p>
                        </div>
                        <h3 id="disclaimer">Do not select redeem unless you are the venue. Doing so will result in not being able to claim your reward.</h3>
                        <button class="redeem-btn" onclick="processRedemption()" id="redeem-button">REDEEM ORDER</button>
                    </div>
                </div>
            `;
            
            // Load redemption data
            loadRedemptionData(userId, mapId, parseInt(stepNumber));
        } else {
            alert('Invalid QR code format');
        }
    } catch (error) {
        alert('Invalid URL in QR code');
    }
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
        // Show QR scan message with camera button
        document.querySelector('.container').innerHTML = `
            <img src="resources/logo.svg">
            <h2>Use your camera to scan a QR code to get started</h2>
            <button class="redeem-btn" onclick="startCamera()">OPEN CAMERA</button>
            <video id="camera" style="width: 100%; max-width: 400px; display: none;"></video>
            <canvas id="canvas" style="display: none;"></canvas>
        `;
        document.getElementById('version').textContent = `v${CONFIG.VERSION}`;
    }
};