// --- VARIABLES ---
const logoutBtn = document.getElementById("logoutBtn");
const myItemsGrid = document.getElementById('myItemsGrid');

// --- CHECK LOGIN SESSION ---
const storedUser = JSON.parse(localStorage.getItem('user'));
// Hahanapin kung 'id' ba o '_id' ang nai-save sa browser mo
const userId = storedUser ? (storedUser.id || storedUser._id) : null;

if (!storedUser || !userId) {
    alert("Session expired. Please login again.");
    window.location.href = 'index.html'; // Siguraduhing 'index.html' ang pangalan ng login page mo
}

// Ipakita ang pangalan sa Navbar
const navUserName = document.getElementById('navUserName');
if (navUserName && storedUser.fullName) {
    navUserName.textContent = storedUser.fullName;
}

// --- LOGOUT LOGIC ---
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('user');
        window.location.href = 'index.html';
    });
}




// --- LOAD USER'S ITEMS ---
async function loadMyItems() {
    try {
        const response = await fetch('http://localhost:3000/api/items');
        const allItems = await response.json(); 

        // I-filter: Kukunin lang yung items kung saan ang ID ng nag-report ay tugma sa ID mo
        const myItems = allItems.filter(item => {
            
            // Kunin ang ID at piliting gawing String
            let reporterId = "";
            if (item.reportedBy && item.reportedBy._id) {
                reporterId = String(item.reportedBy._id);
            } else if (item.reportedBy) {
                reporterId = String(item.reportedBy);
            }

            // I-compare pareho bilang String para walang palya
            return reporterId === String(userId);
        });

        displayMyItems(myItems);
    } catch (error) {
        console.error('Error loading items:', error);
        myItemsGrid.innerHTML = '<p class="text-red-400 col-span-full">Failed to load items. Cannot connect to server.</p>';
    }
}

// --- DISPLAY ITEMS ---
function displayMyItems(itemsToDisplay) {
    myItemsGrid.innerHTML = '';

    if (itemsToDisplay.length === 0) {
        myItemsGrid.innerHTML = `
            <div class="col-span-full text-center py-12 bg-white rounded-lg border border-neutral-200 shadow-sm">
                <p class="text-neutral-500 text-lg mb-2">You haven't reported any items yet.</p>
                <a href="feed.html" class="text-blue-600 hover:underline font-semibold">Go back to Feed to report an item.</a>
            </div>`;
        return;
    }

   itemsToDisplay.forEach(item => {
        let badgeStyle = item.status === 'found' ? 'bg-green-600 text-white' : 'bg-red-600 text-white';
        if (item.status === 'surrendered') badgeStyle = 'bg-orange-500 text-white';
        if (item.status === 'claimed') badgeStyle = 'bg-neutral-600 text-white';
        
        const imageContent = item.imageURL 
            ? `<img src="${item.imageURL}" alt="${item.itemName}" class="w-full h-full object-cover">` 
            : `<p class="text-neutral-400 text-sm">[ No Image Yet ]</p>`;

        // Base Delete Button
        let actionButtons = `<button onclick="deleteMyItem('${item._id}')" class="mt-2 w-full py-2 bg-red-100 hover:bg-red-200 border border-red-300 text-red-700 text-sm font-bold rounded-md transition focus:outline-none"> Delete Post</button>`;

        // Status Conditions
        if (item.status === 'found') {
            actionButtons = `
                <button onclick="updateItemStatus('${item._id}', 'surrendered')" class="mt-auto w-full py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-md transition mb-1"> Surrendered to Admin</button>
                ${actionButtons}
            `;
        } else if (item.status === 'surrendered') {
            actionButtons = `
                <button disabled class="mt-auto w-full py-2 bg-neutral-300 text-neutral-600 text-sm font-bold rounded-md mb-1 cursor-not-allowed">At Admin Office</button>
                ${actionButtons}
            `;
        } else if (item.status === 'lost') {
            actionButtons = `
                <button onclick="markMyItemResolved('${item._id}')" class="mt-auto w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-md transition mb-1"> I Found It (Close Post)</button>
                ${actionButtons}
            `;
        } else if (item.status === 'claimed') {
            actionButtons = `
                <button disabled class="mt-auto w-full py-2 bg-green-100 text-green-700 border border-green-200 text-sm font-bold rounded-md mb-1 cursor-not-allowed"> Resolved</button>
                ${actionButtons}
            `;
        }

        const cardHTML = `
            <div class="bg-white rounded-lg overflow-hidden border border-neutral-200 hover:border-neutral-400 transition flex flex-col shadow-sm">
                <div class="h-48 bg-neutral-700 flex items-center justify-center relative overflow-hidden">
                    <span class="absolute top-3 right-3 z-10 ${badgeStyle} text-xs font-bold px-2 py-1 rounded tracking-wide">${item.status.toUpperCase()}</span>
                    ${imageContent}
                </div>
                <div class="p-5 flex-grow flex flex-col">
                    <h3 class="text-base font-bold text-neutral-900 mb-2">${item.itemName}</h3>
                    <p class="text-sm text-neutral-500 mb-1">Date: ${item.incidentDate || 'No date specified'}</p>
                    <p class="text-sm text-neutral-500 mb-5 line-clamp-2">Location: ${item.location}</p>
                    
                    <div class="mt-auto flex flex-col">
                        ${actionButtons}
                    </div>
                </div>
            </div>
        `;
        myItemsGrid.innerHTML += cardHTML;
    });
}

