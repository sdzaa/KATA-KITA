/**
 * gratitude.js - Handles Gratitude Notes
 * Refactored for better structure and event delegation.
 */

const GratitudeManager = {
    STORAGE_KEY: 'katakita_gratitudes',

    getDefaults() {
        return [
            {
                id: 'g1',
                content: 'Enjoying a warm coffee on a bright morning.',
                timestamp: Date.now() - 86400000,
                reactions: 4
            },
            {
                id: 'g2',
                content: 'Work finished on time today!',
                timestamp: Date.now() - 172800000,
                reactions: 12
            },
            {
                id: 'g3',
                content: 'Still given health to gather with beloved family.',
                timestamp: Date.now() - 43200000,
                reactions: 8
            }
        ];
    },

    getData() {
        const raw = localStorage.getItem(this.STORAGE_KEY);
        if (!raw) {
            const defaults = this.getDefaults();
            this.saveData(defaults);
            return defaults;
        }
        return JSON.parse(raw);
    },

    saveData(data) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    },

    addNote(content) {
        const data = this.getData();
        const newNote = {
            id: 'g_' + Date.now(),
            content,
            timestamp: Date.now(),
            reactions: 0
        };
        data.unshift(newNote);
        this.saveData(data);
        return newNote;
    },

    addReaction(id) {
        const data = this.getData();
        const index = data.findIndex(n => n.id === id);
        if (index > -1) {
            data[index].reactions += 1;
            this.saveData(data);
            return data[index].reactions;
        }
        return null;
    },

    deleteNote(id) {
        let data = this.getData();
        data = data.filter(n => n.id !== id);
        this.saveData(data);
    }
};

