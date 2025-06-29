class ChallengeManager {
  constructor() {
    this.challenges = [];
    this.loadChallenges(); // ← cargar desde Supabase
  }

  async loadChallenges() {
    const user = app.getCurrentUser();
    if (!user) return;

    const allChallenges = await fetchChallenges();
    this.challenges = allChallenges.filter(c => 
      c.userId === user.id || (Array.isArray(c.participants) && c.participants.includes(user.id))
    );
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

  const sharedId = this.generateUID();
  const allParticipants = data.participants || [user.id];
  const icon = data.icon;

  const tipoApuesta = document.getElementById('apuesta-tipo').value;
  const montoApuesta = document.getElementById('apuesta-detalle').value;
  const monedaApuesta = document.getElementById('apuesta-moneda').value;

  const apuesta = (tipoApuesta && montoApuesta)
    ? {
        tipo: tipoApuesta,
        detalle: {
          monto: parseFloat(montoApuesta),
          moneda: monedaApuesta
        }
      }
    : null;

  for (const participantId of allParticipants) {
    const challenge = {
      id: this.generateUID(),
      sharedId,
      userId: participantId,
      name: data.name,
      description: data.description,
      type: data.type,
      unit: data.unit,
      goalPerInterval: parseFloat(data.goalPerInterval),
      interval: data.interval,
      deadline: data.deadline,
      category: data.category,
      icon,
      participants: allParticipants,
      progress: 0,
      streak: 0,
      createdAt: new Date().toISOString(),
      lastResetDate: new Date().toDateString(),
      history: [],
      apuesta
    };

    this.challenges.push(challenge);
    await insertChallenge(challenge); // ← subir a Supabase
  }
}



//updatear reto
async updateProgress(challengeId) {
  const challenge = this.getChallenge(challengeId);
  if (!challenge) return alert('Reto no encontrado o no tienes permiso');

  const modal = document.getElementById('progress-modal');
  const titleEl = document.getElementById('modal-title');
  const currEl = document.getElementById('current-progress');
  const addEl = document.getElementById('added-progress');
  const saveBtn = document.getElementById('save-progress');
  const cancelBtn = document.getElementById('cancel-progress');

  let current = challenge.progress || 0;
  if (challenge.interval === 'daily') {
    const today = new Date().toDateString();
    const entry = challenge.history?.find(h => new Date(h.date).toDateString() === today);
    current = entry ? entry.progress : 0;
  }

  titleEl.textContent = `Actualizar "${challenge.name}" (${challenge.unit})`;
  currEl.value = current;
  addEl.value = '';
  modal.style.display = 'flex';

saveBtn.onclick = async () => {
  // Si se agregó algo extra, sumarlo al valor actual
  const progresoBase = challenge.progress || 0;
  const sumaExtra = parseFloat(addEl.value) || 0;

  let nuevoProgreso;

  if (!isNaN(sumaExtra) && sumaExtra !== 0) {
    nuevoProgreso = progresoBase + sumaExtra;
    currEl.value = nuevoProgreso; // mostrarlo actualizado
  } else {
    nuevoProgreso = parseFloat(currEl.value) || 0;
  }

  const todayStr = new Date().toDateString();
  let todayEntry = challenge.history.find(h => new Date(h.date).toDateString() === todayStr);

  if (todayEntry) {
    todayEntry.progress = nuevoProgreso;
  } else {
    todayEntry = { date: new Date().toISOString(), progress: nuevoProgreso };
    challenge.history.push(todayEntry);
  }

  challenge.progress = (challenge.interval === 'daily')
    ? nuevoProgreso
    : challenge.history.reduce((sum, h) => sum + (h.progress || 0), 0);

  challenge.lastResetDate = todayStr;

    // Estrellas
    const goal = parseFloat(challenge.goalPerInterval) || 0;
    const user = app.getCurrentUser();
    if (nuevoProgreso >= goal && user.lastStarDate !== todayStr) {
      user.stars = (user.stars || 0) + 1;
      user.lastStarDate = todayStr;

      const updatedUser = {
        ...user,
        stars: user.stars,
        lastStarDate: user.lastStarDate
      };

      await updateUserInSupabase(updatedUser); // ← asegúrate de tener esta función
      sessionStorage.setItem('user', JSON.stringify(updatedUser));
    }

    await updateChallenge(challenge); // ← actualiza en Supabase

    const card = document.querySelector(`[data-id="${challengeId}"]`);
    if (card) card.outerHTML = app.createChallengeCard(challenge);

    if (location.hash === '#calendar') app.loadCalendar();
    modal.style.display = 'none';
  };

  cancelBtn.onclick = () => (modal.style.display = 'none');
}

//eliminar reto
async deleteChallenge(challengeId) {
  const index = this.challenges.findIndex(c => c.id === challengeId);
  if (index === -1) {
    throw new Error('Reto no encontrado');
  }

  const user = app.getCurrentUser();
  if (!user || this.challenges[index].userId !== user.id) {
    throw new Error('No tienes permiso para eliminar este reto');
  }

  const confirmed = confirm("¿Estás seguro de que quieres eliminar este reto? Esta acción no se puede deshacer.");
  if (!confirmed) return;

  this.challenges.splice(index, 1);
  await deleteChallengeFromSupabase(challengeId);
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


async resetDailyChallenges() {
  const today = new Date().toDateString();

  for (const challenge of this.challenges) {
    if (challenge.interval === 'daily' && challenge.lastResetDate !== today) {
      if (challenge.progress >= challenge.goalPerInterval) {
        challenge.streak = (challenge.streak || 0) + 1;
      } else {
        challenge.streak = 0;
      }

      challenge.progress = 0;
      challenge.lastResetDate = today;

      await updateChallenge(challenge); // ← actualizar en Supabase
    }
  }
}





}

// Inicializar el gestor de retos
const challengeManager = new ChallengeManager();

// Manejar envío del formulario para crear un reto
/* ---------- handleNewChallenge ---------- */
async function handleNewChallenge(event) {
    event.preventDefault();

    const isEditing = !!sessionStorage.getItem('editingChallenge');

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



            await auth.loadUsers(); // recarga desde Supabase
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
        const challenge = JSON.parse(sessionStorage.getItem('editingChallenge'));
        const index = challengeManager.challenges.findIndex(c => c.id === challenge.id);
        if (index !== -1) {
            challengeManager.challenges[index] = {
                ...challengeManager.challenges[index],
                ...data
            };
          await updateChallenge(challengeManager.challenges[index]);  // ✅ actualización real
          await challengeManager.loadChallenges();                    // ✅ recargar desde Supabase
          sessionStorage.removeItem('editingChallenge');
          router.navigate('dashboard');                               // ✅ forzar redirección
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
    console.log("✅ Entrando al render de avances colaborativos");

if (challenge.type === 'colaborativo' && challenge.participants?.length > 1) {
  challengeHTML += `<div><strong>Avance de compañeros:</strong></div>`;

  // Obtener todos los retos del grupo colaborativo
  const retosDelGrupo = challengeManager.challenges.filter(c => c.sharedId === challenge.sharedId);
  console.log("🔍 Retos del grupo:", retosDelGrupo);

  for (const c of retosDelGrupo) {
    if (c.userId !== currentUser.id) {
      const user = auth.users.find(u => u.id === c.userId);
      const userName = user?.name || user?.email || 'Usuario';
      const userProgress = c.progress || 0;
      const goal = c.goalPerInterval || 0;
      console.log(`👤 ${userName}: progreso = ${c.progress}, meta = ${c.goalPerInterval}`);

      const percent = goal > 0
        ? Math.min(100, Math.round((userProgress / goal) * 100))
        : 0;
      
      challengeHTML += `
        <div style="margin-top: 4px;">
          <div style="display: flex; justify-content: space-between;">
            <span>${userName}</span>
            <span>${percent}%</span>
          </div>
          <div class="progress-bar-container">
            <div class="progress-bar" style="width: ${percent}%; background-color: #6a1b9a;"></div>
          </div>
        </div>
      `;
    }
  }
}



    challengeHTML += `</div>`; // Cerrar .challenge-card
    return challengeHTML;
}




    // Editar y eliminar retos




function editChallenge(challengeId) {
    const challenge = challengeManager.getChallenge(challengeId);
    if (!challenge) return alert("Reto no encontrado");

    // 🟢 Guardar en localStorage para precargar el formulario
    sessionStorage.setItem('editingChallenge', JSON.stringify(challenge));

    // 🟢 Navegar al formulario de edición (el mismo que crear reto)
    router.navigate('new-challenge');
}

function getUserChallenges() {
  return this.challenges; // ya están filtrados en loadChallenges()
}










