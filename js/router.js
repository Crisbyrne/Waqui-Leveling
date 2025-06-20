class Router {
    constructor() {
        this.routes = {
            'home': 'home-template',
            'login': 'login-template',
            'register': 'register-template',
            'dashboard': 'dashboard-template',
            'new-challenge': 'new-challenge-template',
            'calendar': 'calendar-template',
            'profile': 'profile-template'
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

        // Clear and update content
        const appContainer = document.getElementById('app');
        appContainer.innerHTML = template.innerHTML;

        // Initialize page-specific logic
        this.initializePage(route);
    }

    isAuthenticated() {
        return localStorage.getItem('user') !== null;
    }

    initializePage(route) {
        switch (route) {
            case 'dashboard':
                app.loadDashboard();
                break;
            case 'calendar':
                app.loadCalendar();
                break;
            case 'profile':
                app.loadProfile();
                break;
        }
    }
}

// Initialize router
const router = new Router();

// Navigate to initial route based on URL
document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname.substring(1) || 'home';
    router.navigate(path, true);
}); 