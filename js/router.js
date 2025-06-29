class Router {
    constructor() {
        this.routes = {
            'home': 'home-template',
            'login': 'login-template',
            'register': 'register-template',
            'dashboard': 'dashboard-template',
            'new-challenge': 'new-challenge-template',
            'calendar': 'calendar-template',
            'profile': 'profile-template',
            'informacion': 'informacion-template' ,
            'crew': 'crew-template' 


        };
        
        this.currentRoute = 'home';
        
        // Handle browser back/forward buttons
        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.route) {
                this.navigate(e.state.route, true);
            }
        });
    }

    navigate(route, isPopState = false) {
        // Safari fix: Force small delay to ensure DOM is ready
        setTimeout(() => {
            this._navigateImpl(route, isPopState);
        }, 10);
    }

    _navigateImpl(route, isPopState) {
        try {
            // Check if user is authenticated for protected routes
            const protectedRoutes = ['dashboard', 'new-challenge', 'calendar', 'profile'];
            if (protectedRoutes.includes(route) && !this.isAuthenticated()) {
                route = 'login';
                alert('Por favor, inicia sesión para acceder a esta página');
            }
    
            const templateId = this.routes[route];
            if (!templateId) {
                console.error(`Route "${route}" not found`);
                return;
            }
    
            const template = document.getElementById(templateId);
            if (!template) {
                console.error(`Template "${templateId}" not found`);
                return;
            }
    
            // Update URL and history
            if (!isPopState) {
                const url = route === 'home' ? '/' : `/${route}`;
                window.history.pushState({ route }, '', url);
            }
    
            // Update current route
            this.currentRoute = route;
            // Oculta o muestra la barra según la página
            this.toggleNav(route);

    
            // Clear and update content
            const appContainer = document.getElementById('app');
            if (appContainer) {
                // Safari fix: Use innerHTML with proper template cloning
                const templateContent = template.content.cloneNode(true);
                appContainer.innerHTML = '';
                appContainer.appendChild(templateContent);
            }
    
            // Initialize page-specific logic
            this.initializePage(route);
        } catch (err) {
            console.error('Navigation error:', err);
            // Fallback to home on error
            if (route !== 'home') {
                this.navigate('home');
            }
        }
    }

    isAuthenticated() {
        return sessionStorage.getItem('user') !== null;
    }

        /* ─── Mostrar u ocultar el nav global ─────────────────────────────── */
    toggleNav(route) {
        const nav = document.getElementById('global-nav');
        if (!nav) return;
        const ocultarEn = ['home', 'login', 'register']; // rutas SIN barra
        nav.style.display = ocultarEn.includes(route) ? 'none' : 'block';
    }


    initializePage(route) {
        

            if (route !== 'home') {
        // Esperar 1 segundo antes de detener el confetti
        setTimeout(() => {
            if (window._confettiIntervalId) {
                clearInterval(window._confettiIntervalId);
                window._confettiIntervalId = null;
            }
        }, 10); // puedes ajustar a 500 si prefieres

        // También limpia los elementos visuales existentes
        setTimeout(() => {
            const confettis = document.querySelectorAll('.confetti-home');
            confettis.forEach(c => c.remove());
        }, 2000);
    }


        try {
            switch (route) {
                case 'home':
                    lanzarConfettiInicio(); 
                    break;
                case 'dashboard': 
                    app.loadDashboard();
                    break;
                case 'calendar':
                    setTimeout(() => {
                        const calendarEl = document.getElementById('real-calendar');
                        if (calendarEl) {
                            const calendar = new FullCalendar.Calendar(calendarEl, {
                                initialView: 'dayGridMonth',
                                locale: 'es',
                                headerToolbar: {
                                    left: 'prev,next today',
                                    center: 'title',
                                    right: ''
                                },
                                events: [] // puedes poner eventos reales aquí luego
                            });
                            calendar.render();
                        }
                    }, 100);
                    break;


                case 'profile':
                    app.loadProfile();
                    break;
                case 'new-challenge':
                    const editing = JSON.parse(sessionStorage.getItem('editingChallenge') || 'null');
                    if (editing) {
                        setTimeout(() => {
                            document.getElementById('challenge-name').value = editing.name;
                            document.getElementById('challenge-description').value = editing.description;
                            document.getElementById('challenge-type').value = editing.type;
                            document.getElementById('challenge-unit').value = editing.unit;
                            document.getElementById('challenge-goal-interval').value = editing.goalPerInterval;
                            document.getElementById('challenge-interval').value = editing.interval;
                            if (editing.deadline) {
                                document.getElementById('challenge-deadline').value = editing.deadline;
                            }

                            const predefined = ['lectura', 'deporte'];
                            if (predefined.includes(editing.category)) {
                                document.getElementById('challenge-category').value = editing.category;
                            } else {
                                document.getElementById('challenge-category').value = 'custom';
                                document.getElementById('custom-category').value = editing.category;
                                document.getElementById('custom-category').style.display = 'block';
                            }

                            // Prellenar participantes si es colaborativo
                            if (editing.type === 'colaborativo') {
                                const currentUserId = app.getCurrentUser()?.id;
                                const others = editing.participants?.filter(pid => pid !== currentUserId) || [];
                                const emails = others.map(id => {
                                    const user = auth.users.find(u => u.id === id);
                                    return user?.email || '';
                                }).join(', ');
                                const field = document.getElementById('challenge-participants');
                                if (field) field.value = emails;
                            }
                        }, 50);
                    }

                    // Mostrar u ocultar el campo de participantes dinámicamente
                    setTimeout(() => {
                        const participantsGroup = document.getElementById('participants-group');
                        const typeSelector = document.getElementById('challenge-type');

                        function toggleParticipants() {
                            const value = typeSelector.value;
                            participantsGroup.style.display = (value === 'colaborativo') ? 'block' : 'none';
                        }

                        typeSelector.addEventListener('change', toggleParticipants);
                        toggleParticipants(); // Ejecutar una vez al inicio
                    }, 100);
                    break;

            }
        } catch (err) {
            console.error('Error initializing page:', err);
        }
    }
}

// Initialize router
const router = new Router();

// Navigate to initial route based on URL - with Safari compatibility
document.addEventListener('DOMContentLoaded', () => {
    // Small delay to ensure all resources are loaded (helps Safari)
    setTimeout(() => {
        const path = window.location.pathname.substring(1) || 'home';
        router.navigate(path, true);
    }, 100);
}); 

