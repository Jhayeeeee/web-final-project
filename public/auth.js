    // --- REGISTRATION LOGIC ---
    const registerForm = document.getElementById('registerForm');

    if (registerForm){
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const fullName = document.getElementById('fullName').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const errorMessage = document.getElementById('errorMessage');
        
            // 1. Check kung magkapareho ang password
            if (password !== confirmPassword){
                errorMessage.textContent = 'Passwords do not match';
                errorMessage.classList.remove('hidden');
                return;
            }

            // 2. Client-Side Validation: Checking kung @university.edu.ph ang email domain (Inakyat natin dito!)
            if (!email.endsWith('@university.edu.ph')) {
                errorMessage.textContent = "Please use your official university email (@university.edu.ph).";
                errorMessage.classList.remove('hidden');
                return;
            }

            errorMessage.classList.add('hidden');
            
            try {
                const response = await fetch(API_BASE +'/api/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ fullName, email, password })
                });

                const data = await response.json();
                const successMessage = document.getElementById('successMessage');

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

   // --- LOGIN LOGIC ---
    const loginForm = document.getElementById('loginForm');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Pinipigilan ang pag-refresh ng page

            // Kinukuha ang tinype na email at password
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const loginErrorMessage = document.getElementById('loginErrorMessage');

            try {
                // Ipinapadala sa backend ang data para i-verify sa database
                const response = await fetch(API_BASE + '/api/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (response.ok) {
                    loginErrorMessage.classList.add('hidden');
                    
                    localStorage.setItem('user', JSON.stringify(data.user));
                    localStorage.setItem('token', data.token); 

                    if (data.user.role === 'admin') {
                        window.location.href = 'admin.html';
                    } else {
                        window.location.href = 'feed.html';
                    }
                } else {
                    //  Dito sasaluin kapag mali ang password o email
                    loginErrorMessage.textContent = data.message || "Invalid email or password.";
                    loginErrorMessage.classList.remove('hidden');
                }
            } catch (error) {
                // No connection on node server js      
                console.error("Login Connection Error:", error);
                loginErrorMessage.textContent = "Cannot connect to server. Please try again.";
                loginErrorMessage.classList.remove('hidden');
            }
        });
    }