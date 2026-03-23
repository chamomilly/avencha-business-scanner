var SUPABASE_URL = 'https://xtduanvxbgcnnwvkuiwp.supabase.co';
var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0ZHVhbnZ4Ymdjbm53dmt1aXdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMzYzMDAsImV4cCI6MjA3NTcxMjMwMH0.ZRpcpe2Vg2AOrxsEkFxSCSKIYMZYwtvC8PFllNAnNMU';

var supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let stepCount = 0;

// =======================
// STEPS
// =======================

function addStep() {
    stepCount++;
    const container = document.getElementById('stepsContainer');

    const stepDiv = document.createElement('div');
    stepDiv.className = 'step-container';
    stepDiv.id = `step-${stepCount}`;

    stepDiv.innerHTML = `
        <button onclick="removeStep(${stepCount})" class="remove-step-btn">Remove</button>
        <h4 style="color: #F7A829;">Step ${stepCount}</h4>

        <div class="form-group">
            <label>Location</label>
            <input type="text" id="step${stepCount}_location placeholder="Good Heavens Rooftop Bar">
        </div>

        <div class="form-group">
            <label>Opening Hours</label>
            <input type="text" id="step${stepCount}_openingHours" placeholder="10am - 5pm">
        </div>

        <div class="form-group">
            <label>Description</label>
            <textarea id="step${stepCount}_description" placeholder="Make sure to check both levels of the exhibition!"></textarea>
        </div>

        <div class="form-group">
            <label>Map URL</label>
            <input type="text" id="step${stepCount}_mapUrl" placeholder="lib/resources/images/heavensdoor/koorie_map.png">
        </div>

        <div class="form-group">
            <label>Latitude</label>
            <input type="number" step="any" id="step${stepCount}_latitude">
        </div>

        <div class="form-group">
            <label>Longitude</label>
            <input type="number" step="any" id="step${stepCount}_longitude">
        </div>

        <div class="form-group">
            <label>Notes</label>
            <textarea id="step${stepCount}_notes" placeholder="Entry is free, so just walk right in!"></textarea>
        </div>

        <div class="form-group">
            <label>Final Words</label>
            <input type="text" id="step${stepCount}_finalWords" placeholder="We hope you enjoyed Koorie Heritage Trust! It's a truly unique insight into Indigenous Culture in Australia. ">
        </div>

        <div class="form-group">
            <label>Inclusion Title</label>
            <input type="text" id="step${stepCount}_inclusionTitle" placeholder="1 Drink for each person">
        </div>

        <div class="form-group">
            <label>Inclusion Options</label>
            <input type="text" id="step${stepCount}_inclusionOptions" placeholder="Aperol Spritz, Limoncello Spritz, Red Wine, White Wine, Pint of Beer or Soft Drink">
        </div>

        <div class="form-group">
            <label>Inclusion Instructions</label>
            <textarea id="step${stepCount}_inclusionInstructions" placeholder="The staff will scan the QR Code above to verify and redeem your included drink"></textarea>
        </div>

        <div class="form-group">
            <label>Step Type</label>
            <select id="step${stepCount}_stepType" onchange="toggleStepTypeFields(${stepCount})">
                <option value="clue">Clue</option>
                <option value="wordsearch">Word Search</option>
                <option value="multipleChoice">Multiple Choice</option>
                <option value="cipher">Cipher</option>
            </select>
        </div>

        <div id="step${stepCount}_typeFields"></div>
    `;

    container.appendChild(stepDiv);
}

function removeStep(stepNum) {
    document.getElementById(`step-${stepNum}`)?.remove();
}

// =======================
// STEP TYPES
// =======================

function toggleStepTypeFields(stepNum) {
    const stepType = document.getElementById(`step${stepNum}_stepType`).value;
    const fieldsDiv = document.getElementById(`step${stepNum}_typeFields`);

    let html = '';

    if (stepType === 'clue') {
        html = `
            <div class="form-group">
                <label>Clues (one per line)</label>
                <textarea id="step${stepNum}_clueText" placeholder="Enter clues, one per line"></textarea>
            </div>
            <div class="form-group">
                <label>Answer</label>
                <input type="text" id="step${stepNum}_clueAnswer" placeholder="Correct answer">
            </div>
        `;
    } else if (stepType === 'wordsearch') {
        html = `
            <div class="form-group">
                <label>Clue</label>
                <input type="text" id="step${stepNum}_wsClue" placeholder="Word search clue">
            </div>
            <div class="form-group">
                <label>Answer</label>
                <input type="text" id="step${stepNum}_wsAnswer" placeholder="Correct answer">
            </div>
            <div class="form-group">
                <label>Hint</label>
                <input type="text" id="step${stepNum}_wsHint" placeholder="Hint">
            </div>
        `;
    } else if (stepType === 'multipleChoice') {
        html = `
            <div class="form-group">
                <label>Options (format: option|true/false, one per line)</label>
                <textarea id="step${stepNum}_mcOptions" placeholder="Option 1|true\nOption 2|false\nOption 3|false"></textarea>
            </div>
        `;
    } else if (stepType === 'cipher') {
        html = `
            <div class="form-group">
                <label>Cipher Text (one per line)</label>
                <textarea id="step${stepNum}_cipherText" placeholder="Enter cipher text, one per line"></textarea>
            </div>
            <div class="form-group">
                <label>Answer</label>
                <input type="text" id="step${stepNum}_cipherAnswer" placeholder="Correct answer">
            </div>
            <div class="form-group">
                <label>Hint</label>
                <input type="text" id="step${stepNum}_cipherHint" placeholder="Hint">
            </div>
        `;
    }

    fieldsDiv.innerHTML = html;
}

