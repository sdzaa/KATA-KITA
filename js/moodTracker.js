/**
 * moodTracker.js - Logic for My Space (Private Space)
 * Refactored for clean code, state management, and event handling.
 */

const MoodManager = {
    HISTORY_KEY: 'katakita_mood_history',
    DIARY_KEY: 'katakita_diary_content',

    getHistory() {
        return JSON.parse(localStorage.getItem(this.HISTORY_KEY)) || [];
    },

    saveMood(moodObj) {
        const history = this.getHistory();
        const newEntry = {
            ...moodObj,
            timestamp: Date.now()
        };
        history.unshift(newEntry);
        // Limit to 10 entries for prototype
        localStorage.setItem(this.HISTORY_KEY, JSON.stringify(history.slice(0, 10)));
        return newEntry;
    },

    getDiary() {
        return localStorage.getItem(this.DIARY_KEY) || '';
    },

    saveDiary(content) {
        localStorage.setItem(this.DIARY_KEY, content);
    }
};

const MySpaceUI = {
    elements: {
        usernameDisplay: document.getElementById('displayUsername'),
        currentDate: document.getElementById('diaryCurrentDate'),
        diaryInput: document.getElementById('diaryContent'),
        saveDiaryBtn: document.getElementById('saveDiaryBtn'),
        saveMoodBtn: document.getElementById('saveMoodBtn'),
        moodBtns: document.querySelectorAll('.mood-btn'),
        moodHistoryList: document.getElementById('moodHistoryList'),
        pointsDisplay: document.querySelectorAll('.user-points-value')
    },

    state: {
        selectedMood: null
    },

    init() {
        this.setupHeader();
        this.loadDiary();
        this.renderMoodHistory();
        this.bindEvents();
    },

    setupHeader() {
        const user = localStorage.getItem('katakita_user') || 'Friend';
        if (this.elements.usernameDisplay) this.elements.usernameDisplay.textContent = user;

        if (this.elements.currentDate) {
            this.elements.currentDate.textContent = new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
    },

    loadDiary() {
        if (this.elements.diaryInput) {
            this.elements.diaryInput.value = MoodManager.getDiary();
        }
    },

    bindEvents() {
        // Mood Selection
        this.elements.moodBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.elements.moodBtns.forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                this.state.selectedMood = {
                    emoji: btn.textContent,
                    label: btn.dataset.mood
                };
            });
        });

        // Save Mood
        this.elements.saveMoodBtn?.addEventListener('click', () => this.handleSaveMood());

        // Save Diary
        this.elements.saveDiaryBtn?.addEventListener('click', () => this.handleSaveDiary());
    },

    handleSaveMood() {
        if (!this.state.selectedMood) {
            alert('Please pick your mood first!');
            return;
        }

        MoodManager.saveMood(this.state.selectedMood);
        if (typeof AppState !== 'undefined') AppState.addPoints(5);

        this.renderMoodHistory();
        this.showButtonFeedback(this.elements.saveMoodBtn, 'Mood Saved! ✨', 'Save Mood (+5 pts)');
    },

    handleSaveDiary() {
        const content = this.elements.diaryInput?.value.trim();
        if (!content) return;

        MoodManager.saveDiary(content);
        if (typeof AppState !== 'undefined') AppState.addPoints(10);

        this.showButtonFeedback(this.elements.saveDiaryBtn, 'Saved! ✨', 'Save Note (+10 pts)');
    },

    showButtonFeedback(btn, feedbackText, originalText) {
        if (!btn) return;
        const originalStyle = btn.style.cssText;
        
        btn.textContent = feedbackText;
        btn.style.backgroundColor = 'var(--color-secondary)';
        btn.style.color = 'var(--color-text-main)';
        btn.disabled = true;

        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.cssText = originalStyle;
            btn.disabled = false;
        }, 2000);
    },

    renderMoodHistory() {
        if (!this.elements.moodHistoryList) return;
        const history = MoodManager.getHistory();

        if (history.length === 0) {
            this.elements.moodHistoryList.innerHTML = '<li class="mood-history-item">No mood history yet.</li>';
            return;
        }

        this.elements.moodHistoryList.innerHTML = history.map(entry => {
            const date = new Date(entry.timestamp);
            const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            const dateStr = date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
            
            return `
                <li class="mood-history-item animate-fade-in">
                    <span class="mood-history-date">${timeStr}, ${dateStr}</span>
                    <span class="mood-history-emoji">${entry.emoji}</span>
                </li>
            `;
        }).join('');
    }
};

document.addEventListener('DOMContentLoaded', () => MySpaceUI.init());
