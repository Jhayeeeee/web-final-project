(function () {
    const eyeIcon = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>`;

    const eyeOffIcon = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3l18 18M10.584 10.587a2 2 0 002.828 2.83M9.363 5.365A9.466 9.466 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411M6.61 6.614A10.024 10.024 0 002.458 12c1.274 4.057 5.064 7 9.542 7a9.97 9.97 0 004.39-1.002"></path></svg>`;

    document.querySelectorAll('input[type="password"]').forEach(input => {
        // Ilagay ang input sa wrapper para may puwesto ang button
        const wrapper = document.createElement('div');
        wrapper.className = 'relative';
        input.parentNode.insertBefore(wrapper, input);
        wrapper.appendChild(input);

        // Bigyan ng espasyo sa kanan ang input para hindi matakpan ng icon
        input.classList.add('pr-11');

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'absolute inset-y-0 right-0 px-3 flex items-center text-neutral-400 hover:text-neutral-700 transition';
        btn.setAttribute('aria-label', 'Show password');
        btn.innerHTML = eyeIcon;

        btn.addEventListener('click', () => {
            const showing = input.type === 'text';
            input.type = showing ? 'password' : 'text';
            btn.innerHTML = showing ? eyeIcon : eyeOffIcon;
            btn.setAttribute('aria-label', showing ? 'Show password' : 'Hide password');
        });

        wrapper.appendChild(btn);
    });
})();