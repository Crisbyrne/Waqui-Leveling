class ChallengeManager {
    constructor() {
        this.challenges = JSON.parse(localStorage.getItem('challenges') || '[]');
    }

    generateUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0,
                v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    createChallenge(data) {
    const user = app.getCurrentUser();
    if (!user) throw new Error('Usuario no autenticado');

    const sharedId = this.generateUID(); // ID común entre todos los participantes

    const allParticipants = data.participants || [user.id];
    const icon = data.icon;

    const tipoApuesta = document.getElementById('apuesta-tipo').value;
    const montoApuesta = document.getElementById('apuesta-detalle').value;
    const monedaApuesta = document.getElementById('apuesta-moneda').value;

    const apuesta = (tipoApuesta && montoApuesta)
    ? {
        tipo: tipoApuesta, // 'amigos' o 'plataforma'
        detalle: {
            monto: parseFloat(montoApuesta),
            moneda: monedaApuesta // 'plata' o 'estrellas'
        }
        }
    : null;


    allParticipants.forEach(participantId => {
        const challenge = {
            id: this.generateUID(), // único por participante
            sharedId: sharedId,
            userId: participantId,
            name: data.name,
            description: data.description,
            type: data.type,
            unit: data.unit,
            goalPerInterval: parseFloat(data.goalPerInterval),
            interval: data.interval,
            deadline: data.deadline,
            category: data.category,
            icon: icon,
            participants: allParticipants,
            progress: 0,
            streak: 0,
            createdAt: new Date().toISOString(),
            lastResetDate: new Date().toDateString(),
            history: [],
            apuesta
        };

        this.challenges.push(challenge);
    });

    this.saveChanges();
}


    
    updateProgress(challengeId) {
    const challenge = this.getChallenge(challengeId);
    if (!challenge) {
        alert('Reto no encontrado o no tienes permiso para modificarlo');
        return;
    }

    const input = prompt(`Ingresa cuánto has avanzado en "${challenge.name}" (${challenge.unit}):`);
    if (input === null) return;

    const addedProgress = parseFloat(input);
    if (isNaN(addedProgress)) {
        alert('Por favor ingresa un número válido');
        return;
    }

    try {
        const todayStr = new Date().toDateString();

        // Buscar si ya hay entrada para hoy en el historial
        let todayEntry = challenge.history.find(h => new Date(h.date).toDateString() === todayStr);

        if (todayEntry) {
            todayEntry.progress += addedProgress;
        } else {
            todayEntry = {
                date: new Date().toISOString(),
                progress: addedProgress
            };
            challenge.history.push(todayEntry);
        }

        // Actualizar progreso total
        if (challenge.interval === 'daily') {
            challenge.progress = todayEntry.progress;
        } else {
            challenge.progress += addedProgress;
        }

        challenge.lastResetDate = todayStr;

        this.saveChanges();

        const card = document.querySelector(`[data-id="${challengeId}"]`);
        if (card) {
            card.outerHTML = app.createChallengeCard(challenge);
        }

    } catch (error) {
        alert('Error al actualizar el progreso: ' + error.message);
    }

    const user = app.getCurrentUser();
    const allUsers = auth.users;
    const i = allUsers.findIndex(u => u.id === user.id);
    const today = new Date().toDateString();

    const yaSumoEstrella = user.lastStarDate === today;

    if (progreso >= 100 && !yaSumoEstrella) {
        user.stars = (user.stars || 0) + 1;
        user.lastStarDate = today;

        // Persistir cambios
        allUsers[i] = user;
        localStorage.setItem('users', JSON.stringify(allUsers));
        localStorage.setItem('user', JSON.stringify(user)); // también actualiza sesión
    }

    if (window.location.hash === '#calendar') app.loadCalendar();

}



    
    

    getExpectedProgress(challenge) {
        if (!challenge.goalPerInterval || !challenge.interval) return null;

        const start = new Date(challenge.createdAt);
        const now = new Date();
        const msPerDay = 1000 * 60 * 60 * 24;

        let intervalsPassed = 0;
        switch (challenge.interval) {
            case 'daily':
                intervalsPassed = Math.floor((now - start) / msPerDay);
                break;
            case 'weekly':
                intervalsPassed = Math.floor((now - start) / (msPerDay * 7));
                break;
            case 'monthly':
                intervalsPassed = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
                break;
        }

        return intervalsPassed * challenge.goalPerInterval;
    }

    getUserChallenges() {
        const user = app.getCurrentUser();
        if (!user || !user.id) return [];

        return this.challenges.filter(challenge => challenge.userId === user.id);
    }

    getChallenge(challengeId) {
        const user = app.getCurrentUser();
        if (!user || !user.id) return null;

        const challenge = this.challenges.find(c => c.id === challengeId);
        return challenge && challenge.userId === user.id ? challenge : null;
    }

    deleteChallenge(challengeId) {
        const index = this.challenges.findIndex(c => c.id === challengeId);
        if (index === -1) {
            throw new Error('Reto no encontrado');
        }

        const user = app.getCurrentUser();
        if (!user || this.challenges[index].userId !== user.id) {
            throw new Error('No tienes permiso para eliminar este reto');
        }

        this.challenges.splice(index, 1);
        this.saveChanges();
    }

    saveChanges() {
        localStorage.setItem('challenges', JSON.stringify(this.challenges));
    }

resetDailyChallenges() {
    const today = new Date().toDateString();

    this.challenges.forEach(challenge => {
        if (challenge.interval === 'daily' && challenge.lastResetDate !== today) {
            if (challenge.progress >= challenge.goalPerInterval) {
                challenge.streak = (challenge.streak || 0) + 1;
            } else {
                challenge.streak = 0;
            }

            challenge.progress = 0;
            challenge.lastResetDate = today;
        }
    });

    this.saveChanges();
}




}

