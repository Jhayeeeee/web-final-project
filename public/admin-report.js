const reportsGrid = document.getElementById('reportsGrid');
let reportedItems = [];

// --- MODAL HELPERS ---
function showToast(type, title, message) {
    const icons = {
        success: `<svg class="w-14 h-14 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
        error:   `<svg class="w-14 h-14 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
        warning: `<svg class="w-14 h-14 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>`,
    };
    document.getElementById('toastIcon').innerHTML = icons[type] || icons.warning;
    document.getElementById('toastTitle').textContent = title;
    document.getElementById('toastMessage').textContent = message;
    document.getElementById('toastModal').classList.remove('hidden');
}

function showConfirm(title, message, okLabel = 'Confirm', okClass = 'bg-red-600 hover:bg-red-700') {
    return new Promise((resolve) => {
        const modal = document.getElementById('confirmModal');
        const okBtn = document.getElementById('confirmOkBtn');
        const cancelBtn = document.getElementById('confirmCancelBtn');

        document.getElementById('confirmIcon').innerHTML = `<svg class="w-14 h-14 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>`;
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

// --- 1. USER AUTHENTICATION ---
const storedUser = JSON.parse(localStorage.getItem('user'));

if (!storedUser || storedUser.role !== 'admin') {
    alert("Unauthorized access. Please login as an admin.");
    window.location.href = 'index.html';
}

// --- 2. INITIALIZE PAGE (UI & DATA) ---
document.addEventListener('DOMContentLoaded', () => {
    // Wire up toast dismiss button
    const toastOkBtn = document.getElementById('toastOkBtn');
    if (toastOkBtn) toastOkBtn.addEventListener('click', () => {
        document.getElementById('toastModal').classList.add('hidden');
    });

    const adminNameDisplay = document.getElementById('adminNameDisplay');
    const adminInitials = document.getElementById('adminInitials');
    const logoutBtn = document.getElementById('logoutBtn');

    // Set Admin Name with robust fallback
    if (storedUser) {
        const displayName = storedUser.fullName || storedUser.name || storedUser.email || 'Admin';
        if (adminNameDisplay) adminNameDisplay.textContent = displayName;
        if (adminInitials) adminInitials.textContent = displayName.charAt(0).toUpperCase();
    }

    // Logout Button
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            window.location.href = 'index.html';
        });
    }

    loadReportedItems();
});

// --- 3. FETCH & DISPLAY REPORTED ITEMS ---
async function loadReportedItems() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch( API_BASE + '/api/items', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error("Failed to fetch items");

        const allItems = await response.json();
        reportedItems = allItems.filter(item => (item.reportCount || 0) > 0);
        displayReportedItems();
    } catch (error) {
        console.error("Error loading reports:", error);
        reportsGrid.innerHTML = `<p class="text-red-500 font-semibold col-span-full">Error connecting to server. Please check your backend.</p>`;
    }
}

