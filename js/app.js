class App {
    constructor() {
        this.challenges = JSON.parse(localStorage.getItem('challenges') || '[]');
        this.currentUser = null;
        
        // Enhanced iOS detection
        this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        
        // Fix for iOS Safari touch events
        if ('ontouchstart' in window) {
            document.addEventListener('touchstart', function(){}, {passive: true});
        }
        
        // Apply iOS specific fixes
        if (this.isIOS) {
            this.applyIOSFixes();
        }
    }

    applyIOSFixes() {
        // Add iOS class to body for CSS targeting
        document.body.classList.add('ios-device');
        
        // Fix for potential viewport issues
        const viewportMeta = document.querySelector('meta[name="viewport"]');
        if (viewportMeta) {
            // Ensure proper viewport settings for iOS
            viewportMeta.setAttribute('content', 
                'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
        }
        
        // Fix for iOS click delay
        const attachFastClick = () => {
            const links = document.querySelectorAll('a, button, .nav-item, [onclick]');
            links.forEach(el => {
                el.addEventListener('touchstart', function(e) {
                    e.preventDefault();
                    const clickEvent = new MouseEvent('click', {
                        view: window,
                        bubbles: true,
                        cancelable: true
                    });
                    e.target.dispatchEvent(clickEvent);
                });
            });
        };
        
        // Apply FastClick after page changes
        document.addEventListener('DOMContentLoaded', attachFastClick);
        
        // Reattach after navigation
        const originalNavigate = router.navigate;
        if (originalNavigate) {
            router.navigate = function(route, isPopState) {
                originalNavigate.call(router, route, isPopState);
                setTimeout(attachFastClick, 300);
            };
        }
    }

    
    loadDashboard() {
        let cumplimientoChart = null;  // Variable global para almacenar el gráfico

        const challenges = challengeManager.getUserChallenges();
        const container = document.querySelector('.challenges-container');
        if (!container) return;

        if (challenges.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>No tienes retos activos</h3>
                    <p>¡Comienza creando tu primer reto!</p>
                    <button onclick="router.navigate('new-challenge')" class="btn primary">Crear Reto</button>
                </div>
            `;
            return;
        }

        container.innerHTML = challenges.map(challenge => this.createChallengeCard(challenge)).join('');
        
        app.loadDashboard = function () {
            const challenges = challengeManager.getUserChallenges();
            const container = document.querySelector('.challenges-container');
            if (!container) return;
        
            if (challenges.length === 0) {
                container.innerHTML = `...`;
                return;
            }
        
            container.innerHTML = challenges.map(renderChallenge).join('');
        
            
        };
        
    
    
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
        const currentProgress = challenge.progress || 0;
        const status = progress >= 100 ? 'Completado' : 'En progreso';
        const statusClass = progress >= 100 ? 'status-completed' : 'status-in-progress';
    
        const icon = challenge.icon || '📘'; // Puedes usar emoji o una imagen en base64
    
        const cardHTML = `
            <div class="challenge-card">
                <div class="challenge-icon-header">
                    <div class="progress-circle">
                        <canvas id="progress-${challenge.id}" width="80" height="80"></canvas>
                        <div class="progress-label">${progress}%</div>
                    </div>
                    <div class="challenge-title">
                        <div class="icon">${icon}</div>
                        <h3>${challenge.name}</h3>
                        <span class="challenge-status ${statusClass}">${status}</span>
                    </div>
                </div>
                <p>${challenge.description || ''}</p>
                <div class="challenge-details">
                    <p>Progreso actual: ${currentProgress} ${challenge.unit}</p>
                    <p>Meta: ${challenge.goal || challenge.goalPerInterval} ${challenge.unit}</p>
                </div>
                <button onclick="challengeManager.updateProgress('${challenge.id}')" class="btn secondary">Actualizar Progreso</button>
            </div>
        `;
    
        setTimeout(() => drawCircularProgress(`progress-${challenge.id}`, progress), 0);
    
        return cardHTML;
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
        const current = parseFloat(challenge.progress) || 0;
        const goal = parseFloat(challenge.goalPerInterval) || 0;
        return goal > 0 ? Math.min(Math.round((current / goal) * 100), 100) : 0;
    }
    

    hasProgressOnDay(date) {
        // Implementar lógica para verificar si hay progreso en una fecha específica
        return false;
    }

    getChallenges() {
        return challengeManager.getUserChallenges();
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
}

// Initialize app
const app = new App(); 

function drawCircularProgress(canvasId, percent) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const radius = canvas.width / 2;
    const lineWidth = 8;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Fondo gris
    ctx.beginPath();
    ctx.arc(radius, radius, radius - lineWidth / 2, 0, 2 * Math.PI);
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = lineWidth;
    ctx.stroke();

    // Progreso verde
    ctx.beginPath();
    ctx.arc(radius, radius, radius - lineWidth / 2, -Math.PI / 2, (2 * Math.PI) * (percent / 100) - Math.PI / 2);
    ctx.strokeStyle = '#4caf50';
    ctx.lineWidth = lineWidth;
    ctx.stroke();
}
