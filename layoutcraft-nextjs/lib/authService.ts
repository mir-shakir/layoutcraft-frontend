// TODO: Implement a subscription service similar to the vanilla JS version.
const subscriptionService = {
  clearSubscription: () => {},
};

class AuthService {
  private apiBaseUrl = 'https://layoutcraft-backend.onrender.com';
  private tokenKey = 'layoutcraft_access_token';
  private userKey = 'layoutcraft_user';

  // --- TOKEN & USER MANAGEMENT ---

  saveToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiry = payload.exp;
      const now = Math.floor(Date.now() / 1000);
      return now >= expiry;
    } catch (e) {
      return true;
    }
  }

  saveUser(user: any): void {
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }

  getCurrentUser(): any | null {
    const userStr = localStorage.getItem(this.userKey);
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  hasToken(): boolean {
    return !!this.getToken();
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    subscriptionService.clearSubscription();
    document.dispatchEvent(new CustomEvent('authChange'));
  }

  // --- API METHODS ---

  private formatAuthError(message: string): string {
    if (message.includes('Invalid email or password') || message.includes('401')) {
      return 'Invalid email or password. Please check your credentials and try again.';
    }
    if (message.includes('Email already registered') || message.includes('already be registered')) {
      return 'An account with this email already exists. Try logging in instead.';
    }
    if (message.includes('Invalid email format')) {
      return 'Please enter a valid email address.';
    }
    if (message.includes('timeout') || message.includes('NetworkError')) {
      return 'Connection failed. Please check your internet and try again.';
    }
    return message || 'An unexpected error occurred. Please try again.';
  }

  private async handleResponse(response: Response): Promise<any> {
    if (!response.ok) {
      if (response.status === 401) {
        this.logout();
        window.location.href = '/?auth=required';
        throw new Error('SESSION_EXPIRED');
      }
      const errorData = await response.json().catch(() => ({}));
      const rawMessage = errorData.detail || `Error: ${response.status}`;
      throw new Error(this.formatAuthError(rawMessage));
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }
    return response.blob();
  }

  async fetchAuthenticated(endpoint: string, options: RequestInit = {}): Promise<any> {
    if (!this.hasToken() || this.isTokenExpired()) {
      this.logout();
      window.location.href = '/?auth=required';
      throw new Error('SESSION_EXPIRED');
    }
    const url = `${this.apiBaseUrl}${endpoint}`;
    const headers = {
      ...options.headers,
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.getToken()}`,
    };

    const response = await fetch(url, { ...options, headers });
    return this.handleResponse(response);
  }

  async register(userData: any): Promise<any> {
    const response = await fetch(`${this.apiBaseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    return this.handleResponse(response);
  }

  async login(credentials: any): Promise<any> {
    const response = await fetch(`${this.apiBaseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    const data = await this.handleResponse(response);
    if (data.access_token && data.user) {
      this.saveToken(data.access_token);
      this.saveUser(data.user);
    }
    return data;
  }
}

const authService = new AuthService();
export { authService };
