/**
 * tasks.js - Logic for the Tasks page
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initial points update
    if (typeof AppState !== 'undefined') {
        AppState.updatePointsDisplay();
    }

    // Function to handle task completion with reset for repeatability
    function markTaskCompleted(card, btn, successText = 'Completed! ✨') {
        const originalText = btn.textContent;
        // Visual feedback for completion
        card.classList.add('completed');
        btn.textContent = successText;
        btn.style.backgroundColor = '#48BB78'; // green success
        btn.disabled = true;
        // Reset after a short delay to allow repeatable action
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.backgroundColor = '';
            btn.disabled = false;
            card.classList.remove('completed');
        }, 3000);
    }

    // 2. Handle Task Button Clicks (all buttons, allow repeatable)
    const taskButtons = document.querySelectorAll('.task-btn');
    
    taskButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const card = btn.closest('.task-card');
            const title = card.querySelector('h3').textContent;
            const starsMatch = title.match(/(\d+)\s+Stars/);
            const stars = starsMatch ? parseInt(starsMatch[1]) : 0;

            const btnText = btn.textContent.trim();
            let taskType = '';
            let url = '';

            if (btnText === 'Go to Education') {
                taskType = 'education';
                url = 'library.html';
            } else if (btnText === 'Post to Wall') {
                taskType = 'gratitude';
                url = 'gratitude.html';
            } else if (btnText === 'Go to Comfort Zone') {
                taskType = 'comfort';
                url = 'comfort.html';
            } else if (btnText === 'Go to Kindness Feed') {
                taskType = 'kindness';
                url = 'beranda.html';
            }

            if (taskType && url) {
                if (typeof AppState !== 'undefined') {
                    AppState.setPendingTask(taskType, stars);
                }
                window.location.href = url;
            }
        });
    });
});
