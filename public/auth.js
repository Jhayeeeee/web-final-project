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
         

        try {
            const response = await fetch('http://localhost:3000/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ fullName, email, password })
            });

            const data = await response.json();
            const successMessage = document.getElementById('successMessage');

            // Client-Side Validation: Checking kung @plm.edu.ph ang email domain
        if (!email.endsWith('@university.edu.ph')) {
            errorMessage.textContent = "Please use your official university email (@university.edu.ph).";
            errorMessage.classList.remove('hidden');
            return; // Ihihinto ang proseso dito
        }

            if (response.ok) {
                // Kapag successful ang pag-save sa database
                errorMessage.classList.add('hidden');

                successMessage.textContent = "Account successfully created!";
                successMessage.classList.remove('hidden');
                
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);
                
            } else {
                // Kapag may error galing sa backend (hal. ginamit na ang email)
                errorMessage.textContent = data.message;
                errorMessage.classList.remove('hidden');
            }
        } catch (error) {
            // Kapag nakapatay ang Node.js server mo
            console.error("Connection Error:", error);
            errorMessage.textContent = "Cannot connect to server. Please try again.";
            errorMessage.classList.remove('hidden');
        }


    });
}