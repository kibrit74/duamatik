import { Prayer, HatimPartStatus } from '../types';
import { defaultPrayers } from '../data/defaults';
import { logger } from '../utils/logger';
import {
  supabase,
  getCatalogPrayers,
  getCustomPrayers,
  getUserPrayerProgress,
  saveCustomPrayer,
  saveUserPrayerProgress,
  deleteCustomPrayer,
  deleteUserPrayerProgress,
  uploadPrayerAudio,
  deletePrayerAudio,
  checkTablesExist,
  DbPrayer,
  CustomPrayer,
  UserPrayerProgress
} from './supabase';
import { seedPrayers } from './seedPrayers';

// Local storage keys for minimal caching
const LS_PRAYERS_CACHE = 'prayers_cache';
const LS_HATIM_CACHE = 'hatim_cache';

class DatabaseService {
  private userId: string | null = null;
  private supabaseAvailable: boolean = false;

  setUserId(userId: string | null) {
    this.userId = userId;
  }

  getUserId(): string | null {
    return this.userId;
  }

  async init(): Promise<void> {
    // Check Supabase availability
    try {
      const tables = await checkTablesExist();
      // userPrayers tablosu yeterli - prayers tablosu RLS'den dolayı erişilemeyebilir
      this.supabaseAvailable = tables.userPrayers || tables.customPrayers;
      logger.log('Supabase availability:', this.supabaseAvailable, tables);
    } catch (e) {
      this.supabaseAvailable = false;
      logger.warn('Supabase not available, using offline fallback');
    }
  }

  // --- Prayer Methods (Supabase-only) ---

  async getAllPrayers(): Promise<Prayer[]> {
    // Auto-init if not done yet
    if (!this.supabaseAvailable && this.userId) {
      await this.init();
    }

    if (!this.supabaseAvailable || !this.userId) {
      logger.log('Supabase not available, using cached/default prayers');
      return this.getCachedPrayers();
    }

    try {
      // 1. Get catalog prayers from Supabase
      let catalogPrayers = await getCatalogPrayers();

      if (!catalogPrayers || catalogPrayers.length === 0) {
        // Check if we already tried seeding recently to prevent loops
        const hasSeeded = typeof localStorage !== 'undefined' && localStorage.getItem('HAS_SEEDED_PRAYERS');

        if (!hasSeeded) {
          logger.warn('Supabase catalog empty, triggering auto-seed...');
          try {
            await seedPrayers();
            if (typeof localStorage !== 'undefined') {
              localStorage.setItem('HAS_SEEDED_PRAYERS', 'true');
            }
            catalogPrayers = await getCatalogPrayers();
          } catch (seedError) {
            logger.error('Auto-seed failed:', seedError);
          }
        } else {
          logger.warn('Supabase catalog empty and seed already run. Using defaults (Check RLS policies).');
        }
      }

      if (!catalogPrayers || catalogPrayers.length === 0) {
        logger.warn('Supabase catalog still empty after seed, using defaults');
        catalogPrayers = defaultPrayers.map(p => ({
          id: p.id,
          title: p.title,
          arabic: p.arabic || null,
          turkish: p.turkish,
          meaning: p.meaning || null,
          target_count: p.targetCount,
          tags: p.tags
        }));
      }

      // 2. Get user's custom prayers
      const customPrayers = await getCustomPrayers(this.userId);

      // 3. Get user progress for catalog prayers
      const userProgress = await getUserPrayerProgress(this.userId);

      // 4. Merge catalog prayers with user progress
      const mergedPrayers: Prayer[] = [];

      for (const cp of catalogPrayers) {
        const progress = userProgress.find(up => up.prayer_id === cp.id);

        mergedPrayers.push({
          id: cp.id,
          title: cp.title,
          arabic: cp.arabic || undefined,
          turkish: cp.turkish,
          meaning: cp.meaning || undefined,
          targetCount: progress?.custom_target ?? cp.target_count,
          currentCount: progress?.current_count ?? 0,
          tags: cp.tags || [],
          lastUpdated: progress ? new Date(progress.last_updated).getTime() : Date.now(),
          history: progress?.history || [],
          reminder: progress?.reminder,
          _audioUrl: progress?.audio_url || undefined,
          _isCatalog: true,
        } as Prayer & { _audioUrl?: string; _isCatalog?: boolean });
      }

      // Add custom prayers
      for (const custom of customPrayers) {
        mergedPrayers.push({
          id: custom.id,
          title: custom.title,
          arabic: custom.arabic || undefined,
          turkish: custom.turkish,
          meaning: custom.meaning || undefined,
          targetCount: custom.target_count,
          currentCount: custom.current_count,
          tags: custom.tags || [],
          lastUpdated: new Date(custom.last_updated).getTime(),
          history: custom.history || [],
          reminder: custom.reminder,
          isHatimPart: custom.is_hatim_part,
          hatimPartNo: custom.hatim_part_no || undefined,
          _audioUrl: custom.audio_url || undefined,
          _isCustom: true,
        } as Prayer & { _audioUrl?: string; _isCustom?: boolean });
      }

      // Cache to localStorage for offline fallback
      this.cachePrayers(mergedPrayers);

      return mergedPrayers;
    } catch (error) {
      logger.error('Error fetching prayers from Supabase:', error);
      return this.getCachedPrayers();
    }
  }

