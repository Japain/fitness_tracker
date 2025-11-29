import { create } from 'zustand';
import type { User } from '@fitness-tracker/shared';
import { apiRequest } from '../api/client';

/**
 * Authentication State Interface
 */
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (user: User) => void;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

/**
 * Zustand Auth Store
 * Manages global authentication state
 *
 * Usage:
 * const { user, isAuthenticated, login, logout } = useAuthStore();
 */
export const useAuthStore = create<AuthState>((set) => ({
  // Initial state
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  // Actions
  login: (user: User) => {
    set({
      user,
      isAuthenticated: true,
      error: null,
    });
  },

  logout: async () => {
    try {
      // Use apiRequest to automatically include CSRF token
      await apiRequest('/api/auth/logout', {
        method: 'POST',
      });

      set({
        user: null,
        isAuthenticated: false,
        error: null,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Logout failed',
      });
    }
  },

  checkAuth: async () => {
    set({ isLoading: true });

    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
      });

      if (response.ok) {
        const user = await response.json();
        set({
          user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } else {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      }
    } catch (error) {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Auth check failed',
      });
    }
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  setError: (error: string | null) => {
    set({ error });
  },
}));
