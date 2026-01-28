export interface AuthProfile {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  employeeId?: string;
}

class AuthService {
  private currentUser: AuthProfile | null = null;
  private accessToken: string | null = null;
  private storageKey = 'aptologics_auth';

  constructor() {
    this.restoreFromStorage();
  }

  private restoreFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const { user, token } = JSON.parse(stored);
        // Validate that the stored user has the new format (with 'role' property)
        // Old mock sessions won't have this, so we clear them
        if (user && user.role && (user.role === 'admin' || user.role === 'user')) {
          this.currentUser = user;
          this.accessToken = token;
        } else {
          // Clear invalid/old session data
          console.log('[Auth] Clearing old session format');
          localStorage.removeItem(this.storageKey);
        }
      }
    } catch (e) {
      console.warn('Failed to restore auth from storage', e);
      localStorage.removeItem(this.storageKey);
    }
  }

  private saveToStorage(): void {
    try {
      if (this.currentUser && this.accessToken) {
        localStorage.setItem(this.storageKey, JSON.stringify({
          user: this.currentUser,
          token: this.accessToken
        }));
      }
    } catch (e) {
      console.warn('Failed to save auth to storage', e);
    }
  }

  async login(email: string, password: string): Promise<{ user: AuthProfile; token: string } | null> {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }

      const data = await response.json();
      this.currentUser = data.user;
      this.accessToken = data.token;
      this.saveToStorage();

      return { user: data.user, token: data.token };
    } catch (error) {
      console.error("Authentication Failed:", error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      if (this.accessToken) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'X-Session-Token': this.accessToken }
        });
      }
    } catch (e) {
      console.warn('Logout request failed', e);
    }

    this.currentUser = null;
    this.accessToken = null;
    try {
      localStorage.removeItem(this.storageKey);
    } catch (e) {
      console.warn('Failed to clear auth storage', e);
    }
  }

  async getToken(): Promise<string | null> {
    return this.accessToken;
  }

  getCurrentUser(): AuthProfile | null {
    return this.currentUser;
  }
}

export const authService = new AuthService();
