/**
 * LayoutCraft Authentication Service
 * Handles all authentication-related API calls and token management
 */

class AuthService {
    constructor(apiBaseUrl) {
        this.apiBaseUrl = apiBaseUrl;
        this.tokenKey = 'layoutcraft_access_token';
        this.proUsedKey = 'layoutcraft_pro_used';
    }

    // ===== TOKEN MANAGEMENT ===== //
    
    /**
     * Save access token to localStorage
     * @param {string} token - JWT access token
     */
    saveToken(token) {
        try {
            localStorage.setItem(this.tokenKey, token);
        } catch (error) {
            console.error('Failed to save token:', error);
        }
    }

    /**
     * Get access token from localStorage
     * @returns {string|null} Access token or null if not found
     */
    getToken() {
        try {
            return localStorage.getItem(this.tokenKey);
        } catch (error) {
            console.warn('Failed to get token:', error);
            return null;
        }
    }

    /**
     * Remove access token from localStorage
     */
    removeToken() {
        try {
            localStorage.removeItem(this.tokenKey);
        } catch (error) {
            console.warn('Failed to remove token:', error);
        }
    }

    /**
     * Check if user has a stored token
     * @returns {boolean}
     */
    hasToken() {
        return !!this.getToken();
    }

    // ===== PRO MODEL TRACKING FOR ANONYMOUS USERS ===== //

    /**
     * Check if anonymous user has used their free Pro generation
     * @returns {boolean}
     */
    hasUsedFreePro() {
        try {
            return localStorage.getItem(this.proUsedKey) === 'true';
        } catch (error) {
            return false;
        }
    }

    /**
     * Mark that anonymous user has used their free Pro generation
     */
    markProAsUsed() {
        try {
            localStorage.setItem(this.proUsedKey, 'true');
        } catch (error) {
            console.warn('Failed to mark Pro as used:', error);
        }
    }

    /**
     * Clear the Pro usage flag (useful when user logs in)
     */
    clearProUsage() {
        try {
            localStorage.removeItem(this.proUsedKey);
        } catch (error) {
            console.warn('Failed to clear Pro usage:', error);
        }
    }

    // ===== HTTP HELPER METHODS ===== //

    /**
     * Make an authenticated API request
     * @param {string} url - API endpoint
     * @param {object} options - Fetch options
     * @returns {Promise<Response>}
     */
    async makeAuthenticatedRequest(url, options = {}) {
        const token = this.getToken();
        
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        return fetch(url, {
            ...options,
            headers
        });
    }

    /**
     * Handle API response and extract JSON or throw error
     * @param {Response} response 
     * @returns {Promise<object>}
     */
    async handleResponse(response) {
        if (!response.ok) {
            let errorMessage = `HTTP ${response.status}`;
            
            try {
                const errorData = await response.json();
                errorMessage = errorData.detail || errorMessage;
            } catch {
                // If JSON parsing fails, use status text
                errorMessage = response.statusText || errorMessage;
            }
            
            throw new Error(errorMessage);
        }

        return response.json();
    }

    // ===== AUTHENTICATION API METHODS ===== //

    /**
     * Register a new user
     * @param {object} userData - User registration data
     * @param {string} userData.email
     * @param {string} userData.password
     * @param {string} userData.full_name
     * @returns {Promise<object>}
     */
    async register(userData) {
        const response = await fetch(`${this.apiBaseUrl}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        return this.handleResponse(response);
    }

    /**
     * Login user
     * @param {object} credentials
     * @param {string} credentials.email
     * @param {string} credentials.password
     * @returns {Promise<object>} Login response with access_token and user data
     */
    async login(credentials) {
        const response = await fetch(`${this.apiBaseUrl}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(credentials)
        });

        const data = await this.handleResponse(response);
        
        // Save token automatically on successful login
        if (data.access_token) {
            this.saveToken(data.access_token);
            // Clear Pro usage flag since logged-in users have unlimited Pro access
            this.clearProUsage();
        }

        return data;
    }

    /**
     * Get current user profile
     * @returns {Promise<object>} User profile data
     */
    async getProfile() {
        const response = await this.makeAuthenticatedRequest(`${this.apiBaseUrl}/auth/profile`);
        return this.handleResponse(response);
    }

    /**
     * Logout user (client-side cleanup)
     * Note: The API has a logout endpoint but we handle it client-side for simplicity
     */
    logout() {
        this.removeToken();
        // Don't clear Pro usage on logout - let them keep their free Pro use
    }

    /**
     * Update user profile
     * @param {object} profileData - Updated profile data
     * @returns {Promise<object>}
     */
    async updateProfile(profileData) {
        const response = await this.makeAuthenticatedRequest(`${this.apiBaseUrl}/auth/profile`, {
            method: 'PUT',
            body: JSON.stringify(profileData)
        });

        return this.handleResponse(response);
    }

    /**
     * Request password reset
     * @param {string} email 
     * @returns {Promise<object>}
     */
    async requestPasswordReset(email) {
        const response = await fetch(`${this.apiBaseUrl}/auth/password-reset`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });

        return this.handleResponse(response);
    }

    /**
     * Delete user account
     * @returns {Promise<object>}
     */
    async deleteAccount() {
        const response = await this.makeAuthenticatedRequest(`${this.apiBaseUrl}/auth/account`, {
            method: 'DELETE'
        });

        const result = await this.handleResponse(response);
        
        // Clean up local storage after successful deletion
        this.removeToken();
        
        return result;
    }

    // ===== SESSION VALIDATION ===== //

    /**
     * Validate current session by fetching user profile
     * @returns {Promise<object|null>} User profile if valid, null if invalid
     */
    async validateSession() {
        if (!this.hasToken()) {
            return null;
        }

        try {
            const profile = await this.getProfile();
            return profile;
        } catch (error) {
            // Token is invalid or expired
            console.warn('Session validation failed:', error.message);
            this.removeToken();
            return null;
        }
    }

    // ===== GENERATION ENDPOINT SELECTION ===== //

    /**
     * Get the appropriate generation endpoint based on auth status
     * @param {boolean} isLoggedIn 
     * @returns {string} API endpoint URL
     */
    getGenerationEndpoint(isLoggedIn) {
        return isLoggedIn 
            ? `${this.apiBaseUrl}/api/v1/generate`
            : `${this.apiBaseUrl}/api/generate`;
    }

    /**
     * Make a generation request with appropriate authentication
     * @param {object} generationData - Generation request data
     * @param {boolean} isLoggedIn - Whether user is authenticated
     * @returns {Promise<Blob>} Image blob
     */
    async generateImage(generationData, isLoggedIn) {
        const url = this.getGenerationEndpoint(isLoggedIn);
        
        const options = {
            method: 'POST',
            body: JSON.stringify(generationData)
        };

        // For anonymous users using Pro model, mark it as used
        if (!isLoggedIn && generationData.model === 'gemini-2.5-pro') {
            this.markProAsUsed();
        }

        const response = isLoggedIn 
            ? await this.makeAuthenticatedRequest(url, options)
            : await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json'
                }
            });

        if (!response.ok) {
            let errorMessage = `HTTP ${response.status}`;
            
            try {
                const errorData = await response.json();
                errorMessage = errorData.detail || errorMessage;
            } catch {
                errorMessage = response.statusText || errorMessage;
            }
            
            throw new Error(errorMessage);
        }

        return response.blob();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthService;
} else if (typeof window !== 'undefined') {
    window.AuthService = AuthService;
}