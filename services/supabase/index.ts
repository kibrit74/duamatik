import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { User, Prayer, Quote, PrayerPackage, AdminNotification, SpiritualPlan } from '../../types';
import { logger } from '../../utils/logger';
import { supabase } from './client';

export { supabase };

// Removed local init


// ==================
// PROFILE HELPERS
// ==================

export async function getProfile(userId: string): Promise<User | null> {
  try {
    // 5 second timeout
    const timeoutPromise = new Promise<null>((resolve) =>
      setTimeout(() => resolve(null), 5000)
    );

    const queryPromise = (async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, role, city, join_date, is_premium, updated_at')
        .eq('id', userId)
        .single();

      if (error || !data) return null;

      return {
        id: data.id,
        email: '',
        name: data.name || 'Kullanıcı',
        role: data.role || 'user',
        city: data.city,
        joinDate: data.join_date,
        isPremium: data.is_premium || false,
      };
    })();

    return await Promise.race([queryPromise, timeoutPromise]);
  } catch (e) {
    logger.warn('Profile fetch failed:', e);
    return null;
  }
}

export async function updateProfile(userId: string, updates: Partial<User>): Promise<boolean> {
  const { error } = await supabase
    .from('profiles')
    .update({
      name: updates.name,
      city: updates.city,
      is_premium: updates.isPremium,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  return !error;
}

// ==================
// PRAYERS CATALOG (Varsayılan Dualar)
// ==================

export interface DbPrayer {
  id: string;
  title: string;
  arabic: string | null;
  turkish: string;
  meaning: string | null;
  target_count: number;
  tags: string[];
}

export async function getCatalogPrayers(): Promise<DbPrayer[]> {
  try {
    const timeoutPromise = new Promise<DbPrayer[]>((resolve) =>
      setTimeout(() => resolve([]), 10000)
    );

    const queryPromise = (async () => {
      console.log('[DEBUG] getCatalogPrayers: Fetching from Supabase...');
      const { data, error, count } = await supabase
        .from('prayers')
        .select('*', { count: 'exact' })
        .order('title');

      console.log('[DEBUG] getCatalogPrayers result:', {
        dataLength: data?.length,
        count,
        error: error?.message
      });

      if (error) {
        logger.error('Error fetching catalog prayers:', error);
        return [];
      }
      return data || [];
    })();

    return await Promise.race([queryPromise, timeoutPromise]);
  } catch (e) {
    console.error('[DEBUG] getCatalogPrayers exception:', e);
    logger.warn('getCatalogPrayers failed:', e);
    return [];
  }
}

// Admin: Add new catalog prayer
export async function addCatalogPrayer(prayer: {
  title: string;
  arabic?: string;
  turkish: string;
  meaning?: string;
  target_count?: number;
  tags?: string[];
}): Promise<DbPrayer | null> {
  const { data, error } = await supabase
    .from('prayers')
    .insert({
      title: prayer.title,
      arabic: prayer.arabic || null,
      turkish: prayer.turkish,
      meaning: prayer.meaning || null,
      target_count: prayer.target_count || 33,
      tags: prayer.tags || [],
    })
    .select()
    .single();

  if (error) {
    logger.error('Error adding catalog prayer:', error);
    return null;
  }
  return data;
}

// Admin: Update catalog prayer
export async function updateCatalogPrayer(id: string, updates: {
  title?: string;
  arabic?: string;
  turkish?: string;
  meaning?: string;
  target_count?: number;
  tags?: string[];
}): Promise<boolean> {
  // Build update object without undefined values
  const updateData: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.title !== undefined) updateData.title = updates.title;
  if (updates.arabic !== undefined) updateData.arabic = updates.arabic;
  if (updates.turkish !== undefined) updateData.turkish = updates.turkish;
  if (updates.meaning !== undefined) updateData.meaning = updates.meaning;
  if (updates.target_count !== undefined) updateData.target_count = updates.target_count;
  if (updates.tags !== undefined) updateData.tags = updates.tags;

  console.log('[DEBUG] updateCatalogPrayer:', { id, updateData });

  const { error } = await supabase
    .from('prayers')
    .update(updateData)
    .eq('id', id);

  if (error) {
    logger.error('Error updating catalog prayer:', error);
    console.error('[DEBUG] Supabase update error:', error);
    return false;
  }
  console.log('[DEBUG] Prayer updated successfully');
  return true;
}

// Admin: Delete catalog prayer
export async function deleteCatalogPrayer(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('prayers')
    .delete()
    .eq('id', id);

  if (error) {
    logger.error('Error deleting catalog prayer:', error);
    return false;
  }
  return true;
}

export async function seedCatalogPrayers(prayers: Array<{
  title: string;
  arabic?: string;
  turkish: string;
  meaning?: string;
  target_count: number;
  tags: string[];
}>): Promise<boolean> {
  // Fetch existing titles to avoid duplicates
  const { data: existingPrayers, error: fetchError } = await supabase
    .from('prayers')
    .select('title');

  if (fetchError) {
    logger.error('Error fetching existing prayers:', fetchError);
    return false;
  }

  const existingTitles = new Set(existingPrayers?.map(p => p.title) || []);

  // Filter out prayers that already exist
  const newPrayers = prayers.filter(p => !existingTitles.has(p.title));

  if (newPrayers.length === 0) {
    logger.log('All prayers already exist in catalog. No new items to seed.');
    return true;
  }

  logger.log(`Adding ${newPrayers.length} new prayers to catalog...`);

  const { error } = await supabase
    .from('prayers')
    .insert(newPrayers.map(p => ({
      title: p.title,
      arabic: p.arabic || null,
      turkish: p.turkish,
      meaning: p.meaning || null,
      target_count: p.target_count,
      tags: p.tags,
    })));

  if (error) {
    logger.error('Error seeding catalog prayers:', error);
    return false;
  }
  return true;
}

export async function seedQuotes(quotes: Quote[]): Promise<boolean> {
  // Fetch existing quotes to avoid duplicates
  const { data: existingQuotes, error: fetchError } = await supabase
    .from('quotes')
    .select('text');

  if (fetchError) {
    logger.error('Error fetching existing quotes:', fetchError);
    return false;
  }

  const existingTexts = new Set(existingQuotes?.map(q => q.text) || []);

  // Filter out quotes that already exist
  const newQuotes = quotes.filter(q => !existingTexts.has(q.text));

  if (newQuotes.length === 0) {
    logger.log('All quotes already seeded. No new items.');
    return true;
  }

  logger.log(`Adding ${newQuotes.length} new quotes...`);

  const { error } = await supabase
    .from('quotes')
    .insert(newQuotes);

  if (error) {
    logger.error('Error seeding quotes:', error);
    return false;
  }
  return true;
}

// ==================
// USER PRAYERS (Kullanıcı İlerlemesi)
// ==================

export interface UserPrayerProgress {
  id: string;
  user_id: string;
  prayer_id: string | null;
  custom_title: string | null;
  custom_target: number | null;
  current_count: number;
  last_updated: string;
  history: Array<{ date: string; count: number }>;
  reminder: any;
  audio_url: string | null;
}

export async function getUserPrayerProgress(userId: string): Promise<UserPrayerProgress[]> {
  try {
    const timeoutPromise = new Promise<UserPrayerProgress[]>((resolve) =>
      setTimeout(() => resolve([]), 5000)
    );

    const queryPromise = (async () => {
      const { data, error } = await supabase
        .from('user_prayers')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        logger.error('Error fetching user prayer progress:', error);
        return [];
      }
      return data || [];
    })();

    return await Promise.race([queryPromise, timeoutPromise]);
  } catch (e) {
    logger.warn('getUserPrayerProgress failed:', e);
    return [];
  }
}

