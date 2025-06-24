class Auth {
    constructor() {
        // Keep this.users for backward compatibility during migration
        this.users = JSON.parse(localStorage.getItem('users') || '[]');
        this.firebaseAuth = firebaseAuthService;
    }

    generateUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0,
                v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    async register(name, email, password) {
        try {
            // Register user with Firebase
            await this.firebaseAuth.register(name, email, password);
            
            // For compatibility with legacy code during migration
            const user = {
                id: this.firebaseAuth.currentUser?.id || this.generateUID(),
                name,
                email,
                password: this.hashPassword(password), // Keep for backward compatibility
                avatar: null,
                stars: 0,
                createdAt: new Date().toISOString()
            };
            
            this.users.push(user);
            localStorage.setItem('users', JSON.stringify(this.users));
            
            // Navigation is handled by the Firebase auth state change listener
        } catch (error) {
            console.error("Registration error:", error.message);
            throw new Error(error.message || 'Error during registration');
        }
    }

    async login(email, password) {
        try {
            // Login with Firebase
            await this.firebaseAuth.login(email, password);
            
            // Navigation is handled by the Firebase auth state change listener
        } catch (error) {
            console.error("Login error:", error.message);
            throw new Error(error.message || 'Invalid credentials');
        }
    }

    async logout() {
        try {
            await this.firebaseAuth.logout();
        } catch (error) {
            console.error("Logout error:", error.message);
            // Fallback to old method if Firebase logout fails
            localStorage.removeItem('user');
            app.currentUser = null;
            router.navigate('home');
        }
    }

    hashPassword(password) {
        // Keep for backward compatibility
        return btoa(password);
    }
}

// Initialize auth
const auth = new Auth();

// Handle registration form submission
async function handleRegister(event) {
    event.preventDefault();
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;

    try {
        await auth.register(name, email, password);
    } catch (error) {
        alert(error.message);
    }
}

// Handle login form submission
async function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        await auth.login(email, password);
    } catch (error) {
        alert(error.message);
    }
} 