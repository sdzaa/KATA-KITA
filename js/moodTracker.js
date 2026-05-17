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
        // Keep at least 31 entries to fill a full month calendar
        localStorage.setItem(this.HISTORY_KEY, JSON.stringify(history.slice(0, 50)));
        return newEntry;
    },

    getDiary() {
        return JSON.parse(localStorage.getItem(this.DIARY_KEY)) || [];
    },

    saveDiary(content) {
        const diary = this.getDiary();
        const newEntry = {
            content,
            timestamp: Date.now()
        };
        diary.unshift(newEntry);
        localStorage.setItem(this.DIARY_KEY, JSON.stringify(diary.slice(0, 50)));
        return newEntry;
    }
};

const MySpaceUI = {
    elements: {},

    state: {
        selectedMood: null
    },

    queryElements() {
        this.elements = {
            usernameDisplay: document.getElementById('displayUsername'),
            currentDate: document.getElementById('diaryCurrentDate'),
            diaryInput: document.getElementById('diaryContent'),
            saveDiaryBtn: document.getElementById('saveDiaryBtn'),
            moodOptions: document.querySelectorAll('.mood-option'),
            calendarGrid: document.getElementById('moodCalendarGrid'),
            calendarTitle: document.getElementById('calendarMonthYear'),
            gaugeValue: document.getElementById('gaugeValue'),
            diaryHistoryList: document.getElementById('diaryHistoryList'),
            pointsDisplay: document.querySelectorAll('.user-points-value')
        };
    },

    init() {
        this.queryElements();
        this.setupHeader();
        this.highlightTodayMood();
        this.renderCalendar();
        this.renderDiaryHistory();
        this.updateGauge();
        this.updateRewards();
        this.bindEvents();
    },

    highlightTodayMood() {
        const history = MoodManager.getHistory();
        const now = new Date();
        const todayMood = history.find(entry => {
            const date = new Date(entry.timestamp);
            return date.getDate() === now.getDate() &&
                date.getMonth() === now.getMonth() &&
                date.getFullYear() === now.getFullYear();
        });

        if (todayMood && this.elements.moodOptions) {
            this.elements.moodOptions.forEach(opt => {
                if (opt.dataset.mood === todayMood.label) {
                    opt.classList.add('selected');
                }
            });
        }
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

        if (this.elements.calendarTitle) {
            this.elements.calendarTitle.textContent = new Date().toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric'
            });
        }
    },

    updateRewards() {
        const points = typeof AppState !== 'undefined' ? AppState.getPoints() : 0;
        const target = 2000;
        const remaining = Math.max(0, target - points);
        const progress = Math.min(100, (points / target) * 100);

        const pointsEl = document.getElementById('rewardPointsDisplay');
        const fillEl = document.getElementById('rewardProgressFill');
        const hintEl = document.getElementById('rewardHintText');

        if (pointsEl) pointsEl.textContent = points.toLocaleString();
        if (fillEl) fillEl.style.width = `${progress}%`;

        if (hintEl) {
            const lang = typeof AppState !== 'undefined' ? AppState.getLanguage() : 'id';
            if (remaining > 0) {
                if (lang === 'id') {
                    hintEl.innerHTML = `Kumpulkan <b>${remaining} bintang</b> lagi<br>untuk reward bulan ini!`;
                } else {
                    hintEl.innerHTML = `Collect <b>${remaining} more stars</b><br>for this month's reward!`;
                }
            } else {
                if (lang === 'id') {
                    hintEl.innerHTML = `Selamat! 🎉<br>Kamu telah mencapai target 2,000 bintang!`;
                } else {
                    hintEl.innerHTML = `Congratulations! 🎉<br>You've reached the 2,000 stars target!`;
                }

                // Show celebratory pop-up if not shown this session
                const popupKey = 'katakita_reward_popup_shown';
                if (!sessionStorage.getItem(popupKey) && typeof showModal === 'function') {
                    const title = lang === 'id' ? 'Target Tercapai! 🏆' : 'Target Reached! 🏆';
                    const msg = lang === 'id' ?
                        'Luar biasa! Kamu telah mengumpulkan <b>2.000 Bintang</b> bulan ini. Kamu hebat dalam menjaga kesehatan mentalmu! ✨' :
                        'Amazing! You have collected <b>2,000 Stars</b> this month. You are doing great taking care of your mental wellbeing! ✨';
                    showModal(title, msg, '🎉');
                    sessionStorage.setItem(popupKey, 'true');
                }
            }
        }
    },

    loadDiary() {
        if (this.elements.diaryInput) {
            this.elements.diaryInput.value = MoodManager.getDiary();
        }
    },

    bindEvents() {
        // Mood Selection - Now saves immediately for better UX
        this.elements.moodOptions.forEach(opt => {
            opt.addEventListener('click', () => {
                const mood = {
                    emoji: opt.textContent,
                    label: opt.dataset.mood
                };

                // Visual feedback on the button
                this.elements.moodOptions.forEach(o => o.classList.remove('selected'));
                opt.classList.add('selected');

                // Save to history
                MoodManager.saveMood(mood);
                if (typeof AppState !== 'undefined') AppState.addPoints(5);

                // Show Confirmation Pop-up
                if (typeof showModal === 'function') {
                    const currentLang = AppState.getLanguage() || 'id';
                    const title = currentLang === 'id' ? 'Mood Tersimpan! ✨' : 'Mood Saved! ✨';
                    const msg = currentLang === 'id' ?
                        `Perasaan <b>${mood.label}</b> kamu telah dicatat di kalender. Terus semangat ya! ❤️` :
                        `Your <b>${mood.label}</b> mood has been recorded in the calendar. Keep going! ❤️`;

                    showModal(title, msg, mood.emoji);
                }

                // Refresh UI components immediately
                this.renderCalendar();
                this.updateGauge();
                this.updateRewards();

                // Pulse animation effect
                opt.style.transform = 'scale(1.3) translateY(-10px)';
                setTimeout(() => opt.style.transform = '', 300);
            });
        });

        // Save Diary
        this.elements.saveDiaryBtn?.addEventListener('click', () => {
            this.handleSaveDiary();
        });

        // Auto-clear placeholder on focus for cleaner experience
        this.elements.diaryInput?.addEventListener('focus', () => {
            this.elements.diaryInput.placeholder = '';
        });

        this.elements.diaryInput?.addEventListener('blur', () => {
            if (this.elements.diaryInput.value === '') {
                const currentLang = AppState.getLanguage() || 'id';
                this.elements.diaryInput.placeholder = TRANSLATIONS[currentLang]?.myspace_diary_placeholder || "Write whatever is on your mind. Only you can see this...";
            }
        });

        // Save on Enter keypress
        this.elements.diaryInput?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault(); // Prevent newline
                this.handleSaveDiary();
            }
        });
    },

    handleSaveDiary() {
        const content = this.elements.diaryInput?.value.trim();
        if (!content) return;

        MoodManager.saveDiary(content);
        if (typeof AppState !== 'undefined') AppState.addPoints(10);

        // Clear input for new stories
        if (this.elements.diaryInput) this.elements.diaryInput.value = '';

        this.renderDiaryHistory();
        this.updateRewards();
        this.showButtonFeedback(this.elements.saveDiaryBtn, 'Saved! ✨', 'Save Diary');
    },

    renderDiaryHistory() {
        if (!this.elements.diaryHistoryList) return;
        const diary = MoodManager.getDiary();

        if (diary.length === 0) {
            this.elements.diaryHistoryList.innerHTML = '<p class="diary-item-content">No diary entries yet.</p>';
            return;
        }

        this.elements.diaryHistoryList.innerHTML = diary.map(entry => {
            const date = new Date(entry.timestamp);
            const dateStr = date.toLocaleDateString('en-US', {
                day: 'numeric', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });

            return `
                <div class="diary-item animate-fade-in">
                    <span class="diary-item-date">${dateStr}</span>
                    <p class="diary-item-content">"${entry.content}"</p>
                </div>
            `;
        }).join('');
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

    updateGauge() {
        if (!this.elements.gaugeValue) return;

        const history = MoodManager.getHistory();
        const counts = {
            'bahagia': 0, 'senang': 0, 'biasa': 0,
            'cemas': 0, 'marah': 0, 'sedih': 0
        };

        // Count frequencies in current month
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        history.forEach(entry => {
            const date = new Date(entry.timestamp);
            if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
                if (counts[entry.label] !== undefined) counts[entry.label]++;
            }
        });

        const total = Object.values(counts).reduce((a, b) => a + b, 0);

        // Calculate Gauge Value (Happiness Index)
        // Grouping: Bahagia = 1.0, senang = 0.8, Biasa = 0.5, Cemas = 0.3, Marah = 0.1, Sedih = 0.0
        const bahagiaCount = counts.bahagia;
        const senangCount = counts.senang;
        const biasaCount = counts.biasa;
        const cemasCount = counts.cemas;
        const marahCount = counts.marah;
        const sedihCount = counts.sedih;

        let weightedIndex = 0.5; // Default middle
        if (total > 0) {
            weightedIndex = (bahagiaCount * 1 + senangCount * 0.7 + biasaCount * 0.5 + cemasCount * 0.3 + marahCount * 0.1 + sedihCount * 0) / total;
        }

        // Arc length for r=40 is ~125.66
        const arcLength = Math.PI * 40;
        const offset = arcLength - (weightedIndex * arcLength);

        this.elements.gaugeValue.style.strokeDasharray = arcLength;
        this.elements.gaugeValue.style.strokeDashoffset = offset;

        // Color based on index
        let strokeColor = '#FDE68A'; // Yellow
        if (weightedIndex < 0.35) strokeColor = '#A7F3D0'; // Green (Cemas)
        else if (weightedIndex < 0.7) strokeColor = '#7DD3FC'; // Blue (Meh)
        this.elements.gaugeValue.style.stroke = strokeColor;
    },

    renderCalendar() {
        if (!this.elements.calendarGrid) return;

        const history = MoodManager.getHistory();
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const prevDaysInMonth = new Date(year, month, 0).getDate();
        const today = now.getDate();

        let html = '';

        // Weekday headers (matching screenshot)
        const weekdays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
        weekdays.forEach(day => {
            html += `<div class="calendar-weekday" style="text-align: center; font-size: 0.75rem; font-weight: 800; color: var(--color-text-muted); padding-bottom: 12px;">${day}</div>`;
        });

        // Previous Month Days (Muted)
        for (let i = firstDay - 1; i >= 0; i--) {
            html += `<div class="calendar-day empty" style="opacity: 0.3;">${prevDaysInMonth - i}</div>`;
        }

        // Current Month Days
        for (let i = 1; i <= daysInMonth; i++) {
            // Find most recent mood for this date
            const dayMood = history.find(entry => {
                const entryDate = new Date(entry.timestamp);
                return entryDate.getDate() === i &&
                    entryDate.getMonth() === month &&
                    entryDate.getFullYear() === year;
            });

            const isToday = (i === today) ? 'is-today' : '';

            if (dayMood && dayMood.emoji) {
                html += `<div class="calendar-day has-mood ${isToday}" title="${dayMood.label}">${dayMood.emoji}</div>`;
            } else {
                html += `<div class="calendar-day ${isToday}">${i}</div>`;
            }
        }

        // Next Month Days to fill the 6-row grid (42 cells total)
        const totalCells = 42;
        const usedCells = firstDay + daysInMonth;
        for (let i = 1; i <= (totalCells - usedCells); i++) {
            html += `<div class="calendar-day empty" style="opacity: 0.3;">${i}</div>`;
        }

        this.elements.calendarGrid.innerHTML = html;
    }
};

document.addEventListener('DOMContentLoaded', () => MySpaceUI.init());
