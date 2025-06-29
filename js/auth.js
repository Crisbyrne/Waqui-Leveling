class Auth {
  constructor() {
    this.users = []; 
    this.loadUsers();
  }

  async loadUsers() {
    this.users = await fetchUsers();
  }

  generateUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0,
        v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  async register(name, email, password) {
    await this.loadUsers(); // asegurarse de tener la lista más reciente
    if (this.users.some(user => user.email === email)) {
      throw new Error('El email ya está registrado');
    }

    const user = {
      id: this.generateUID(),
      name,
      email,
      password: this.hashPassword(password),
      avatar: null,
      stars: 0,
      createdAt: new Date().toISOString()
    };

    await insertUser(user);
    await this.loadUsers(); // 🔁 vuelve a cargar desde Supabase

    this.users.push(user);
    this.login(email, password); // sesión en local
  }

  async login(email, password) {
    await this.loadUsers();
    const user = this.users.find(u => u.email === email);
    if (!user || user.password !== this.hashPassword(password)) {
      throw new Error('Credenciales inválidas');
    }

    const session = {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      stars: user.stars || 0,
      lastStarDate: user.lastStarDate || null

    };

    sessionStorage.setItem('user', JSON.stringify(session));
    router.navigate('dashboard');
  }

  logout() {
    sessionStorage.removeItem('user');
    app.currentUser = null;
    router.navigate('home');
  }

  hashPassword(password) {
    return btoa(password); // simple para desarrollo
  }
}

// Initialize auth
const auth = new Auth();

// Formularios
function handleRegister(event) {
  event.preventDefault();
  const name = document.getElementById('register-name').value;
  const email = document.getElementById('register-email').value;
  const password = document.getElementById('register-password').value;

  auth.register(name, email, password).catch(error => alert(error.message));
}

function handleLogin(event) {
  event.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  auth.login(email, password).catch(error => alert(error.message));
}