// =======================
// CREATE MAP
// =======================

async function createMap() {
    const messageDiv = document.getElementById('message');
    messageDiv.innerHTML = '';

    await supabase.rpc('begin_transaction');

    try {
        const mapData = {
            name: document.getElementById('name').value,
            number_of_attendees: document.getElementById('numberOfAttendees').value,
            cost: parseFloat(document.getElementById('cost').value) || 0,
            location: document.getElementById('location').value,
            description: document.getElementById('description').value,
            duration_hours: document.getElementById('durationHours').value,
            completion_hours: document.getElementById('completionHours').value,
            image_url: document.getElementById('imageUrl').value
        };

        const { data: map, error: mapError } = await supabase
            .from('adventure_maps')
            .insert(mapData)
            .select()
            .single();

        if (mapError) throw mapError;

        // =======================
        // MAP INCLUSIONS INSERT
        // =======================


        const inclusions = document.getElementById('inclusions').value
            .split(',')
            .map(i => i.trim())
            .filter(i => i);

        if (inclusions.length > 0) {
            await supabase.from('map_inclusions').insert(
                inclusions.map(i => ({
                    map_id: map.id,
                    inclusion: i
                }))
            );
        }

        // =======================
        // STEPS
        // =======================

        const steps = [];

        for (let i = 1; i <= stepCount; i++) {
            if (!document.getElementById(`step-${i}`)) continue;

            const stepType = document.getElementById(`step${i}_stepType`).value;
            const stepData = {
                map_id: map.id,
                step_number: i,
                location: document.getElementById(`step${i}_location`).value,
                opening_hours: document.getElementById(`step${i}_openingHours`).value,
                description: document.getElementById(`step${i}_description`).value,
                step_type: stepType,
                map_url: document.getElementById(`step${i}_mapUrl`).value,
                latitude: parseFloat(document.getElementById(`step${i}_latitude`).value) || 0,
                longitude: parseFloat(document.getElementById(`step${i}_longitude`).value) || 0,
                notes: document.getElementById(`step${i}_notes`).value,
                final_words: document.getElementById(`step${i}_finalWords`).value || null,
                inclusion_title: document.getElementById(`step${i}_inclusionTitle`).value || null,
                inclusion_options: document.getElementById(`step${i}_inclusionOptions`).value || null,
                inclusion_instructions: document.getElementById(`step${i}_inclusionInstructions`).value || null
            };

            // Add step-type specific data
            if (stepType === 'clue') {
                const clueTextEl = document.getElementById(`step${i}_clueText`);
                const clueAnswerEl = document.getElementById(`step${i}_clueAnswer`);
                if (clueTextEl && clueAnswerEl) {
                    const textList = clueTextEl.value.split('\n').filter(t => t.trim());
                    stepData.clues = JSON.stringify({
                        textList: textList,
                        answer: clueAnswerEl.value
                    });
                }
            } else if (stepType === 'wordsearch') {
                const wsClueEl = document.getElementById(`step${i}_wsClue`);
                const wsAnswerEl = document.getElementById(`step${i}_wsAnswer`);
                const wsHintEl = document.getElementById(`step${i}_wsHint`);
                if (wsClueEl && wsAnswerEl && wsHintEl) {
                    stepData.word_search = JSON.stringify({
                        clue: wsClueEl.value,
                        answer: wsAnswerEl.value,
                        hint: wsHintEl.value
                    });
                }
            }
            else if (stepType === 'multipleChoice') {
                const raw = document.getElementById(`step${i}_mcOptions`).value;

                const options = raw.split('\n')
                    .filter(o => o.trim())
                    .map((o, index) => {
                        const parts = o.split('|');

                        if (parts.length !== 2) {
                            throw new Error(`Invalid MC format on line ${index + 1}`);
                        }

                        return {
                            title: parts[0].trim(),
                            isCorrect: parts[1].trim().toLowerCase() === 'true'
                        };
                    });

                stepData.multiple_choice_options = JSON.stringify(options);
            }

            steps.push(stepData);
        }

        if (steps.length > 0) {
            const { error } = await supabase.from('map_steps').insert(steps);
            if (error) throw error;
        }

        await supabase.rpc('commit_transaction');

        messageDiv.innerHTML = '<div class="success">Map created successfully!</div>';
        setTimeout(() => location.reload(), 2000);
    } catch (error) {
        await supabase.rpc('rollback_transaction');
        messageDiv.innerHTML = error.message;
    }
}

// =======================
// AUTH
// =======================

window.onload = async function () {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        window.location.href = 'index.html';
        return;
    }

    // Verify email is in admin_users table
    const { data: adminUser } = await supabase
        .from('admin_users')
        .select('email')
        .eq('email', session.user.email)
        .single();

    if (!adminUser) {
        await supabase.auth.signOut();
        window.location.href = 'index.html';
    }
};