export async function saveUserPrayerProgress(
  userId: string,
  prayerId: string,
  currentCount: number,
  history: Array<{ date: string; count: number }>,
  reminder?: any,
  audioUrl?: string
): Promise<boolean> {
  const { error } = await supabase
    .from('user_prayers')
    .upsert({
      user_id: userId,
      prayer_id: prayerId,
      current_count: currentCount,
      last_updated: new Date().toISOString(),
      history: history,
      reminder: reminder || null,
      audio_url: audioUrl || null,
    }, {
      onConflict: 'user_id,prayer_id'
    });

  if (error) {
    logger.error('Error saving user prayer progress:', error);
    return false;
  }
  return true;
}

export async function deleteUserPrayerProgress(userId: string, prayerId: string): Promise<boolean> {
  const { error } = await supabase
    .from('user_prayers')
    .delete()
    .eq('user_id', userId)
    .eq('prayer_id', prayerId);

  return !error;
}

// ==================
// CUSTOM PRAYERS (Kullanıcının Eklediği Dualar)
// ==================

export interface CustomPrayer {
  id: string;
  user_id: string;
  title: string;
  arabic: string | null;
  turkish: string;
  meaning: string | null;
  target_count: number;
  tags: string[];
  current_count: number;
  last_updated: string;
  history: Array<{ date: string; count: number }>;
  reminder: any;
  audio_url: string | null;
  is_hatim_part: boolean;
  hatim_part_no: number | null;
}

export async function getCustomPrayers(userId: string): Promise<CustomPrayer[]> {
  try {
    const timeoutPromise = new Promise<CustomPrayer[]>((resolve) =>
      setTimeout(() => resolve([]), 5000)
    );

    const queryPromise = (async () => {
      const { data, error } = await supabase
        .from('custom_prayers')
        .select('*')
        .eq('user_id', userId)
        .order('last_updated', { ascending: false });

      if (error) {
        logger.error('Error fetching custom prayers:', error);
        return [];
      }
      return data || [];
    })();

    return await Promise.race([queryPromise, timeoutPromise]);
  } catch (e) {
    logger.warn('getCustomPrayers failed:', e);
    return [];
  }
}

export async function saveCustomPrayer(userId: string, prayer: Prayer): Promise<string | null> {
  const { data, error } = await supabase
    .from('custom_prayers')
    .upsert({
      id: prayer.id,
      user_id: userId,
      title: prayer.title,
      arabic: prayer.arabic || null,
      turkish: prayer.turkish,
      meaning: prayer.meaning || null,
      target_count: prayer.targetCount,
      tags: prayer.tags,
      current_count: prayer.currentCount,
      last_updated: new Date().toISOString(),
      history: prayer.history || [],
      reminder: prayer.reminder || null,
      is_hatim_part: prayer.isHatimPart || false,
      hatim_part_no: prayer.hatimPartNo || null,
    }, {
      onConflict: 'id'
    })
    .select('id')
    .single();

  if (error) {
    logger.error('Error saving custom prayer:', error);
    return null;
  }
  return data?.id || prayer.id;
}

export async function deleteCustomPrayer(prayerId: string): Promise<boolean> {
  const { error } = await supabase
    .from('custom_prayers')
    .delete()
    .eq('id', prayerId);

  return !error;
}

// ==================
// AUDIO STORAGE
// ==================

// ==================
// AUDIO STORAGE
// ==================

export * from './audio';


// ==================
// QUOTES
// ==================

export async function getQuotes(): Promise<Quote[]> {
  const { data, error } = await supabase
    .from('quotes')
    .select('text, source');

  if (error) {
    logger.error('Error fetching quotes:', error);
    return [];
  }

  return data || [];
}



// ==================
// SYNC UTILITIES
// ==================

export async function checkTablesExist(): Promise<{ prayers: boolean; userPrayers: boolean; customPrayers: boolean; quotes: boolean }> {
  const results = {
    prayers: false,
    userPrayers: false,
    customPrayers: false,
    quotes: false
  };

  // Quick check with 3 second timeout
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Supabase check timeout')), 10000)
  );

  try {
    // Run all checks in parallel with timeout
    const checkPromise = Promise.all([
      supabase.from('prayers').select('id').limit(1),
      supabase.from('user_prayers').select('id').limit(1),
      supabase.from('custom_prayers').select('id').limit(1),
      supabase.from('quotes').select('id').limit(1),
    ]);

    const [r1, r2, r3, r4] = await Promise.race([checkPromise, timeoutPromise]) as any;

    results.prayers = !r1.error;
    results.userPrayers = !r2.error;
    results.customPrayers = !r3.error;
    results.quotes = !r4.error;
  } catch (e) {
    logger.warn('Supabase check failed, using offline mode:', e);
  }

  return results;
}

// ==================
// LEADERBOARD & STATS
// ==================

export interface LeaderboardEntry {
  id: string;
  name: string;
  city: string | null;
  totalZikir: number;
  streak: number;
  rank: number;
}

export async function getLeaderboard(limit: number = 10): Promise<LeaderboardEntry[]> {
  try {
    // Tüm kullanıcıların dua verilerini tek seferde çek
    const [
      { data: userPrayers, error: upError },
      { data: customPrayers, error: cpError },
      { data: profiles, error: profError }
    ] = await Promise.all([
      supabase.from('user_prayers').select('user_id, current_count'),
      supabase.from('custom_prayers').select('user_id, current_count'),
      supabase.from('profiles').select('id, name, city')
    ]);

    logger.log('🏆 getLeaderboard debug:', {
      userPrayersCount: userPrayers?.length,
      customPrayersCount: customPrayers?.length,
      profilesCount: profiles?.length,
      upError, cpError, profError,
      userPrayersSample: userPrayers?.slice(0, 5),
      customPrayersSample: customPrayers?.slice(0, 5)
    });

    if (profError || !profiles) {
      logger.error('Error fetching profiles for leaderboard:', profError);
      return [];
    }

    // Kullanıcı bazında toplam zikir sayısını hesapla
    const userTotals: Record<string, number> = {};

    userPrayers?.forEach(p => {
      userTotals[p.user_id] = (userTotals[p.user_id] || 0) + (p.current_count || 0);
    });

    customPrayers?.forEach(p => {
      userTotals[p.user_id] = (userTotals[p.user_id] || 0) + (p.current_count || 0);
    });

    logger.log('🏆 User totals:', userTotals);

    // Profil bilgileriyle eşleştir
    const leaderboard: LeaderboardEntry[] = [];

    for (const profile of profiles) {
      const totalZikir = userTotals[profile.id] || 0;

      // Sıfır olanları da göster (debug için)
      leaderboard.push({
        id: profile.id,
        name: profile.name || 'Anonim',
        city: profile.city,
        totalZikir,
        streak: 0,
        rank: 0,
      });
    }

    // Toplam zikire göre sırala
    leaderboard.sort((a, b) => b.totalZikir - a.totalZikir);

    // Sıralama numarası ata
    leaderboard.forEach((entry, idx) => {
      entry.rank = idx + 1;
    });

    logger.log('🏆 Final leaderboard:', leaderboard);

    return leaderboard.slice(0, limit);
  } catch (e) {
    logger.error('Error getting leaderboard:', e);
    return [];
  }
}

export async function getUserStats(userId: string): Promise<{ totalZikir: number; rank: number; streak: number } | null> {
  try {
    const leaderboard = await getLeaderboard(100);
    const userEntry = leaderboard.find(e => e.id === userId);

    if (userEntry) {
      return {
        totalZikir: userEntry.totalZikir,
        rank: userEntry.rank,
        streak: userEntry.streak,
      };
    }

    // User not in top 100, calculate separately
    const { data: userPrayers } = await supabase
      .from('user_prayers')
      .select('current_count')
      .eq('user_id', userId);

    const { data: customPrayers } = await supabase
      .from('custom_prayers')
      .select('current_count')
      .eq('user_id', userId);

    const userPrayersTotal = userPrayers?.reduce((sum, p) => sum + (p.current_count || 0), 0) || 0;
    const customPrayersTotal = customPrayers?.reduce((sum, p) => sum + (p.current_count || 0), 0) || 0;
    const totalZikir = userPrayersTotal + customPrayersTotal;

    // Estimate rank
    const rank = leaderboard.filter(e => e.totalZikir > totalZikir).length + 1;

    return { totalZikir, rank, streak: 0 };
  } catch (e) {
    logger.error('Error getting user stats:', e);
    return null;
  }
}

