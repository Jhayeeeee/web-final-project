// --- VARIABLES & SESSION CHECK ---
const storedUser = JSON.parse(localStorage.getItem('user'));
const token = localStorage.getItem('token');

if (!storedUser || !token) {
    alert("Session expired. Please login again.");
    window.location.href = 'index.html';
}

// --- LOAD USER INFO TO UI ---
document.addEventListener('DOMContentLoaded', () => {
    // Navbar name
    const navUserName = document.getElementById('navUserName');
    if (navUserName) navUserName.textContent = storedUser.fullName || storedUser.name;

    // Profile Details
    const profileName = document.getElementById('profileName');
    const profileEmail = document.getElementById('profileEmail');
    
    if (profileName) profileName.textContent = storedUser.fullName || storedUser.name;
    if (profileEmail) profileEmail.textContent = storedUser.email;

    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            window.location.href = 'index.html';
        });
    }
});

// --- CHANGE PASSWORD LOGIC ---
const changePasswordForm = document.getElementById('changePasswordForm');
const passwordMessage = document.getElementById('passwordMessage');
const updatePasswordBtn = document.getElementById('updatePasswordBtn');

if (changePasswordForm) {
    changePasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Pipigilan ang page na mag-refresh
        
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // reset message box
        passwordMessage.className = 'text-sm font-medium mt-2';
        
        // 1. Validation: Match ba ang dalawang bagong password?
        if (newPassword !== confirmPassword) {
            passwordMessage.textContent = "New passwords do not match!";
            passwordMessage.classList.add('text-red-600');
            return;
        }

        updatePasswordBtn.textContent = 'Updating...';
        updatePasswordBtn.disabled = true;

        try {
            // 2. Ipadala sa Backend gamit ang Fetch API
            const response = await fetch('http://localhost:3000/api/users/change-password', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    currentPassword: currentPassword,
                    newPassword: newPassword
                })
            });

            const data = await response.json();

            if (response.ok) {
                passwordMessage.textContent = "Password updated successfully!";
                passwordMessage.classList.add('text-green-600');
                changePasswordForm.reset(); // Lilinisin ang form

                setTimeout(() => {
                    window.location.href = 'profile.html';
            }, 1000);
            } else {
                passwordMessage.textContent = data.message || "Failed to update password.";
                passwordMessage.classList.add('text-red-600');
            }
        } catch (error) {
            console.error('Error updating password:', error);
            passwordMessage.textContent = "Server error. Cannot connect to backend.";
            passwordMessage.classList.add('text-red-600');
        } finally {
            updatePasswordBtn.textContent = 'Update Password';
            updatePasswordBtn.disabled = false;
        }
    });
}