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
        if (!user) {
            throw new Error('Usuario no autenticado');
        }

        /* ---------- dentro de ChallengeManager.createChallenge ---------- */
        const challenge = {
            id: this.generateUID(),
            userId: user.id,
            name: data.name,
            description: data.description,
            type: data.type,
            unit: data.unit,
            goalPerInterval: parseFloat(data.goalPerInterval),
            interval: data.interval,
            deadline: data.deadline,
            category: data.category,
            icon: data.icon,
            progress: 0,
            createdAt: new Date().toISOString(),
            history: []
          };
          
  

        this.challenges.push(challenge);
        this.saveChanges();

        return challenge;
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
            // Actualiza el progreso y la historia
            challenge.progress += addedProgress;
            challenge.history.push({
                date: new Date().toISOString(),
                progress: challenge.progress
            });
    
            this.saveChanges();
    
            // ✅ En vez de recargar todo el dashboard, solo actualizamos la tarjeta
            const card = document.querySelector(`[data-id="${challengeId}"]`);
            if (card) {
                card.outerHTML = renderChallenge(challenge);
            }
    
        } catch (error) {
            alert('Error al actualizar el progreso: ' + error.message);
        }
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
}

// Inicializar el gestor de retos
const challengeManager = new ChallengeManager();

// Manejar envío del formulario para crear un reto
/* ---------- handleNewChallenge ---------- */
function handleNewChallenge(event) {
    event.preventDefault();
  
    const categorySelect = document.getElementById('challenge-category').value;
    const customCategory = document.getElementById('custom-category').value.trim();
    const category = categorySelect === 'custom' ? customCategory : categorySelect;
    
    const icons = {
      lectura: '📚',
      deporte: '🏃‍♂️',
      custom: '🌀'
    };
    
    const data = {
      name: document.getElementById('challenge-name').value.trim(),
      description: document.getElementById('challenge-description').value.trim(),
      type: document.getElementById('challenge-type').value,
      unit: document.getElementById('challenge-unit').value.trim(),
      goalPerInterval: document.getElementById('challenge-goal-interval').value,
      interval: document.getElementById('challenge-interval').value,
      deadline: document.getElementById('challenge-deadline').value || null,
      category: category,
      icon: icons[categorySelect] || '🌀'
    };
    
  
    try {
      challengeManager.createChallenge(data);
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
    const actual = challenge.progress || 0;

    // Asegurar que goal > 0 antes de calcular porcentaje
    const percent = (goal > 0)
        ? Math.min(100, Math.round((actual / goal) * 100))
        : 0;

    const challengeHTML = `
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
        </div>
    `;
    return challengeHTML;
}