// ==================
// FRIENDSHIP SYSTEM
// ==================

export interface FriendProfile {
  id: string;
  name: string;
  city: string | null;
  isOnline: boolean;
  lastActive: string | null;
}

export interface FriendRequest {
  id: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

// Get all friends for a user
export async function getFriends(userId: string): Promise<FriendProfile[]> {
  try {
    // Get friendships where user is either user_id or friend_id
    const { data: friendships, error } = await supabase
      .from('friendships')
      .select('user_id, friend_id')
      .or(`user_id.eq.${userId},friend_id.eq.${userId}`);

    if (error || !friendships) {
      logger.error('Error fetching friendships:', error);
      return [];
    }

    // Extract friend IDs
    const friendIds = friendships.map(f =>
      f.user_id === userId ? f.friend_id : f.user_id
    );

    if (friendIds.length === 0) return [];

    // Get friend profiles
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, name, city, updated_at')
      .in('id', friendIds);

    if (profileError || !profiles) {
      logger.error('Error fetching friend profiles:', profileError);
      return [];
    }

    return profiles.map(p => ({
      id: p.id,
      name: p.name || 'Anonim',
      city: p.city,
      isOnline: false, // TODO: Implement real-time presence
      lastActive: p.updated_at,
    }));
  } catch (e) {
    logger.error('Error getting friends:', e);
    return [];
  }
}

// Search users by name or email
export async function searchUsers(query: string, currentUserId: string): Promise<FriendProfile[]> {
  try {
    if (query.length < 2) return [];

    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, city')
      .neq('id', currentUserId)
      .ilike('name', `%${query}%`)
      .limit(10);

    if (error || !data) {
      logger.error('Error searching users:', error);
      return [];
    }

    return data.map(p => ({
      id: p.id,
      name: p.name || 'Anonim',
      city: p.city,
      isOnline: false,
      lastActive: null,
    }));
  } catch (e) {
    logger.error('Error searching users:', e);
    return [];
  }
}

// Send friend request
export async function sendFriendRequest(fromUserId: string, toUserId: string): Promise<{ success: boolean; message?: string }> {
  try {
    const { error } = await supabase
      .from('friend_requests')
      .insert({
        from_user_id: fromUserId,
        to_user_id: toUserId,
        status: 'pending',
      });

    if (error) {
      // 23505 = unique_violation, 409 = HTTP conflict
      if (error.code === '23505' || error.message?.includes('duplicate') || error.message?.includes('conflict')) {
        return { success: false, message: 'Bu kişiye zaten istek gönderilmiş.' };
      }
      logger.error('Error sending friend request:', error);
      return { success: false, message: 'İstek gönderilemedi.' };
    }
    return { success: true, message: 'İstek gönderildi.' };
  } catch (e: any) {
    logger.error('Error sending friend request:', e);
    // HTTP 409 hatası için
    if (e?.status === 409 || e?.message?.includes('409')) {
      return { success: false, message: 'Bu kişiye zaten istek gönderilmiş.' };
    }
    return { success: false, message: 'Bir hata oluştu.' };
  }
}

// Get pending friend requests
export async function getPendingRequests(userId: string): Promise<FriendRequest[]> {
  try {
    const { data, error } = await supabase
      .from('friend_requests')
      .select(`
        id,
        from_user_id,
        to_user_id,
        status,
        created_at
      `)
      .eq('to_user_id', userId)
      .eq('status', 'pending');

    if (error || !data) {
      logger.error('Error fetching pending requests:', error);
      return [];
    }

    // Get sender names
    const senderIds = data.map(r => r.from_user_id);
    const { data: senders } = await supabase
      .from('profiles')
      .select('id, name')
      .in('id', senderIds);

    const senderMap = new Map(senders?.map(s => [s.id, s.name]) || []);

    return data.map(r => ({
      id: r.id,
      fromUserId: r.from_user_id,
      fromUserName: senderMap.get(r.from_user_id) || 'Anonim',
      toUserId: r.to_user_id,
      status: r.status,
      createdAt: r.created_at,
    }));
  } catch (e) {
    logger.error('Error getting pending requests:', e);
    return [];
  }
}

// Accept friend request
export async function acceptFriendRequest(requestId: string, fromUserId: string, toUserId: string): Promise<boolean> {
  try {
    // Update request status
    const { error: updateError } = await supabase
      .from('friend_requests')
      .update({ status: 'accepted' })
      .eq('id', requestId);

    if (updateError) {
      logger.error('Error updating request:', updateError);
      return false;
    }

    // Create friendship (both directions for easier querying)
    const { error: friendError } = await supabase
      .from('friendships')
      .insert([
        { user_id: fromUserId, friend_id: toUserId },
        { user_id: toUserId, friend_id: fromUserId },
      ]);

    if (friendError) {
      logger.error('Error creating friendship:', friendError);
      // Rollback request status if friendship creation fails
      return false;
    }

    return true;
  } catch (e) {
    logger.error('Error accepting friend request:', e);
    return false;
  }
}

// Reject friend request
export async function rejectFriendRequest(requestId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('friend_requests')
      .update({ status: 'rejected' })
      .eq('id', requestId);

    return !error;
  } catch (e) {
    logger.error('Error rejecting friend request:', e);
    return false;
  }
}

// Send nudge to friend (dürtme)
export async function sendNudge(fromUserId: string, toUserId: string, fromUserName: string): Promise<boolean> {
  try {
    // Insert a nudge notification
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: toUserId,
        type: 'nudge',
        title: '📿 Dürtme!',
        message: `${fromUserName} seni dürtüyor! Zikirlerini yapmayı unutma!`,
        read: false,
        created_at: new Date().toISOString()
      });

    if (error) {
      logger.error('Error sending nudge:', error);
      return false;
    }
    return true;
  } catch (e) {
    logger.error('Error sending nudge:', e);
    return false;
  }
}