  async savePrayer(prayer: Prayer): Promise<void> {
    // Cache locally first
    const cached = this.getCachedPrayers();
    const idx = cached.findIndex(p => p.id === prayer.id);
    if (idx >= 0) {
      cached[idx] = prayer;
    } else {
      cached.push(prayer);
    }
    this.cachePrayers(cached);

    // Auto-init if not done yet
    if (!this.supabaseAvailable && this.userId) {
      await this.init();
    }

    // Save to Supabase
    if (!this.supabaseAvailable || !this.userId) {
      logger.warn('Supabase not available, prayer saved locally only');
      return;
    }

    try {
      const isCatalog = (prayer as any)._isCatalog;

      if (isCatalog) {
        await saveUserPrayerProgress(
          this.userId,
          prayer.id,
          prayer.currentCount,
          prayer.history || [],
          prayer.reminder,
          (prayer as any)._audioUrl
        );
      } else {
        await saveCustomPrayer(this.userId, prayer);
      }
    } catch (error) {
      logger.error('Error saving prayer to Supabase:', error);
    }
  }

  async seedPrayers(prayers: Prayer[]): Promise<void> {
    // Just cache them - Supabase catalog should be the source of truth
    this.cachePrayers(prayers);
  }

  async deletePrayer(id: string): Promise<void> {
    // Remove from cache
    const cached = this.getCachedPrayers().filter(p => p.id !== id);
    this.cachePrayers(cached);

    // Auto-init if not done yet
    if (!this.supabaseAvailable && this.userId) {
      await this.init();
    }

    // Delete from Supabase
    if (!this.supabaseAvailable || !this.userId) return;

    try {
      await deleteCustomPrayer(id);
      await deletePrayerAudio(this.userId, id);
    } catch (err) {
      logger.warn('Supabase delete failed:', err);
    }
  }

  // --- Audio Methods ---

  async uploadAudio(prayerId: string, audioBase64: string): Promise<string | null> {
    if (!this.supabaseAvailable || !this.userId) {
      return null;
    }
    return uploadPrayerAudio(this.userId, prayerId, audioBase64);
  }

  async deleteAudio(prayerId: string): Promise<boolean> {
    if (!this.supabaseAvailable || !this.userId) {
      return false;
    }
    return deletePrayerAudio(this.userId, prayerId);
  }

  // --- LocalStorage Cache Methods ---

  private getCachedPrayers(): Prayer[] {
    try {
      const cached = localStorage.getItem(LS_PRAYERS_CACHE);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {
      logger.warn('Error reading prayer cache:', e);
    }
    return defaultPrayers;
  }

  private cachePrayers(prayers: Prayer[]): void {
    try {
      localStorage.setItem(LS_PRAYERS_CACHE, JSON.stringify(prayers));
    } catch (e) {
      logger.warn('Error caching prayers:', e);
    }
  }

  // --- Hatim Tracking Methods ---

  async getHatimStatus(): Promise<HatimPartStatus[]> {
    try {
      const cached = localStorage.getItem(LS_HATIM_CACHE);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {
      logger.warn('Error reading hatim cache:', e);
    }

    // Return default empty list
    const fullList: HatimPartStatus[] = [];
    for (let i = 1; i <= 30; i++) {
      fullList.push({ partNo: i, status: 'empty' });
    }
    return fullList;
  }

  async saveHatimPart(part: HatimPartStatus): Promise<void> {
    try {
      const current = await this.getHatimStatus();
      const idx = current.findIndex(p => p.partNo === part.partNo);
      if (idx >= 0) {
        current[idx] = part;
      } else {
        current.push(part);
      }
      localStorage.setItem(LS_HATIM_CACHE, JSON.stringify(current));
    } catch (e) {
      logger.warn('Error saving hatim part:', e);
    }
  }

  async resetHatim(): Promise<void> {
    localStorage.removeItem(LS_HATIM_CACHE);
  }

  // --- Deprecated methods (no-op for backwards compatibility) ---

  async runDeduplication(): Promise<number> {
    logger.log('Deduplication skipped - using Supabase-only');
    return 0;
  }

  async addMissingPrayers(defaults: Prayer[]): Promise<number> {
    logger.log('addMissingPrayers skipped - using Supabase catalog');
    return 0;
  }
}

export const dbService = new DatabaseService();
