(function () {
    // Hamburger toggle
    const menuBtn = document.getElementById('adminMenuBtn');
    const menu = document.getElementById('adminMobileMenu');

    if (menuBtn && menu) {
        menuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            menu.classList.toggle('hidden');
        });

        // Isara ang menu kapag may pinindot sa labas nito
        document.addEventListener('click', (e) => {
            if (!menu.contains(e.target) && e.target !== menuBtn) {
                menu.classList.add('hidden');
            }
        });
    }

    // Initial at pangalan sa mobile
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
        const name = user.fullName || user.email || 'Admin';
        const initial = name.charAt(0).toUpperCase();
        const mobileName = document.getElementById('adminNameMobile');
        const mobileInitials = document.getElementById('adminInitialsMobile');
        if (mobileName) mobileName.textContent = name;
        if (mobileInitials) mobileInitials.textContent = initial;
    }

    // Mobile logout (ang desktop logout ay hawak na ng bawat page JS)
    const logoutMobile = document.getElementById('logoutBtnMobile');
    if (logoutMobile) {
        logoutMobile.addEventListener('click', () => {
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            window.location.href = 'index.html';
        });
    }
})();