// Remove friend
export async function removeFriend(userId: string, friendId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('friendships')
      .delete()
      .or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`);

    return !error;
  } catch (e) {
    logger.error('Error removing friend:', e);
    return false;
  }
}

// Generate invite code
export async function generateInviteCode(userId: string): Promise<string | null> {
  try {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();

    const { error } = await supabase
      .from('invite_codes')
      .insert({
        user_id: userId,
        code: code,
        uses_remaining: 5,
      });

    if (error) {
      logger.error('Error generating invite code:', error);
      return null;
    }
    return code;
  } catch (e) {
    logger.error('Error generating invite code:', e);
    return null;
  }
}

// Get user's invite code
export async function getInviteCode(userId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('invite_codes')
      .select('code, uses_remaining')
      .eq('user_id', userId)
      .gt('uses_remaining', 0)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.warn('[DEBUG] getInviteCode error:', error);
      // Table may not exist or RLS issue - generate new code
      return generateInviteCode(userId);
    }

    if (!data || data.length === 0) {
      // No existing code, generate new one
      return generateInviteCode(userId);
    }

    return data[0].code;
  } catch (e) {
    console.warn('[DEBUG] getInviteCode exception:', e);
    return generateInviteCode(userId);
  }
}

// Use invite code to add friend
export async function useInviteCode(code: string, userId: string): Promise<{ success: boolean; message: string }> {
  try {
    // Find the code
    const { data: inviteData, error: findError } = await supabase
      .from('invite_codes')
      .select('id, user_id, uses_remaining')
      .eq('code', code.toUpperCase())
      .gt('uses_remaining', 0)
      .single();

    if (findError || !inviteData) {
      return { success: false, message: 'Geçersiz veya kullanılmış davet kodu.' };
    }

    if (inviteData.user_id === userId) {
      return { success: false, message: 'Kendi davet kodunuzu kullanamazsınız.' };
    }

    // Check if already friends
    const { data: existingFriendship } = await supabase
      .from('friendships')
      .select('id')
      .or(`and(user_id.eq.${userId},friend_id.eq.${inviteData.user_id}),and(user_id.eq.${inviteData.user_id},friend_id.eq.${userId})`)
      .limit(1);

    if (existingFriendship && existingFriendship.length > 0) {
      return { success: false, message: 'Bu kişi zaten arkadaşınız.' };
    }

    // Create friendship
    const { error: matchError } = await supabase.from('friendships').insert([
      { user_id: userId, friend_id: inviteData.user_id },
      { user_id: inviteData.user_id, friend_id: userId },
    ]);

    if (matchError) {
      logger.error('Error creating friendship:', matchError);
      return { success: false, message: 'Arkadaşlık oluşturulurken bir hata meydana geldi.' };
    }

    // Decrease uses
    const { error: updateError } = await supabase
      .from('invite_codes')
      .update({ uses_remaining: inviteData.uses_remaining - 1 })
      .eq('id', inviteData.id);

    if (updateError) {
      logger.error('Error updating invite code:', updateError);
      // We don't fail the operation here since the friendship was created, but we log it.
    }

    return { success: true, message: 'Arkadaş eklendi!' };
  } catch (e) {
    logger.error('Error using invite code:', e);
    return { success: false, message: 'Bir hata oluştu.' };
  }
}

// ==================
// MESSAGING & NOTIFICATIONS
// ==================

import { Message, Notification } from '../../types';

export async function getNotifications(userId: string): Promise<Notification[]> {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error || !data) return [];

    // Get source names
    const sourceIds = data.map(n => n.source_id).filter(Boolean) as string[];
    let sourceMap = new Map<string, string>();

    if (sourceIds.length > 0) {
      const { data: sources } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', sourceIds);

      if (sources) {
        sourceMap = new Map(sources.map(s => [s.id, s.name]));
      }
    }

    return data.map(n => ({
      id: n.id,
      userId: n.user_id,
      type: n.type,
      content: n.content,
      sourceId: n.source_id,
      sourceName: sourceMap.get(n.source_id) || 'Biri',
      metadata: n.metadata,
      isRead: n.is_read,
      createdAt: n.created_at,
    }));
  } catch (e) {
    logger.error('Error getting notifications:', e);
    return [];
  }
}

export async function markNotificationRead(notificationId: string): Promise<boolean> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId);
  return !error;
}

export async function sendNotification(
  userId: string, // Receiver
  type: string,
  content: string,
  sourceId?: string, // Sender
  metadata?: any
): Promise<boolean> {
  const { error } = await supabase.from('notifications').insert({
    user_id: userId,
    type,
    content,
    source_id: sourceId,
    metadata,
  });
  return !error;
}

export async function getMessages(userId: string, friendId: string): Promise<Message[]> {
  try {
    // Determine conversation ID concept implicitly by filtering sender/receiver
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${userId},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${userId})`)
      .order('created_at', { ascending: true })
      .limit(100);

    if (error || !data) return [];

    return data.map(m => ({
      id: m.id,
      senderId: m.sender_id,
      receiverId: m.receiver_id,
      content: m.content,
      isRead: m.is_read,
      createdAt: m.created_at,
    }));
  } catch (e) {
    logger.error('Error getting messages:', e);
    return [];
  }
}

export async function sendMessage(senderId: string, receiverId: string, content: string): Promise<boolean> {
  // 1. Insert message
  const { error } = await supabase.from('messages').insert({
    sender_id: senderId,
    receiver_id: receiverId,
    content,
  });

  if (error) {
    logger.error('Error sending message:', error);
    return false;
  }

  return true;
}

// ==================
// ADMIN & PACKAGES
// ==================

// PrayerPackage is imported from types at the top

// Admin: Get All Users
// Admin: Get All Users
export async function getAllUsers(): Promise<User[]> {
  try {
    const timeoutPromise = new Promise<User[]>((resolve) =>
      setTimeout(() => resolve([]), 8000)
    );

    const queryPromise = (async () => {
      // Parallel fetch: profiles, user_prayers, AND custom_prayers
      const [profilesResult, prayersResult, customPrayersResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('*')
          .order('join_date', { ascending: false }),

        supabase
          .from('user_prayers')
          .select('user_id, current_count'),

        supabase
          .from('custom_prayers')
          .select('user_id, current_count')
      ]);

      const profiles = profilesResult.data;
      const userPrayers = prayersResult.data;
      const customPrayers = customPrayersResult.data;
      const profilesError = profilesResult.error;

      if (profilesError || !profiles) {
        logger.error('Error fetching users:', profilesError);
        return [];
      }

      // Calculate stats per user
      const statsMap = new Map<string, { totalZikir: number; totalPrayers: number }>();

      if (userPrayers) {
        userPrayers.forEach((up: any) => {
          const current = statsMap.get(up.user_id) || { totalZikir: 0, totalPrayers: 0 };
          current.totalZikir += (up.current_count || 0);
          current.totalPrayers += 1;
          statsMap.set(up.user_id, current);
        });
      }

      // custom_prayers da dahil et
      if (customPrayers) {
        customPrayers.forEach((cp: any) => {
          const current = statsMap.get(cp.user_id) || { totalZikir: 0, totalPrayers: 0 };
          current.totalZikir += (cp.current_count || 0);
          current.totalPrayers += 1;
          statsMap.set(cp.user_id, current);
        });
      }

      return profiles.map(p => {
        const stats = statsMap.get(p.id) || { totalZikir: 0, totalPrayers: 0 };
        return {
          id: p.id,
          email: p.email || '',
          name: p.name || 'Anonim',
          role: p.role || 'user',
          city: p.city,
          joinDate: p.join_date || p.created_at || new Date().toISOString(),
          isPremium: p.is_premium || false,
          stats: stats
        };
      });
    })();

    return await Promise.race([queryPromise, timeoutPromise]);
  } catch (e) {
    logger.warn('getAllUsers failed:', e);
    return [];
  }
}

// Admin: Search and Filter Users
export interface AdminUserFilters {
  query?: string;       // Search by name or email
  isPremium?: boolean;  // Filter by premium status
  city?: string;        // Filter by city
  limit?: number;       // Max results
}

export async function searchAdminUsers(filters: AdminUserFilters): Promise<User[]> {
  try {
    const { query, isPremium, city, limit = 50 } = filters;

    let queryBuilder = supabase
      .from('profiles')
      .select('*')
      .order('join_date', { ascending: false })
      .limit(limit);

    // Apply filters
    if (query && query.length >= 2) {
      queryBuilder = queryBuilder.or(`name.ilike.%${query}%,email.ilike.%${query}%`);
    }

    if (isPremium !== undefined) {
      queryBuilder = queryBuilder.eq('is_premium', isPremium);
    }

    if (city && city.trim() !== '') {
      queryBuilder = queryBuilder.ilike('city', `%${city}%`);
    }

    const { data: profiles, error } = await queryBuilder;

    if (error || !profiles) {
      logger.error('Error searching users:', error);
      return [];
    }

    // Get stats for returned users
    const userIds = profiles.map(p => p.id);

    const [prayersResult, customPrayersResult] = await Promise.all([
      supabase.from('user_prayers').select('user_id, current_count').in('user_id', userIds),
      supabase.from('custom_prayers').select('user_id, current_count').in('user_id', userIds)
    ]);

    const statsMap = new Map<string, { totalZikir: number; totalPrayers: number }>();

    prayersResult.data?.forEach((up: any) => {
      const current = statsMap.get(up.user_id) || { totalZikir: 0, totalPrayers: 0 };
      current.totalZikir += (up.current_count || 0);
      current.totalPrayers += 1;
      statsMap.set(up.user_id, current);
    });

    customPrayersResult.data?.forEach((cp: any) => {
      const current = statsMap.get(cp.user_id) || { totalZikir: 0, totalPrayers: 0 };
      current.totalZikir += (cp.current_count || 0);
      current.totalPrayers += 1;
      statsMap.set(cp.user_id, current);
    });

    return profiles.map(p => {
      const stats = statsMap.get(p.id) || { totalZikir: 0, totalPrayers: 0 };
      return {
        id: p.id,
        email: p.email || '',
        name: p.name || 'Anonim',
        role: p.role || 'user',
        city: p.city,
        joinDate: p.join_date || p.created_at || new Date().toISOString(),
        isPremium: p.is_premium || false,
        stats: stats
      };
    });
  } catch (e) {
    logger.error('searchAdminUsers failed:', e);
    return [];
  }
}

