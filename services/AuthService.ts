import { AZURE_CONFIG } from '../config';

export interface AuthProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

class AuthService {
  private currentUser: AuthProfile | null = null;
  private accessToken: string | null = null;
  private storageKey = 'assetguard_auth';

  constructor() {
    this.restoreFromStorage();
  }

  private restoreFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const { user, token } = JSON.parse(stored);
        this.currentUser = user;
        this.accessToken = token;
      }
    } catch (e) {
      console.warn('Failed to restore auth from storage', e);
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

  // In a real production environment with MSAL:
  // this.msalInstance = new PublicClientApplication(msalConfig);

  async login(): Promise<{ user: AuthProfile; token: string } | null> {
    try {
      // SIMULATION: In a real Azure setup, you would use:
      // const response = await this.msalInstance.loginPopup(loginRequest);
      // this.accessToken = response.accessToken;
      // return { user: { ... }, token: response.accessToken };

      console.log("Triggering Azure Login Flow...");
      
      // Artificial delay to simulate the popup interaction
      await new Promise(resolve => setTimeout(resolve, 1500));

      const mockUser: AuthProfile = {
        id: 'AZ-998877',
        name: 'Azure User',
        email: 'user@yourcompany.com',
        avatar: `https://ui-avatars.com/api/?name=Azure+User&background=0078d4&color=fff`
      };

      this.currentUser = mockUser;
      this.accessToken = "mock_azure_jwt_token";
      this.saveToStorage();

      return { user: mockUser, token: this.accessToken };
    } catch (error) {
      console.error("Azure Authentication Failed:", error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    this.currentUser = null;
    this.accessToken = null;
    try {
      localStorage.removeItem(this.storageKey);
    } catch (e) {
      console.warn('Failed to clear auth storage', e);
    }
    // this.msalInstance.logoutPopup();
  }

  async getToken(): Promise<string | null> {
    return this.accessToken;
  }

  getCurrentUser(): AuthProfile | null {
    return this.currentUser;
  }
}

export const authService = new AuthService();
