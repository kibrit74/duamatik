import { Prayer, HatimPartStatus } from '../types';
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

const DB_NAME = 'TasbihDB';
const DB_VERSION = 3; // Incremented for sync support
const STORE_PRAYERS = 'prayers';
const STORE_HATIM = 'hatim_tracking';
const STORE_SYNC_META = 'sync_meta';

class DatabaseService {
  private db: IDBDatabase | null = null;
  private userId: string | null = null;
  private supabaseAvailable: boolean = false;

  setUserId(userId: string | null) {
    this.userId = userId;
  }

  async init(): Promise<void> {
    // Check Supabase availability
    try {
      const tables = await checkTablesExist();
      this.supabaseAvailable = tables.prayers && tables.customPrayers;
    } catch (e) {
      this.supabaseAvailable = false;
      console.warn('Supabase not available, using offline mode');
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(STORE_PRAYERS)) {
          db.createObjectStore(STORE_PRAYERS, { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains(STORE_HATIM)) {
          db.createObjectStore(STORE_HATIM, { keyPath: 'partNo' });
        }

        if (!db.objectStoreNames.contains(STORE_SYNC_META)) {
          db.createObjectStore(STORE_SYNC_META, { keyPath: 'key' });
        }
      };
    });
  }

  // --- SYNC METHODS ---

  async syncFromSupabase(): Promise<Prayer[]> {
    if (!this.supabaseAvailable || !this.userId) {
      console.log('Supabase sync skipped (not available or no user)');
      return this.getAllPrayersLocal();
    }

    try {
      // 1. Get catalog prayers from Supabase
      const catalogPrayers = await getCatalogPrayers();

      // 2. Get user's custom prayers
      const customPrayers = await getCustomPrayers(this.userId);

      // 3. Get user progress for catalog prayers
      const userProgress = await getUserPrayerProgress(this.userId);

      // 4. Merge catalog prayers with user progress
      const mergedPrayers: Prayer[] = [];

      // Add catalog prayers with progress
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
          audioBase64: undefined, // Will be loaded on demand
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

      // 5. Cache to IndexedDB
      await this.cachePrayersLocally(mergedPrayers);

      // 6. Save last sync time
      await this.setSyncMeta('lastSync', Date.now());

      return mergedPrayers;
    } catch (error) {
      console.error('Sync from Supabase failed:', error);
      // Fallback to local data
      return this.getAllPrayersLocal();
    }
  }

  async syncToSupabase(prayer: Prayer): Promise<boolean> {
    if (!this.supabaseAvailable || !this.userId) {
      return false;
    }

    try {
      const isCustom = (prayer as any)._isCustom || !((prayer as any)._isCatalog);

      // Check if this prayer exists in catalog
      const catalogPrayers = await getCatalogPrayers();
      const isCatalogPrayer = catalogPrayers.some(cp => cp.id === prayer.id);

      if (isCatalogPrayer) {
        // Save progress for catalog prayer
        await saveUserPrayerProgress(
          this.userId,
          prayer.id,
          prayer.currentCount,
          prayer.history || [],
          prayer.reminder,
          (prayer as any)._audioUrl
        );
      } else {
        // Save as custom prayer
        await saveCustomPrayer(this.userId, prayer);
      }

      return true;
    } catch (error) {
      console.error('Sync to Supabase failed:', error);
      return false;
    }
  }

  // --- Prayer Methods with Sync ---

  async getAllPrayers(): Promise<Prayer[]> {
    if (!this.db) await this.init();

    // Try to sync from Supabase first if online
    if (this.supabaseAvailable && this.userId) {
      return this.syncFromSupabase();
    }

    return this.getAllPrayersLocal();
  }

  private async getAllPrayersLocal(): Promise<Prayer[]> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_PRAYERS], 'readonly');
      const store = transaction.objectStore(STORE_PRAYERS);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async savePrayer(prayer: Prayer): Promise<void> {
    if (!this.db) await this.init();

    // Save to IndexedDB first (offline-first)
    await new Promise<void>((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_PRAYERS], 'readwrite');
      const store = transaction.objectStore(STORE_PRAYERS);
      const request = store.put(prayer);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    // Then sync to Supabase in background
    if (this.supabaseAvailable && this.userId) {
      this.syncToSupabase(prayer).catch(err => {
        console.warn('Background sync failed:', err);
      });
    }
  }

  async seedPrayers(prayers: Prayer[]): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_PRAYERS], 'readwrite');
      const store = transaction.objectStore(STORE_PRAYERS);

      let completed = 0;
      let errors = 0;

      if (prayers.length === 0) {
        resolve();
        return;
      }

      prayers.forEach(prayer => {
        const request = store.add(prayer);
        request.onsuccess = () => {
          completed++;
          if (completed + errors === prayers.length) resolve();
        };
        request.onerror = () => {
          errors++;
          if (completed + errors === prayers.length) resolve();
        };
      });
    });
  }

  async deletePrayer(id: string): Promise<void> {
    if (!this.db) await this.init();

    // Delete from IndexedDB
    await new Promise<void>((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_PRAYERS], 'readwrite');
      const store = transaction.objectStore(STORE_PRAYERS);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    // Delete from Supabase
    if (this.supabaseAvailable && this.userId) {
      try {
        // Try to delete as custom prayer first
        await deleteCustomPrayer(id);
        // Also delete any audio
        await deletePrayerAudio(this.userId, id);
      } catch (err) {
        console.warn('Supabase delete failed:', err);
      }
    }
  }

  async addMissingPrayers(defaults: Prayer[]): Promise<number> {
    if (!this.db) await this.init();
    const existing = await this.getAllPrayersLocal();
    const existingTitles = new Set(existing.map(p => p.title.toLowerCase().trim()));

    let addedCount = 0;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_PRAYERS], 'readwrite');
      const store = transaction.objectStore(STORE_PRAYERS);

      defaults.forEach(prayer => {
        if (!existingTitles.has(prayer.title.toLowerCase().trim())) {
          store.add(prayer);
          addedCount++;
        }
      });

      transaction.oncomplete = () => resolve(addedCount);
      transaction.onerror = () => reject(transaction.error);
    });
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

  // --- Local Cache Methods ---

  private async cachePrayersLocally(prayers: Prayer[]): Promise<void> {
    if (!this.db) await this.init();

    const transaction = this.db!.transaction([STORE_PRAYERS], 'readwrite');
    const store = transaction.objectStore(STORE_PRAYERS);

    // Clear existing
    store.clear();

    // Add new
    prayers.forEach(prayer => {
      store.add(prayer);
    });
  }

  private async setSyncMeta(key: string, value: any): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_SYNC_META], 'readwrite');
      const store = transaction.objectStore(STORE_SYNC_META);
      const request = store.put({ key, value });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async getSyncMeta(key: string): Promise<any> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_SYNC_META], 'readonly');
      const store = transaction.objectStore(STORE_SYNC_META);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result?.value);
      request.onerror = () => reject(request.error);
    });
  }

  // --- Hatim Tracking Methods ---

  async getHatimStatus(): Promise<HatimPartStatus[]> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_HATIM], 'readonly');
      const store = transaction.objectStore(STORE_HATIM);
      const request = store.getAll();

      request.onsuccess = () => {
        const result = request.result as HatimPartStatus[];
        const fullList: HatimPartStatus[] = [];
        for (let i = 1; i <= 30; i++) {
          const existing = result.find(r => r.partNo === i);
          if (existing) {
            fullList.push(existing);
          } else {
            fullList.push({ partNo: i, status: 'empty' });
          }
        }
        resolve(fullList);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async saveHatimPart(part: HatimPartStatus): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_HATIM], 'readwrite');
      const store = transaction.objectStore(STORE_HATIM);
      const request = store.put(part);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async resetHatim(): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_HATIM], 'readwrite');
      const store = transaction.objectStore(STORE_HATIM);
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export const dbService = new DatabaseService();