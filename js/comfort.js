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

const AudioPlayerUI = {
    state: {
        isPlaying: false
    },

    elements: {
        playBtn: document.getElementById('playBtn'),
        playIcon: document.getElementById('playIcon'),
        pauseIcon: document.getElementById('pauseIcon'),
        audioStatus: document.getElementById('audioStatus'),
        audioCard: document.querySelector('.audio-card'),
        nextBtn: document.getElementById('nextBtn'),
        prevBtn: document.getElementById('prevBtn')
    },

    init() {
        this.bindEvents();
    },

    bindEvents() {
        this.elements.playBtn?.addEventListener('click', () => this.togglePlayback());
        
        [this.elements.nextBtn, this.elements.prevBtn].forEach(btn => {
            btn?.addEventListener('click', () => this.animateButtonClick(btn));
        });
    },

    togglePlayback() {
        this.state.isPlaying = !this.state.isPlaying;
        const { playIcon, pauseIcon, audioStatus, audioCard } = this.elements;

        if (this.state.isPlaying) {
            if (playIcon) playIcon.style.display = 'none';
            if (pauseIcon) pauseIcon.style.display = 'block';
            if (audioStatus) audioStatus.textContent = 'Now Playing';
            audioCard?.classList.add('playing');
        } else {
            if (playIcon) playIcon.style.display = 'block';
            if (pauseIcon) pauseIcon.style.display = 'none';
            if (audioStatus) audioStatus.textContent = 'Paused';
            audioCard?.classList.remove('playing');
        }
    },

    animateButtonClick(btn) {
        btn.style.transform = 'scale(0.9)';
        setTimeout(() => btn.style.transform = '', 100);
    }
};

const ComfortUI = {
    elements: {
        nextMessageBtn: document.getElementById('nextMessageBtn'),
        messageText: document.getElementById('comfortMessage'),
        messageCard: document.getElementById('messageCard')
    },

    init() {
        this.bindEvents();
        AudioPlayerUI.init();
    },

    bindEvents() {
        this.elements.nextMessageBtn?.addEventListener('click', () => this.handleNextMessage());
    },

    handleNextMessage() {
        const { messageText, messageCard } = this.elements;
        if (!messageText) return;

        // Transition out
        messageText.style.opacity = '0';
        messageText.style.transform = 'translateY(10px)';
        
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
