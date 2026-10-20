const registerForm = document.getElementById('registerForm');

if (registerForm){
    registerForm.addEventListener('submit', async (e) => {

        e.preventDefault();

        const fullName = document.getElementById('fullName').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const errorMessage = document.getElementById('errorMessage');

       

        if (password !== confirmPassword){
            errorMessage.textContent = 'Passwords do not match';
            errorMessage.classList.remove('hidden');
            return;
        }

         errorMessage.classList.add('hidden');

        console.log("Handa nang ipadala sa database:", { fullName, email, password });
        alert("Frontend Validation Success! Ready to send to backend.");

    })
}