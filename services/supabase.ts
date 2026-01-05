import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { User, Prayer, Quote } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials missing. Check .env.local');
}

export const supabase: SupabaseClient = createClient(supabaseUrl!, supabaseAnonKey!);

// ==================
// PROFILE HELPERS
// ==================

export async function getProfile(userId: string): Promise<User | null> {
  try {
    const query = supabase
      .from('profiles')
      .select('id, name, role, city, join_date, is_premium, updated_at')
      .eq('id', userId)
      .single();

    // Create a timeout promise
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Profile fetch timeout')), 5000));

    // Race the query against the timeout
    const { data, error } = await Promise.race([query, timeoutPromise]) as any;

    if (error || !data) return null;

    return {
      id: data.id,
      email: '', // Email is not in public profile
      name: data.name || 'Kullanıcı',
      role: data.role || 'user',
      city: data.city,
      joinDate: data.join_date,
      isPremium: data.is_premium || false,
    };
  } catch (e) {
    console.warn('Profile fetch timed out or failed', e);
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
  const { data, error } = await supabase
    .from('prayers')
    .select('*')
    .order('title');

  if (error) {
    console.error('Error fetching catalog prayers:', error);
    return [];
  }

  return data || [];
}

export async function seedCatalogPrayers(prayers: Array<{
  title: string;
  arabic?: string;
  turkish: string;
  meaning?: string;
  target_count: number;
  tags: string[];
}>): Promise<boolean> {
  // First check if already seeded
  const { count } = await supabase
    .from('prayers')
    .select('*', { count: 'exact', head: true });

  if (count && count > 0) {
    console.log(`Catalog already has ${count} prayers, skipping seed.`);
    return true;
  }

  const { error } = await supabase
    .from('prayers')
    .insert(prayers.map(p => ({
      title: p.title,
      arabic: p.arabic || null,
      turkish: p.turkish,
      meaning: p.meaning || null,
      target_count: p.target_count,
      tags: p.tags,
    })));

  if (error) {
    console.error('Error seeding catalog prayers:', error);
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
  const { data, error } = await supabase
    .from('user_prayers')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching user prayer progress:', error);
    return [];
  }

  return data || [];
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
    console.error('Error saving user prayer progress:', error);
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
  const { data, error } = await supabase
    .from('custom_prayers')
    .select('*')
    .eq('user_id', userId)
    .order('last_updated', { ascending: false });

  if (error) {
    console.error('Error fetching custom prayers:', error);
    return [];
  }

  return data || [];
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
    console.error('Error saving custom prayer:', error);
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

const AUDIO_BUCKET = 'prayer-audio';

export async function uploadPrayerAudio(
  userId: string,
  prayerId: string,
  audioBase64: string
): Promise<string | null> {
  try {
    // Convert base64 to Blob
    const byteCharacters = atob(audioBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'audio/wav' });

    const filePath = `${userId}/${prayerId}.wav`;

    const { error } = await supabase.storage
      .from(AUDIO_BUCKET)
      .upload(filePath, blob, {
        upsert: true,
        contentType: 'audio/wav'
      });

    if (error) {
      console.error('Error uploading audio:', error);
      return null;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(AUDIO_BUCKET)
      .getPublicUrl(filePath);

    return urlData?.publicUrl || null;
  } catch (e) {
    console.error('Error in uploadPrayerAudio:', e);
    return null;
  }
}

export async function deletePrayerAudio(userId: string, prayerId: string): Promise<boolean> {
  const filePath = `${userId}/${prayerId}.wav`;

  const { error } = await supabase.storage
    .from(AUDIO_BUCKET)
    .remove([filePath]);

  return !error;
}

export async function downloadPrayerAudio(audioUrl: string): Promise<string | null> {
  try {
    const response = await fetch(audioUrl);
    if (!response.ok) return null;

    const blob = await response.blob();
    const reader = new FileReader();

    return new Promise((resolve) => {
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.error('Error downloading audio:', e);
    return null;
  }
}

// ==================
// QUOTES
// ==================

export async function getQuotes(): Promise<Quote[]> {
  const { data, error } = await supabase
    .from('quotes')
    .select('text, source');

  if (error) {
    console.error('Error fetching quotes:', error);
    return [];
  }

  return data || [];
}

export async function seedQuotes(quotes: Quote[]): Promise<boolean> {
  // Check if already seeded
  const { count } = await supabase
    .from('quotes')
    .select('*', { count: 'exact', head: true });

  if (count && count > 0) {
    console.log(`Quotes already seeded (${count}), skipping.`);
    return true;
  }

  const { error } = await supabase
    .from('quotes')
    .insert(quotes);

  if (error) {
    console.error('Error seeding quotes:', error);
    return false;
  }
  return true;
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

  try {
    const { error: e1 } = await supabase.from('prayers').select('id').limit(1);
    results.prayers = !e1;

    const { error: e2 } = await supabase.from('user_prayers').select('id').limit(1);
    results.userPrayers = !e2;

    const { error: e3 } = await supabase.from('custom_prayers').select('id').limit(1);
    results.customPrayers = !e3;

    const { error: e4 } = await supabase.from('quotes').select('id').limit(1);
    results.quotes = !e4;
  } catch (e) {
    console.error('Error checking tables:', e);
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
    // Get user stats by aggregating user_prayers and custom_prayers
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, name, city')
      .order('name');

    if (error || !profiles) {
      console.error('Error fetching profiles for leaderboard:', error);
      return [];
    }

    // Get zikir counts for each user
    const leaderboard: LeaderboardEntry[] = [];

    for (const profile of profiles) {
      // Get sum of current_count from user_prayers
      const { data: userPrayers } = await supabase
        .from('user_prayers')
        .select('current_count')
        .eq('user_id', profile.id);

      const { data: customPrayers } = await supabase
        .from('custom_prayers')
        .select('current_count')
        .eq('user_id', profile.id);

      const userPrayersTotal = userPrayers?.reduce((sum, p) => sum + (p.current_count || 0), 0) || 0;
      const customPrayersTotal = customPrayers?.reduce((sum, p) => sum + (p.current_count || 0), 0) || 0;
      const totalZikir = userPrayersTotal + customPrayersTotal;

      if (totalZikir > 0) {
        leaderboard.push({
          id: profile.id,
          name: profile.name || 'Anonim',
          city: profile.city,
          totalZikir,
          streak: 0, // TODO: Calculate streak from history
          rank: 0,
        });
      }
    }

    // Sort by totalZikir descending
    leaderboard.sort((a, b) => b.totalZikir - a.totalZikir);

    // Assign ranks
    leaderboard.forEach((entry, idx) => {
      entry.rank = idx + 1;
    });

    return leaderboard.slice(0, limit);
  } catch (e) {
    console.error('Error getting leaderboard:', e);
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
    console.error('Error getting user stats:', e);
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
      console.error('Error fetching friendships:', error);
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
      console.error('Error fetching friend profiles:', profileError);
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
    console.error('Error getting friends:', e);
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
      console.error('Error searching users:', error);
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
    console.error('Error searching users:', e);
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
      if (error.code === '23505') {
        return { success: false, message: 'Bu kişiye zaten istek gönderilmiş.' };
      }
      console.error('Error sending friend request:', error);
      return { success: false, message: 'İstek gönderilemedi.' };
    }
    return { success: true, message: 'İstek gönderildi.' };
  } catch (e) {
    console.error('Error sending friend request:', e);
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
      console.error('Error fetching pending requests:', error);
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
    console.error('Error getting pending requests:', e);
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
      console.error('Error updating request:', updateError);
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
      console.error('Error creating friendship:', friendError);
      // Rollback request status if friendship creation fails
      return false;
    }

    return true;
  } catch (e) {
    console.error('Error accepting friend request:', e);
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
    console.error('Error rejecting friend request:', e);
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
    console.error('Error removing friend:', e);
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
      console.error('Error generating invite code:', error);
      return null;
    }
    return code;
  } catch (e) {
    console.error('Error generating invite code:', e);
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
      .limit(1)
      .single();

    if (error || !data) {
      // No existing code, generate new one
      return generateInviteCode(userId);
    }
    return data.code;
  } catch (e) {
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
      console.error('Error creating friendship:', matchError);
      return { success: false, message: 'Arkadaşlık oluşturulurken bir hata meydana geldi.' };
    }

    // Decrease uses
    const { error: updateError } = await supabase
      .from('invite_codes')
      .update({ uses_remaining: inviteData.uses_remaining - 1 })
      .eq('id', inviteData.id);

    if (updateError) {
      console.error('Error updating invite code:', updateError);
      // We don't fail the operation here since the friendship was created, but we log it.
    }

    return { success: true, message: 'Arkadaş eklendi!' };
  } catch (e) {
    console.error('Error using invite code:', e);
    return { success: false, message: 'Bir hata oluştu.' };
  }
}

// ==================
// MESSAGING & NOTIFICATIONS
// ==================

import { Message, Notification } from '../types';

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
    console.error('Error getting notifications:', e);
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
    console.error('Error getting messages:', e);
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
    console.error('Error sending message:', error);
    return false;
  }

  return true;
}
