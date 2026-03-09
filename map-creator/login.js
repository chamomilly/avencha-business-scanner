var SUPABASE_URL = 'https://xtduanvxbgcnnwvkuiwp.supabase.co';
var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0ZHVhbnZ4Ymdjbm53dmt1aXdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMzYzMDAsImV4cCI6MjA3NTcxMjMwMH0.ZRpcpe2Vg2AOrxsEkFxSCSKIYMZYwtvC8PFllNAnNMU';

var supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const messageDiv = document.getElementById('message');

    if (!email || !password) {
        messageDiv.innerHTML = '<div class="error">Please enter email and password</div>';
        return;
    }

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) throw error;

        // Check if email is in admin_users table
        const { data: adminUser, error: adminError } = await supabase
            .from('admin_users')
            .select('email')
            .eq('email', email)
            .single();

        if (adminError || !adminUser) {
            await supabase.auth.signOut();
            messageDiv.innerHTML = '<div class="error">Access denied: You do not have permission to access this area</div>';
            return;
        }

        messageDiv.innerHTML = '<div class="success">Login successful! Redirecting...</div>';

        // Redirect to dashboard or map creator page
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1000);

    } catch (error) {
        messageDiv.innerHTML = `<div class="error">Login failed: ${error.message}</div>`;
    }
}

// Check if user is already logged in
window.onload = async function () {
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
        // Verify email is in admin_users table
        const { data: adminUser } = await supabase
            .from('admin_users')
            .select('email')
            .eq('email', session.user.email)
            .single();

        if (!adminUser) {
            await supabase.auth.signOut();
            return;
        }
        window.location.href = 'dashboard.html';
    }
};