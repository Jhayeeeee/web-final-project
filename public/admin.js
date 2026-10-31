const adminInventoryGrid = document.getElementById('adminInventoryGrid');
const searchInput = document.getElementById('adminSearch');
const storedUser = JSON.parse(localStorage.getItem('user'))
searchInput.addEventListener('input', applyFilters);
document.addEventListener('DOMContentLoaded', loadAdminInventory);

// Kick out non-admins or logged out users
if (!storedUser || storedUser.role !== 'admin') {
    alert("Unauthorized access. Please login as an admin.");
    window.location.href = 'index.html';
}

// Update UI and setup Logout
document.addEventListener('DOMContentLoaded', () => {
    const adminNameDisplay = document.getElementById('adminNameDisplay');
    const adminInitials = document.getElementById('adminInitials');
    const logoutBtn = document.getElementById('logoutBtn');
    
    // Set admin name dynamically
    if (storedUser && storedUser.fullName) {
        if(adminNameDisplay) adminNameDisplay.textContent = storedUser.fullName;
        if(adminInitials) adminInitials.textContent = storedUser.fullName.charAt(0).toUpperCase();
    }
    
    // Logout button functionality
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('user');
            window.location.href = 'index.html';
        });
    }
    
    // Load the items after UI is set
    loadAdminInventory();
});

let allSystemItems = [];
let currentFilter = 'all';

async function loadAdminInventory() {
    try {
        const response = await fetch(API_BASE +'/api/items');
        allSystemItems = await response.json();
        updateDashboard();
    } catch (error) {
        console.error("Error loading inventory:", error);
        adminInventoryGrid.innerHTML = `<p class="text-red-500">Error connecting to server.</p>`;
    }
}

function updateDashboard() {
    updateStats();
    renderFilters();
    applyFilters();
}

function updateStats() {
    document.getElementById('statTotal').textContent = allSystemItems.length;
    document.getElementById('statAdmin').textContent = allSystemItems.filter(i => i.status === 'surrendered').length;
    document.getElementById('statClaimed').textContent = allSystemItems.filter(i => i.status === 'claimed').length;
}

function renderFilters() {
    const filterContainer = document.getElementById('filterContainer');
    const counts = {
        all: allSystemItems.length,
        lost: allSystemItems.filter(i => i.status === 'lost').length,
        found: allSystemItems.filter(i => i.status === 'found').length,
        surrendered: allSystemItems.filter(i => i.status === 'surrendered').length,
        claimed: allSystemItems.filter(i => i.status === 'claimed').length
    };

    const filters = [
        { id: 'all', label: 'All Items', dot: '', countBg: 'bg-black text-white' },
        { id: 'lost', label: 'Lost', dot: 'bg-red-500', countBg: 'bg-neutral-200 text-neutral-700' },
        { id: 'found', label: 'Found', dot: 'bg-blue-500', countBg: 'bg-neutral-200 text-neutral-700' },
        { id: 'surrendered', label: 'At Admin', dot: 'bg-orange-500', countBg: 'bg-neutral-200 text-neutral-700' },
        { id: 'claimed', label: 'Claimed', dot: 'bg-green-500', countBg: 'bg-neutral-200 text-neutral-700' }
    ];

    filterContainer.innerHTML = filters.map(f => `
        <button onclick="setFilter('${f.id}')" class="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition shrink-0 ${currentFilter === f.id ? 'bg-neutral-100 border border-neutral-200 shadow-sm' : 'text-neutral-600 hover:bg-neutral-50'}">
            ${f.dot ? `<span class="w-2 h-2 rounded-full ${f.dot}"></span>` : ''}
            ${f.label} 
            <span class="px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs ${currentFilter === f.id ? 'bg-neutral-200 text-neutral-800' : f.countBg}">${counts[f.id]}</span>
        </button>
    `).join('');
}

function setFilter(status) {
    currentFilter = status;
    renderFilters();
    applyFilters();
}

function applyFilters() {
    const searchTerm = searchInput.value.toLowerCase();
    
    let filtered = allSystemItems;
    if (currentFilter !== 'all') {
        filtered = filtered.filter(item => item.status === currentFilter);
    }
    
    if (searchTerm) {
        filtered = filtered.filter(item => 
            item.itemName.toLowerCase().includes(searchTerm) || 
            item.location.toLowerCase().includes(searchTerm) ||
            (item.reportedBy?.email && item.reportedBy.email.toLowerCase().includes(searchTerm))
        );
    }
    
    displayAdminItems(filtered);
}

