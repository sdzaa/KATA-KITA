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
    }
};

const GratitudeUI = {
    elements: {
        wall: document.getElementById('gratitudeWall'),
        form: document.getElementById('gratitudeForm'),
        modal: document.getElementById('gratitudeModal'),
        openBtn: document.getElementById('openGratitudeBtn'),
        closeBtn: document.getElementById('closeGratitudeModal'),
        contentInput: document.getElementById('gratitudeContent')
    },

    init() {
        this.render();
        this.bindEvents();
    },

    bindEvents() {
        // Modal logic
        this.elements.openBtn?.addEventListener('click', () => this.toggleModal(true));
        this.elements.closeBtn?.addEventListener('click', () => this.toggleModal(false));
        window.addEventListener('click', (e) => {
            if (e.target === this.elements.modal) this.toggleModal(false);
        });

        // Form submission
        this.elements.form?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });

        // Event delegation for reactions
        this.elements.wall?.addEventListener('click', (e) => {
            const btn = e.target.closest('.react-btn');
            if (btn) this.handleReaction(btn);
        });
    },

    toggleModal(show) {
        if (!this.elements.modal) return;
        this.elements.modal.style.display = show ? 'flex' : 'none';
        if (show) this.elements.contentInput?.focus();
    },

    handleSubmit() {
        const content = this.elements.contentInput.value.trim();
        if (!content) return;

        GratitudeManager.addNote(content);
        if (typeof AppState !== 'undefined') AppState.addPoints(5);

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

    render() {
        if (!this.elements.wall) return;
        const notes = GratitudeManager.getData().sort((a, b) => b.timestamp - a.timestamp);
        
        if (notes.length === 0) {
            this.elements.wall.innerHTML = '<p class="text-center w-full" style="color:var(--color-text-muted)">No gratitude notes yet. Hang the first one!</p>';
            return;
        }

        this.elements.wall.innerHTML = notes.map(note => `
            <div class="note animate-fade-in">
                <div class="note-content">"${note.content}"</div>
                <div class="note-footer">
                    <span class="note-date">${new Date(note.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    <button class="react-btn" data-id="${note.id}">
                        🙏 <span>${note.reactions}</span>
                    </button>
                </div>
            </div>
        `).join('');
    }
};

document.addEventListener('DOMContentLoaded', () => GratitudeUI.init());