const GratitudeUI = {
    elements: {
        wall: document.getElementById('gratitudeWall'),
        form: document.getElementById('gratitudeForm'),
        modal: document.getElementById('gratitudeModal'),
        openBtn: document.getElementById('openGratitudeBtn'),
        closeBtn: document.getElementById('closeGratitudeModal'),
        contentInput: document.getElementById('gratitudeContent'),
        deleteModal: document.getElementById('deleteConfirmModal'),
        cancelDeleteBtn: document.getElementById('cancelDeleteBtn'),
        confirmDeleteBtn: document.getElementById('confirmDeleteBtn'),
        historyModal: document.getElementById('historyModal'),
        openHistoryBtn: document.getElementById('openHistoryBtn'),
        closeHistoryBtn: document.getElementById('closeHistoryModal'),
        historyList: document.getElementById('historyList')
    },

    state: {
        pendingDeleteId: null
    },

    init() {
        this.render();
        this.bindEvents();
    },

    bindEvents() {
        // Modal logic
        this.elements.openBtn?.addEventListener('click', () => this.toggleModal(true));
        this.elements.closeBtn?.addEventListener('click', () => this.toggleModal(false));
        this.elements.openHistoryBtn?.addEventListener('click', () => this.toggleHistoryModal(true));
        this.elements.closeHistoryBtn?.addEventListener('click', () => this.toggleHistoryModal(false));
        
        window.addEventListener('click', (e) => {
            if (e.target === this.elements.modal) this.toggleModal(false);
            if (e.target === this.elements.deleteModal) this.toggleDeleteModal(false);
            if (e.target === this.elements.historyModal) this.toggleHistoryModal(false);
        });

        // Delete Modal logic
        this.elements.cancelDeleteBtn?.addEventListener('click', () => this.toggleDeleteModal(false));
        this.elements.confirmDeleteBtn?.addEventListener('click', () => {
            if (this.state.pendingDeleteId) {
                GratitudeManager.deleteNote(this.state.pendingDeleteId);
                this.state.pendingDeleteId = null;
                this.toggleDeleteModal(false);
                this.render();
            }
        });

        // Form submission
        this.elements.form?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });

        // Event delegation for reactions and deletions
        this.elements.wall?.addEventListener('click', (e) => {
            const reactBtn = e.target.closest('.react-btn');
            const deleteBtn = e.target.closest('.delete-btn');
            
            if (reactBtn) this.handleReaction(reactBtn);
            if (deleteBtn) this.handleDelete(deleteBtn);
        });
    },

    toggleModal(show) {
        if (!this.elements.modal) return;
        this.elements.modal.style.display = show ? 'flex' : 'none';
        if (show) this.elements.contentInput?.focus();
    },

    toggleDeleteModal(show) {
        if (!this.elements.deleteModal) return;
        this.elements.deleteModal.style.display = show ? 'flex' : 'none';
        if (!show) this.state.pendingDeleteId = null;
    },

    toggleHistoryModal(show) {
        if (!this.elements.historyModal) return;
        this.elements.historyModal.style.display = show ? 'flex' : 'none';
        if (show) this.renderHistory();
    },

    handleSubmit() {
        const content = this.elements.contentInput.value.trim();
        if (!content) return;

        GratitudeManager.addNote(content);
        if (typeof AppState !== 'undefined') {
            AppState.addPoints(5);
            AppState.checkAndCompleteTask('gratitude');
        }

        this.elements.form.reset();
        this.toggleModal(false);
        this.render();
    },

    handleReaction(btn) {
        const id = btn.dataset.id;
        const newCount = GratitudeManager.addReaction(id);
        if (newCount !== null) {
            btn.querySelector('span').textContent = newCount;
            // Visual feedback
            btn.style.transform = 'scale(1.4)';
            setTimeout(() => btn.style.transform = 'scale(1)', 200);
        }
    },

    handleDelete(btn) {
        this.state.pendingDeleteId = btn.dataset.id;
        this.toggleDeleteModal(true);
    },

    renderHistory() {
        if (!this.elements.historyList) return;
        const notes = GratitudeManager.getData().sort((a, b) => b.timestamp - a.timestamp);
        const lang = (typeof AppState !== 'undefined') ? AppState.getLanguage() : 'id';
        const locale = lang === 'id' ? 'id-ID' : 'en-US';
        
        if (notes.length === 0) {
            const emptyHistoryMsg = (typeof TRANSLATIONS !== 'undefined' && TRANSLATIONS[lang]['gratitude_empty_history']) || 'No gratitude history yet.';
            this.elements.historyList.innerHTML = `<p style="text-align:center; color: var(--color-text-muted); padding: 20px;">${emptyHistoryMsg}</p>`;
            return;
        }

        this.elements.historyList.innerHTML = notes.map(note => `
            <div style="background: var(--color-bg-primary); padding: 16px; border-radius: 12px; border: 1px solid var(--color-border); display: flex; flex-direction: column; gap: 8px;">
                <div style="font-size: 0.85rem; color: var(--color-text-muted);">
                    ${new Date(note.timestamp).toLocaleDateString(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
                <div style="font-weight: 500; color: var(--color-text-main); font-size: 1.05rem;">
                    "${note.content}"
                </div>
            </div>
        `).join('');
    },

    render() {
        if (!this.elements.wall) return;
        const notes = GratitudeManager.getData().sort((a, b) => b.timestamp - a.timestamp);
        const lang = (typeof AppState !== 'undefined') ? AppState.getLanguage() : 'id';
        const locale = lang === 'id' ? 'id-ID' : 'en-US';

        // Dynamic scaling logic
        if (notes.length >= 16) {
            this.elements.wall.style.setProperty('--note-size', '140px');
            this.elements.wall.style.setProperty('--note-padding', '16px 12px 12px');
            this.elements.wall.style.setProperty('--note-font-size', '1rem');
        } else if (notes.length >= 8) {
            this.elements.wall.style.setProperty('--note-size', '180px');
            this.elements.wall.style.setProperty('--note-padding', '20px 16px 16px');
            this.elements.wall.style.setProperty('--note-font-size', '1.2rem');
        } else {
            this.elements.wall.style.removeProperty('--note-size');
            this.elements.wall.style.removeProperty('--note-padding');
            this.elements.wall.style.removeProperty('--note-font-size');
        }

        if (notes.length === 0) {
            const emptyWallMsg = (typeof TRANSLATIONS !== 'undefined' && TRANSLATIONS[lang]['gratitude_empty_wall']) || 'No gratitude notes yet. Hang the first one!';
            this.elements.wall.innerHTML = `<p class="text-center w-full" style="color:var(--color-text-muted)">${emptyWallMsg}</p>`;
            return;
        }

        this.elements.wall.innerHTML = notes.map(note => `
            <div class="note animate-fade-in">
                <button class="delete-btn" data-id="${note.id}" title="Hapus catatan">✕</button>
                <div class="note-content">"${note.content}"</div>
                <div class="note-footer">
                    <span class="note-date">${new Date(note.timestamp).toLocaleDateString(locale, { month: 'short', day: 'numeric' })}</span>
                    <button class="react-btn" data-id="${note.id}">
                        🙏 <span>${note.reactions}</span>
                    </button>
                </div>
            </div>
        `).join('');
    }
};

document.addEventListener('DOMContentLoaded', () => GratitudeUI.init());