// Admin: Ban User (Status update simulation)
export async function updateUserStatus(userId: string, status: string): Promise<boolean> {
  // Assuming we have a 'status' column or using 'role' to ban
  // For now, let's just log it as we don't have a status column in types yet
  logger.log(`Updating user ${userId} status to ${status}`);
  return true;
}

// Packages: Get All
export async function getPackages(): Promise<PrayerPackage[]> {
  try {
    const timeoutPromise = new Promise<PrayerPackage[]>((resolve) =>
      setTimeout(() => resolve([]), 5000)
    );

    const queryPromise = (async () => {
      const { data, error } = await supabase
        .from('prayer_packages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data) {
        logger.error('Error fetching packages:', error);
        return [];
      }

      return data.map(p => ({
        id: p.id,
        title: p.title,
        description: p.description,
        iconUrl: p.icon_url,
        isPremium: p.is_premium,
        itemCount: 0
      }));
    })();

    return await Promise.race([queryPromise, timeoutPromise]);
  } catch (e) {
    logger.warn('getPackages failed:', e);
    return [];
  }
}

// Packages: Create
export async function createPackage(title: string, description: string, isPremium: boolean): Promise<PrayerPackage | null> {
  const { data, error } = await supabase
    .from('prayer_packages')
    .insert({ title, description, is_premium: isPremium })
    .select()
    .single();

  if (error || !data) {
    logger.error('Error creating package:', error);
    return null;
  }

  return {
    id: data.id,
    title: data.title,
    description: data.description,
    isPremium: data.is_premium,
  };
}

// Packages: Add Prayer
export async function addPrayerToPackage(packageId: string, prayerId: string): Promise<boolean> {
  const { error } = await supabase
    .from('package_items')
    .insert({ package_id: packageId, prayer_id: prayerId });

  if (error) {
    logger.error('Error adding prayer to package:', error);
    return false;
  }
  return true;
}

// Packages: Update
export async function updatePackage(id: string, updates: { title?: string; description?: string; isPremium?: boolean }): Promise<boolean> {
  const { error } = await supabase
    .from('prayer_packages')
    .update({
      title: updates.title,
      description: updates.description,
      is_premium: updates.isPremium,
      updated_at: new Date().toISOString()
    })
    .eq('id', id);

  if (error) {
    logger.error('Error updating package:', error);
    return false;
  }
  return true;
}

// Packages: Delete
export async function deletePackage(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('prayer_packages')
    .delete()
    .eq('id', id);

  if (error) {
    logger.error('Error deleting package:', error);
    return false;
  }
  return true;
}

// Packages: Get prayers in a package
export async function getPackagePrayers(packageId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('package_items')
    .select('prayer_id')
    .eq('package_id', packageId)
    .order('display_order');

  if (error) {
    logger.error('Error getting package prayers:', error);
    return [];
  }
  return data?.map(item => item.prayer_id) || [];
}

// Packages: Remove prayer from package
export async function removePrayerFromPackage(packageId: string, prayerId: string): Promise<boolean> {
  const { error } = await supabase
    .from('package_items')
    .delete()
    .eq('package_id', packageId)
    .eq('prayer_id', prayerId);

  if (error) {
    logger.error('Error removing prayer from package:', error);
    return false;
  }
  return true;
}

// Global Notification
export async function sendGlobalNotification(title: string, message: string): Promise<boolean> {
  // 1. Get all user IDs
  const users = await getAllUsers();
  const userIdChunks = [];
  const chunkSize = 100; // Batch insert limit

  for (let i = 0; i < users.length; i += chunkSize) {
    const chunk = users.slice(i, i + chunkSize);

    const notifications = chunk.map(u => ({
      user_id: u.id,
      type: 'system',
      content: `${title}: ${message}`,
      is_read: false
    }));

    const { error } = await supabase.from('notifications').insert(notifications);
    if (error) logger.error('Error sending batch notifications:', error);
  }

  return true;
}

// ==========================================
// ADMIN NOTIFICATIONS & QUOTES
// ==========================================

// Admin Notifications
export async function createAdminNotification(title: string, message: string, target: string = 'all'): Promise<boolean> {
  const { error } = await supabase.from('admin_notifications').insert({
    title,
    message,
    target,
  });
  if (error) {
    logger.error('Error creating admin notification:', error);
    return false;
  }
  return true;
}

export async function getAdminNotifications(): Promise<AdminNotification[]> {
  const { data, error } = await supabase
    .from('admin_notifications')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('Error fetching admin notifications:', error);
    return [];
  }
  return data as AdminNotification[];
}

export async function getUserNotifications(user: User): Promise<AdminNotification[]> {
  const { data, error } = await supabase
    .from('admin_notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    logger.error('Error fetching user notifications:', error);
    return [];
  }

  // Client side filter
  return (data as AdminNotification[]).filter(n =>
    n.target === 'all' ||
    (user.isPremium && n.target === 'premium') ||
    (!user.isPremium && n.target === 'free')
  );
}

// Quote Management
export async function getQuotesFromDB(): Promise<Quote[]> {
  const { data, error } = await supabase
    .from('daily_quotes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('Error fetching quotes:', error);
    return [];
  }
  return data as Quote[];
}

export async function addQuote(text: string, source: string): Promise<boolean> {
  const { error } = await supabase.from('daily_quotes').insert({ text, source });
  if (error) return false;
  return true;
}

export async function deleteQuote(id: string): Promise<boolean> {
  const { error } = await supabase.from('daily_quotes').delete().eq('id', id);
  if (error) return false;
  return true;
}

// Quotes: Update
export async function updateQuote(id: string, updates: { text?: string; source?: string }): Promise<boolean> {
  const { error } = await supabase
    .from('daily_quotes')
    .update({
      text: updates.text,
      source: updates.source
    })
    .eq('id', id);

  if (error) {
    logger.error('Error updating quote:', error);
    return false;
  }
  return true;
}

// ==========================================
// ANALİTİK SERVİSLERİ
// ==========================================

export interface AnalyticsEvent {
  id?: string;
  user_id?: string;
  prayer_id?: string;
  prayer_title?: string;
  event_type: string;
  count?: number;
  metadata?: any;
  created_at?: string;
}

export async function trackAnalyticsEvent(event: Omit<AnalyticsEvent, 'id' | 'created_at'>): Promise<boolean> {
  const { error } = await supabase.from('analytics_events').insert(event);
  return !error;
}

export async function getTopPrayers(limit: number = 10): Promise<{ prayer_title: string; total_count: number }[]> {
  try {
    // user_prayers tablosunu prayers ile join ederek title al
    const { data: userPrayers, error: upError } = await supabase
      .from('user_prayers')
      .select(`
        current_count,
        prayers:prayer_id (title)
      `);

    // custom_prayers'dan title ve current_count al
    const { data: customPrayers, error: cpError } = await supabase
      .from('custom_prayers')
      .select('title, current_count');

    logger.log('📊 getTopPrayers debug:', {
      userPrayers: userPrayers?.slice(0, 3),
      customPrayers: customPrayers?.slice(0, 3),
      upError,
      cpError
    });

    // Toplam sayıları hesapla
    const counts: Record<string, number> = {};

    userPrayers?.forEach((p: any) => {
      const title = p.prayers?.title || 'Bilinmeyen Dua';
      if (p.current_count > 0) {
        counts[title] = (counts[title] || 0) + p.current_count;
      }
    });

    customPrayers?.forEach(p => {
      if (p.title && p.current_count > 0) {
        counts[p.title] = (counts[p.title] || 0) + p.current_count;
      }
    });

    logger.log('📊 Prayer counts:', counts);

    return Object.entries(counts)
      .map(([prayer_title, total_count]) => ({ prayer_title, total_count }))
      .sort((a, b) => b.total_count - a.total_count)
      .slice(0, limit);
  } catch (e) {
    logger.error('Error getting top prayers:', e);
    return [];
  }
}

