/**
 * API service for LayoutCraft
 */

class APIService {
    constructor() {
        this.baseURL = window.APP_CONFIG?.API_BASE_URL || 'http://127.0.0.1:8000';
        this.timeout = window.APP_CONFIG?.API_TIMEOUT || 120000; // 2 minutes
    }

    /**
     * Generate image from prompt
     * @param {Object} params - Generation parameters
     * @returns {Promise<Blob>} Generated image blob
     */
    async generateImage({ prompt, width = 1200, height = 630, model = 'gemini-1.5-flash' }) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
            const response = await fetch(`${this.baseURL}/api/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt,
                    width,
                    height,
                    model
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.blob();

        } catch (error) {
            clearTimeout(timeoutId);

            if (error.name === 'AbortError') {
                throw new Error('Request timed out. Please try again with a shorter prompt.');
            }

            if (error.message.includes('Failed to fetch')) {
                throw new Error('Unable to connect to the server. Please ensure the backend is running.');
            }

            throw error;
        }
    }

    /**
     * Check API health
     * @returns {Promise<Object>} Health status
     */
    async checkHealth() {
        try {
            const response = await fetch(`${this.baseURL}/health`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            throw new Error('API is not available');
        }
    }
}

// Create global API service instance
const apiService = new APIService();
  