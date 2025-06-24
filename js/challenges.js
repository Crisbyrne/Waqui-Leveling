class ChallengeManager {
    constructor() {
        // Keep this.challenges for backward compatibility during migration
        this.challenges = JSON.parse(localStorage.getItem('challenges') || '[]');
        this.firebaseDb = firebaseDbService;
    }

    generateUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0,
                v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    async createChallenge(data) {
        const user = app.getCurrentUser();
        if (!user) throw new Error('Usuario no autenticado');

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

        try {
            // Extract participants from input if collaborative
            let participants = [user.id];
            
            if (data.type === 'colaborativo') {
                const emailsInput = document.getElementById('challenge-participants').value;
                if (emailsInput) {
                    const emails = emailsInput.split(',').map(e => e.trim()).filter(e => e);
                    
                    // For Firebase migration, use the actual user IDs instead of emails
                    // Note: In a real app, you would need to query Firebase to get user IDs from emails
                    const foundUsers = auth.users.filter(u => emails.includes(u.email));
                    const participantIds = foundUsers.map(u => u.id);
                    
                    if (participantIds.length > 0) {
                        participants = [user.id, ...participantIds];
                    }
                }
            }
            
            // Create the challenge in Firebase
            data.participants = participants;
            data.icon = icon;
            data.apuesta = apuesta;
            
            await this.firebaseDb.createChallenge(data, user.id);
            
            // For backward compatibility, update the local storage as well
            this.loadChallengesFromFirebase();
            
        } catch (error) {
            console.error("Error creating challenge:", error);
            throw error;
        }
    }
    
    async updateProgress(challengeId) {
        const challenge = await this.getChallengeFromFirebase(challengeId);
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
            // Update progress in Firebase
            const updatedChallenge = await this.firebaseDb.updateProgress(challengeId, addedProgress);
            
            // Update the UI
            const card = document.querySelector(`[data-id="${challengeId}"]`);
            if (card) {
                // Recalculate progress percentage for UI
                const progress = this.firebaseDb.calculateProgress(updatedChallenge);
                updatedChallenge.progressPercentage = progress;
                
                card.outerHTML = app.createChallengeCard(updatedChallenge);
            }
            
            // Check if challenge is completed to award stars
            const user = app.getCurrentUser();
            if (!user) return;
            
            const progress = this.firebaseDb.calculateProgress(updatedChallenge);
            const today = new Date().toDateString();
            const yaSumoEstrella = user.lastStarDate === today;
            
            if (progress >= 100 && !yaSumoEstrella) {
                const newStars = (user.stars || 0) + 1;
                await firebaseAuthService.updateStars(user.id, newStars);
            }
            
            // Refresh challenges from Firebase
            await this.loadChallengesFromFirebase();
            
        } catch (error) {
            console.error("Error updating progress:", error);
            alert('Error al actualizar el progreso: ' + error.message);
        }
    }

    async getExpectedProgress(challenge) {
        if (!challenge.goalPerInterval || !challenge.interval) return null;

        const start = challenge.createdAt instanceof firebase.firestore.Timestamp 
            ? challenge.createdAt.toDate() 
            : new Date(challenge.createdAt);
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

    async getUserChallenges() {
        const user = app.getCurrentUser();
        if (!user || !user.id) return [];

        try {
            // Get challenges from Firebase
            const challenges = await this.firebaseDb.getUserChallenges(user.id);
            
            // Store in local this.challenges for backward compatibility
            this.challenges = challenges;
            
            return challenges;
        } catch (error) {
            console.error("Error getting user challenges:", error);
            // Fallback to local storage if Firebase fails
            return this.challenges.filter(challenge => challenge.userId === user.id);
        }
    }

    async getChallengeFromFirebase(challengeId) {
        try {
            return await this.firebaseDb.getChallenge(challengeId);
        } catch (error) {
            console.error("Error getting challenge from Firebase:", error);
            return null;
        }
    }

    getChallenge(challengeId) {
        const user = app.getCurrentUser();
        if (!user || !user.id) return null;

        // First try from local cache
        const challenge = this.challenges.find(c => c.id === challengeId);
        return challenge && challenge.userId === user.id ? challenge : null;
    }

    async deleteChallenge(challengeId) {
        try {
            // Delete from Firebase
            await this.firebaseDb.deleteChallenge(challengeId);
            
            // Update local cache
            const index = this.challenges.findIndex(c => c.id === challengeId);
            if (index !== -1) {
                this.challenges.splice(index, 1);
                this.saveChanges();
            }
        } catch (error) {
            console.error("Error deleting challenge:", error);
            throw error;
        }
    }

    // For backward compatibility
    saveChanges() {
        localStorage.setItem('challenges', JSON.stringify(this.challenges));
    }

    async resetDailyChallenges() {
        const user = app.getCurrentUser();
        if (!user || !user.id) return;

        try {
            // Reset daily challenges in Firebase
            await this.firebaseDb.resetDailyChallenges(user.id);
            
            // Refresh challenges from Firebase
            await this.loadChallengesFromFirebase();
        } catch (error) {
            console.error("Error resetting daily challenges:", error);
            
            // Fallback to local storage method
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

    async loadChallengesFromFirebase() {
        const user = app.getCurrentUser();
        if (!user || !user.id) return;
        
        try {
            this.challenges = await this.firebaseDb.getUserChallenges(user.id);
            this.saveChanges(); // Update localStorage for backward compatibility
        } catch (error) {
            console.error("Error loading challenges from Firebase:", error);
        }
    }

}

// Inicializar el gestor de retos
const challengeManager = new ChallengeManager();

// Load challenges from Firebase when the app starts
document.addEventListener('DOMContentLoaded', async () => {
    const user = app.getCurrentUser();
    if (user) {
        try {
            await challengeManager.loadChallengesFromFirebase();
        } catch (error) {
            console.error("Error loading initial challenges:", error);
        }
    }
});

// Manejar envío del formulario para crear un reto
/* ---------- handleNewChallenge ---------- */
async function handleNewChallenge(event) {
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
        const emailsInput = document.getElementById('challenge-participants').value;
        if (emailsInput) {
            const emails = emailsInput.split(',').map(e => e.trim()).filter(e => e);
            const foundUsers = auth.users.filter(u => emails.includes(u.email));
            const participantIds = foundUsers.map(u => u.id);
            participants = [...participants, ...participantIds];
        }
    }

    const challengeData = {
        name: document.getElementById('challenge-name').value,
        description: document.getElementById('challenge-description').value,
        category: category,
        type: document.getElementById('challenge-type').value,
        goalPerInterval: document.getElementById('challenge-goal-interval').value,
        unit: document.getElementById('challenge-unit').value,
        interval: document.getElementById('challenge-interval').value,
        deadline: document.getElementById('challenge-deadline').value,
        icon: icons[category] || icons.custom,
        participants: participants
    };

    try {
        if (isEditing) {
            const editingChallenge = JSON.parse(localStorage.getItem('editingChallenge'));
            await challengeManager.firebaseDb.updateChallenge(editingChallenge.id, challengeData);
            localStorage.removeItem('editingChallenge');
        } else {
            await challengeManager.createChallenge(challengeData);
        }
        router.navigate('dashboard');
    } catch (error) {
        console.error("Error handling challenge form:", error);
        alert('Error: ' + error.message);
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