export async function getAnalyticsTrend(days: number = 7): Promise<{ date: string; count: number }[]> {
  try {
    // Toplam zikir sayısını al ve günlere böl (basit yaklaşım)
    const [{ data: userPrayers }, { data: customPrayers }] = await Promise.all([
      supabase.from('user_prayers').select('current_count'),
      supabase.from('custom_prayers').select('current_count')
    ]);

    // Toplam zikir hesapla
    let totalZikir = 0;
    userPrayers?.forEach(p => { totalZikir += p.current_count || 0; });
    customPrayers?.forEach(p => { totalZikir += p.current_count || 0; });

    // Son 7 gün için basit bir dağılım oluştur
    const result: { date: string; count: number }[] = [];
    const today = new Date();
    const avgPerDay = Math.round(totalZikir / days);

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      // Bugün için gerçek toplam, diğer günler için tahmin
      const count = i === 0 ? totalZikir : avgPerDay;
      result.push({ date: dateStr, count: i === 0 ? count : 0 });
    }

    return result;
  } catch (e) {
    logger.error('Error getting analytics trend:', e);
    return [];
  }
}

// ==========================================
// BANNER SERVİSLERİ
// ==========================================

export interface Banner {
  id?: string;
  title: string;
  message?: string;
  image_url?: string;
  link_url?: string;
  bg_color?: string;
  text_color?: string;
  is_active?: boolean;
  start_date?: string;
  end_date?: string;
  target?: string;
  priority?: number;
  created_at?: string;
}

export async function getActiveBanners(userIsPremium?: boolean): Promise<Banner[]> {
  const now = new Date().toISOString();

  let query = supabase
    .from('banners')
    .select('*')
    .eq('is_active', true)
    .or(`start_date.is.null,start_date.lte.${now}`)
    .or(`end_date.is.null,end_date.gte.${now}`)
    .order('priority', { ascending: false });

  const { data, error } = await query;
  if (error || !data) return [];

  // Filter by target
  return data.filter((b: Banner) => {
    if (b.target === 'all') return true;
    if (b.target === 'premium' && userIsPremium) return true;
    if (b.target === 'free' && !userIsPremium) return true;
    return false;
  });
}

export async function getAllBanners(): Promise<Banner[]> {
  const { data, error } = await supabase
    .from('banners')
    .select('*')
    .order('created_at', { ascending: false });
  return error ? [] : data || [];
}

export async function createBanner(banner: Omit<Banner, 'id' | 'created_at'>): Promise<Banner | null> {
  const { data, error } = await supabase.from('banners').insert(banner).select().single();
  return error ? null : data;
}

export async function updateBanner(id: string, updates: Partial<Banner>): Promise<boolean> {
  const { error } = await supabase.from('banners').update(updates).eq('id', id);
  return !error;
}

export async function deleteBanner(id: string): Promise<boolean> {
  const { error } = await supabase.from('banners').delete().eq('id', id);
  return !error;
}

// ==========================================
// GLOBAL HATİM KAMPANYALARI
// ==========================================

export interface HatimCampaign {
  id?: string;
  title: string;
  description?: string;
  goal: number;
  current_count?: number;
  start_date?: string;
  end_date?: string;
  is_active?: boolean;
  image_url?: string;
  created_at?: string;
}

export interface HatimParticipation {
  id?: string;
  campaign_id: string;
  user_id: string;
  part_no: number;
  completed: boolean;
  completed_at?: string;
  created_at?: string;
}

export async function getActiveCampaigns(): Promise<HatimCampaign[]> {
  const { data, error } = await supabase
    .from('global_hatim_campaigns')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });
  return error ? [] : data || [];
}

export async function getAllCampaigns(): Promise<HatimCampaign[]> {
  const { data, error } = await supabase
    .from('global_hatim_campaigns')
    .select('*')
    .order('created_at', { ascending: false });
  return error ? [] : data || [];
}

export async function createCampaign(campaign: Omit<HatimCampaign, 'id' | 'created_at' | 'current_count'>): Promise<HatimCampaign | null> {
  const { data, error } = await supabase.from('global_hatim_campaigns').insert(campaign).select().single();
  return error ? null : data;
}

export async function updateCampaign(id: string, updates: Partial<HatimCampaign>): Promise<boolean> {
  const { error } = await supabase.from('global_hatim_campaigns').update(updates).eq('id', id);
  return !error;
}

export async function joinCampaign(campaignId: string, userId: string, partNo: number): Promise<boolean> {
  const { error } = await supabase.from('hatim_participations').insert({
    campaign_id: campaignId,
    user_id: userId,
    part_no: partNo,
    completed: false
  });
  return !error;
}

export async function completeCampaignPart(campaignId: string, userId: string, partNo: number): Promise<boolean> {
  const { error } = await supabase
    .from('hatim_participations')
    .update({ completed: true, completed_at: new Date().toISOString() })
    .eq('campaign_id', campaignId)
    .eq('user_id', userId)
    .eq('part_no', partNo);
  return !error;
}

export async function getCampaignParticipations(campaignId: string): Promise<HatimParticipation[]> {
  const { data, error } = await supabase
    .from('hatim_participations')
    .select('*')
    .eq('campaign_id', campaignId);
  return error ? [] : data || [];
}

// ==========================================
// MODERASYON SERVİSLERİ
// ==========================================

export interface Report {
  id?: string;
  reporter_id?: string;
  reported_user_id?: string;
  reported_content_id?: string;
  content_type?: string;
  reason: string;
  description?: string;
  status?: string;
  admin_note?: string;
  resolved_by?: string;
  resolved_at?: string;
  created_at?: string;
  reporter_name?: string;
  reported_user_name?: string;
}

export async function getAllReports(): Promise<Report[]> {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  // Get user names
  const userIds = [...new Set([
    ...data.map((r: any) => r.reporter_id),
    ...data.map((r: any) => r.reported_user_id)
  ].filter(Boolean))];

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, name')
    .in('id', userIds);

  const nameMap = new Map(profiles?.map((p: any) => [p.id, p.name]) || []);

  return data.map((r: any) => ({
    ...r,
    reporter_name: nameMap.get(r.reporter_id) || 'Bilinmiyor',
    reported_user_name: nameMap.get(r.reported_user_id) || 'Bilinmiyor'
  }));
}

export async function createReport(report: Omit<Report, 'id' | 'created_at' | 'status'>): Promise<boolean> {
  const { error } = await supabase.from('reports').insert(report);
  return !error;
}

export async function updateReportStatus(id: string, status: string, adminNote?: string): Promise<boolean> {
  const { error } = await supabase
    .from('reports')
    .update({
      status,
      admin_note: adminNote,
      resolved_at: status === 'resolved' || status === 'dismissed' ? new Date().toISOString() : null
    })
    .eq('id', id);
  return !error;
}

// ==========================================
// CMS / MAKALE SERVİSLERİ
// ==========================================

export interface ArticleCategory {
  id?: string;
  name: string;
  slug?: string;
  description?: string;
  icon?: string;
  display_order?: number;
  created_at?: string;
}

export interface Article {
  id?: string;
  title: string;
  slug?: string;
  content: string;
  excerpt?: string;
  cover_image?: string;
  category_id?: string;
  category_name?: string;
  author_id?: string;
  author_name?: string;
  is_published?: boolean;
  is_featured?: boolean;
  view_count?: number;
  published_at?: string;
  created_at?: string;
  updated_at?: string;
}