function displayAdminItems(items) {
    adminInventoryGrid.innerHTML = ''; 

    if (items.length === 0) {
        adminInventoryGrid.innerHTML = `<p class="text-neutral-500 col-span-full py-8">No items match your criteria.</p>`;
        return;
    }

    items.forEach(item => {
        const imageContent = item.imageURL 
            ? `<img src="${API_BASE}${item.imageURL}" alt="${item.itemName}" class="w-full h-full object-cover">`
            : `<div class="w-full h-full bg-[#3a3a3a] flex flex-col items-center justify-center text-neutral-400" style="background-image: repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.1) 10px, rgba(0,0,0,0.1) 20px);">
                <span class="text-xs font-semibold tracking-wide">No image provided</span>
               </div>`;

        let badgeStyle = 'bg-neutral-600 text-white';
        let claimButtonHTML = '';

        if (item.status === 'lost') {
            badgeStyle = 'bg-red-600 text-white';
            claimButtonHTML = `<button disabled class="w-full py-2 bg-red-50 text-red-300 border border-red-100 text-xs font-bold rounded-lg cursor-not-allowed flex items-center justify-center gap-1">Still Missing</button>`;
        } else if (item.status === 'found') {
            badgeStyle = 'bg-green-600 text-white';
            claimButtonHTML = `<button onclick="markAsClaimed('${item._id}')" class="w-full py-2 bg-black hover:bg-gray-800 text-white text-xs font-bold rounded-lg transition flex items-center justify-center gap-1">✓ Mark claimed</button>`;
        } else if (item.status === 'surrendered') {
            badgeStyle = 'bg-orange-500 text-white';
            claimButtonHTML = `<button onclick="markAsClaimed('${item._id}')" class="w-full py-2 bg-black hover:bg-gray-800 text-white text-xs font-bold rounded-lg transition flex items-center justify-center gap-1">✓ Mark claimed</button>`;
        } else if (item.status === 'claimed') {
            badgeStyle = 'bg-green-600 text-white';
            claimButtonHTML = `<button disabled class="w-full py-2 bg-neutral-200 text-neutral-500 text-xs font-bold rounded-lg cursor-not-allowed flex items-center justify-center gap-1">Already Claimed</button>`;
        }

        const displayId = item._id.substring(item._id.length - 4);

        let deleteButtonHTML = '';
        if (item.status === 'lost') {
            deleteButtonHTML = `<button disabled class="px-3 py-2 bg-neutral-100 text-neutral-300 rounded-lg cursor-not-allowed">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            </button>`;
        } else {
            deleteButtonHTML = `<button onclick="deleteAdminItem('${item._id}')" class="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            </button>`;
        }

        const cardHTML = `
            <div class="bg-white rounded-xl overflow-hidden border border-neutral-200 shadow-sm flex flex-col">
                <div class="h-44 relative overflow-hidden">
                    <span class="absolute top-3 right-3 z-10 ${badgeStyle} text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">${item.status}</span>
                    ${imageContent}
                </div>
                <div class="p-4 flex-grow flex flex-col">
                    <div class="flex justify-between items-start mb-4 gap-2">
                        <h3 class="text-sm sm:text-base font-bold text-gray-900 truncate" title="${item.itemName}">${item.itemName}</h3>
                        <span class="text-xs text-gray-400 shrink-0">#${displayId}</span>
                    </div>
                    
                    <div class="space-y-2 mb-6">
                        <p class="text-xs text-gray-500 flex items-center gap-2">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                            ${item.reportedBy?.email || 'Unknown User'}
                        </p>
                        <p class="text-xs text-gray-500 flex items-center gap-2">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                            ${item.incidentDate || 'N/A'}
                        </p>
                        <p class="text-xs text-gray-500 flex items-center gap-2">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                            <span class="truncate">${item.location}</span>
                        </p>
                    </div>

                   <!-- DITO IDINAGDAG ANG CLAIM BUTTON -->
                    <div class="mt-auto flex flex-col gap-2">
                        ${claimButtonHTML}
                        <div class="flex gap-2">
                            <button onclick="openDetailsModal('${item._id}')" class="flex-1 px-3 py-2 bg-neutral-800 hover:bg-black text-white rounded-lg text-xs font-bold transition flex items-center justify-center">View</button>
                            ${deleteButtonHTML}
                        </div>
                    </div>
                </div>
            </div>
        `;
        adminInventoryGrid.innerHTML += cardHTML;
    });
}

function showCustomModal(title, message, isConfirm = false, callback = null) {
    const modal = document.getElementById('customModal');
    if (!modal) return console.error("Custom Modal HTML is missing in admin.html!");
    
    document.getElementById('customModalTitle').textContent = title;
    document.getElementById('customModalMessage').textContent = message;
    
    const cancelBtn = document.getElementById('customModalCancel');
    const confirmBtn = document.getElementById('customModalConfirm');
    
    cancelBtn.classList.toggle('hidden', !isConfirm);
    modal.classList.remove('hidden');
    
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    const newCancelBtn = cancelBtn.cloneNode(true);
    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
    
    newConfirmBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
        if (callback) callback(true);
    });
    
    newCancelBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
        if (callback) callback(false);
    });
}