function displayReportedItems() {
    reportsGrid.innerHTML = '';

    if (reportedItems.length === 0) {
        reportsGrid.innerHTML = `<p class="text-green-700 font-bold col-span-full py-8 text-center bg-green-50 rounded-xl border border-green-200">No reported items right now. All good!</p>`;
        return;
    }

    reportedItems.forEach(item => {
        // Kunin ang Account Name ng nag-post
        let posterName = 'Unknown User';
        if (item.reportedBy) {
            posterName = item.reportedBy.email || item.reportedBy.fullName || item.reportedBy.name || item.reportedBy;
        }

        // Author info para sa Ban button
        const author = (item.reportedBy && typeof item.reportedBy === 'object') ? item.reportedBy : null;
        const authorId = author ? author._id : null;
        const isBanned = author ? !!author.isBanned : false;

        // Image o Placeholder
        const imageContent = item.imageURL 
            ? `<img src="${item.imageURL}" class="w-full h-full object-cover">` 
            : `<div class="w-full h-full bg-[#2a2a2a] flex items-center justify-center text-neutral-400"><span class="text-sm">No image provided</span></div>`;

        // Badge color based on status
        let badgeStyle = 'bg-neutral-500';
        if (item.status === 'lost') badgeStyle = 'bg-red-600';
        if (item.status === 'found') badgeStyle = 'bg-green-600';
        if (item.status === 'claimed') badgeStyle = 'bg-green-600';
        
        const shortId = item._id ? '#' + item._id.substring(item._id.length - 4) : '';

        const cardHTML = `
            <div class="bg-white rounded-xl overflow-hidden border border-neutral-200 hover:border-neutral-300 shadow-sm flex flex-col relative transition">
                
                <div class="h-44 relative overflow-hidden bg-[#2a2a2a] flex items-center justify-center">
                    <span class="absolute top-3 right-3 z-10 ${badgeStyle} text-white text-[10px] font-bold px-2 py-1 rounded tracking-wide uppercase">${item.status}</span>
                    ${imageContent}
                </div>
                
                <div class="p-4 flex-grow flex flex-col">
                    <div class="flex justify-between items-start mb-2">
                        <h3 class="text-sm font-bold text-gray-900 truncate" title="${item.itemName}">${item.itemName}</h3>
                        <span class="text-xs text-gray-400">${shortId}</span>
                    </div>
                    
                    <div class="space-y-1.5 mb-4">
                        <p class="text-xs text-gray-500 flex items-center gap-1.5">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                            <span class="truncate">${posterName}</span>
                        </p>
                        <p class="text-xs text-gray-500 flex items-center gap-1.5">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                            ${item.incidentDate || 'No date'}
                        </p>
                        <p class="text-xs text-gray-500 flex items-center gap-1.5">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                            <span class="truncate">${item.location || 'Location not tagged'}</span>
                        </p>
                        
                        <div class="mt-2 inline-flex items-center gap-1 bg-red-50 text-red-600 px-2 py-0.5 rounded text-[10px] font-bold border border-red-100">
                            🚩 ${item.reportCount} Report(s)
                        </div>
                    </div>
                    
                    <div class="mt-auto flex gap-2 flex-wrap">
                        <button onclick="openDetailsModal('${item._id}')" class="px-3 py-1.5 bg-neutral-800 hover:bg-black text-white rounded-md text-xs font-bold transition flex items-center justify-center">View</button>
                        <button onclick="dismissReport('${item._id}')" class="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-md text-xs font-bold transition flex items-center justify-center border border-neutral-200">Dismiss</button>
                        ${authorId ? `
                        <button onclick="toggleBanUser('${authorId}', ${isBanned})" class="px-3 py-1.5 ${isBanned ? 'bg-green-50 hover:bg-green-100 text-green-700 border-green-200' : 'bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200'} rounded-md text-xs font-bold transition flex items-center justify-center border">
                            ${isBanned ? 'Unban' : 'Ban'}
                        </button>` : ''}
                        <button onclick="deleteAdminItem('${item._id}')" class="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-md text-xs font-bold transition flex items-center justify-center border border-red-100 ml-auto">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                    </div>
                </div>
            </div>
        `;
        reportsGrid.innerHTML += cardHTML;
    });
}

// --- 4. ACTIONS (DISMISS & DELETE) ---
async function dismissReport(itemId) {
    const confirmed = await showConfirm(
        'Dismiss Reports?',
        'This will clear all flags for this item and remove it from this list.',
        'Yes, Dismiss',
        'bg-yellow-500 hover:bg-yellow-600'
    );
    if (!confirmed) return;

    try {
        const token = localStorage.getItem('token');
        const response = await fetch( API_BASE + `/api/items/${itemId}/dismiss-report`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            showToast('success', 'Reports Dismissed', 'All flags have been cleared for this item.');
            setTimeout(() => {
                document.getElementById('toastModal').classList.add('hidden');
                loadReportedItems();
            }, 1500);
        } else {
            showToast('error', 'Action Failed', 'Failed to dismiss report. Session may have expired.');
        }
    } catch (error) {
        console.error('Error dismissing:', error);
        showToast('error', 'Connection Error', 'Cannot connect to the server.');
    }
}

