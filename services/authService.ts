import { supabase, getProfile } from './supabase';
import { User } from '../types';
import { logger } from '../utils/logger';

class AuthService {
  private currentUser: User | null = null;
  private authStateListeners: Array<(user: User | null) => void> = [];
  private initialized = false;

  constructor() {
    logger.log('🔐 AuthService initialized');
  }

  async init() {
    if (this.initialized) return;
    this.initialized = true;

    // Set up auth state change listener
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        // IMMEDIATE UPDATE: Use session data first to unblock UI
        const minimalUser: User = {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.name || 'Kullanıcı',
          role: 'user',
          city: session.user.user_metadata?.city,
          joinDate: new Date().toISOString(),
          isPremium: false,
        };

        this.currentUser = minimalUser;
        this.authStateListeners.forEach(listener => listener(this.currentUser));

        // Background fetch for profile (role, premium status)
        try {
          await new Promise(resolve => setTimeout(resolve, 100));
          const profile = await getProfile(session.user.id);
          if (profile) {
            this.currentUser = profile;
            this.authStateListeners.forEach(listener => listener(this.currentUser));
          }
        } catch (e) {
          logger.warn('Background profile update failed:', e);
        }
      } else {
        this.currentUser = null;
        this.authStateListeners.forEach(listener => listener(this.currentUser));
      }
    });

    // Check for existing session
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const profile = await getProfile(session.user.id);
        if (profile) {
          this.currentUser = profile;
          this.authStateListeners.forEach(listener => listener(this.currentUser));
        }
      }
    } catch (e) {
      logger.warn('Failed to get initial session:', e);
    }
  }

  async login(email: string, password: string): Promise<User> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('E-posta veya şifre hatalı.');
        }
        throw new Error(error.message);
      }

      if (!data?.user) {
        throw new Error('Giriş yapılamadı.');
      }

      // Create minimal user for fast UI
      const minimalUser: User = {
        id: data.user.id,
        email: data.user.email || email,
        name: data.user.user_metadata?.name || 'Kullanıcı',
        role: 'user',
        city: data.user.user_metadata?.city,
        joinDate: new Date().toISOString(),
        isPremium: false,
      };

      this.currentUser = minimalUser;
      return minimalUser;
    } catch (e: any) {
      logger.error('Login error:', e);
      throw e;
    }
  }

  async register(name: string, email: string, city: string, password: string): Promise<User> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, city },
      },
    });

    if (error) {
      if (error.message.includes('already registered')) {
        throw new Error('Bu e-posta zaten kayıtlı.');
      }
      if (error.message.includes('Password')) {
        throw new Error('Şifre en az 6 karakter olmalı.');
      }
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error('Kayıt işlemi başarısız.');
    }

    // Wait for profile trigger
    await new Promise(resolve => setTimeout(resolve, 500));

    let profile = await getProfile(data.user.id);

    if (!profile) {
      try {
        await supabase.from('profiles').insert({
          id: data.user.id,
          email,
          name,
          city,
        });
      } catch (e) {
        logger.warn('Profile insert failed:', e);
      }

      profile = {
        id: data.user.id,
        email,
        name,
        role: 'user',
        city,
        joinDate: new Date().toISOString(),
        isPremium: false,
      };
    }

    this.currentUser = profile;
    return profile;
  }

  async logout(): Promise<void> {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      logger.error('Logout error:', e);
    }

    this.currentUser = null;
    localStorage.removeItem('currentUser');

    // Clear all Supabase localStorage keys
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('sb-')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));

    this.authStateListeners.forEach(listener => listener(null));
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  isAuthenticated(): boolean {
    return !!this.currentUser;
  }

  onAuthStateChange(callback: (user: User | null) => void): () => void {
    this.authStateListeners.push(callback);
    return () => {
      this.authStateListeners = this.authStateListeners.filter(l => l !== callback);
    };
  }

  async upgradeToPremium(): Promise<void> {
    if (this.currentUser) {
      await supabase
        .from('profiles')
        .update({ is_premium: true })
        .eq('id', this.currentUser.id);

      this.currentUser = { ...this.currentUser, isPremium: true };
    }
  }
}

export const authService = new AuthService();