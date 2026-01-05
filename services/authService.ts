import { supabase, getProfile } from './supabase';
import { User } from '../types';

class AuthService {
  private currentUser: User | null = null;
  private authStateListeners: Array<(user: User | null) => void> = [];
  private initialized = false;

  constructor() {
    // Don't call async functions in constructor
    console.log('🔐 AuthService initialized');
  }

  async init() {
    if (this.initialized) return;
    this.initialized = true;

    console.log('🔐 AuthService.init() called');

    // Set up auth state change listener
    supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 Auth state changed:', event);
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

        // Background fetch for strict profile data (role, premium status)
        try {
          // Add a small delay to let the initial render happen
          await new Promise(resolve => setTimeout(resolve, 100));

          const profile = await getProfile(session.user.id);
          if (profile) {
            console.log('🔐 Background profile update success');
            this.currentUser = profile;
            this.authStateListeners.forEach(listener => listener(this.currentUser));
          }
        } catch (e) {
          console.warn('🔐 Background profile update failed:', e);
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
        console.log('🔐 Existing session found');
        const profile = await getProfile(session.user.id);
        if (profile) {
          this.currentUser = profile;
          this.authStateListeners.forEach(listener => listener(this.currentUser));
        }
      }
    } catch (e) {
      console.warn('🔐 Failed to get initial session:', e);
    }
  }

  async login(email: string, password: string): Promise<User> {
    console.log('🔐 Login attempt:', email);

    try {
      console.log('🔐 Calling signInWithPassword...');
      // Add a small timeout race to detect hangs
      const signInPromise = supabase.auth.signInWithPassword({ email, password });
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Login timed out')), 15000));

      const response = await Promise.race([signInPromise, timeoutPromise]) as any;
      console.log('🔐 signInWithPassword returned:', response);

      const { data, error } = response;

      console.log('🔐 Supabase auth result:', { user: !!data?.user, error: error?.message });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('E-posta veya şifre hatalı.');
        }
        throw new Error(error.message);
      }

      if (!data?.user) {
        throw new Error('Giriş yapılamadı.');
      }

      // Try to get profile
      let profile: User | null = null;
      try {
        console.log('🔐 Fetching profile...');
        profile = await getProfile(data.user.id);
        console.log('🔐 Profile result:', profile ? 'Found' : 'Not Found');
      } catch (e) {
        console.warn('🔐 Profile fetch failed:', e);
      }

      // If no profile, create minimal user
      if (!profile) {
        console.log('🔐 Creating minimal user from auth data');
        profile = {
          id: data.user.id,
          email: data.user.email || email,
          name: data.user.user_metadata?.name || 'Kullanıcı',
          role: 'user',
          city: data.user.user_metadata?.city,
          joinDate: new Date().toISOString(),
          isPremium: false,
        };
      }

      this.currentUser = profile;
      return profile;
    } catch (e: any) {
      console.error('🔐 Login error:', e);
      throw e;
    }
  }

  async register(name: string, email: string, city: string, password: string): Promise<User> {
    console.log('📝 Register attempt:', email);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, city },
      },
    });

    console.log('📝 Supabase signup result:', { user: !!data?.user, error: error?.message });

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
      // Create manually
      try {
        await supabase.from('profiles').insert({
          id: data.user.id,
          email,
          name,
          city,
        });
      } catch (e) {
        console.warn('Profile insert failed:', e);
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
    await supabase.auth.signOut();
    this.currentUser = null;
    localStorage.removeItem('currentUser');
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