/**
 * main.js - Global Logic for KATA-KITA Platform
 * Handles Authentication, Navigation State, and Global Points tracking.
 */

const APP_PREFIX = 'katakita_';

// State Management Functions
const AppState = {
    getUser: () => localStorage.getItem(`${APP_PREFIX}user`),
    setUser: (username) => localStorage.setItem(`${APP_PREFIX}user`, username),
    removeUser: () => localStorage.removeItem(`${APP_PREFIX}user`),

    getDisplayName: () => localStorage.getItem(`${APP_PREFIX}display_name`) || 'Anonymous',
    setDisplayName: (displayName) => localStorage.setItem(`${APP_PREFIX}display_name`, displayName),
    removeDisplayName: () => localStorage.removeItem(`${APP_PREFIX}display_name`),

    getPoints: () => parseInt(localStorage.getItem(`${APP_PREFIX}points`)) || 0,
    addPoints: (amount) => {
        const current = AppState.getPoints();
        const newTotal = current + amount;
        localStorage.setItem(`${APP_PREFIX}points`, newTotal);
        AppState.updatePointsDisplay();

        // Sync points update to Apps Script database
        const user = AppState.getUser();
        if (user && typeof KatakitaAPI !== 'undefined') {
            KatakitaAPI.sync('update_skor', { username: user, points: amount });
        }

        return newTotal;
    },

    updatePointsDisplay: () => {
        const pointsEls = document.querySelectorAll('#userPoints, .user-points-value, .stars-count, #rewardPointsDisplay');
        const points = AppState.getPoints();
        pointsEls.forEach(el => {
            if (el.classList.contains('stars-count')) {
                el.textContent = points.toLocaleString();
            } else if (el.id === 'userPoints' || el.id === 'rewardPointsDisplay') {
                el.textContent = points.toLocaleString();
            } else {
                el.textContent = `${points.toLocaleString()} pts`;
            }
        });

        // Trigger MySpace UI update if on that page
        if (typeof MySpaceUI !== 'undefined' && typeof MySpaceUI.updateRewards === 'function') {
            MySpaceUI.updateRewards();
        }

        // Update user display name in profile if exists
        const user = AppState.getUser();
        const displayName = AppState.getDisplayName();
        const nameEl = document.getElementById('userNameProfile');
        if (nameEl && user) {
            nameEl.textContent = user;
        }

        // Update avatar display if exists
        const avatar = AppState.getAvatar();
        const avatarEls = document.querySelectorAll('#headerAvatar, .profile-avatar');
        if (avatar && avatarEls.length > 0) {
            avatarEls.forEach(el => {
                let src;
                if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
                    src = avatar;
                } else {
                    const ext = avatar.startsWith('avatar') ? 'jpg' : 'png';
                    src = `../images/avatars/${avatar}.${ext}`;
                }
                el.innerHTML = `<img src="${src}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
            });
        }
    },

    getAvatar: () => localStorage.getItem(`${APP_PREFIX}avatar`) || 'avatar1',
    setAvatar: (avatarName) => {
        localStorage.setItem(`${APP_PREFIX}avatar`, avatarName);
        AppState.updatePointsDisplay();
    },

    getTheme: () => localStorage.getItem(`${APP_PREFIX}theme`) || 'light',
    setTheme: (theme) => {
        localStorage.setItem(`${APP_PREFIX}theme`, theme);
        AppState.applyTheme();
    },
    applyTheme: () => {
        const theme = AppState.getTheme();
        document.documentElement.setAttribute('data-theme', theme);
    },

    getLanguage: () => localStorage.getItem(`${APP_PREFIX}language`) || 'id',
    setLanguage: (lang) => {
        localStorage.setItem(`${APP_PREFIX}language`, lang);
        AppState.applyLanguage();
    },
    applyLanguage: () => {
        const lang = AppState.getLanguage();
        const elements = document.querySelectorAll('[data-i18n]');

        if (typeof TRANSLATIONS === 'undefined') {
            console.error('TRANSLATIONS not loaded');
            return;
        }

        elements.forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) {
                // If it's an input or placeholder, handle differently if needed
                if (el.hasAttribute('placeholder')) {
                    el.placeholder = TRANSLATIONS[lang][key];
                } else {
                    el.innerHTML = TRANSLATIONS[lang][key];
                }
            }
        });

        const hideStyle = document.getElementById('lang-hide');
        if (hideStyle) hideStyle.remove();
        if (document.body) document.body.style.visibility = 'visible';

        // Specific updates for complex elements
        const nameGreeting = document.getElementById('homeNameGreeting');
        if (nameGreeting) {
            const greeting = TRANSLATIONS[lang]['home_greeting'] || 'Hello, ';
            const user = AppState.getUser();
            nameGreeting.textContent = `${greeting}${user}!`;
        }
    },

    // Task Tracking Functions
    setPendingTask: (taskType, stars) => {
        localStorage.setItem(`${APP_PREFIX}pending_task`, JSON.stringify({ type: taskType, stars }));
    },

    getPendingTask: () => {
        const raw = localStorage.getItem(`${APP_PREFIX}pending_task`);
        return raw ? JSON.parse(raw) : null;
    },

    clearPendingTask: () => {
        localStorage.removeItem(`${APP_PREFIX}pending_task`);
    },

    checkAndCompleteTask: (taskType) => {
        const pending = AppState.getPendingTask();
        if (pending && pending.type === taskType) {
            AppState.addPoints(pending.stars);

            // Sync task completion to Google Sheets tasks database
            if (typeof KatakitaAPI !== 'undefined') {
                KatakitaAPI.sync('insert', {
                    tableName: 'tasks',
                    task: taskType,
                    skor: pending.stars
                });
            }

            // Use the global showModal function for a premium feel
            if (typeof showModal === 'function') {
                showModal('Task Completed! ✨', `You have successfully finished the task and earned <b>${pending.stars} Stars</b>!`, '⭐');
            } else {
                alert(`Task Completed! You earned ${pending.stars} Stars.`);
            }
            AppState.clearPendingTask();
            return true;
        }
        return false;
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
        window.location.href = 'pages/myspace.html';
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

    // Apply initial language
    AppState.applyLanguage();

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



    // 5. Header Icons Functionality
    const calendarBtn = document.getElementById('headerCalendar');
    const notifBtn = document.getElementById('headerNotif');

    if (calendarBtn) {
        calendarBtn.addEventListener('click', () => {
            const today = new Date().toLocaleDateString('en-US', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            });
            showModal('Your Calendar', `Today is <b>${today}</b>. <br><br>No scheduled activities yet. Take some time for yourself!`, '📅');
        });
    }

    if (notifBtn) {
        notifBtn.addEventListener('click', () => {
            const points = AppState.getPoints();
            showModal('Notifications', `
                <div style="text-align: left;">
                    <p>• You have earned <b>${points} Stars</b> so far!</p>
                    <p>• Don't forget to log your mood today.</p>
                    <p>• 2 new kindness stories are trending.</p>
                </div>
            `, '🔔');
        });
    }
}

// Global Modal Function (Accessible everywhere)
function showModal(title, message, icon = '✨') {
    // Create modal if not exists
    let modalOverlay = document.querySelector('.custom-modal-overlay');
    if (!modalOverlay) {
        modalOverlay = document.createElement('div');
        modalOverlay.className = 'custom-modal-overlay';
        modalOverlay.innerHTML = `
            <div class="custom-modal">
                <span class="modal-icon">${icon}</span>
                <h3 class="modal-title">${title}</h3>
                <div class="modal-body">${message}</div>
                <button class="modal-close-btn">Awesome!</button>
            </div>
        `;
        document.body.appendChild(modalOverlay);

        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay || e.target.classList.contains('modal-close-btn')) {
                modalOverlay.classList.remove('active');
            }
        });
    } else {
        modalOverlay.querySelector('.modal-title').textContent = title;
        modalOverlay.querySelector('.modal-body').innerHTML = message;
        modalOverlay.querySelector('.modal-icon').textContent = icon;
    }

    // Show modal
    setTimeout(() => modalOverlay.classList.add('active'), 10);
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