function markAsClaimed(itemId) {
    showCustomModal("Mark as Claimed", "Are you sure you want to mark this item as CLAIMED?", true, async (confirmed) => {
        if (!confirmed) return;
        
        try {
            const token = localStorage.getItem('token'); 

            const response = await fetch(API_BASE + `/api/items/${itemId}/status`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ status: 'claimed' })
            });

            if (response.ok) {
                loadAdminInventory();
            } else {
                showCustomModal("Error", "Session expired or access denied. Please login again.", false);
            }
        } catch (error) { 
            console.error('Error:', error); 
        }
    });
}

function deleteAdminItem(itemId) {
    showCustomModal("Delete Post", "Are you sure you want to permanently delete this post?", true, async (confirmed) => {
        if (!confirmed) return; 
        
        try {
            const token = localStorage.getItem('token'); 

            const response = await fetch(API_BASE + `/api/items/${itemId}`, { 
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}` 
                }
            });

            if (response.ok) {
                loadAdminInventory();
            } else {
                showCustomModal("Error", "Session expired or access denied. Please login again.", false);
            }
        } catch (error) { 
            console.error('Error:', error); 
        }
    });
}

document.getElementById('exportReportBtn').addEventListener('click', async () => {
    try {
        const token = localStorage.getItem('token');
        
        const response = await fetch(API_BASE +'/api/items', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error("Failed to fetch data");
        const items = await response.json();

        let csvContent = "Item ID,Item Name,Category,Status,Reported By,Date,Location\n";

        items.forEach((item, index) => {
            const customId = "ITEM" + String(index + 1).padStart(3, '0');
            const rawDate = item.createdAt || item.date || item.dateReported;
            const date = rawDate ? new Date(rawDate).toLocaleDateString() : 'N/A';
            const itemName = item.name || item.itemName || item.title || 'N/A';
            const category = item.category || item.type || 'N/A';
            const reportedBy = item.reportedBy?.email || item.reportedBy?.name || (typeof item.reportedBy === 'string' ? item.reportedBy : 'N/A');

           let locationData = item.location || 'N/A';
           if(item.latitude && item.longitude) {
           locationData = `=HYPERLINK(""https://www.google.com/maps?q=${item.latitude},${item.longitude}"", ""View Map"")`;
            }

            const row = `"${customId}","${itemName}","${category}","${item.status}","${reportedBy}","${date}","${locationData}"`;
            csvContent += row + "\n";
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        
        link.setAttribute("href", url);
        link.setAttribute("download", `Lost_and_Found_Report_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

    } catch (error) {
        console.error('Export error:', error);
        alert("Hindi ma-generate ang report. Pakisuri ang koneksyon sa server.");
    }
});

function openDetailsModal(itemId) {
    const item = allSystemItems.find(i => i._id === itemId);
    if (!item) return;

    const detailsContent = document.getElementById('detailsModalContent');
    const rawDate = item.createdAt || item.date || item.dateReported;
    const dateFormatted = rawDate ? new Date(rawDate).toLocaleString() : 'N/A';

    detailsContent.innerHTML = `
        <div class="space-y-2">
            ${item.imageURL ? `<img src="${API_BASE}${item.imageURL}" class="w-full h-48 object-cover rounded-lg mb-3 border">` : ''}
            <p><strong>Item Name:</strong> ${item.itemName || 'N/A'}</p>
            <p><strong>Description:</strong> ${item.description || 'No description provided.'}</p>
            <p><strong>Category:</strong> ${item.category || 'N/A'}</p>
            <p><strong>Status:</strong> <span class="uppercase font-semibold px-2 py-0.5 bg-neutral-100 rounded text-xs">${item.status}</span></p>
            <p><strong>Reported By:</strong> ${item.reportedBy?.email || item.reportedBy || 'Unknown'}</p>
            <p><strong>Date Reported:</strong> ${dateFormatted}</p>
            <p><strong>Incident Date:</strong> ${item.incidentDate || 'N/A'}</p>
            <p><strong>Location:</strong> ${item.location || 'N/A'}</p>
            ${item.latitude && item.longitude ? `<p><strong>Coordinates:</strong> ${item.latitude}, ${item.longitude}</p>` : ''}
        </div>
    `;

    document.getElementById('detailsModal').classList.remove('hidden');
}

function closeDetailsModal() {
    document.getElementById('detailsModal').classList.add('hidden');
}