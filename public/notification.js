(function () {
    const bellBtn = document.getElementById('notifBellBtn');
    const dropdown = document.getElementById('notifDropdown');
    const list = document.getElementById('notifList');
    const badge = document.getElementById('notifBadge');
    const markAllBtn = document.getElementById('notifMarkAllBtn');
    const clearAllBtn = document.getElementById('notifClearAllBtn');

    if (!bellBtn || !dropdown) return;

    let notifications = [];
    let unreadCount = 0;

    const escapeHtml = (str) =>
        String(str ?? '').replace(/[&<>"']/g, c => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[c]));

    const authHeaders = () => ({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
    });
        // Styled confirm modal (pumapalit sa native confirm() ng browser)
    function showNotifConfirm(title, message, okLabel = 'Yes') {
        return new Promise((resolve) => {
            const modal = document.getElementById('notifConfirmModal');
            const okBtn = document.getElementById('notifConfirmOkBtn');
            const cancelBtn = document.getElementById('notifConfirmCancelBtn');

            document.getElementById('notifConfirmTitle').textContent = title;
            document.getElementById('notifConfirmMessage').textContent = message;
            okBtn.textContent = okLabel;
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

    function renderBadge() {
        if (unreadCount > 0) {
            badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }

    function renderList() {
        if (notifications.length === 0) {
            list.innerHTML = `<p class="text-sm text-neutral-500 text-center py-8">No notifications yet.</p>`;
            return;
        }

        list.innerHTML = notifications.map(n => {
            const isClaim = n.type === 'item_claimed';
            const iconBg = isClaim ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600';
            const iconSvg = isClaim
                ? `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`
                : `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"></path></svg>`;

            return `
                <div class="flex items-start gap-2 px-4 py-3 border-b border-neutral-100 hover:bg-neutral-50 transition ${n.isRead ? '' : 'bg-blue-50/60'}">
                    <button data-id="${n._id}" class="flex-1 min-w-0 text-left flex gap-3">
                        <span class="shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${iconBg}">${iconSvg}</span>
                        <span class="flex-1 min-w-0">
                            <span class="block text-sm ${n.isRead ? 'font-semibold text-neutral-700' : 'font-bold text-neutral-900'}">${escapeHtml(n.title)}</span>
                            <span class="block text-xs text-neutral-600 mt-0.5 break-words">${escapeHtml(n.message)}</span>
                            <span class="block text-[10px] text-neutral-400 mt-1">${new Date(n.createdAt).toLocaleString()}</span>
                        </span>
                        ${n.isRead ? '' : '<span class="shrink-0 w-2 h-2 mt-2 rounded-full bg-blue-600"></span>'}
                    </button>
                    <button data-delete-id="${n._id}" title="Delete" aria-label="Delete notification"
                        class="shrink-0 text-neutral-400 hover:text-red-600 text-lg leading-none px-1 transition">&times;</button>
                </div>
            `;
        }).join('');
    }

    async function loadNotifications() {
        try {
            const response = await fetch(API_BASE + '/api/notifications', {
                headers: authHeaders()
            });
            if (!response.ok) return;

            const data = await response.json();
            notifications = data.notifications || [];
            unreadCount = data.unreadCount || 0;
            renderBadge();
            renderList();
        } catch (error) {
            console.error('Error loading notifications:', error);
        }
    }

    async function markAsRead(id) {
        const notif = notifications.find(n => n._id === id);
        if (!notif || notif.isRead) return;

        try {
            const response = await fetch(API_BASE + `/api/notifications/${id}/read`, {
                method: 'PUT',
                headers: authHeaders()
            });
            if (!response.ok) return;

            notif.isRead = true;
            unreadCount = Math.max(0, unreadCount - 1);
            renderBadge();
            renderList();
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    }

    async function markAllAsRead() {
        try {
            const response = await fetch(API_BASE + '/api/notifications/read-all', {
                method: 'PUT',
                headers: authHeaders()
            });
            if (!response.ok) return;

            notifications.forEach(n => n.isRead = true);
            unreadCount = 0;
            renderBadge();
            renderList();
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    }

    async function deleteOne(id) {
        try {
            const response = await fetch(API_BASE + `/api/notifications/${id}`, {
                method: 'DELETE',
                headers: authHeaders()
            });
            if (!response.ok) return;

            const removed = notifications.find(n => n._id === id);
            notifications = notifications.filter(n => n._id !== id);
            if (removed && !removed.isRead) unreadCount = Math.max(0, unreadCount - 1);
            renderBadge();
            renderList();
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    }
    async function clearAll() {
        if (notifications.length === 0) return;

        const confirmed = await showNotifConfirm(
            'Clear all notifications?',
            'This cannot be undone.',
            'Yes, Clear'
        );
        if (!confirmed) return;

        try {
            const response = await fetch(API_BASE + '/api/notifications', {
                method: 'DELETE',
                headers: authHeaders()
            });
            if (!response.ok) return;

            notifications = [];
            unreadCount = 0;
            renderBadge();
            renderList();
        } catch (error) {
            console.error('Error clearing notifications:', error);
        }
    }

    // Close when clicking outside
    document.addEventListener('click', (e) => {
        if (!bellBtn.parentElement.contains(e.target)) {
            dropdown.classList.add('hidden');
        }
    });

    // Mark as read o delete, depende sa button na pinindot
    list.addEventListener('click', (e) => {
        const deleteBtn = e.target.closest('button[data-delete-id]');
        if (deleteBtn) {
            deleteOne(deleteBtn.dataset.deleteId);
            return;
        }

        const readBtn = e.target.closest('button[data-id]');
        if (readBtn) markAsRead(readBtn.dataset.id);
    });

    if (markAllBtn) markAllBtn.addEventListener('click', markAllAsRead);
    if (clearAllBtn) clearAllBtn.addEventListener('click', clearAll);

    // Initial load, then check for new notifications every 30 seconds
    loadNotifications();
    setInterval(loadNotifications, 30000);
})();