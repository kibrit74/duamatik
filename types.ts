
export interface Reminder {
  active: boolean;
  type: 'onetime' | 'weekly';
  date?: string; // ISO string for onetime
  day?: number; // 0-6 for weekly (0=Sunday)
  time: string; // HH:mm format
}

export interface HistoryEntry {
  date: string; // ISO String
  count: number; // How many read in this session
}

export interface Prayer {
  id: string;
  title: string;
  arabic?: string;
  turkish: string;
  meaning?: string; // Meal / Anlam
  audioBase64?: string; // Offline stored PCM audio data (Base64)
  targetCount: number;
  currentCount: number;
  tags: string[];
  lastUpdated: number;
  reminder?: Reminder;
  history?: HistoryEntry[];
  isHatimPart?: boolean; // Is this a part of a shared Hatim?
  hatimPartNo?: number; // 1-30
}

export interface HatimPartStatus {
  partNo: number;
  status: 'empty' | 'assigned' | 'completed';
  assignedTo?: string; // Name of the person
  assignedDate?: number;
}

export type ViewState = 'HOME' | 'COUNTER' | 'ADD' | 'SEARCH' | 'SETTINGS' | 'PROFILE' | 'SOCIAL' | 'ADMIN' | 'COACH' | 'DREAM' | 'ARTICLES' | 'ARTICLE_DETAIL';

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

export interface SearchResult {
  text: string;
  sources: { title: string; url: string }[];
}

export interface Quote {
  id?: string;
  text: string;
  source: string;
}

// Social Types
export interface LeaderboardUser {
  id: string;
  name: string;
  city: string;
  score: number; // Total dhikr count
  streak: number; // Days
  badge: 'gold' | 'silver' | 'bronze' | null;
}

export interface Friend {
  id: string;
  name: string;
  status: 'online' | 'praying' | 'offline';
  lastActive: string;
  isAwakeForFajr?: boolean;
}

export interface FriendProfile {
  id: string;
  name: string;
  city: string | null;
  isCustom?: boolean;
  isOnline?: boolean;
  lastActive?: string | null;
}

export interface FriendRequest {
  id: string;
  fromUserId: string;
  fromUserName: string;
  fromUserCity: string;
  sentAt: string;
}

// Auth Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  city?: string;
  avatar?: string;
  joinDate: string;
  isPremium: boolean; // Monetization flag
  stats?: {
    totalZikir: number;
    totalPrayers: number;
  };
}

// Spiritual Coach Types
export interface DailyPlan {
  day: number;
  focus: string; // e.g., "Sabır"
  morning: string; // Task
  evening: string; // Task
  dhikr: string; // Recommended dhikr
}

export interface SpiritualPlan {
  title: string;
  description: string;
  days: DailyPlan[];
}

// Messaging Types
export interface Notification {
  id: string;
  userId: string;
  type: 'nudge' | 'friend_request' | 'hatim_invite' | 'message' | 'system';
  content: string;
  sourceId?: string;
  sourceName?: string; // Hydrated on client
  metadata?: any;
  isRead: boolean;
  createdAt: string;
}

export interface AdminNotification {
  id: string;
  title: string;
  message: string;
  target: string;
  created_at: string;
  created_by?: string;
}

// Package Types
export interface PrayerPackage {
  id: string;
  title: string;
  description: string;
  iconUrl?: string;
  isPremium: boolean;
  prayers?: Prayer[]; // Hydrated
  itemCount?: number;
}

export interface PackageItem {
  id: string;
  packageId: string;
  prayerId: string;
  displayOrder: number;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}