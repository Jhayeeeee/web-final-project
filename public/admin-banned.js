const bannedGrid = document.getElementById('bannedGrid');
const storedUser = JSON.parse(localStorage.getItem('user'));
let bannedList = [];

if (!storedUser || storedUser.role !== 'admin') {
    alert('Unauthorized access. Please login as an admin.');
    window.location.href = 'index.html';
}

// --- HTML ESCAPE ---
function escapeHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}

// --- MODAL HELPERS ---
function showToast(type, title, message) {
    const icons = {
        success: `<svg class="w-14 h-14 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
        error:   `<svg class="w-14 h-14 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`
    };
    document.getElementById('toastIcon').innerHTML = icons[type] || icons.error;
    document.getElementById('toastTitle').textContent = title;
    document.getElementById('toastMessage').textContent = message;
    document.getElementById('toastModal').classList.remove('hidden');
}

function showConfirm(title, message, okLabel = 'Confirm', okClass = 'bg-green-600 hover:bg-green-700') {
    return new Promise((resolve) => {
        const modal = document.getElementById('confirmModal');
        const okBtn = document.getElementById('confirmOkBtn');
        const cancelBtn = document.getElementById('confirmCancelBtn');

        document.getElementById('confirmIcon').innerHTML = `<svg class="w-14 h-14 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`;
        document.getElementById('confirmTitle').textContent = title;
        document.getElementById('confirmMessage').textContent = message;
        okBtn.textContent = okLabel;
        okBtn.className = `flex-1 py-2 ${okClass} text-white text-sm font-bold rounded-lg transition`;
        modal.classList.remove('hidden');

        const cleanup = (result) => {
            modal.classList.add('hidden');
            okBtn.removeEventListener('click', onOk);
            cancelBtn.removeEventListener('click', onCancel);
            resolve(result);
        };
        const onOk = () => cleanup(true);
        const onCancel = () => cleanup(false);

        okBtn.addEventListener('click', onOk);
        cancelBtn.addEventListener('click', onCancel);
    });
}

// --- INIT ---
document.addEventListener('DOMContentLoaded', () => {
    const toastOkBtn = document.getElementById('toastOkBtn');
    if (toastOkBtn) toastOkBtn.addEventListener('click', () => {
        document.getElementById('toastModal').classList.add('hidden');
    });

    const displayName = (storedUser && (storedUser.fullName || storedUser.email)) || 'Admin';
    document.getElementById('adminNameDisplay').textContent = displayName;
    document.getElementById('adminInitials').textContent = displayName.charAt(0).toUpperCase();

    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        window.location.href = 'index.html';
    });

    loadBannedUsers();
});

// --- LOAD BANNED ACCOUNTS ---
async function loadBannedUsers() {
    try {
        const response = await fetch(API_BASE + '/api/users', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (!response.ok) throw new Error(`Server responded with ${response.status}`);

        const users = await response.json();
        bannedList = users.filter(u => u.isBanned);
        displayBannedUsers();
    } catch (error) {
        console.error('Error loading banned accounts:', error);
        bannedGrid.innerHTML = `<p class="text-red-500 col-span-full">Error connecting to server.</p>`;
    }
}

function displayBannedUsers() {
    bannedGrid.innerHTML = '';

    if (bannedList.length === 0) {
        bannedGrid.innerHTML = `<p class="text-green-700 font-bold col-span-full py-8 text-center bg-green-50 rounded-xl border border-green-200">No banned accounts right now.</p>`;
        return;
    }

    bannedList.forEach(user => {
        bannedGrid.innerHTML += `
            <div class="bg-white rounded-xl border border-neutral-200 shadow-sm p-4 flex flex-col gap-3">
                <div class="min-w-0">
                    <h3 class="text-sm font-bold text-gray-900 truncate">${escapeHtml(user.fullName || 'No name')}</h3>
                    <p class="text-xs text-gray-500 truncate">${escapeHtml(user.email || 'No email')}</p>
                </div>
                <button onclick="unbanUser('${user._id}')" class="w-full py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg transition">Unban</button>
            </div>
        `;
    });
}

// --- UNBAN ---
// Ang ban route ay toggle. Dahil banned na ang mga nasa listahang ito, unban ang mangyayari.
async function unbanUser(userId) {
    const user = bannedList.find(u => u._id === userId);
    const label = user?.email || 'This account';

    const confirmed = await showConfirm(
        'Unban this Account?',
        `${label} will be able to log in again. Posts that were deleted will NOT be restored.`,
        'Yes, Unban',
        'bg-green-600 hover:bg-green-700'
    );
    if (!confirmed) return;

    try {
        const response = await fetch(API_BASE + `/api/users/${userId}/ban`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await response.json().catch(() => ({}));

        if (response.ok) {
            showToast('success', 'User Unbanned', data.message || 'Account can log in again.');
            setTimeout(() => {
                document.getElementById('toastModal').classList.add('hidden');
                loadBannedUsers();
            }, 1500);
        } else {
            showToast('error', 'Action Failed', data.message || 'Failed to unban this account.');
        }
    } catch (error) {
        console.error('Error unbanning:', error);
        showToast('error', 'Connection Error', 'Cannot connect to the server.');
    }
}