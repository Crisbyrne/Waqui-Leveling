function lanzarConfettiInicio() {
  const intervalId = setInterval(() => {
    for (let i = 0; i < 6; i++) {
      const confetti = document.createElement('div');
      confetti.classList.add('confetti', 'confetti-home'); // ← Añadimos clase especial
      const isLeft = Math.random() < 0.5;
      const horizontalPosition = isLeft
        ? Math.random() * 35 + 'vw'
        : (65 + Math.random() * 30) + 'vw';

      confetti.style.left = horizontalPosition;
      confetti.style.animationDuration = (2.5 + Math.random() * 2) + 's';
      confetti.style.backgroundColor = ['#FFD700', '#FF69B4', '#87CEEB', '#4CAF50', '#FF4500'][Math.floor(Math.random() * 5)];

      document.body.appendChild(confetti);
    }
  }, 200);

  // Guardar ID del intervalo para poder cancelarlo luego
  window._confettiIntervalId = intervalId;
}