// Inicializar el gestor de retos
const challengeManager = new ChallengeManager();

// Manejar envío del formulario para crear un reto
/* ---------- handleNewChallenge ---------- */
function handleNewChallenge(event) {
    event.preventDefault();

    const isEditing = !!localStorage.getItem('editingChallenge');

    const categorySelect = document.getElementById('challenge-category').value;
    const customCategory = document.getElementById('custom-category').value.trim();
    const category = categorySelect === 'custom' ? customCategory : categorySelect;

    const icons = {
        lectura: '📚',
        deporte: '🏃‍♂️',
        custom: '🌀'
    };

    // ✅ AQUÍ es donde debes agregar esto:
    let participants = [app.getCurrentUser().id];

    if (document.getElementById('challenge-type').value === 'colaborativo') {
        const emailsRaw = document.getElementById('challenge-participants');
        if (emailsRaw) {
            const participantEmails = emailsRaw.value
                .split(',')
                .map(e => e.trim())
                .filter(e => e !== '');

            const allUsers = auth.users;

            participantEmails.forEach(email => {
                const user = allUsers.find(u => u.email === email);
                if (user && !participants.includes(user.id)) {
                    participants.push(user.id);
                }
            });
        }
    }


    const data = {
        name: document.getElementById('challenge-name').value.trim(),
        description: document.getElementById('challenge-description').value.trim(),
        type: document.getElementById('challenge-type').value,
        unit: document.getElementById('challenge-unit').value.trim(),
        goalPerInterval: document.getElementById('challenge-goal-interval').value,
        interval: document.getElementById('challenge-interval').value,
        deadline: document.getElementById('challenge-deadline').value || null,
        category: category,
        icon: icons[categorySelect] || '🌀',
        participants: participants // ✅ importante
    };

    if (isEditing) {
        const challenge = JSON.parse(localStorage.getItem('editingChallenge'));
        const index = challengeManager.challenges.findIndex(c => c.id === challenge.id);
        if (index !== -1) {
            challengeManager.challenges[index] = {
                ...challengeManager.challenges[index],
                ...data
            };
            challengeManager.saveChanges();
            localStorage.removeItem('editingChallenge');
            router.navigate('dashboard');
            return;
        }
    }

    try {
        challengeManager.createChallenge(data); // ✅ usa el objeto con participantes
        router.navigate('dashboard');
    } catch (err) {
        alert(err.message);
    }
}


  

