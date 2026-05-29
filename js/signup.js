document.getElementById('signupForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const displayName = document.getElementById('display_name').value.trim();
    const confirmPassword = document.getElementById('confirm_password').value;
    const errorMessage = document.getElementById('errorMessage');
    const submitBtn = document.getElementById('submitBtn');
    
    if (password !== confirmPassword) {
        errorMessage.textContent = 'Passwords do not match.';
        errorMessage.style.display = 'block';
        return;
    }
    
    errorMessage.style.display = 'none';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Signing up...';
    
    try {
        const response = await KatakitaAPI.request('signup', {
            username: username,
            password: password,
            display_name: displayName
        });
        
        // Handling the Apps Script response.
        const data = response;
        
        if (data.result === 'success') {
            // Set initial local storage values to maintain the existing app state functionality
            localStorage.setItem('katakita_user', username);
            localStorage.setItem('katakita_display_name', displayName || 'Anonymous');
            localStorage.setItem('katakita_points', '0');
            localStorage.setItem('katakita_theme', 'light');
            localStorage.setItem('katakita_language', 'id');
            
            // Smooth transition
            document.querySelector('.form-side').style.opacity = '0';
            document.querySelector('.form-side').style.transform = 'translateX(20px)';

            setTimeout(() => {
                window.location.href = 'myspace.html';
            }, 400);
        } else {
            errorMessage.textContent = data.message || 'Error creating account.';
            errorMessage.style.display = 'block';
            submitBtn.disabled = false;
            submitBtn.textContent = 'Sign Up';
        }
    } catch (error) {
        console.error('Error!', error);
        errorMessage.textContent = 'Network error. Make sure your Apps Script Web App is deployed and accessible to "Anyone".';
        errorMessage.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign Up';
    }
});
