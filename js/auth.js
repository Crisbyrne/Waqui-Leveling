class Auth {
    constructor() {
        this.users = JSON.parse(localStorage.getItem('users') || '[]');
    }

    generateUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0,
                v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    register(name, email, password) {
        // Validar que el email no esté en uso
        if (this.users.some(user => user.email === email)) {
            throw new Error('El email ya está registrado');
        }

        // Crear nuevo usuario
        const user = {
            id: this.generateUID(),
            name,
            email,
            password: this.hashPassword(password), // En producción usar bcrypt o similar
            avatar: null,
            createdAt: new Date().toISOString()
        };

        // Guardar usuario
        this.users.push(user);
        localStorage.setItem('users', JSON.stringify(this.users));

        // Iniciar sesión automáticamente
        this.login(email, password);
    }

    login(email, password) {
        const user = this.users.find(u => u.email === email);
        if (!user || user.password !== this.hashPassword(password)) {
            throw new Error('Credenciales inválidas');
        }

        // Guardar sesión
        const session = {
            id: user.id,
            name: user.name,
            email: user.email,
            avatar: user.avatar
        };

        localStorage.setItem('user', JSON.stringify(session));
        router.navigate('dashboard');
    }

    logout() {
        localStorage.removeItem('user');
        router.navigate('home');
    }

    hashPassword(password) {
        // En producción usar bcrypt o similar
        return btoa(password);
    }
}

// Initialize auth
const auth = new Auth();

// Handle registration form submission
function handleRegister(event) {
    event.preventDefault();
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;

    try {
        auth.register(name, email, password);
    } catch (error) {
        alert(error.message);
    }
}

// Handle login form submission
function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        auth.login(email, password);
    } catch (error) {
        alert(error.message);
    }
} 