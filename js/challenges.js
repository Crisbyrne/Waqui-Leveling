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

        const challenge = {
            id: this.generateUID(),
            userId: user.id,
            name: data.name,
            description: data.description,
            type: data.type,
            unit: data.unit,
            goal: parseFloat(data.goal),
            deadline: data.deadline,
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

        const progress = prompt(`Ingresa el nuevo progreso para ${challenge.name} (${challenge.unit}):`);
        if (progress === null) return;

        const newProgress = parseFloat(progress);
        if (isNaN(newProgress)) {
            alert('Por favor ingresa un número válido');
            return;
        }

        try {
            challenge.progress = newProgress;
            challenge.history.push({
                date: new Date().toISOString(),
                progress: newProgress
            });
            
            this.saveChanges();
            app.loadDashboard(); // Actualizar el dashboard después de cambiar el progreso
            
        } catch (error) {
            alert('Error al actualizar el progreso: ' + error.message);
        }
    }

    getUserChallenges() {
        const user = app.getCurrentUser();
        if (!user || !user.id) return [];

        // Ensure we're strictly comparing IDs
        return this.challenges.filter(challenge => {
            return challenge.userId && challenge.userId === user.id;
        });
    }

    getChallenge(challengeId) {
        const user = app.getCurrentUser();
        if (!user || !user.id) return null;

        const challenge = this.challenges.find(c => c.id === challengeId);
        // Only return the challenge if it belongs to the current user
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

// Initialize challenge manager
const challengeManager = new ChallengeManager();

// Handle new challenge form submission
function handleNewChallenge(event) {
    event.preventDefault();
    
    const data = {
        name: document.getElementById('challenge-name').value,
        description: document.getElementById('challenge-description').value,
        type: document.getElementById('challenge-type').value,
        unit: document.getElementById('challenge-unit').value,
        goal: document.getElementById('challenge-goal').value,
        deadline: document.getElementById('challenge-deadline').value
    };

    try {
        challengeManager.createChallenge(data);
        router.navigate('dashboard');
    } catch (error) {
        alert(error.message);
    }
}

// Handle challenge progress update
function handleProgressUpdate(challengeId) {
    const challenge = challengeManager.getChallenge(challengeId);
    if (!challenge) return;

    const progress = prompt(`Ingresa el nuevo progreso para ${challenge.name} (${challenge.unit}):`);
    if (progress === null) return;

    try {
        challengeManager.updateProgress(challengeId);
    } catch (error) {
        alert(error.message);
    }
} 