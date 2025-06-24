function editChallenge(challengeId) {
    const challenge = challengeManager.getChallenge(challengeId);
    if (!challenge) return alert("Reto no encontrado");

    // Guardar temporalmente el reto a editar
    localStorage.setItem('editingChallenge', JSON.stringify(challenge));

    // Navegar a la pantalla de edición (usamos el mismo template)
    router.navigate('new-challenge');
}
