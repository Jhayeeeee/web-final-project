

/**
 * Shows a styled toast/alert modal.
 * @param {'success'|'error'|'warning'|'info'} type
 * @param {string} title
 * @param {string} message
 */
function showToast(type, title, message) {
    const icons = {
        success: `<svg class="w-14 h-14 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
        error:   `<svg class="w-14 h-14 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
        warning: `<svg class="w-14 h-14 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>`,
        info:    `<svg class="w-14 h-14 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
    };
    document.getElementById('toastIcon').innerHTML = icons[type] || icons.info;
    document.getElementById('toastTitle').textContent = title;
    document.getElementById('toastMessage').textContent = message;
    document.getElementById('toastModal').classList.remove('hidden');
}

/**
 * Shows the confirm-report modal and resolves with true/false.
 * @returns {Promise<boolean>}
 */
function showConfirmReport() {
    return new Promise((resolve) => {
        const modal = document.getElementById('confirmReportModal');
        const okBtn = document.getElementById('confirmReportOkBtn');
        const cancelBtn = document.getElementById('confirmReportCancelBtn');
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

// Wire up toast OK button once
document.getElementById('toastOkBtn').addEventListener('click', () => {
    document.getElementById('toastModal').classList.add('hidden');
});

// =============================================

    const logoutBtn = document.getElementById("logoutBtn");
    const logoutBtnMobile = document.getElementById("logoutBtnMobile");

    // Kunin ang user data mula sa localStorage
    const storedUser = JSON.parse(localStorage.getItem('user'));

    // I-update ang pangalan sa Navbar (Desktop at Mobile)
    const navUserName = document.getElementById('navUserName');
    const mobileNavUserName = document.getElementById('mobileNavUserName');
    if (storedUser && storedUser.fullName) {
        if (navUserName) navUserName.textContent = storedUser.fullName;
        if (mobileNavUserName) mobileNavUserName.textContent = storedUser.fullName;
        
        // Para mapalitan din yung letrang "U" sa bilog ng unang letra ng pangalan nila
        const userInitialCircles = document.querySelectorAll('.user-initial-circle, .rounded-full.bg-neutral-700');
        userInitialCircles.forEach(circle => {
            circle.textContent = storedUser.fullName.charAt(0).toUpperCase();
        });
    }

    const handleLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        window.location.href = 'index.html';
    };

    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    if (logoutBtnMobile) logoutBtnMobile.addEventListener('click', handleLogout);


    // --- MOBILE MENU LOGIC ---
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileNavMenu = document.getElementById('mobileNavMenu');
    if (mobileMenuBtn && mobileNavMenu) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileNavMenu.classList.toggle('hidden');
        });
    }

    // --- MODAL LOGIC ---
    const openReportBtn = document.getElementById('reportItemBtn');
    const openReportBtnMobile = document.getElementById('openReportBtnMobile');
    const closeReportBtn = document.getElementById('closeReportBtn');
    const reportModal = document.getElementById('reportModal');
    const reportForm = document.getElementById('reportForm');
    const reportMessage = document.getElementById('reportMessage');

    const handleOpenReport = (e) => {
        if (e) e.preventDefault();
        reportModal.classList.remove('hidden');
        if (mobileNavMenu && !mobileNavMenu.classList.contains('hidden')) {
            mobileNavMenu.classList.add('hidden');
        }
    };

    if (openReportBtn) openReportBtn.addEventListener('click', handleOpenReport);
    if (openReportBtnMobile) openReportBtnMobile.addEventListener('click', handleOpenReport);

    // Itago ang modal
    if (closeReportBtn) {
        closeReportBtn.addEventListener('click', () => {
            reportModal.classList.add('hidden');
            reportForm.reset();
            reportMessage.classList.add('hidden');
            
            // --- BAGONG DAGDAG: I-reset ang Location UI at Inputs ---
            const resetGeoStatus = document.getElementById('geoStatus');
            if (resetGeoStatus) {
                resetGeoStatus.textContent = '';
                resetGeoStatus.classList.add('hidden'); // Itatago ulit ang text
            }
            document.getElementById('latitude').value = '';
            document.getElementById('longitude').value = '';
            
            // Ibalik sa itim ang button kung naging green ito
            const locBtn = document.getElementById('getLocationBtn');
            if (locBtn && locBtn.classList.contains('bg-green-700')) {
                locBtn.classList.replace('bg-green-700', 'bg-neutral-800');
            }
        });
    }
   // --- SUBMIT ITEM LOGIC ---
if (reportForm) {
    reportForm.addEventListener('submit', async (e) => {
        e.preventDefault();

   // --- NATIVE BROWSER TOOLTIP VALIDATION ---
        const latValue = document.getElementById('latitude').value;
        const buildingSelect = document.getElementById('campusBuilding');

        // Kung walang GPS at walang napiling building
        if (!latValue && buildingSelect.value === "") {
            // Maglalabas ng native tooltip na parang naka-HTML 'required'
            buildingSelect.setCustomValidity("Please choose a building. If it's not among the choices, select 'other'");
            buildingSelect.reportValidity(); // Ipakita ang tooltip sa screen
            return; // Pigilan ang pag-save
        } else {
            // I-clear ang error kung may laman na para makapag-submit
            buildingSelect.setCustomValidity("");
        }
        // ------------------------------------------

        const storedUser = JSON.parse(localStorage.getItem('user'));
        if (!storedUser || !storedUser.id) {
            showToast('warning', 'Session Expired', 'Please login again to continue.');
            setTimeout(() => { window.location.href = 'index.html'; }, 1800);
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
        // Design badge and button text based on status
        let badgeStyle = 'bg-red-600 text-white'; // Default para sa 'lost'
        let badgeText = item.status.toUpperCase();
        let buttonText = 'View Details';
        let buttonStyle = 'bg-blue-600 hover:bg-blue-700 focus-visible:ring-blue-500'; // Default blue button

        if (item.status === 'found') {
            badgeStyle = 'bg-green-600 text-white';
            buttonText = 'Claim Item';
            buttonStyle = 'bg-green-600 hover:bg-green-700 focus-visible:ring-green-500'; // Berde kapag found
        } else if (item.status === 'surrendered') {
            badgeStyle = 'bg-orange-500 text-white';
            badgeText = 'AT ADMIN';
            buttonText = 'Claim at Admin';
            buttonStyle = 'bg-orange-500 hover:bg-orange-600 focus-visible:ring-orange-500'; // Orange kapag nasa admin
        } else if (item.status === 'claimed') {
            return;
        }

        // --- REPORT LOGIC START ---
        // 1. I-check kung ang naka-login na user ang nag-post nito
        const currentUser = JSON.parse(localStorage.getItem('user'));
        const postOwnerId = item.reportedBy?._id || item.reportedBy; 
        const isOwner = currentUser && (postOwnerId === currentUser.id || postOwnerId === currentUser._id);

        // 2. I-generate ang report button kung hindi siya ang may-ari ng post
        let reportButtonHTML = '';
        if (!isOwner) {
            reportButtonHTML = `
                <button onclick="reportItem('${item._id}')" class="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 mb-3 transition w-fit" title="Report as spam or inappropriate">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"></path></svg>
                    Report Post
                </button>
            `;
        }
        // --- REPORT LOGIC END ---

        // Image placeholder
        const imageContent = item.imageURL 
            ? `<img src="${item.imageURL}" alt="${item.itemName}" class="w-full h-full object-cover">` 
            : `<p class="text-neutral-400 text-sm">[ No Image Yet ]</p>`;

        const cardHTML = `
            <div class="bg-white rounded-xl overflow-hidden border border-neutral-200 hover:border-neutral-400 transition flex flex-col shadow-sm">
                <div class="h-44 sm:h-48 bg-neutral-700 flex items-center justify-center relative overflow-hidden">
                    <span class="absolute top-3 right-3 z-10 ${badgeStyle} text-[10px] sm:text-xs font-bold px-2 py-1 rounded tracking-wide">${badgeText}</span>
                    ${imageContent}
                </div>
                <div class="p-4 sm:p-5 flex-grow flex flex-col">
                    <h3 class="text-sm sm:text-base font-bold text-neutral-900 mb-1.5 truncate" title="${item.itemName}">${item.itemName}</h3>
                    <p class="text-xs sm:text-sm text-neutral-500 mb-1">Date: ${item.incidentDate || 'No date specified'}</p>
                    <p class="text-xs sm:text-sm text-neutral-500 mb-2 line-clamp-2">Location: ${item.location}</p>
                    
                    
                    ${reportButtonHTML}

                    <button onclick="openItemDetails('${item._id}')" class="mt-auto w-full py-2 text-white text-xs sm:text-sm font-semibold rounded-md transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${buttonStyle}">
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
    document.getElementById('detailLocation').textContent = item.location;// Palitan ang mga itry;

// Ito ay ang ID ng element sa HTML para sa pangalan ng nag-post
const posterNameElement = document.getElementById('detailPosterName');
if (item.reportedBy && item.reportedBy.fullName) {
    posterNameElement.textContent = item.reportedBy.fullName;
} else {
    posterNameElement.textContent = 'Unknown User'; // Fallback text
}
    
    
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
    
    // 1. Baguhin ang text ng button depende sa status
    if (item.status === 'found') {
        actionBtn.textContent = 'Contact Finder';
    } else if (item.status === 'surrendered') {
        actionBtn.textContent = 'Proceed to Admin Office';
    } else {
        actionBtn.textContent = 'Contact Owner'; // Para sa 'lost'
    }

    const contactEmail = (item.reportedBy && item.reportedBy.email) ? item.reportedBy.email : 'admin@plm.edu.ph';

    // 2. Alisin ang mga lumang click listener para hindi magdoble-doble
    const newActionBtn = actionBtn.cloneNode(true);
    actionBtn.parentNode.replaceChild(newActionBtn, actionBtn);

    // 3. I-setup ang tamang action kapag pinindot ang button
    document.getElementById('actionBtn').addEventListener('click', () => {
        if (item.status === 'surrendered') {
            document.getElementById('adminInfoModal').classList.remove('hidden');
        } else {
            const subject = encodeURIComponent(`University of Manila Lost & Found: Regarding your post about ${item.itemName}`);
            const body = encodeURIComponent(`Hello!\n\nI saw your post on the University Lost & Found Portal regarding the ${item.itemName}.\n\n[ Type your message here... ]`);
            const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${contactEmail}&su=${subject}&body=${body}`;
            window.open(gmailUrl, '_blank');
        }
    });

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

// --- DATE RESTRICTION LOGIC ---
document.addEventListener('DOMContentLoaded', () => {
    // Ginamit na natin ang tamang ID na 'itemDate'
    const dateInput = document.getElementById('itemDate'); 

    if (dateInput) {
        const today = new Date();
        // Inaayos ang timezone para sumakto sa oras sa Pilipinas
        const localDate = new Date(today.getTime() - (today.getTimezoneOffset() * 60000));
        const formattedToday = localDate.toISOString().split('T')[0];
        
        // I-set ang maximum date (bawal ang future date)
        dateInput.setAttribute('max', formattedToday);

        // I-set ang minimum date (hanggang 1 buwan nakalipas lang pwede)
        const pastDate = new Date(localDate);
        pastDate.setMonth(pastDate.getMonth() - 1);
        const formattedPast = pastDate.toISOString().split('T')[0];
        dateInput.setAttribute('min', formattedPast);
    }
});

// Isara ang Admin Info Modal kapag pinindot ang "Got it"
const closeAdminInfoBtn = document.getElementById('closeAdminInfoBtn');
if (closeAdminInfoBtn) {
    closeAdminInfoBtn.addEventListener('click', () => {
        document.getElementById('adminInfoModal').classList.add('hidden');
    });
}


async function reportItem(itemId) {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        showToast('warning', 'Login Required', 'You must be logged in to report a post.');
        return;
    }

    const confirmed = await showConfirmReport();
    if (!confirmed) return;

    try {
        const response = await fetch(`http://localhost:3000/api/items/${itemId}/report`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ userId: user.id || user._id })
        });

        const data = await response.json();

        if (data.message === "You have already reported this item.") {
            showToast('warning', 'Already Reported', 'You have already flagged this post.');
        } else if (data.message === "Item reported successfully") {
            showToast('success', 'Report Submitted', 'Thank you! Our admins will review this post.');
        } else {
            showToast('error', 'Report Failed', data.message || 'Something went wrong. Please try again.');
        }
    } catch (error) {
        console.error("Error:", error);
        showToast('error', 'Connection Error', 'Cannot connect to the server. Please try again later.');
    }

}
