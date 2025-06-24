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
    // 🆕 Reinicia los retos diarios si ha cambiado el día
    challengeManager.resetDailyChallenges();  

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
}
 
loadCalendar() {
  const el = document.querySelector('#real-calendar');
  if (!el) return;

  /* 1️⃣  Prepara los eventos “día cumplido” */
  const completed = getCompletedDays().map(date => ({
    title: '✔️ Reto completado',
    start: date,
    allDay: true,
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
    textColor: '#ffffff'
  }));

  /* 2️⃣  Instancia/Render FullCalendar */
  const calendar = new FullCalendar.Calendar(el, {
    locale: 'es',
    height: 'auto',
    initialView: 'dayGridMonth',
    events: completed          // ← aquí inyectamos los días cumplidos
  });

  calendar.render();
}



    loadProfile() {
        const user = this.getCurrentUser();
        if (!user) return;

        const container = document.querySelector('.profile-container');
        if (!container) return;

        container.innerHTML = `
            <div class="profile-header">
            <img src="${this.getAvatarBasedOnStreak(user)}" alt="Avatar" class="profile-avatar">
                <h2>${user.name}</h2>
                <p>${user.email}</p>
                <p>⭐= ${user.stars || 0}</p>

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

    // Progreso del día si es diario
    let currentProgress = challenge.progress || 0;
    if (challenge.interval === 'daily') {
        const today = new Date().toDateString();
        const todayEntry = challenge.history?.find(h => new Date(h.date).toDateString() === today);
        currentProgress = todayEntry ? todayEntry.progress : 0;
    }

    let apuestaHTML = '';
    if (challenge.apuesta) {
        const { tipo, detalle } = challenge.apuesta;
        apuestaHTML = `
            <p><strong>Apuesta:</strong> ${detalle.monto} ${detalle.moneda} (${tipo === 'amigos' ? 'Con amigos' : 'Con la plataforma'})</p>
        `;
    }



    const status = progress >= 100 ? 'Completado' : 'En progreso';
    const statusClass = progress >= 100 ? 'status-completed' : 'status-in-progress';
    const icon = challenge.icon || '📘';
const otherProgressHTML = (challenge.type === 'colaborativo' && challenge.participants?.length > 1) ? `
    <div class="participant-progress">
        <h4>Avance de Waqui-Crew:</h4>
        <div class="participant-progress-list">
            ${challenge.participants
                .filter(pid => pid !== app.getCurrentUser().id)
                .map(pid => {
                    const other = challengeManager.challenges.find(c => c.userId === pid && c.sharedId === challenge.sharedId);
                    const user = auth.users.find(u => u.id === pid);
                    const name = user?.name || 'Invitado';
                    const p = other?.progress || 0;
                    const goal = other?.goalPerInterval || 0;
                    const percent = goal > 0 ? Math.min(100, Math.round((p / goal) * 100)) : 0;

                    return `
                        <div class="participant-horizontal">
                            <span class="participant-name">${name}</span>
                            <div class="horizontal-bar">
                                <div class="horizontal-fill" style="width: ${percent}%"></div>
                            </div>
                            <span class="participant-percent">${percent}%</span>
                        </div>
                    `;
                }).join('')}
        </div>
    </div>
` : '';





    const cardHTML = `
        <div class="challenge-card" data-id="${challenge.id}">
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
                <p>Racha: ${challenge.streak || 0} 🔥 días</p>
            </div>
            ${otherProgressHTML}
            ${apuestaHTML}



                        <button onclick="challengeManager.updateProgress('${challenge.id}')" class="btn secondary2">Actualizar Progreso</button>
            <div class="challenge-actions">
                <button onclick="editChallenge('${challenge.id}')" class="btn-icon edit-btn" title="Editar">✏️</button>
                <button onclick="deleteChallenge('${challenge.id}')" class="btn-icon delete-btn" title="Eliminar">🗑️</button>
            </div>
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
        const goal = parseFloat(challenge.goalPerInterval) || 0;

        // 🟨 Para retos diarios, mostrar solo el progreso del día
        let current = parseFloat(challenge.progress) || 0;
        if (challenge.interval === 'daily') {
            const today = new Date().toDateString();
            const todayProgress = challenge.history?.find(h => new Date(h.date).toDateString() === today);
            current = todayProgress ? todayProgress.progress : 0;
        }

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

    getAvatarBasedOnStreak(user) {
    const streak = user.streak || 0;

    // Si tiene una racha de 4 o más días, usa avatar especial
    if (streak >= 4) {
        return 'img/streak-avatar.png'; // Asegúrate de que este archivo exista en esa ruta
    }

    return user.avatar || 'img/default-avatar.png';
}

calculateUserStreak(user) {
    const today = new Date();
    let streak = 0;

    const progressDates = (user.challengeHistory || [])
        .map(h => new Date(h.date).toDateString());

    for (let i = 0; i < 100; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateStr = date.toDateString();

        if (progressDates.includes(dateStr)) {
            streak++;
        } else {
            break;
        }
    }

    return streak;
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
    ctx.strokeStyle = '#D89810';
    ctx.lineWidth = lineWidth;
    ctx.stroke();
}

/* ───────── UTILIDAD: devuelve un array de días cumplidos (ISO yyyy-mm-dd) ───────── */
function getCompletedDays() {
  const user = app.getCurrentUser();
  if (!user) return [];

  const challenges = challengeManager.getUserChallenges();      // ← retos del usuario
  const daysSet = new Set();

  challenges.forEach(ch => {
    const goal = parseFloat(ch.goalPerInterval) || 0;

    (ch.history || []).forEach(h => {
      const prog = h.progress || 0;
      const done = prog >= goal;           // se llegó a la meta del intervalo
      if (done) daysSet.add(h.date.slice(0, 10));  // yyyy-mm-dd
    });
  });

  return Array.from(daysSet);              // → ["2024-05-10","2024-05-12", …]
}


