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

        const storedUser = JSON.parse(localStorage.getItem('user'));
        if (!storedUser || !storedUser.id) {
            alert("Session expired. Please login again.");
            window.location.href = 'index.html';
            return;
        }

        const building = document.getElementById('campusBuilding').value;
        const room = document.getElementById('campusRoom').value;
        const combinedLocation = (building && room) ? `${building} - ${room}` : (building || 'GPS Location Tagged');

        // GAGAMIT TAYO NG FORMDATA IMBES NA JSON PARA SA FILE UPLOAD
        const formData = new FormData();
        formData.append('itemName', document.getElementById('itemName').value);
        formData.append('description', document.getElementById('itemDesc').value);
        formData.append('category', document.getElementById('itemCategory').value);
        formData.append('status', document.getElementById('itemStatus').value);
        formData.append('location', combinedLocation);
        formData.append('incidentDate', document.getElementById('itemDate').value);
        formData.append('latitude', document.getElementById('latitude').value || '');
        formData.append('longitude', document.getElementById('longitude').value || '');
        formData.append('reportedBy', storedUser.id);

        // Kunin ang image file
        const imageFile = document.getElementById('itemImage').files[0];
        if (imageFile) {
            formData.append('image', imageFile);
        }

        try {
            const response = await fetch('http://localhost:3000/api/items', {
                method: 'POST',
                // TANGGALIN ANG HEADERS dahil kusa itong iseset ng FormData
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                document.getElementById('reportMessage').textContent = "Item successfully saved!";
                document.getElementById('reportMessage').className = "text-xs font-bold text-center text-green-600 block mt-2";
                
                setTimeout(() => {
                    document.getElementById('reportModal').classList.add('hidden');
                    reportForm.reset();
                    document.getElementById('reportMessage').classList.add('hidden');
                    loadItems(); 
                }, 2000);
            } else {
                document.getElementById('reportMessage').textContent = data.message || "Failed to save item.";
                document.getElementById('reportMessage').className = "text-xs font-bold text-center text-red-500 block mt-2";
            }
        } catch (error) {
            console.error("Error saving item:", error);
            document.getElementById('reportMessage').textContent = "Cannot connect to server.";
            document.getElementById('reportMessage').className = "text-xs font-bold text-center text-red-500 block mt-2";
        }
    });
}


    // --- VARIABLES PARA SA FILTERING ---
    let allItems = []; // Dito natin ise-save ang lahat ng data galing database
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const statusFilters = document.getElementsByName('status');

    // --- LOAD ITEMS (GET DATA FROM MONGODB) ---
    async function loadItems() {
        try {
            const response = await fetch('http://localhost:3000/api/items');
            allItems = await response.json(); 
            displayItems(allItems); // I-display lahat sa simula
        } catch (error) {
            console.error('Error loading items:', error);
            document.getElementById('itemsGrid').innerHTML = '<p class="text-red-400">Failed to load items. Cannot connect to server.</p>';
        }
    }

    // --- DISPLAY ITEMS ---
    function displayItems(itemsToDisplay) {
        const itemsGrid = document.getElementById('itemsGrid');
        itemsGrid.innerHTML = '';

        if (itemsToDisplay.length === 0) {
            itemsGrid.innerHTML = '<p class="text-neutral-500 col-span-full text-center py-8">No items found matching your criteria.</p>';
            return;
        }

        itemsToDisplay.forEach(item => {
            // Ibinalik natin sa design mo: Pula kapag LOST, Green kapag FOUND
            const badgeStyle = item.status === 'found' 
                ? 'bg-green-600 text-white' 
                : 'bg-red-600 text-white';
                
            const buttonText = item.status === 'found' ? 'Claim Item' : 'View Details';

         // Pinalitan ang dark background ng totoong image o placeholder
            const imageContent = item.imageURL 
                ? `<img src="${item.imageURL}" alt="${item.itemName}" class="w-full h-full object-cover">` 
                : `<p class="text-neutral-400 text-sm">[ No Image Yet ]</p>`;

            const cardHTML = `
                <div class="bg-white rounded-lg overflow-hidden border border-neutral-200 hover:border-neutral-400 transition flex flex-col">
                    <div class="h-48 bg-neutral-700 flex items-center justify-center relative overflow-hidden">
                        <span class="absolute top-3 right-3 z-10 ${badgeStyle} text-xs font-bold px-2 py-1 rounded tracking-wide">${item.status.toUpperCase()}</span>
                        ${imageContent}
                    </div>
                    <div class="p-5 flex-grow flex flex-col">
                        <h3 class="text-base font-bold text-neutral-900 mb-2">${item.itemName}</h3>
                        <p class="text-sm text-neutral-500 mb-1">Date: ${item.incidentDate || 'No date specified'}</p>
                        <p class="text-sm text-neutral-500 mb-5 line-clamp-2">Location: ${item.location}</p>
                        
                        <button onclick="openItemDetails('${item._id}')" class="mt-auto w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-md transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
                            ${buttonText}
                        </button>
                    </div>
                </div>
        `;
            itemsGrid.innerHTML += cardHTML;
        });
    }

    // --- FILTERING LOGIC ---
    function applyFilters() {
        const searchTerm = searchInput.value.toLowerCase();
        const selectedCategory = categoryFilter.value;
        
        let selectedStatus = 'all';
        statusFilters.forEach(radio => {
            if (radio.checked) selectedStatus = radio.value;
        });

        const filteredItems = allItems.filter(item => {
            // 1. Check kung nagma-match sa search bar (Name o Description)
            const matchesSearch = item.itemName.toLowerCase().includes(searchTerm) || 
                                item.description.toLowerCase().includes(searchTerm);
            
            // 2. Check kung nagma-match sa category
            const matchesCategory = selectedCategory === 'All Categories' || item.category === selectedCategory;
            
            // 3. Check kung nagma-match sa radio button (Lost/Found)
            const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;

            return matchesSearch && matchesCategory && matchesStatus;
        });

        displayItems(filteredItems);
    }

    // --- EVENT LISTENERS (Nag-aabang ng click/type sa filters) ---
    if (searchInput) searchInput.addEventListener('input', applyFilters);
    if (categoryFilter) categoryFilter.addEventListener('change', applyFilters);
    statusFilters.forEach(radio => radio.addEventListener('change', applyFilters));

    // Patakbuhin sa simula
    loadItems();

  
    // --- ITEM DETAILS MODAL LOGIC ---
