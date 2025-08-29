import { authService } from '../../shared/js/authService.js';

document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    if (!authService.hasToken()) {
        // If not, redirect to the main app, which will prompt them to log in.
        window.location.href = '/app/';
        return;
    }

    const grid = document.getElementById('history-grid');
    const loadingState = document.getElementById('loading-state');
    const emptyState = document.getElementById('empty-state');

    async function fetchHistory() {
        try {
            const response = await fetch(`${authService.apiBaseUrl}/users/history`, {
                headers: { 'Authorization': `Bearer ${authService.getToken()}` }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch history.');
            }

            const designs = await response.json();
            loadingState.style.display = 'none';

            if (designs.length === 0) {
                emptyState.style.display = 'block';
            } else {
                renderDesigns(designs);
            }

        } catch (error) {
            console.error("Error fetching history:", error);
            loadingState.innerHTML = '<p>Could not load your designs. Please try again later.</p>';
        }
    }

    function renderDesigns(designs) {
        grid.innerHTML = ''; // Clear the grid
        designs.forEach(design => {
            const card = document.createElement('div');
            card.className = 'design-card';
            card.innerHTML = `
                <img src="${design.image_url}" alt="Generated design">
                <div class="design-card-content">
                    <p class="design-card-prompt"><strong>Prompt:</strong> "${design.prompt}"</p>
                    <div class="design-card-actions">
                        <a href="/app/?edit=${design.id}" class="btn btn-primary edit-button">Edit</a>
                        </div>
                </div>
            `;
            grid.appendChild(card);
        });
    }

    fetchHistory();
});