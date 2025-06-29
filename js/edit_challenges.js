function editChallenge(challengeId) {
    const challenge = challengeManager.getChallenge(challengeId);
    if (!challenge) return alert("Reto no encontrado");

    // Guardar temporalmente el reto a editar
    sessionSStorage.setItem('editingChallenge', JSON.stringify(challenge));

    // Navegar a la pantalla de edición (usamos el mismo template)
    router.navigate('new-challenge');
}

// Asegura que sea visible en HTML al usar onchange=""
window.toggleCustomCategoryInput = function () {
  const selector = document.getElementById('challenge-category');
  const custom = document.getElementById('custom-category');
  if (!selector || !custom) return;

  custom.style.display = (selector.value === 'custom') ? 'block' : 'none';
};
