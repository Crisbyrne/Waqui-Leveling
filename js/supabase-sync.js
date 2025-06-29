const SUPABASE_URL = 'https://stazqdexlpoionhweadv.supabase.co';
const SUPABASE_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0YXpxZGV4bHBvaW9uaHdlYWR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExNzE3MTAsImV4cCI6MjA2Njc0NzcxMH0.xTTzu0Ue5GjHMHaZbPPUn9ccn9zPeooAze0W3TfW8PE';

// --- USUARIOS ---
async function fetchUsers() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/users?select=*`, {
    headers: {
      apikey: SUPABASE_API_KEY,
    }
  });
  return await res.json();
}

async function insertUser(user) {
  await fetch(`${SUPABASE_URL}/rest/v1/users`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_API_KEY,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates'
    },
    body: JSON.stringify(user)
  });
}

async function updateUserInSupabase(user) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${user.id}`, {
    method: 'PATCH',
    headers: {
      apikey: SUPABASE_API_KEY,
      'Content-Type': 'application/json',
      Prefer: 'return=representation'
    },
    body: JSON.stringify({
      name: user.name,
      avatar: user.avatar || null,
      stars: user.stars || 0,
      lastStarDate: user.lastStarDate || null
    })
  });

  if (!res.ok) {
    const error = await res.text();
    console.error("❌ Error actualizando usuario:", res.status, error);
    throw new Error("No se pudo actualizar el perfil");
  }

  const updated = await res.json();
  console.log("✅ Usuario actualizado:", updated);
}



// --- RETOS ---
async function fetchChallenges() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/challenges?select=*`, {
    headers: {
      apikey: SUPABASE_API_KEY,
    }
  });
  return await res.json();
}

async function insertChallenge(ch) {
const payload = {
  id: ch.id,                              // UUID generado
  userId: ch.userId,                      // ID del creador
  name: ch.name,
    sharedId: ch.sharedId,

  description: ch.description,
  deadline: ch.deadline,
  unit:ch.unit,
  goalPerInterval: parseFloat(ch.goalPerInterval),
  interval: ch.interval,
  progress: 0,
  history: [],                            // ← asegúrate que sea array, no string
  type: ch.type,
  participants: ch.participants || [],    // debe ser array para jsonb
  category: ch.category,
  icon: ch.icon,
  streak: 0,
  lastResetDate: new Date().toDateString(),
  apuesta: ch.apuesta || null             // jsonb (puede ser null u objeto)
};


  console.log("Payload enviado a Supabase:", payload); // ✅ ya está definido

  const res = await fetch(`${SUPABASE_URL}/rest/v1/challenges`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_API_KEY,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates'
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    console.error('insertChallenge →', res.status, await res.text());
    throw new Error('No se pudo insertar el reto en Supabase');
  }
}


async function updateChallenge(challenge) {
  console.log("📦 Enviando actualización a Supabase:", challenge);

  const res = await fetch(`${SUPABASE_URL}/rest/v1/challenges?id=eq.${challenge.id}`, {
    method: 'PATCH',
    headers: {
      apikey: SUPABASE_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(challenge)
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("❌ Supabase error:", res.status, errorText);
    throw new Error("Error al actualizar reto");
  } else {
    console.log("✅ Supabase respondió OK");
  }
}


async function deleteChallengeFromSupabase(challengeId) {
  await fetch(`${SUPABASE_URL}/rest/v1/challenges?id=eq.${challengeId}`, {
    method: 'DELETE',
    headers: {
      apikey: SUPABASE_API_KEY,
    }
  });
}

// --- EXPONER FUNCIONES GLOBALES ---
window.fetchUsers = fetchUsers;
window.insertUser = insertUser;
window.updateUserInSupabase = updateUserInSupabase;

window.fetchChallenges = fetchChallenges;
window.insertChallenge = insertChallenge;
window.updateChallenge = updateChallenge;
window.deleteChallengeFromSupabase = deleteChallengeFromSupabase;