function openItemDetails(itemId) {
    
    // Hanapin ang item sa array natin gamit ang ID
    const item = allItems.find(i => i._id === itemId);
    if (!item) return;

        const imageContainer = document.getElementById('detailImageContainer');
        if (item.imageURL) {
            imageContainer.innerHTML = `<img src="${item.imageURL}" alt="${item.itemName}" class="w-full h-full object-cover">`;
        } else {
            imageContainer.innerHTML = `<p class="text-neutral-400">[ No Image Yet ]</p>`;
        }
    // Ilagay ang text sa HTML ng modal
    document.getElementById('detailName').textContent = item.itemName;
    document.getElementById('detailCategory').textContent = item.category;
    document.getElementById('detailDesc').textContent = item.description;
    document.getElementById('detailLocation').textContent = item.location;
    document.getElementById('detailLocation').textContent = item.location;
    
    // --- GOOGLE MAPS LINK LOGIC ---
    const mapLink = document.getElementById('detailMapLink');
    if (item.latitude && item.longitude) {
        // Gagawa ng URL papuntang Google Maps gamit ang coordinates
        mapLink.href = `https://www.google.com/maps?q=${item.latitude},${item.longitude}`;
        mapLink.classList.remove('hidden'); // Ipakita ang link
    } else {
        mapLink.classList.add('hidden'); // Itago kung walang GPS data
    }
    
    document.getElementById('detailDate').textContent = item.incidentDate || 'No date specified';

    // Baguhin ang kulay ng status badge sa modal
    const statusBadge = document.getElementById('detailStatus');
    statusBadge.textContent = item.status.toUpperCase();
    statusBadge.className = item.status === 'found' 
        ? 'text-xs font-bold px-2 py-1 rounded tracking-wide bg-green-600 text-white' 
        : 'text-xs font-bold px-2 py-1 rounded tracking-wide bg-red-600 text-white';

    // Baguhin ang text ng Action Button
    const actionBtn = document.getElementById('actionBtn');
    actionBtn.textContent = item.status === 'found' ? 'Contact Finder' : 'Contact Owner';

    // DAGDAG ITO: Ito ang mismong magbubukas ng Email App mo
    const contactEmail = (item.reportedBy && item.reportedBy.email) ? item.reportedBy.email : 'admin@plm.edu.ph';
    actionBtn.onclick = () => {
        const subject = encodeURIComponent(`PLM Lost & Found: Regarding your post about ${item.itemName}`);
        const body = encodeURIComponent(`Hello!\n\nI saw your post on the PLM Lost & Found Portal regarding the ${item.itemName}.\n\n[ Type your message here... ]`);
        window.location.href = `mailto:${contactEmail}?subject=${subject}&body=${body}`;
    };
    

    // Ipakita ang modal
    document.getElementById('itemDetailsModal').classList.remove('hidden');

}

