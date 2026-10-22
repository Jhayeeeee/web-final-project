const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {

        localStorage.removeItem('user');

        window.location.href = 'index.html';

    });
}

const gridButtons = document.querySelectorAll('#itemsGrid button');

gridButtons.forEach(button => {
    button.addEventListener('click', (e) => {
        // Kukunin ang text ng button (kung 'Claim Item' ba o 'View Details')
        const action = e.target.textContent.trim();
        
        // Magpapakita muna ng alert habang wala pa tayong database para sa items
        alert(`Action Triggered: ${action}\n\nLalabas ang buong detalye ng gamit na ito kapag nai-connect na natin ang MongoDB Items Collection.`);
    });
});

// --- MODAL LOGIC ---
const openReportBtn = document.getElementById('openReportBtn');
const closeReportBtn = document.getElementById('closeReportBtn');
const reportModal = document.getElementById('reportModal');
const reportForm = document.getElementById('reportForm');
const reportMessage = document.getElementById('reportMessage');


// Palitawin ang modal
if (openReportBtn) {
    openReportBtn.addEventListener('click', (e) => {
        e.preventDefault();
        reportModal.classList.remove('hidden');
    });
}

// Itago ang modal
if (closeReportBtn) {
    closeReportBtn.addEventListener('click', () => {
        reportModal.classList.add('hidden');
        reportForm.reset();
        reportMessage.classList.add('hidden');
    });
}

// --- SUBMIT ITEM LOGIC ---
if (reportForm) {
    reportForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // 1. Kunin ang ID ng user na naka-login mula sa localStorage
        const storedUser = JSON.parse(localStorage.getItem('user'));
        
        if (!storedUser || !storedUser.id) {
            alert("Session expired. Please login again.");
            window.location.href = 'index.html';
            return;
        }

        // 2. Kunin ang laman ng form
        const newItemData = {
            itemName: document.getElementById('itemName').value,
            description: document.getElementById('itemDesc').value,
            category: document.getElementById('itemCategory').value,
            status: document.getElementById('itemStatus').value,
            location: document.getElementById('itemLocation').value,
            incidentDate: document.getElementById('itemDate').value,
            reportedBy: storedUser.id // Importante: naka-link kung sino ang nag-post
        };

        try {
            // 3. I-send sa database
            const response = await fetch('http://localhost:3000/api/items', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newItemData)
            });

            const data = await response.json();

            if (response.ok) {
                // Success styling
                reportMessage.textContent = "Item successfully saved!";
                reportMessage.className = "text-sm font-bold text-center text-white bg-green-500 border border-green-900 rounded py-2 mt-4 block";
            

            setTimeout(() => {
                reportModal.classList.add('hidden');
                reportForm.reset();
                reportMessage.classList.add('hidden');
                loadItems(); 
            }, 2000);
            } else {
                // Error styling
                reportMessage.textContent = data.message || "Failed to save item.";
                reportMessage.className = "text-sm font-bold text-center text-red-400 bg-red-900/30 border border-red-500 rounded py-2 mt-4 block";
            }
        } catch (error) {
            console.error("Error saving item:", error);
            reportMessage.textContent = "Cannot connect to server.";
            reportMessage.className = "text-sm font-bold text-center text-red-400 bg-red-900/30 border border-red-500 rounded py-2 mt-4 block";
        }
    });
}


// --- LOAD ITEMS LOGIC (GET DATA FROM MONGODB) ---
async function loadItems() {
    try {
        const response = await fetch('http://localhost:3000/api/items');
        const items = await response.json();
        const itemsGrid = document.getElementById('itemsGrid');

        // 1. Burahin ang mga hardcoded sample cards sa HTML
        itemsGrid.innerHTML = '';

        // 2. I-loop ang bawat item mula sa database at gawan ng card
        items.forEach(item => {
            // Iba ang kulay ng badge depende kung lost o found
            const badgeColor = item.status === 'found' ? 'bg-green-600' : 'bg-red-600';
            const badgeText = item.status.toUpperCase();
            
            // Text sa button
            const buttonText = item.status === 'found' ? 'Claim Item' : 'View Details';

            // Gagawa ng HTML para sa card
            const cardHTML = `
                <div class="bg-neutral-100 rounded-xl overflow-hidden border border-neutral-400 shadow-lg hover:border-blue-500 transition flex flex-col">
                    <div class="h-48 bg-neutral-600 flex items-center justify-center relative">
                        <span class="absolute top-3 right-3 ${badgeColor} text-white text-xs font-bold px-2 py-1 rounded">${badgeText}</span>
                        <p class="text-gray-400">[ No Image Yet ]</p>
                    </div>
                    <div class="p-5 flex-grow flex flex-col">
                        <h3 class="text-lg font-bold text-gray-800 mb-1">${item.itemName}</h3>
                        <p class="text-sm text-gray-600 mb-1">Date: ${item.incidentDate || 'No date specified'}</p>
                        <p class="text-sm text-gray-600 mb-1">Location: ${item.location}</p>
                        <p class="text-sm text-gray-600 mb-4 truncate">${item.description}</p>
                        
                        <button class="mt-auto w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition">
                            ${buttonText}
                        </button>
                    </div>
                </div>
            `;
            
            // I-insert ang card sa loob ng grid
            itemsGrid.innerHTML += cardHTML;
        });

    } catch (error) {
        console.error('Error loading items:', error);
        document.getElementById('itemsGrid').innerHTML = '<p class="text-red-400">Failed to load items. Cannot connect to server.</p>';
    }
}

// 3. Patakbuhin agad ang function pagkabukas ng feed.html
loadItems();