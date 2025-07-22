/**
 * Application configuration for LayoutCraft
 */

window.APP_CONFIG = {
    // API Configuration
    API_BASE_URL: 'http://127.0.0.1:8000',
    API_TIMEOUT: 120000, // 2 minutes

    // UI Configuration
    MAX_PROMPT_LENGTH: 500,
    DEFAULT_DIMENSIONS: {
        width: 1200,
        height: 630
    },

    // Available models
    AVAILABLE_MODELS: [
        {
            id: 'gemini-1.5-flash',
            name: 'Gemini 1.5 Flash',
            description: 'Fast generation, good quality'
        },
        {
            id: 'gemini-1.5-pro',
            name: 'Gemini 1.5 Pro',
            description: 'Highest quality, slower'
        },
        {
            id: 'gemini-2.0-flash',
            name: 'Gemini 2.0 Flash',
            description: 'Latest model '
        },
        {
            id: 'gemini-2.5-flash',
            name: 'Gemini 2.5 Flash',
            description: 'Latest model (Beta)'
        },
        {
            id: 'gemini-2.5-pro',
            name: 'Gemini 2.5 Pro',
            description: 'Latest model (Beta)'
        }
    ],

    // Dimension presets
    DIMENSION_PRESETS: [
        { name: 'Social Media', width: 1200, height: 630 },
        { name: 'Blog Header', width: 1200, height: 400 },
        { name: 'Square', width: 1080, height: 1080 },
        { name: 'Story', width: 1080, height: 1920 }
    ],

    // Animation settings
    ANIMATION_DURATION: 300,
    LOADING_MESSAGES: [
        'Creating your masterpiece...',
        'Applying AI magic...',
        'Crafting the perfect design...',
        'Almost there...'
    ],

    // Local storage keys
    STORAGE_KEYS: {
        DRAFT: 'layoutcraft-draft',
        HISTORY: 'layoutcraft-history',
        SETTINGS: 'layoutcraft-settings'
    }
};
  

const getBaseURL = () => {
    if (process.env.NODE_ENV === 'production') {
        return 'https://your-domain.com';
    }
    return 'http://localhost:5173';
  };