async function deleteAdminItem(itemId) {
    const confirmed = await showConfirm(
        'Delete this Post?',
        'This action is permanent and cannot be undone. The post will be removed for everyone.',
        'Yes, Delete',
        'bg-red-600 hover:bg-red-700'
    );
    if (!confirmed) return;

    try {
        const token = localStorage.getItem('token');
        const response = await fetch( API_BASE + `/api/items/${itemId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            showToast('success', 'Post Deleted', 'The reported post has been permanently removed.');
            setTimeout(() => {
                document.getElementById('toastModal').classList.add('hidden');
                loadReportedItems();
            }, 1500);
        } else {
            showToast('error', 'Delete Failed', 'Failed to delete the post. Please try again.');
        }
    } catch (error) {
        console.error('Error deleting:', error);
        showToast('error', 'Connection Error', 'Cannot connect to the server.');
    }
}

// --- 4b. BAN / UNBAN POSTER ---
async function toggleBanUser(userId, isCurrentlyBanned) {
    const confirmed = await showConfirm(
        isCurrentlyBanned ? 'Unban this Account?' : 'Ban this Account?',
        isCurrentlyBanned
            ? 'This account will be able to log in again.'
            : 'This user will be blocked from logging in. Their existing posts will not be removed.',
        isCurrentlyBanned ? 'Yes, Unban' : 'Yes, Ban',
        isCurrentlyBanned ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-600 hover:bg-orange-700'
    );
    if (!confirmed) return;

    try {
        const token = localStorage.getItem('token');
        const response = await fetch( API_BASE + `/api/users/${userId}/ban`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json().catch(() => ({}));

        if (response.ok) {
            showToast('success', data.isBanned ? 'User Banned' : 'User Unbanned', data.message || 'Account status updated.');
            setTimeout(() => {
                document.getElementById('toastModal').classList.add('hidden');
                loadReportedItems();
            }, 1500);
        } else {
            showToast('error', 'Action Failed', data.message || 'Failed to update user status.');
        }
    } catch (error) {
        console.error('Error updating ban status:', error);
        showToast('error', 'Connection Error', 'Cannot connect to the server.');
    }
}

// --- 5. MODAL LOGIC (With Account Name) ---
function openDetailsModal(itemId) {
    const item = reportedItems.find(i => i._id === itemId);
    if (!item) return;

    const rawDate = item.incidentDate || item.createdAt || 'N/A';

    // Extract account name para sa modal
    let posterName = 'Unknown User';
    if (item.reportedBy) {
        posterName = item.reportedBy.email || item.reportedBy.fullName || item.reportedBy.name || item.reportedBy;
    }

    document.getElementById('detailsModalContent').innerHTML = `
        <div class="space-y-3">
            ${item.imageURL ? `<img src="${item.imageURL}" class="w-full h-48 object-cover rounded-lg mb-3 border">` : ''}
            <p><strong>Item Name:</strong> ${item.itemName}</p>
            <p><strong>Posted By:</strong> ${posterName} <span class="text-xs text-gray-400 bg-gray-100 px-1 py-0.5 rounded">(Author)</span></p>
            <p><strong>Description:</strong> ${item.description || 'No description provided.'}</p>
            <p><strong>Category:</strong> ${item.category || 'N/A'}</p>
            <p><strong>Status:</strong> <span class="uppercase font-semibold px-2 py-0.5 bg-neutral-100 rounded text-xs">${item.status}</span></p>
            <p><strong>Total Reports:</strong> <span class="text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded border border-red-100">${item.reportCount}</span></p>
            <p><strong>Date:</strong> ${rawDate}</p>
            <p><strong>Location:</strong> ${item.location || 'N/A'}</p>
            ${item.latitude && item.longitude ? `<p><strong>Coordinates:</strong> ${item.latitude}, ${item.longitude}</p>` : ''}
        </div>
    `;

    document.getElementById('detailsModal').classList.remove('hidden');
}

function closeDetailsModal() {
    document.getElementById('detailsModal').classList.add('hidden');
}