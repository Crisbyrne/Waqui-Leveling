class App {
    constructor() {
        this.challenges = JSON.parse(localStorage.getItem('challenges') || '[]');
        this.currentUser = null;
    }

    loadDashboard() {
        const challenges = this.getChallenges();
        const container = document.querySelector('.challenges-container');
        if (!container) return;

        container.innerHTML = challenges.map(challenge => this.createChallengeCard(challenge)).join('');
    }

    loadCalendar() {
        const container = document.querySelector('.calendar-container');
        if (!container) return;

        const today = new Date();
        const month = today.getMonth();
        const year = today.getFullYear();

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        
        const days = [];
        for (let i = 0; i < firstDay.getDay(); i++) {
            days.push('');
        }
        
        for (let i = 1; i <= lastDay.getDate(); i++) {
            days.push(i);
        }

        const calendarHTML = `
            <h2>${this.getMonthName(month)} ${year}</h2>
            <div class="calendar-grid">
                ${this.createCalendarDays(days)}
            </div>
        `;

        container.innerHTML = calendarHTML;
    }

    loadProfile() {
        const user = this.getCurrentUser();
        if (!user) return;

        const container = document.querySelector('.profile-container');
        if (!container) return;

        container.innerHTML = `
            <div class="profile-header">
                <img src="${user.avatar || 'img/default-avatar.png'}" alt="Avatar" class="profile-avatar">
                <h2>${user.name}</h2>
                <p>${user.email}</p>
            </div>
            <div class="form-container">
                <div class="form-group">
                    <label>Nombre</label>
                    <input type="text" id="profile-name" value="${user.name}">
                </div>
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" id="profile-email" value="${user.email}" disabled>
                </div>
                <button onclick="app.updateProfile()" class="btn primary">Guardar Cambios</button>
            </div>
        `;
    }

    createChallengeCard(challenge) {
        const progress = this.calculateProgress(challenge);
        return `
            <div class="challenge-card">
                <h3>${challenge.name}</h3>
                <p>${challenge.description}</p>
                <div class="progress-bar">
                    <div class="progress-bar-fill" style="width: ${progress}%"></div>
                </div>
                <p>Progreso: ${progress}%</p>
                <p>Meta: ${challenge.goal} ${challenge.unit}</p>
                <button onclick="app.updateProgress('${challenge.id}')" class="btn secondary">Actualizar Progreso</button>
            </div>
        `;
    }

    createCalendarDays(days) {
        return days.map(day => {
            const hasProgress = day && this.hasProgressOnDay(new Date(2024, new Date().getMonth(), day));
            return `
                <div class="calendar-day ${hasProgress ? 'has-progress' : ''}">
                    ${day || ''}
                </div>
            `;
        }).join('');
    }

    getMonthName(month) {
        const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                       'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        return months[month];
    }

    calculateProgress(challenge) {
        const current = challenge.progress || 0;
        return Math.min(Math.round((current / challenge.goal) * 100), 100);
    }

    hasProgressOnDay(date) {
        // Implementar lógica para verificar si hay progreso en una fecha específica
        return false;
    }

    getChallenges() {
        return this.challenges;
    }

    getCurrentUser() {
        if (!this.currentUser) {
            const userData = localStorage.getItem('user');
            this.currentUser = userData ? JSON.parse(userData) : null;
        }
        return this.currentUser;
    }

    updateProfile() {
        const user = this.getCurrentUser();
        if (!user) return;

        const newName = document.getElementById('profile-name').value;
        user.name = newName;

        localStorage.setItem('user', JSON.stringify(user));
        this.currentUser = user;

        alert('Perfil actualizado correctamente');
    }

    updateProgress(challengeId) {
        const challenge = this.challenges.find(c => c.id === challengeId);
        if (!challenge) return;

        const progress = prompt(`Ingresa el nuevo progreso para ${challenge.name} (${challenge.unit}):`);
        if (progress === null) return;

        const newProgress = parseFloat(progress);
        if (isNaN(newProgress)) {
            alert('Por favor ingresa un número válido');
            return;
        }

        challenge.progress = newProgress;
        localStorage.setItem('challenges', JSON.stringify(this.challenges));
        this.loadDashboard();
    }
}

// Initialize app
const app = new App(); 