// Patakbuhin
loadMyItems();

// --- CUSTOM SURRENDER MODAL LOGIC ---
const surrenderModal = document.getElementById('surrenderModal');
const cancelSurrenderBtn = document.getElementById('cancelSurrenderBtn');
const confirmSurrenderBtn = document.getElementById('confirmSurrenderBtn');

let itemToSurrenderId = null; 
let newStatusToSet = null;

// 1. Kapag pinindot ang orange button sa card, ipapakita ang Modal
function updateItemStatus(itemId, newStatus) {
    itemToSurrenderId = itemId;
    newStatusToSet = newStatus;
    surrenderModal.classList.remove('hidden');
}

// 2. Kapag pinindot ang "Cancel"
cancelSurrenderBtn.addEventListener('click', () => {
    surrenderModal.classList.add('hidden');
    itemToSurrenderId = null;
    newStatusToSet = null;
});

// 3. Kapag pinindot ang "Yes, Surrendered" (Konekta sa backend)
confirmSurrenderBtn.addEventListener('click', async () => {
    if (!itemToSurrenderId) return;

    // Gawing "Updating..." ang text habang naglo-load
    confirmSurrenderBtn.textContent = "Updating...";
    confirmSurrenderBtn.disabled = true;

    try {
        const response = await fetch(`http://localhost:3000/api/items/${itemToSurrenderId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatusToSet })
        });

        if (response.ok) {
            surrenderModal.classList.add('hidden'); // Itago ang modal
            loadMyItems(); // Kusa nitong babaguhin yung button sa UI mo
        } else {
            alert("Failed to update status.");
        }
    } catch (error) {
        console.error('Error updating status:', error);
        alert("Cannot connect to server.");
    } finally {
        // Ibalik sa normal ang button
        confirmSurrenderBtn.textContent = "Yes, Surrendered";
        confirmSurrenderBtn.disabled = false;
        itemToSurrenderId = null;
        newStatusToSet = null;
    }
});




// --- CUSTOM DELETE MODAL LOGIC ---
const deleteModal = document.getElementById('deleteModal');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
let itemToDeleteId = null; // Dito natin ise-save pansamantala yung ID na buburahin

// 1. Kapag pinindot ang Delete sa card, ipapakita ang Modal
function deleteMyItem(itemId) {
    itemToDeleteId = itemId;
    deleteModal.classList.remove('hidden'); 
}

// 2. Kapag pinindot ang "Cancel" sa Modal, itatago lang ito
cancelDeleteBtn.addEventListener('click', () => {
    deleteModal.classList.add('hidden');
    itemToDeleteId = null;
});

// 3. Kapag pinindot ang "Yes, Delete" sa Modal, saka kokonekta sa server
confirmDeleteBtn.addEventListener('click', async () => {
    if (!itemToDeleteId) return;

    confirmDeleteBtn.textContent = "Deleting...";
    confirmDeleteBtn.disabled = true;

    try {
        const response = await fetch(`http://localhost:3000/api/items/${itemToDeleteId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            deleteModal.classList.add('hidden'); // Itago ang modal
            loadMyItems(); // Kusa na lang mawawala yung item sa screen
        } else {
            alert("Failed to delete the post.");
        }
    } catch (error) {
        console.error('Error deleting item:', error);
        alert("Cannot connect to server.");
    } finally {
        // Ibalik sa normal ang button text
        confirmDeleteBtn.textContent = "Yes, Delete";
        confirmDeleteBtn.disabled = false;
        itemToDeleteId = null;
    }
});


function showCustomModal(title, message, isConfirm = false, callback = null) {
    const modal = document.getElementById('customModal');
    if (!modal) return console.error("Modal HTML is missing!");
    
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

// --- MARK OWN LOST ITEM AS RESOLVED ---
function markMyItemResolved(itemId) {
    showCustomModal("Found Your Item?", "Did you find your item? This will close the post and mark it as resolved.", true, async (confirmed) => {
        if (!confirmed) return;

        try {
            const response = await fetch(`http://localhost:3000/api/items/${itemId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'claimed' })
            });

            if (response.ok) {
                loadMyItems(); 
            } else {
                showCustomModal("Error", "Failed to update post status.", false);
            }
        } catch (error) {
            console.error('Error updating status:', error);
            showCustomModal("Error", "Cannot connect to server.", false);
        }
    });
}

