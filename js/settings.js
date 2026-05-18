/**
 * settings.js - Logic for the Settings page
 */

document.addEventListener('DOMContentLoaded', () => {
    // Current state from AppState (initial)
    const initialState = {
        username: AppState.getUser() || 'User',
        avatar: AppState.getAvatar(),
        language: AppState.getLanguage(),
        theme: AppState.getTheme(),
        notif_email: localStorage.getItem('katakita_notif_email') !== 'false',
        notif_push: localStorage.getItem('katakita_notif_push') !== 'false'
    };

    // Pending changes (working state)
    let pendingState = { ...initialState };

    // 1. Tab Switching Navigation
    const sidebarItems = document.querySelectorAll('.settings-sidebar li');
    const settingsSections = document.querySelectorAll('.settings-section');

    sidebarItems.forEach(item => {
        item.addEventListener('click', () => {
            // Update sidebar UI
            sidebarItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            
            // Show corresponding section
            const sectionId = item.getAttribute('data-section');
            settingsSections.forEach(section => {
                if (section.id === `section-${sectionId}`) {
                    section.classList.add('active');
                } else {
                    section.classList.remove('active');
                }
            });
        });
    });

    // 2. Avatar Selection
    const avatarItems = document.querySelectorAll('.avatar-item');
    const updateAvatarUI = (selected) => {
        avatarItems.forEach(item => {
            if (item.getAttribute('data-avatar') === selected) {
                item.classList.add('selected');
            } else {
                item.classList.remove('selected');
            }
        });
    };
    updateAvatarUI(pendingState.avatar);

    avatarItems.forEach(item => {
        item.addEventListener('click', () => {
            pendingState.avatar = item.getAttribute('data-avatar');
            updateAvatarUI(pendingState.avatar);
        });
    });

    // 3. Language Dropdown
    const langSelect = document.getElementById('languageSelect');
    const langDropdown = document.getElementById('languageDropdown');
    const selectedLangText = document.getElementById('selectedLanguage');
    
    if (langSelect && langDropdown) {
        langSelect.addEventListener('click', () => {
            langDropdown.style.display = langDropdown.style.display === 'none' ? 'block' : 'none';
        });

        const langOptions = langDropdown.querySelectorAll('.option');
        
        const updateLanguageUI = (lang) => {
            const opt = Array.from(langOptions).find(o => o.getAttribute('data-lang') === lang);
            if (opt) {
                selectedLangText.innerHTML = opt.querySelector('span').innerHTML;
                langOptions.forEach(o => o.classList.remove('active'));
                opt.classList.add('active');
            }
        };
        updateLanguageUI(pendingState.language);

        langOptions.forEach(opt => {
            opt.addEventListener('click', () => {
                const lang = opt.getAttribute('data-lang');
                pendingState.language = lang;
                updateLanguageUI(lang);
                langDropdown.style.display = 'none';
                
                // Live preview language change
                if (window.TRANSLATIONS) {
                    const elements = document.querySelectorAll('[data-i18n]');
                    elements.forEach(el => {
                        const key = el.getAttribute('data-i18n');
                        if (TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) {
                            if (el.tagName === 'INPUT' && el.placeholder) el.placeholder = TRANSLATIONS[lang][key];
                            else el.innerHTML = TRANSLATIONS[lang][key];
                        }
                    });
                }
            });
        });

        document.addEventListener('click', (e) => {
            if (!langSelect.contains(e.target) && !langDropdown.contains(e.target)) {
                langDropdown.style.display = 'none';
            }
        });
    }

    // 4. Theme Switching
    const lightBtn = document.getElementById('lightModeBtn');
    const darkBtn = document.getElementById('darkModeBtn');
    
    const updateThemeUI = (theme) => {
        if (!lightBtn || !darkBtn) return;
        [lightBtn, darkBtn].forEach(b => b.classList.remove('active'));
        if (theme === 'light') lightBtn.classList.add('active');
        else if (theme === 'dark') darkBtn.classList.add('active');
        
        // Live preview theme
        document.documentElement.setAttribute('data-theme', theme);
    };
    updateThemeUI(pendingState.theme);

    if (lightBtn) lightBtn.addEventListener('click', () => {
        pendingState.theme = 'light';
        updateThemeUI('light');
    });

    if (darkBtn) darkBtn.addEventListener('click', () => {
        pendingState.theme = 'dark';
        updateThemeUI('dark');
    });

    // 5. Notifications
    const emailNotifToggle = document.getElementById('emailNotifToggle');
    const pushNotifToggle = document.getElementById('pushNotifToggle');

    if (emailNotifToggle) {
        emailNotifToggle.addEventListener('change', (e) => {
            pendingState.notif_email = e.target.checked;
        });
    }

    if (pushNotifToggle) {
        pushNotifToggle.addEventListener('change', (e) => {
            pendingState.notif_push = e.target.checked;
        });
    }

    // 6. Username Input
    const usernameInput = document.getElementById('usernameInput');
    if (usernameInput) {
        usernameInput.value = pendingState.username;
        usernameInput.addEventListener('input', (e) => {
            pendingState.username = e.target.value;
        });
    }

    // 7. Footer Buttons
    const saveBtn = document.getElementById('saveChangesBtn');
    const cancelBtn = document.getElementById('cancelBtn');

    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            if (!pendingState.username.trim()) {
                alert('Username cannot be empty');
                return;
            }

            // PERSIST EVERYTHING
            AppState.setUser(pendingState.username);
            AppState.setAvatar(pendingState.avatar);
            AppState.setLanguage(pendingState.language);
            AppState.setTheme(pendingState.theme);
            localStorage.setItem('katakita_notif_email', pendingState.notif_email);
            localStorage.setItem('katakita_notif_push', pendingState.notif_push);

            // Sync with backend database
            KatakitaAPI.sync('update_settings', {
                username: pendingState.username, // using username as the identifier
                avatar: pendingState.avatar,
                display_name: pendingState.username,
                language: pendingState.language,
                theme: pendingState.theme,
                notification: pendingState.notif_push ? 1 : 0
            });

            // Refresh displays
            AppState.updatePointsDisplay();
            
            // Visual Success State
            const originalText = saveBtn.textContent;
            saveBtn.textContent = 'Changes Saved! ✨';
            saveBtn.classList.add('success-btn');
            saveBtn.disabled = true;

            setTimeout(() => {
                saveBtn.textContent = originalText;
                saveBtn.classList.remove('success-btn');
                saveBtn.disabled = false;
                
                // Redirect after save for a better flow
                window.location.href = 'beranda.html';
            }, 1000);
        });
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            // Revert live changes (optional but good)
            document.documentElement.setAttribute('data-theme', initialState.theme);
            // Redirect back
            window.location.href = 'beranda.html';
        });
    }
});