function closeItemDetails() {
    // Itago ang modal
    document.getElementById('itemDetailsModal').classList.add('hidden');
}

// --- GEOLOCATION AT CASCADING DROPDOWN LOGIC ---
const getLocationBtn = document.getElementById('getLocationBtn');
const geoStatus = document.getElementById('geoStatus');
const campusBuilding = document.getElementById('campusBuilding');
const campusRoom = document.getElementById('campusRoom');
const latInput = document.getElementById('latitude');
const lngInput = document.getElementById('longitude');

const plmRooms = {
    "Gusaling Corazon Aquino": ["GCA 101", "GCA 202", "GCA 303", "Canteen", "Restroom"],
    "Gusaling Villegas": ["GV 101", "GV 204", "GV 305", "Restroom"],
    "University Library": ["Main Reading Area", "Internet Section", "Baggage Counter"],
    "Campus Grounds": ["Flagpole", "Field", "Main Gate", "Parking"]
};

if (campusBuilding) {
    campusBuilding.addEventListener('change', function() {
        const selectedBuilding = this.value;
        campusRoom.innerHTML = '<option value="">Select Area/Room</option>';
        
        if (selectedBuilding && plmRooms[selectedBuilding]) {
            campusRoom.disabled = false;
            plmRooms[selectedBuilding].forEach(room => {
                const option = document.createElement('option');
                option.value = room;
                option.textContent = room;
                campusRoom.appendChild(option);
            });
        } else {
            campusRoom.disabled = true;
        }
    });
}

if (getLocationBtn) {
    getLocationBtn.addEventListener('click', () => {
        if (!navigator.geolocation) {
            geoStatus.textContent = "Geolocation is not supported by your browser.";
            geoStatus.className = "text-xs text-red-500 mb-3 text-center block";
            return;
        }

        geoStatus.textContent = "Locating... Please allow location access.";
        geoStatus.className = "text-xs text-blue-500 mb-3 text-center block";

        navigator.geolocation.getCurrentPosition(
            (position) => {
                latInput.value = position.coords.latitude;
                lngInput.value = position.coords.longitude;
                geoStatus.textContent = `📍 GPS Tagged! (Accurate to ~${Math.round(position.coords.accuracy)} meters).`;
                geoStatus.className = "text-xs text-green-600 font-semibold mb-3 text-center block";
                getLocationBtn.classList.replace('bg-neutral-800', 'bg-green-700');
            },
            (error) => {
                geoStatus.textContent = `GPS Error: ${error.message}. Please select building manually.`;
                geoStatus.className = "text-xs text-red-500 mb-3 text-center block";
            },
            { enableHighAccuracy: true }
        );
    });
}

