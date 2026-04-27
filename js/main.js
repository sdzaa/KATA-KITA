/**
 * main.js - Global Logic for KATA-KITA Platform
 * Handles Authentication, Navigation State, and Global Points tracking.
 */

const APP_PREFIX = 'katakita_';

// State Management Functions
const AppState = {
    getUser: () => localStorage.getItem(`${APP_PREFIX}user`),
    setUser: (nickname) => localStorage.setItem(`${APP_PREFIX}user`, nickname),
    removeUser: () => localStorage.removeItem(`${APP_PREFIX}user`),
    
    getPoints: () => parseInt(localStorage.getItem(`${APP_PREFIX}points`)) || 0,
    addPoints: (amount) => {
        const current = AppState.getPoints();
        const newTotal = current + amount;
        localStorage.setItem(`${APP_PREFIX}points`, newTotal);
        AppState.updatePointsDisplay();
        return newTotal;
    },
    
    updatePointsDisplay: () => {
        const pointsEls = document.querySelectorAll('#userPoints, .user-points-value');
        const points = AppState.getPoints();
        pointsEls.forEach(el => {
            // Check if we are using the new dashboard ID or old prototype ID
            if (el.id === 'userPoints') {
                el.textContent = points;
            } else {
                el.textContent = `${points} pts`;
            }
        });

        // Update username display in profile if exists
        const user = AppState.getUser();
        const nameEl = document.getElementById('userNameProfile');
        if (nameEl && user) {
            nameEl.textContent = user;
        }
    },

    getTheme: () => localStorage.getItem(`${APP_PREFIX}theme`) || 'light',
    setTheme: (theme) => {
        localStorage.setItem(`${APP_PREFIX}theme`, theme);
        AppState.applyTheme();
    },
    applyTheme: () => {
        const theme = AppState.getTheme();
        document.documentElement.setAttribute('data-theme', theme);
    }
};

// Authentication Protection
function checkAuth() {
    const isLoginPage = window.location.pathname.endsWith('index.html') || window.location.pathname === '/';
    const user = AppState.getUser();

    if (!user && !isLoginPage) {
        // Not logged in, trying to access protected page
        window.location.href = '../index.html';
    } else if (user && isLoginPage) {
        // Logged in, trying to access login page
        window.location.href = 'pages/beranda.html';
    }
}

// Global UI Setup
function setupGlobals() {
    // Determine active path
    const currentPath = window.location.pathname;
    
    // Set active class on dashboard navigation
    const navLinks = document.querySelectorAll('.sidebar-nav a');
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (currentPath.includes(href) && href !== '#') {
            link.classList.add('active');
        } else {
            // Handle cross-context matching if needed
            link.classList.remove('active');
        }
    });

    // Update Points UI
    AppState.updatePointsDisplay();

    // Setup Logout Listeners
    const logoutBtns = document.querySelectorAll('.logout-btn');
    logoutBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            AppState.removeUser();
            window.location.href = currentPath.includes('/pages/') ? '../index.html' : 'index.html';
        });
    });

    // Setup Theme Toggle Listeners
    const themeToggles = document.querySelectorAll('.theme-toggle-btn');
    themeToggles.forEach(btn => {
        btn.addEventListener('click', () => {
            const currentTheme = AppState.getTheme();
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            AppState.setTheme(newTheme);
        });
    });

    // Page fade in effect
    document.body.style.opacity = '1';
}

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', () => {
    // Apply theme immediately
    AppState.applyTheme();
    
    // Smooth transition trigger
    document.body.style.opacity = '1';
    checkAuth();
    setupGlobals();
});
