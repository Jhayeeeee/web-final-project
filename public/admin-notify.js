(function () {
    const storedUser = JSON.parse(localStorage.getItem('user'));

    if (!storedUser || storedUser.role !== 'admin') {
        alert("Unauthorized access. Please login as an admin.");
        window.location.href = 'index.html';
        return;
    }

    const titleInput = document.getElementById('notifTitle');
    const messageInput = document.getElementById('notifMessage');
    const titleCount = document.getElementById('titleCount');
    const messageCount = document.getElementById('messageCount');
    const sendBtn = document.getElementById('sendNotifBtn');

    // --- Toast helper ---
    const successIcon = `<svg class="w-14 h-14 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`;
    const errorIcon = `<svg class="w-14 h-14 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`;

    function showToast(title, message, isError = false) {
        document.getElementById('toastIcon').innerHTML = isError ? errorIcon : successIcon;
        document.getElementById('toastTitle').textContent = title;
        document.getElementById('toastMessage').textContent = message;
        document.getElementById('toastModal').classList.remove('hidden');
    }

    document.getElementById('toastOkBtn').addEventListener('click', () => {
        document.getElementById('toastModal').classList.add('hidden');
    });

    // --- Confirm helper ---
    function showConfirm(title, message) {
        return new Promise((resolve) => {
            const modal = document.getElementById('confirmModal');
            const okBtn = document.getElementById('confirmOkBtn');
            const cancelBtn = document.getElementById('confirmCancelBtn');

            document.getElementById('confirmTitle').textContent = title;
            document.getElementById('confirmMessage').textContent = message;
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

    // --- Character counters ---
    titleInput.addEventListener('input', () => titleCount.textContent = titleInput.value.length);
    messageInput.addEventListener('input', () => messageCount.textContent = messageInput.value.length);

    // --- Logout & admin name ---
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        window.location.href = 'index.html';
    });

    const displayName = storedUser.fullName || storedUser.email || 'Admin';
    document.getElementById('adminNameDisplay').textContent = displayName;
    document.getElementById('adminInitials').textContent = displayName.charAt(0).toUpperCase();

    // --- Send broadcast ---
    sendBtn.addEventListener('click', async () => {
        const title = titleInput.value.trim();
        const message = messageInput.value.trim();

        if (!title || !message) {
            showToast('Missing Fields', 'Please fill in both the title and the message.', true);
            return;
        }

        const confirmed = await showConfirm(
            'Send to All Users?',
            `"${title}" will be sent to every student account. This cannot be undone.`
        );
        if (!confirmed) return;

        sendBtn.disabled = true;
        sendBtn.textContent = 'Sending...';

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:3000/api/admin/notifications/broadcast', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ title, message })
            });
            const data = await response.json().catch(() => ({}));

            if (response.ok) {
                showToast('Notification Sent', data.message || 'Notification sent.');
                titleInput.value = '';
                messageInput.value = '';
                titleCount.textContent = '0';
                messageCount.textContent = '0';
            } else {
                showToast('Send Failed', data.message || 'Failed to send notification.', true);
            }
        } catch (error) {
            console.error('Broadcast error:', error);
            showToast('Connection Error', 'Cannot connect to the server.', true);
        } finally {
            sendBtn.disabled = false;
            sendBtn.textContent = 'Send to All Users';
        }
    });
})();