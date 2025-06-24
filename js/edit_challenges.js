// Edit challenge functionality with Firebase integration
async function editChallenge(challengeId) {
    try {
        // Get challenge from Firebase
        const challenge = await firebaseDbService.getChallenge(challengeId);
        
        if (!challenge) {
            console.error("Challenge not found:", challengeId);
            alert("No se pudo encontrar el reto para editar.");
            return;
        }
        
        // Store challenge in localStorage for the edit form to use
        localStorage.setItem('editingChallenge', JSON.stringify(challenge));
        
        // Navigate to the edit form
        router.navigate('new-challenge');
        
    } catch (error) {
        console.error("Error fetching challenge for edit:", error);
        alert("Error al cargar el reto para editar: " + error.message);
    }
}

// Delete challenge functionality with Firebase integration
async function deleteChallenge(challengeId) {
    if (!confirm("¿Estás seguro de que quieres eliminar este reto? Esta acción no se puede deshacer.")) return;
    
    try {
        // Delete challenge from Firebase
        await firebaseDbService.deleteChallenge(challengeId);
        
        // Remove the challenge card from UI
        const card = document.querySelector(`[data-id="${challengeId}"]`);
        if (card) {
            card.remove();
        }
        
        // Check if dashboard is empty and update UI if needed
        const container = document.querySelector('.challenges-container');
        if (container && !container.querySelector('.challenge-card')) {
            app.loadDashboard(); // Reload the dashboard to show empty state
        }
        
    } catch (error) {
        console.error("Error deleting challenge:", error);
        alert("Error al eliminar el reto: " + error.message);
    }
}

// Toggle custom category input field visibility
function toggleCustomCategoryInput() {
    const categorySelect = document.getElementById('challenge-category');
    const customInput = document.getElementById('custom-category');
    
    if (categorySelect && customInput) {
        customInput.style.display = categorySelect.value === 'custom' ? 'block' : 'none';
    }
}
