/**
 * comfort.js - Logic for Comfort Zone
 * Refactored for maintainability and modularity.
 */

const ComfortManager = {
    MESSAGES: [],

    getMessagesByMood(mood) {
        const normalizedMood = (mood || 'neutral').toString().toLowerCase();
        const filtered = this.MESSAGES.filter(item => {
            return (item.mood || 'neutral').toString().toLowerCase() === normalizedMood;
        });
        return filtered.length > 0 ? filtered : this.MESSAGES;
    },

    getRandomMessage(currentText, mood) {
        const messages = this.getMessagesByMood(mood);
        if (messages.length === 0) return "No sweet messages available.";
        if (messages.length === 1) return messages[0].message;

        let newMessage;
        const cleanCurrent = currentText?.replace(/"/g, '').trim();
        do {
            const candidate = messages[Math.floor(Math.random() * messages.length)];
            newMessage = candidate.message;
        } while (newMessage === cleanCurrent && messages.length > 1);

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

            // Sync with backend Google Sheet
            if (typeof KatakitaAPI !== 'undefined') {
                const user = localStorage.getItem('katakita_user') || 'Friend';
                KatakitaAPI.sync('insert', {
                    tableName: 'saved_items',
                    username: user,
                    items: cleanText
                });
            }

            return true;
        }
        return false;
    },
    saveTrack(track) {
        const saved = JSON.parse(localStorage.getItem('katakita_saved_tracks') || '[]');
        if (!saved.some(t => t.title === track.title)) {
            saved.push(track);
            localStorage.setItem('katakita_saved_tracks', JSON.stringify(saved));

            // Sync with backend Google Sheet
            if (typeof KatakitaAPI !== 'undefined') {
                const user = localStorage.getItem('katakita_user') || 'Friend';
                KatakitaAPI.sync('insert', {
                    tableName: 'saved_items',
                    username: user,
                    items: track.title
                });
            }

            return true;
        }
        return false;
    },
    showSavedModal() {
        const messages = JSON.parse(localStorage.getItem('katakita_saved_messages') || '[]');
        const tracks = JSON.parse(localStorage.getItem('katakita_saved_tracks') || '[]');
        const lang = typeof AppState !== 'undefined' ? AppState.getLanguage() : 'en';
        const trans = typeof TRANSLATIONS !== 'undefined' && TRANSLATIONS[lang] ? TRANSLATIONS[lang] : TRANSLATIONS['en'];

        let content = '<div style="text-align: left; max-height: 400px; overflow-y: auto;">';

        if (messages.length === 0 && tracks.length === 0) {
            content += `<p style="text-align: center; color: var(--color-text-muted);">${trans['comfort_empty_saved'] || 'You haven\'t saved anything yet. Click the bookmark icon on any message or track to save it!'}</p>`;
        } else {
            if (messages.length > 0) {
                content += `<h4 style="margin-bottom: 12px; color: var(--color-primary);">${trans['comfort_saved_message_title'] || 'Saved Messages'}</h4><ul style="padding-left: 20px;">`;
                messages.forEach((m, idx) => {
                    content += `<li onclick="SavedManager.loadMessage('${m.replace(/'/g, "\\'")}')" style="margin-bottom: 12px; font-style: italic; color: var(--color-text-main); cursor: pointer; transition: color 0.2s;" onmouseover="this.style.color='var(--color-primary)'" onmouseout="this.style.color='var(--color-text-main)'">"${m}"</li>`;
                });
                content += '</ul>';
            }
            if (tracks.length > 0) {
                content += `<h4 style="margin-top: 24px; margin-bottom: 12px; color: var(--color-primary);">${trans['comfort_saved_track_title'] || 'Saved Tracks'}</h4><ul style="padding-left: 20px;">`;
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
        if (AudioPlayerUI.tracks.length === 0) return;
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
    tracks: [],
    state: {
        isPlaying: false,
        currentTrackIndex: 0
    },
    selectedMood: 'anxious',
    audio: null,

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
        this.audio = new Audio();
        this.audio.preload = 'metadata';
        this.audio.addEventListener('ended', () => this.nextTrack());
        this.audio.addEventListener('error', () => {
            if (this.elements.audioStatus) {
                this.elements.audioStatus.style.display = 'block';
                this.elements.audioStatus.textContent = 'Audio source unavailable. Please try a different track.';
            }
            if (this.elements.playBtn) {
                this.elements.playBtn.disabled = true;
                this.elements.playBtn.style.cursor = 'not-allowed';
            }
        });
        this.audio.addEventListener('canplaythrough', () => {
            if (this.elements.audioStatus) {
                this.elements.audioStatus.style.display = 'none';
                this.elements.audioStatus.textContent = '';
            }
        });
        this.updateTrackUI();
        this.bindEvents();
    },

    bindEvents() {
        this.elements.playBtn?.addEventListener('click', () => this.togglePlayback());
        this.elements.nextTrackBtn?.addEventListener('click', () => this.nextTrack());
        this.elements.saveTrackBtn?.addEventListener('click', () => this.handleSaveTrack());
    },

    getFilteredTracks() {
        const normalizedMood = (this.selectedMood || 'neutral').toString().toLowerCase();
        const filtered = this.tracks.filter(track => {
            return (track.mood || 'neutral').toString().toLowerCase() === normalizedMood;
        });
        return filtered.length > 0 ? filtered : this.tracks;
    },

    getCurrentTrack() {
        const filteredTracks = this.getFilteredTracks();
        if (filteredTracks.length === 0) return null;
        const index = this.state.currentTrackIndex % filteredTracks.length;
        return filteredTracks[index];
    },

    normalizeUrl(url) {
        if (!url || typeof url !== 'string') return '';
        const trimmed = url.trim();
        // Support Google Drive links - convert to direct download
        const driveRegex = /(?:drive\.google\.com\/(?:file\/d\/([\w-]+)(?:\/view(?:\?[^#]*)?)?|open\?id=([\w-]+)|uc\?export=download&id=([\w-]+))|docs\.google\.com\/uc\?export=download&id=([\w-]+))/i;
        const match = trimmed.match(driveRegex);
        if (match) {
            const fileId = match[1] || match[2] || match[3] || match[4];
            return fileId ? `https://docs.google.com/uc?export=download&id=${fileId}` : trimmed;
        }
        // Return any other URL as-is (Firebase, Supabase, direct URLs, etc.)
        if (/^https?:\/\//.test(trimmed)) {
            return trimmed;
        }
        return '';
    },

    applyCurrentTrackSource() {
        const track = this.getCurrentTrack();
        const trackUrl = track ? this.normalizeUrl(track.url) : '';
        if (!track || !trackUrl) {
            if (this.audio) {
                this.audio.pause();
                this.audio.src = '';
            }
            return;
        }

        if (this.audio && this.audio.src !== trackUrl) {
            this.audio.crossOrigin = 'anonymous';
            this.audio.src = trackUrl;
            this.audio.load();
        }
    },

    updateTrackUI() {
        const track = this.getCurrentTrack();
        if (!track) {
            if (this.elements.audioTitle) {
                this.elements.audioTitle.innerHTML = "No audio tracks available for this mood.";
            }
            if (this.elements.progressBar) {
                this.elements.progressBar.style.width = '0%';
            }
            if (this.elements.playBtn) {
                this.elements.playBtn.disabled = true;
                this.elements.playBtn.style.cursor = 'not-allowed';
            }
            return;
        }

        const normalizedUrl = this.normalizeUrl(track.url);
        if (!normalizedUrl) {
            if (this.elements.audioTitle) {
                this.elements.audioTitle.innerHTML = `"${track.title}" - Narrated by ${track.narrator} (No playable audio URL found)`;
            }
            if (this.elements.playBtn) {
                this.elements.playBtn.disabled = true;
                this.elements.playBtn.style.cursor = 'not-allowed';
            }
            if (this.elements.progressBar) {
                this.elements.progressBar.style.width = '0%';
            }
            return;
        }

        if (this.elements.audioTitle) {
            this.elements.audioTitle.innerHTML = `"${track.title}" - Narrated by ${track.narrator}`;
        }
        if (this.elements.playBtn) {
            this.elements.playBtn.disabled = false;
            this.elements.playBtn.style.cursor = 'pointer';
        }
        if (this.elements.progressBar) {
            this.elements.progressBar.style.width = this.state.isPlaying ? '40%' : '0%';
        }
        if (this.elements.saveTrackBtn) {
            this.elements.saveTrackBtn.style.color = '';
        }
        this.applyCurrentTrackSource();
    },

    handleSaveTrack() {
        const track = this.getCurrentTrack();
        if (!track) return;
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
        const filteredTracks = this.getFilteredTracks();
        if (filteredTracks.length === 0) return;
        this.state.currentTrackIndex = (this.state.currentTrackIndex + 1) % filteredTracks.length;
        this.updateTrackUI();
        this.animateButtonClick(this.elements.nextTrackBtn);
    },

    prevTrack() {
        const filteredTracks = this.getFilteredTracks();
        if (filteredTracks.length === 0) return;
        this.state.currentTrackIndex = (this.state.currentTrackIndex - 1 + filteredTracks.length) % filteredTracks.length;
        this.updateTrackUI();
        this.animateButtonClick(this.elements.nextTrackBtn);
    },

    togglePlayback() {
        const track = this.getCurrentTrack();
        if (!track || !track.url) return;

        this.state.isPlaying = !this.state.isPlaying;
        const { playIcon, pauseIcon, audioStatus, audioCard, progressBar } = this.elements;

        if (this.state.isPlaying) {
            this.applyCurrentTrackSource();
            this.audio.play().catch(err => {
                console.error('Audio playback failed:', err);
                this.state.isPlaying = false;
                if (playIcon) playIcon.style.display = 'block';
                if (pauseIcon) pauseIcon.style.display = 'none';
                if (audioStatus) audioStatus.textContent = 'Playback failed';
            });
            if (playIcon) playIcon.style.display = 'none';
            if (pauseIcon) pauseIcon.style.display = 'block';
            if (audioStatus) audioStatus.textContent = 'Now Playing';
            if (progressBar) progressBar.style.width = '45%';
            audioCard?.classList.add('playing');
            if (typeof AppState !== 'undefined') AppState.checkAndCompleteTask('comfort');
        } else {
            if (this.audio) this.audio.pause();
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
    selectedMood: 'anxious',

    init() {
        const activeSpan = Array.from(this.elements.spans).find(span => span.classList.contains('active'));
        if (activeSpan) {
            this.selectedMood = activeSpan.getAttribute('data-mood') || this.selectedMood;
        }
        this.elements.spans.forEach(span => {
            span.addEventListener('click', () => this.handleMoodChange(span));
        });
        this.renderMoodState();
    },

    handleMoodChange(clickedSpan) {
        // 1. Update active state in selector
        this.elements.spans.forEach(s => s.classList.remove('active'));
        clickedSpan.classList.add('active');

        this.selectedMood = clickedSpan.getAttribute('data-mood') || this.selectedMood;
        this.renderMoodState();
        ComfortUI.applyMood(this.selectedMood);
    },

    renderMoodState() {
        const moodKey = this.selectedMood;
        const moodSpan = Array.from(this.elements.spans).find(span => span.getAttribute('data-mood') === moodKey);
        const moodEmoji = moodSpan ? moodSpan.textContent : '';
        const currentLang = (typeof AppState !== 'undefined' && AppState.getLanguage()) || 'en';
        const moodLabel = (typeof TRANSLATIONS !== 'undefined' && TRANSLATIONS[currentLang]['comfort_mood_label']) || 'Mood';
        const translatedMoodName = moodSpan ? (typeof TRANSLATIONS !== 'undefined' && TRANSLATIONS[currentLang][`mood_${moodKey}`]) || moodSpan.getAttribute('title') : moodKey;

        this.elements.moodBadges.forEach(badge => {
            badge.innerHTML = `<span data-i18n="comfort_mood_label">${moodLabel}</span>: <span data-i18n="mood_${moodKey}">${translatedMoodName}</span> ${moodEmoji}`;
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
        MoodSelector.init();

        if (this.elements.messageText) {
            this.elements.messageText.textContent = "Loading sweet messages...";
        }
        if (AudioPlayerUI.elements.audioTitle) {
            AudioPlayerUI.elements.audioTitle.textContent = "Loading tracks...";
        }

        if (typeof KatakitaAPI !== 'undefined') {
            KatakitaAPI.request('get_data', { tables: ['comfort_messages', 'heartfelt_voices'] })
                .then(response => {
                    if (response && response.result === 'success' && response.data) {
                        if (response.data.comfort_messages) {
                            ComfortManager.MESSAGES = response.data.comfort_messages.map(m => ({
                                message: m.message || '',
                                mood: (m.mood || 'neutral').toString().toLowerCase()
                            }));
                        }
                        if (response.data.heartfelt_voices) {
                            AudioPlayerUI.tracks = response.data.heartfelt_voices.map(v => ({
                                title: v.title || 'Untitled Voice',
                                narrator: v.narrator || 'Unknown',
                                url: v.url || v.Voices || v.voices || v.voice || '',
                                mood: (v.mood || 'neutral').toString().toLowerCase()
                            }));
                        }
                    }

                    this.applyMood(MoodSelector.selectedMood);
                    AudioPlayerUI.init();
                })
                .catch(err => {
                    console.error('Error loading Comfort Zone data:', err);
                    if (this.elements.messageText) {
                        this.elements.messageText.textContent = "Error loading sweet messages.";
                    }
                    AudioPlayerUI.init();
                });
        } else {
            if (this.elements.messageText) {
                this.elements.messageText.textContent = "API not available.";
            }
            AudioPlayerUI.init();
        }
    },

    applyMood(mood) {
        const messageText = this.elements.messageText;
        if (messageText) {
            if (ComfortManager.MESSAGES.length > 0) {
                const text = ComfortManager.getRandomMessage('', mood);
                messageText.textContent = `"${text}"`;
            } else {
                messageText.textContent = "No sweet messages available.";
            }
        }
        AudioPlayerUI.selectedMood = mood;
        AudioPlayerUI.state.currentTrackIndex = 0;
        AudioPlayerUI.updateTrackUI();
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

        const mood = MoodSelector.selectedMood;
        // Transition out
        messageText.style.opacity = '0';
        messageText.style.transform = 'translateY(10px)';
        if (saveMessageBtn) saveMessageBtn.style.color = '';

        setTimeout(() => {
            const newMessage = ComfortManager.getRandomMessage(messageText.textContent, mood);
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
