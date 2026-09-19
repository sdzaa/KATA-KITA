document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('bugReportForm');
    const messageInput = document.getElementById('bugMessage');
    const status = document.getElementById('bugReportStatus');

    form?.addEventListener('submit', async (event) => {
        event.preventDefault();
        const message = messageInput.value.trim();
        if (!message) return;

        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.classList.add('is-loading');
        submitButton.setAttribute('aria-busy', 'true');
        status.textContent = 'Mengirim laporan...';

        try {
            const response = await KatakitaAPI.request('insert', {
                tableName: 'bug_reports',
                username: AppState.getUser() || 'Anonymous',
                message
            });
            if (!response || response.result !== 'success') {
                throw new Error(response?.message || 'Laporan tidak dapat dikirim.');
            }
            form.reset();
            status.textContent = 'Terima kasih. Laporan bug kamu sudah terkirim.';
            status.className = 'report-status success';
        } catch (error) {
            console.error('Error submitting bug report:', error);
            status.textContent = 'Laporan belum terkirim. Silakan coba lagi.';
            status.className = 'report-status error';
        } finally {
            submitButton.disabled = false;
            submitButton.classList.remove('is-loading');
            submitButton.removeAttribute('aria-busy');
        }
    });
});
