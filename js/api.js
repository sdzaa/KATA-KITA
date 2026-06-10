/**
 * api.js - Centralized API module for KATA-KITA
 * Handles all communication with the Google Apps Script backend.
 */

const KatakitaAPI = {
    // ⚠️ REPLACE THIS WITH YOUR DEPLOYED APPS SCRIPT WEB APP URL ⚠️
    URL: 'https://script.google.com/macros/s/AKfycbx4jeLIsnvzOfyxBdusEcqJ1_LXhwuITdSCAM-ef0yIxXpba4VLL3znwK0KdsXtWp4/exec',

    /**
     * Send a background sync request to the API without blocking the UI
     */
    sync: async function (action, payload) {
        if (this.URL === 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL') {
            console.warn('KatakitaAPI: Please configure your Apps Script URL in js/api.js');
            return null;
        }

        try {
            const data = { action: action, ...payload };

            // Fire and forget (Optimistic Sync)
            fetch(this.URL, {
                method: 'POST',
                body: JSON.stringify(data)
            }).then(response => response.json())
                .then(result => console.log(`[API Sync: ${action}]`, result))
                .catch(err => console.error(`[API Error: ${action}]`, err));

            return true;
        } catch (error) {
            console.error('API Error:', error);
            return false;
        }
    },

    /**
     * Send a synchronous request to the API (wait for response)
     * Used for critical actions like Login or Sign Up
     */
    request: async function (action, payload) {
        if (this.URL === 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL') {
            throw new Error('Please configure your Apps Script URL in js/api.js');
        }

        const data = { action: action, ...payload };

        try {
            const response = await fetch(this.URL, {
                method: 'POST',
                body: JSON.stringify(data)
            });
            return await response.json();
        } catch (error) {
            console.error('API Request Error:', error);
            throw error;
        }
    }
};

window.KatakitaAPI = KatakitaAPI;