export async function getAllCategories(): Promise<ArticleCategory[]> {
  const { data, error } = await supabase
    .from('article_categories')
    .select('*')
    .order('display_order', { ascending: true });
  return error ? [] : data || [];
}

export async function createCategory(category: Omit<ArticleCategory, 'id' | 'created_at'>): Promise<ArticleCategory | null> {
  const slug = category.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const { data, error } = await supabase
    .from('article_categories')
    .insert({ ...category, slug })
    .select()
    .single();
  return error ? null : data;
}

export async function deleteCategory(id: string): Promise<boolean> {
  const { error } = await supabase.from('article_categories').delete().eq('id', id);
  return !error;
}

export async function getAllArticles(): Promise<Article[]> {
  const { data, error } = await supabase
    .from('articles')
    .select(`
      *,
      article_categories(name)
    `)
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  return data.map((a: any) => ({
    ...a,
    category_name: a.article_categories?.name
  }));
}

export async function getPublishedArticles(): Promise<Article[]> {
  const { data, error } = await supabase
    .from('articles')
    .select(`*, article_categories(name)`)
    .eq('is_published', true)
    .order('published_at', { ascending: false });

  if (error || !data) return [];

  return data.map((a: any) => ({
    ...a,
    category_name: a.article_categories?.name
  }));
}

export async function createArticle(article: Omit<Article, 'id' | 'created_at' | 'updated_at' | 'view_count'>): Promise<Article | null> {
  const slug = article.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now();
  const { data, error } = await supabase
    .from('articles')
    .insert({
      ...article,
      slug,
      published_at: article.is_published ? new Date().toISOString() : null
    })
    .select()
    .single();
  return error ? null : data;
}

export async function updateArticle(id: string, updates: Partial<Article>): Promise<boolean> {
  const updateData: any = { ...updates, updated_at: new Date().toISOString() };
  if (updates.is_published && !updates.published_at) {
    updateData.published_at = new Date().toISOString();
  }
  const { error } = await supabase.from('articles').update(updateData).eq('id', id);
  return !error;
}

export async function deleteArticle(id: string): Promise<boolean> {
  const { error } = await supabase.from('articles').delete().eq('id', id);
  return !error;
}

// ==========================================
// KUPON SERVİSLERİ
// ==========================================

export interface Coupon {
  id?: string;
  code: string;
  description?: string;
  discount_type: string;
  discount_value: number;
  max_uses?: number;
  current_uses?: number;
  min_purchase?: number;
  expires_at?: string;
  is_active?: boolean;
  created_at?: string;
}

export async function getAllCoupons(): Promise<Coupon[]> {
  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .order('created_at', { ascending: false });
  return error ? [] : data || [];
}

export async function createCoupon(coupon: Omit<Coupon, 'id' | 'created_at' | 'current_uses'>): Promise<Coupon | null> {
  const { data, error } = await supabase.from('coupons').insert(coupon).select().single();
  return error ? null : data;
}

export async function updateCoupon(id: string, updates: Partial<Coupon>): Promise<boolean> {
  const { error } = await supabase.from('coupons').update(updates).eq('id', id);
  return !error;
}

export async function deleteCoupon(id: string): Promise<boolean> {
  const { error } = await supabase.from('coupons').delete().eq('id', id);
  return !error;
}

export async function validateCoupon(code: string): Promise<Coupon | null> {
  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('code', code.toUpperCase())
    .eq('is_active', true)
    .single();

  if (error || !data) return null;

  // Check expiration
  if (data.expires_at && new Date(data.expires_at) < new Date()) return null;
  // Check usage limit
  if (data.max_uses && data.current_uses >= data.max_uses) return null;

  return data;
}

export async function useCoupon(id: string): Promise<boolean> {
  const { error } = await supabase.rpc('increment_coupon_use', { coupon_id: id });
  if (error) {
    // Fallback if RPC doesn't exist
    const { data: coupon } = await supabase.from('coupons').select('current_uses').eq('id', id).single();
    if (coupon) {
      await supabase.from('coupons').update({ current_uses: (coupon.current_uses || 0) + 1 }).eq('id', id);
    }
  }
  return true;
}

// ==========================================
// FİNANSAL İSTATİSTİKLER
// ==========================================

export interface Transaction {
  id?: string;
  user_id?: string;
  amount: number;
  currency?: string;
  type: string;
  status?: string;
  payment_method?: string;
  coupon_id?: string;
  metadata?: any;
  created_at?: string;
}

export async function getAllTransactions(): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('created_at', { ascending: false });
  return error ? [] : data || [];
}

export async function getRevenueStats(): Promise<{ total: number; monthly: number; yearly: number }> {
  const { data, error } = await supabase
    .from('transactions')
    .select('amount, created_at')
    .eq('status', 'completed');

  if (error || !data) return { total: 0, monthly: 0, yearly: 0 };

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const yearStart = new Date(now.getFullYear(), 0, 1);

  let total = 0, monthly = 0, yearly = 0;

  data.forEach((t: any) => {
    const amount = parseFloat(t.amount) || 0;
    const date = new Date(t.created_at);
    total += amount;
    if (date >= yearStart) yearly += amount;
    if (date >= monthStart) monthly += amount;
  });

  return { total, monthly, yearly };
}

// ==========================================
// APP CONFIG / REMOTE CONFIG
// ==========================================

export interface AppConfig {
  maintenance_mode?: { enabled: boolean; message: string; end_time?: string };
  feature_flags?: Record<string, boolean>;
  min_app_version?: { ios: string; android: string };
  announcement?: { enabled: boolean; title: string; message: string; type: string };
  rate_limits?: { ai_requests_per_day: number; ai_requests_premium: number };
}

export async function getAppConfig(): Promise<AppConfig> {
  const { data, error } = await supabase
    .from('app_config')
    .select('key, value');

  if (error || !data) return {};

  const config: AppConfig = {};
  data.forEach((row: any) => {
    (config as any)[row.key] = row.value;
  });

  return config;
}

export async function updateAppConfig(key: string, value: any): Promise<boolean> {
  const { error } = await supabase
    .from('app_config')
    .update({ value, updated_at: new Date().toISOString() })
    .eq('key', key);
  return !error;
}

export async function setMaintenanceMode(enabled: boolean, message?: string): Promise<boolean> {
  return updateAppConfig('maintenance_mode', {
    enabled,
    message: message || 'Uygulama bakımda, lütfen daha sonra tekrar deneyin.',
    end_time: null
  });
}

export async function setFeatureFlag(feature: string, enabled: boolean): Promise<boolean> {
  const config = await getAppConfig();
  const flags = config.feature_flags || {};
  flags[feature] = enabled;
  return updateAppConfig('feature_flags', flags);
}

// ==================
// SHARED AUDIO CACHE
// API maliyetinden tasarruf için
// ==================

// Basit hash fonksiyonu (metin -> benzersiz key)
export function hashText(text: string): string {
  let hash = 0;
  const cleanText = text.trim().toLowerCase().replace(/\s+/g, ' ');
  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 32bit integer
  }
  // Pozitif yap ve hex'e çevir
  return Math.abs(hash).toString(16).padStart(8, '0');
}

// Cache'den ses al
export async function getCachedAudio(text: string): Promise<string | null> {
  try {
    const textHash = hashText(text);

    const { data, error } = await supabase
      .from('shared_audio_cache')
      .select('audio_base64')
      .eq('text_hash', textHash)
      .single();

    if (error || !data) {
      return null;
    }

    // Kullanım sayısını artır (arka planda)
    (async () => {
      try { await supabase.rpc('increment_audio_usage', { hash: textHash }); } catch { }
    })();

    logger.log('🎵 Audio loaded from cache!');
    return data.audio_base64;
  } catch (e) {
    logger.warn('Cache lookup failed:', e);
    return null;
  }
}