// Manejar actualización de progreso
function handleProgressUpdate(challengeId) {
    const challenge = challengeManager.getChallenge(challengeId);
    if (!challenge) return;

    const progress = prompt(`Ingresa el nuevo progreso para ${challenge.name} (${challenge.unit}):`);
    if (progress === null) return;

    try {
        challengeManager.updateProgress(challengeId);

        // Mostrar comparación con progreso esperado
        const expected = challengeManager.getExpectedProgress(challenge);
        if (expected !== null) {
            const mensaje = `Progreso actual: ${challenge.progress}\n` +
                `Progreso esperado según ritmo: ${expected.toFixed(2)}\n` +
                (challenge.progress >= expected ? "¡Vas bien! ✅" : "Estás por debajo del ritmo esperado ⚠️");
            alert(mensaje);
        }

    } catch (error) {
        alert(error.message);
    }
}
function renderChallenge(challenge) {
    const expected = challengeManager.getExpectedProgress(challenge);
    const goal = challenge.goalPerInterval || 0;
    const currentUser = app.getCurrentUser();
    const actual = (challenge.progress?.[currentUser.id] !== undefined)
        ? challenge.progress[currentUser.id]
        : (challenge.progress || 0);

    const percent = (goal > 0)
        ? Math.min(100, Math.round((actual / goal) * 100))
        : 0;

    // Render principal del reto
    let challengeHTML = `
        <div class="challenge-card">
            <h3>${challenge.name}</h3>
            <p>${challenge.description}</p>
            <div class="progress-bar-container">
                <div class="progress-bar" style="width: ${percent}%"></div>
            </div>
            <p>Progreso actual: ${actual} ${challenge.unit}</p>
            <p>Meta: ${goal} ${challenge.unit}</p>
            <p>Completado: ${percent}%</p>
            <button onclick="handleProgressUpdate('${challenge.id}')">Actualizar Progreso</button>
    `;

    // Agregar progreso de compañeros si es colaborativo
    if (challenge.type === 'colaborativo' && challenge.participants?.length > 1) {
        challengeHTML += `<div><strong>Avance de compañeros:</strong></div>`;
        
        challenge.participants.forEach(pid => {
            if (pid !== currentUser.id) {
                const user = auth.users.find(u => u.id === pid);
                const userName = user?.name || user?.email || 'Usuario';
                const userProgress = challenge.progress?.[pid] || 0;
                const userPercent = (goal > 0)
                    ? Math.min(100, Math.round((userProgress / goal) * 100))
                    : 0;

                challengeHTML += `
                    <div style="margin-top: 4px;">
                        <div style="display: flex; justify-content: space-between;">
                            <span>${userName}</span>
                            <span>${userPercent}%</span>
                        </div>
                        <div class="progress-bar-container">
                            <div class="progress-bar" style="width: ${userPercent}%; background-color: #6a1b9a;"></div>
                        </div>
                    </div>
                `;
            }
        });
    }

    challengeHTML += `</div>`; // Cerrar .challenge-card
    return challengeHTML;
}




    // Editar y eliminar retos

function deleteChallenge(challengeId) {
    if (!confirm("¿Estás seguro de que quieres eliminar este reto? Esta acción no se puede deshacer.")) return;

    try {
        challengeManager.deleteChallenge(challengeId);
        app.loadDashboard();  // Recargar después de eliminar
    } catch (error) {
        alert('Error al eliminar el reto: ' + error.message);
    }
}

function editChallenge(challengeId) {
    const challenge = challengeManager.getChallenge(challengeId);
    if (!challenge) return alert("Reto no encontrado");

    // 🟢 Guardar en localStorage para precargar el formulario
    localStorage.setItem('editingChallenge', JSON.stringify(challenge));

    // 🟢 Navegar al formulario de edición (el mismo que crear reto)
    router.navigate('new-challenge');
}









