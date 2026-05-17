/**
 * comfort.js - Logic for Comfort Zone
 * Refactored for maintainability and modularity.
 */

const ComfortManager = {
    MESSAGES: [
        "You have done your best today. It's okay to take a short break.",
        "Take it easy, every small step means a lot for your growth.",
        "You are precious, you are loved, and the world is more beautiful with you in it.",
        "Don't be too hard on yourself. You are making progress, and that is amazing.",
        "Take a deep breath... Exhale slowly. Let the calmness surround you.",
        "Whatever you're feeling right now, know that it's valid and will pass.",
        "You are strong, more than you think. Thank you for holding on until now.",
        "Tomorrow is a new opportunity. For today, let yourself rest peacefully."
    ],

    getRandomMessage(currentText) {
        let newMessage;
        const cleanCurrent = currentText?.replace(/"/g, '').trim();
        do {
            newMessage = this.MESSAGES[Math.floor(Math.random() * this.MESSAGES.length)];
        } while (newMessage === cleanCurrent);
        return newMessage;
    }
};

const SavedManager = {
    saveMessage(text) {
        const saved = JSON.parse(localStorage.getItem('katakita_saved_messages') || '[]');
        const cleanText = text.replace(/"/g, '').trim();
        if (!saved.includes(cleanText)) {
            saved.push(cleanText);
            localStorage.setItem('katakita_saved_messages', JSON.stringify(saved));
            return true;
        }
        return false;
    },
    saveTrack(track) {
        const saved = JSON.parse(localStorage.getItem('katakita_saved_tracks') || '[]');
        if (!saved.some(t => t.title === track.title)) {
            saved.push(track);
            localStorage.setItem('katakita_saved_tracks', JSON.stringify(saved));
            return true;
        }
        return false;
    },
    showSavedModal() {
        const messages = JSON.parse(localStorage.getItem('katakita_saved_messages') || '[]');
        const tracks = JSON.parse(localStorage.getItem('katakita_saved_tracks') || '[]');
        
        let content = '<div style="text-align: left; max-height: 400px; overflow-y: auto;">';
        
        if (messages.length === 0 && tracks.length === 0) {
            content += '<p style="text-align: center; color: var(--color-text-muted);">You haven\'t saved anything yet. Click the bookmark icon on any message or track to save it!</p>';
        } else {
            if (messages.length > 0) {
                content += '<h4 style="margin-bottom: 12px; color: var(--color-primary);">Saved Messages</h4><ul style="padding-left: 20px;">';
                messages.forEach((m, idx) => {
                    content += `<li onclick="SavedManager.loadMessage('${m.replace(/'/g, "\\'")}')" style="margin-bottom: 12px; font-style: italic; color: var(--color-text-main); cursor: pointer; transition: color 0.2s;" onmouseover="this.style.color='var(--color-primary)'" onmouseout="this.style.color='var(--color-text-main)'">"${m}"</li>`;
                });
                content += '</ul>';
            }
            if (tracks.length > 0) {
                content += '<h4 style="margin-top: 24px; margin-bottom: 12px; color: var(--color-primary);">Saved Tracks</h4><ul style="padding-left: 20px;">';
                tracks.forEach(t => {
                    content += `<li onclick="SavedManager.loadTrack('${t.title.replace(/'/g, "\\'")}')" style="margin-bottom: 12px; color: var(--color-text-main); cursor: pointer; transition: color 0.2s;" onmouseover="this.style.color='var(--color-primary)'" onmouseout="this.style.color='var(--color-text-main)'"><b>${t.title}</b> <br><small>Narrated by ${t.narrator}</small></li>`;
                });
                content += '</ul>';
            }
        }
        content += '</div>';
        
        if (typeof showModal === 'function') {
            showModal('Saved Items', content, '🔖');
        }
    },
    loadMessage(text) {
        const messageEl = document.getElementById('comfortMessage');
        if (messageEl) {
            messageEl.style.opacity = '0';
            setTimeout(() => {
                messageEl.textContent = `"${text}"`;
                messageEl.style.opacity = '1';
                // Close modal if it's the global one
                const modal = document.querySelector('.modal-overlay');
                if (modal) modal.remove();
            }, 300);
        }
    },
    loadTrack(title) {
        const trackIdx = AudioPlayerUI.tracks.findIndex(t => t.title === title);
        if (trackIdx !== -1) {
            AudioPlayerUI.state.currentTrackIndex = trackIdx;
            AudioPlayerUI.updateTrackUI();
            // Close modal
            const modal = document.querySelector('.modal-overlay');
            if (modal) modal.remove();
        }
    }
};

const AudioPlayerUI = {
    tracks: [
        { title: "Finding Stillness", narrator: "Exia" },
        { title: "Peaceful Mind", narrator: "Nayya" },
        { title: "Calming Breath", narrator: "Exia" },
        { title: "Inner Strength", narrator: "Nayya" },
        { title: "Morning Serenity", narrator: "Nayya" },
        { title: "Deep Sleep Guide", narrator: "Exia" }
    ],
    state: {
        isPlaying: false,
        currentTrackIndex: 0
    },

    elements: {
        playBtn: document.getElementById('playBtn'),
        playIcon: document.getElementById('playIcon'),
        pauseIcon: document.getElementById('pauseIcon'),
        audioStatus: document.getElementById('audioStatus'),
        audioTitle: document.querySelector('.audio-title'),
        audioCard: document.querySelector('.audio-card'),
        nextTrackBtn: document.getElementById('nextTrackBtn'),
        progressBar: document.querySelector('.progress-bar-fill'),
        saveTrackBtn: document.getElementById('saveTrackBtn')
    },

    init() {
        this.updateTrackUI();
        this.bindEvents();
    },

    bindEvents() {
        this.elements.playBtn?.addEventListener('click', () => this.togglePlayback());
        this.elements.nextTrackBtn?.addEventListener('click', () => this.nextTrack());
        this.elements.saveTrackBtn?.addEventListener('click', () => this.handleSaveTrack());
    },

    updateTrackUI() {
        const track = this.tracks[this.state.currentTrackIndex];
        if (this.elements.audioTitle) {
            this.elements.audioTitle.innerHTML = `"${track.title}" - Narrated by ${track.narrator}`;
        }
        // Randomize progress for visual effect
        if (this.elements.progressBar) {
            this.elements.progressBar.style.width = this.state.isPlaying ? '40%' : '0%';
        }
        // Reset save icon color
        if (this.elements.saveTrackBtn) {
            this.elements.saveTrackBtn.style.color = '';
        }
    },

    handleSaveTrack() {
        const track = this.tracks[this.state.currentTrackIndex];
        if (SavedManager.saveTrack(track)) {
            this.elements.saveTrackBtn.style.color = '#E93B81'; // pink active
            if (typeof showModal === 'function') {
                showModal('Track Saved', `<b>${track.title}</b> has been added to your saved list.`, '✅');
            }
        } else {
            if (typeof showModal === 'function') {
                showModal('Already Saved', 'This track is already in your saved list.', 'ℹ️');
            }
        }
    },

    nextTrack() {
        this.state.currentTrackIndex = (this.state.currentTrackIndex + 1) % this.tracks.length;
        this.updateTrackUI();
        this.animateButtonClick(this.elements.nextBtn);
    },

    prevTrack() {
        this.state.currentTrackIndex = (this.state.currentTrackIndex - 1 + this.tracks.length) % this.tracks.length;
        this.updateTrackUI();
        this.animateButtonClick(this.elements.prevBtn);
    },

    togglePlayback() {
        this.state.isPlaying = !this.state.isPlaying;
        const { playIcon, pauseIcon, audioStatus, audioCard, progressBar } = this.elements;

        if (this.state.isPlaying) {
            if (playIcon) playIcon.style.display = 'none';
            if (pauseIcon) pauseIcon.style.display = 'block';
            if (audioStatus) audioStatus.textContent = 'Now Playing';
            if (progressBar) progressBar.style.width = '45%';
            audioCard?.classList.add('playing');
            if (typeof AppState !== 'undefined') AppState.checkAndCompleteTask('comfort');
        } else {
            if (playIcon) playIcon.style.display = 'block';
            if (pauseIcon) pauseIcon.style.display = 'none';
            if (audioStatus) audioStatus.textContent = 'Paused';
            if (progressBar) progressBar.style.width = '0%';
            audioCard?.classList.remove('playing');
        }
    },

    animateButtonClick(btn) {
        if (!btn) return;
        btn.style.transform = 'scale(0.9)';
        setTimeout(() => btn.style.transform = '', 100);
    }
};

const MoodSelector = {
    elements: {
        spans: document.querySelectorAll('.mood-selector span'),
        moodBadges: document.querySelectorAll('.mood-badge')
    },

    init() {
        this.elements.spans.forEach(span => {
            span.addEventListener('click', () => this.handleMoodChange(span));
        });
    },

    handleMoodChange(clickedSpan) {
        // 1. Update active state in selector
        this.elements.spans.forEach(s => s.classList.remove('active'));
        clickedSpan.classList.add('active');

        // 2. Update all mood badges on the page
        const moodKey = clickedSpan.getAttribute('data-mood');
        const moodEmoji = clickedSpan.textContent;
        
        const currentLang = (typeof AppState !== 'undefined' && AppState.getLanguage()) || 'en';
        const moodLabel = (typeof TRANSLATIONS !== 'undefined' && TRANSLATIONS[currentLang]['comfort_mood_label']) || 'Mood';
        const translatedMoodName = (typeof TRANSLATIONS !== 'undefined' && TRANSLATIONS[currentLang][`mood_${moodKey}`]) || clickedSpan.getAttribute('title');

        this.elements.moodBadges.forEach(badge => {
            badge.innerHTML = `<span data-i18n="comfort_mood_label">${moodLabel}</span>: <span data-i18n="mood_${moodKey}">${translatedMoodName}</span> ${moodEmoji}`;
        });

        // 3. Optional: Add a little animation to badges
        this.elements.moodBadges.forEach(badge => {
            badge.style.transform = 'scale(1.1)';
            setTimeout(() => badge.style.transform = '', 200);
        });
    }
};

const ComfortUI = {
    elements: {
        nextMessageBtn: document.getElementById('nextMessageBtn'),
        messageText: document.getElementById('comfortMessage'),
        messageCard: document.getElementById('messageCard'),
        saveMessageBtn: document.getElementById('saveMessageBtn'),
        savedBtn: document.getElementById('savedBtn')
    },

    init() {
        this.bindEvents();
        AudioPlayerUI.init();
        MoodSelector.init();
    },

    bindEvents() {
        this.elements.nextMessageBtn?.addEventListener('click', () => this.handleNextMessage());
        this.elements.saveMessageBtn?.addEventListener('click', () => this.handleSaveMessage());
        this.elements.savedBtn?.addEventListener('click', () => SavedManager.showSavedModal());
    },

    handleSaveMessage() {
        const text = this.elements.messageText.textContent;
        if (SavedManager.saveMessage(text)) {
            this.elements.saveMessageBtn.style.color = '#E93B81'; // pink active
            if (typeof showModal === 'function') {
                showModal('Message Saved', 'This sweet message has been added to your saved list.', '✅');
            }
        } else {
            if (typeof showModal === 'function') {
                showModal('Already Saved', 'This message is already in your saved list.', 'ℹ️');
            }
        }
    },

    handleNextMessage() {
        const { messageText, messageCard, saveMessageBtn } = this.elements;
        if (!messageText) return;

        // Transition out
        messageText.style.opacity = '0';
        messageText.style.transform = 'translateY(10px)';
        if (saveMessageBtn) saveMessageBtn.style.color = '';

        setTimeout(() => {
            const newMessage = ComfortManager.getRandomMessage(messageText.textContent);
            messageText.textContent = `"${newMessage}"`;

            // Transition in
            messageText.style.opacity = '1';
            messageText.style.transform = 'translateY(0)';
        }, 300);

        // Card wiggle animation
        if (messageCard) {
            messageCard.style.transition = 'transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            messageCard.style.transform = `rotate(${(Math.random() - 0.5) * 2}deg) scale(1.02)`;
            setTimeout(() => {
                messageCard.style.transform = '';
            }, 500);
        }
    }
};

document.addEventListener('DOMContentLoaded', () => ComfortUI.init());


document.addEventListener('DOMContentLoaded', () => ComfortUI.init());