// Cache'e ses kaydet
export async function saveCachedAudio(text: string, audioBase64: string, userId?: string): Promise<boolean> {
  try {
    const textHash = hashText(text);
    const textPreview = text.slice(0, 50) + (text.length > 50 ? '...' : '');

    const { error } = await supabase
      .from('shared_audio_cache')
      .insert({
        text_hash: textHash,
        text_preview: textPreview,
        audio_base64: audioBase64,
        audio_size: audioBase64.length,
        created_by: userId
      });

    if (error) {
      // UNIQUE constraint hatası -> zaten var, sorun yok
      if (error.code === '23505') {
        logger.log('Audio already in cache');
        return true;
      }
      logger.warn('Cache save failed:', error);
      return false;
    }

    logger.log('🎵 Audio saved to cache!');
    return true;
  } catch (e) {
    logger.warn('Cache save error:', e);
    return false;
  }
}

// Cache istatistikleri (admin için)
export async function getAudioCacheStats(): Promise<{ totalCount: number; totalSize: number; topUsed: any[] }> {
  try {
    const { data: countData } = await supabase
      .from('shared_audio_cache')
      .select('id', { count: 'exact' });

    const { data: topData } = await supabase
      .from('shared_audio_cache')
      .select('text_preview, usage_count, audio_size, created_at')
      .order('usage_count', { ascending: false })
      .limit(10);

    return {
      totalCount: countData?.length || 0,
      totalSize: 0, // Hesaplanabilir
      topUsed: topData || []
    };
  } catch (e) {
    return { totalCount: 0, totalSize: 0, topUsed: [] };
  }
}

// ==========================================
// MANEVİ KOÇ PLANLARI (SPIRITUAL PLANS)
// ==========================================

export interface SpiritualPlanDb {
  id: string;
  user_id: string;
  title: string;
  description: string;
  mood: string;
  plan_data: SpiritualPlan;
  created_at: string;
}

export async function saveSpiritualPlan(userId: string, mood: string, plan: SpiritualPlan): Promise<boolean> {
  const { error } = await supabase
    .from('spiritual_plans')
    .insert({
      user_id: userId,
      title: plan.title,
      description: plan.description,
      mood: mood,
      plan_data: plan
    });

  if (error) {
    logger.error('Error saving spiritual plan:', error);
    return false;
  }
  return true;
}

export async function getUserSpiritualPlans(userId: string): Promise<SpiritualPlanDb[]> {
  const { data, error } = await supabase
    .from('spiritual_plans')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('Error fetching spiritual plans:', error);
    return [];
  }
  return data || [];
}

export async function deleteSpiritualPlan(planId: string): Promise<boolean> {
  const { error } = await supabase
    .from('spiritual_plans')
    .delete()
    .eq('id', planId);

  if (error) {
    logger.error('Error deleting spiritual plan:', error);
    return false;
  }
  return true;
}

// ==================
// APP SETTINGS (API Anahtarları vb.)
// ==================

export interface AppSetting {
  key: string;
  value: string;
  updated_at: string;
}

export async function getAppSetting(key: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', key)
      .single();

    if (error || !data) {
      logger.warn(`App setting '${key}' not found:`, error?.message);
      return null;
    }
    return data.value;
  } catch (e) {
    logger.error('Error getting app setting:', e);
    return null;
  }
}

export async function setAppSetting(key: string, value: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('app_settings')
      .upsert({
        key,
        value,
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' });

    if (error) {
      logger.error('Error setting app setting:', error);
      return false;
    }
    return true;
  } catch (e) {
    logger.error('Error setting app setting:', e);
    return false;
  }
}

export async function getAllAppSettings(): Promise<AppSetting[]> {
  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('*');

    if (error) {
      logger.error('Error fetching app settings:', error);
      return [];
    }
    return data || [];
  } catch (e) {
    logger.error('Error fetching app settings:', e);
    return [];
  }
}

// ==================
// AD RATES (Reklam Oranları)
// ==================

export interface AdRates {
  tts: number;
  ocr: number;
  dream: number;
  chat: number;
}

// Cache for ad rates
let adRatesCache: AdRates | null = null;

export async function getAdRates(): Promise<AdRates> {
  // Return cached if available
  if (adRatesCache) return adRatesCache;

  // Default values based on API costs
  const defaults: AdRates = { tts: 2, ocr: 1, dream: 1, chat: 2 };

  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('key, value')
      .in('key', ['ad_rate_tts', 'ad_rate_ocr', 'ad_rate_dream', 'ad_rate_chat']);

    if (!error && data) {
      data.forEach(item => {
        const feature = item.key.replace('ad_rate_', '') as keyof AdRates;
        if (feature in defaults) {
          defaults[feature] = parseInt(item.value) || defaults[feature];
        }
      });
    }
  } catch (e) {
    logger.warn('Failed to fetch ad rates, using defaults:', e);
  }

  adRatesCache = defaults;
  return defaults;
}

export function clearAdRatesCache(): void {
  adRatesCache = null;
}

// ==================
// USAGE STATISTICS
// ==================

export type UsageType = 'tts' | 'ocr' | 'ad_watched' | 'chat';

export interface UsageStat {
  id: string;
  user_id: string;
  type: UsageType;
  cost_estimate: number;
  created_at: string;
}

export interface UsageSummary {
  type: UsageType;
  total_count: number;
  total_cost: number;
  date?: string;
}

// Maliyet tahminleri (USD cinsinden)
const COST_ESTIMATES: Record<UsageType, number> = {
  tts: 0.002,      // ~$0.002 per TTS request
  ocr: 0.001,      // ~$0.001 per image
  chat: 0.0005,    // ~$0.0005 per chat message
  ad_watched: 0    // No cost, actually revenue
};

export async function logUsageStat(type: UsageType, userId?: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('usage_stats')
      .insert({
        user_id: userId || null,
        type,
        cost_estimate: COST_ESTIMATES[type]
      });

    if (error) {
      logger.error('Error logging usage stat:', error);
      return false;
    }
    return true;
  } catch (e) {
    logger.error('Error logging usage stat:', e);
    return false;
  }
}

export async function getUsageStats(days: number = 30): Promise<UsageSummary[]> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('usage_stats')
      .select('type, cost_estimate')
      .gte('created_at', startDate.toISOString());

    if (error) {
      logger.error('Error fetching usage stats:', error);
      return [];
    }

    // Tipe göre grupla
    const summary: Record<UsageType, { count: number; cost: number }> = {
      tts: { count: 0, cost: 0 },
      ocr: { count: 0, cost: 0 },
      chat: { count: 0, cost: 0 },
      ad_watched: { count: 0, cost: 0 }
    };

    data?.forEach(stat => {
      const t = stat.type as UsageType;
      if (summary[t]) {
        summary[t].count++;
        summary[t].cost += stat.cost_estimate || 0;
      }
    });

    return Object.entries(summary).map(([type, stats]) => ({
      type: type as UsageType,
      total_count: stats.count,
      total_cost: stats.cost
    }));
  } catch (e) {
    logger.error('Error fetching usage stats:', e);
    return [];
  }
}

export async function getUsageStatsByDate(days: number = 7): Promise<{ date: string; type: UsageType; count: number }[]> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('usage_stats')
      .select('type, created_at')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching usage stats by date:', error);
      return [];
    }

    // Tarihe ve tipe göre grupla
    const grouped: Record<string, Record<UsageType, number>> = {};

    data?.forEach(stat => {
      const date = new Date(stat.created_at).toISOString().split('T')[0];
      if (!grouped[date]) {
        grouped[date] = { tts: 0, ocr: 0, chat: 0, ad_watched: 0 };
      }
      const t = stat.type as UsageType;
      grouped[date][t]++;
    });

    const result: { date: string; type: UsageType; count: number }[] = [];
    Object.entries(grouped).forEach(([date, types]) => {
      Object.entries(types).forEach(([type, count]) => {
        if (count > 0) {
          result.push({ date, type: type as UsageType, count });
        }
      });
    });

    return result;
  } catch (e) {
    logger.error('Error fetching usage stats by date:', e);
    return [];
  }
}
