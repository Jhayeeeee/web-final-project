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
            const reporterId = (item.reportedBy && item.reportedBy._id) ? item.reportedBy._id : item.reportedBy;
            return reporterId === userId;
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
        const badgeStyle = item.status === 'found' ? 'bg-green-600 text-white' : 'bg-red-600 text-white';
        
        const imageContent = item.imageUrl 
            ? `<img src="${item.imageUrl}" alt="${item.itemName}" class="w-full h-full object-cover">` 
            : `<p class="text-neutral-400 text-sm">[ No Image Yet ]</p>`;

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
                    
                    <button class="mt-auto w-full py-2 bg-neutral-100 border border-neutral-300 text-neutral-600 text-sm font-semibold rounded-md cursor-default">
                        Your Post
                    </button>
                </div>
            </div>
        `;
        myItemsGrid.innerHTML += cardHTML;
    });
}

// Patakbuhin
loadMyItems();