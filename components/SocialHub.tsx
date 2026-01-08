import React, { useState, useEffect } from 'react';
import HatimManager from './HatimManager';
import ChatModal from './ChatModal';
import { Trophy, Users, BookOpenCheck, MapPin, Flame, UserPlus, BellRing, Hand, Medal, Crown, Loader2, Search, Share2, Copy, Check, X, UserCheck, Clock, MessageCircle, CheckCircle2 } from 'lucide-react';
import { LeaderboardUser, Friend, User } from '../types';
import {
  getLeaderboard,
  getUserStats,
  LeaderboardEntry,
  getFriends,
  searchUsers,
  sendFriendRequest,
  getPendingRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  getInviteCode,
  useInviteCode,
  FriendProfile,
  FriendRequest,
  sendNotification
} from '../services/supabase';

interface SocialHubProps {
  onClose: () => void;
  user?: User | null;
}

const SocialHub: React.FC<SocialHubProps> = ({ onClose, user }) => {
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'friends' | 'hatim'>('leaderboard');
  const [nudgedFriends, setNudgedFriends] = useState<string[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userStats, setUserStats] = useState<{ totalZikir: number; rank: number; streak: number } | null>(null);
  const [loading, setLoading] = useState(true);

  // Friends state
  const [friends, setFriends] = useState<FriendProfile[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FriendProfile[]>([]);
  const [searching, setSearching] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [friendsLoading, setFriendsLoading] = useState(true);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [friendsError, setFriendsError] = useState<string | null>(null);

  // Chat State
  const [showChat, setShowChat] = useState(false);
  const [chatFriend, setChatFriend] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    loadLeaderboard();
  }, [user]);

  useEffect(() => {
    if (activeTab === 'friends' && user) {
      loadFriends();
    }
  }, [activeTab, user]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (searchQuery.length >= 2 && user) {
        handleSearch();
      } else {
        setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const data = await getLeaderboard(10);
      setLeaderboard(data);

      if (user) {
        const stats = await getUserStats(user.id);
        setUserStats(stats);
      }
    } catch (e) {
      console.error('Error loading leaderboard:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadFriends = async () => {
    if (!user) return;
    setFriendsLoading(true);
    setFriendsError(null);
    try {
      const [friendsData, requestsData, code] = await Promise.all([
        getFriends(user.id),
        getPendingRequests(user.id),
        getInviteCode(user.id),
      ]);
      setFriends(friendsData);
      setPendingRequests(requestsData);
      setInviteCode(code);
    } catch (e) {
      console.error('Error loading friends:', e);
      setFriendsError('Arkadaşlar yüklenirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setFriendsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!user || searchQuery.length < 2) return;
    setSearching(true);
    setSearchError(null);
    try {
      const results = await searchUsers(searchQuery, user.id);
      setSearchResults(results);
      if (results.length === 0 && searchQuery.length >= 2) {
        setSearchError('Aradığınız kriterlere uygun kullanıcı bulunamadı.');
      }
    } catch (e) {
      console.error('Error searching:', e);
      setSearchError('Arama sırasında bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setSearching(false);
    }
  };

  const handleSendRequest = async (toUserId: string) => {
    if (!user) return;
    const { success, message } = await sendFriendRequest(user.id, toUserId);
    if (message) alert(message);

    if (success) {
      setSearchResults(prev => prev.filter(u => u.id !== toUserId));
    }
  };

  const handleAcceptRequest = async (request: FriendRequest) => {
    if (!user) return;
    const success = await acceptFriendRequest(request.id, request.fromUserId, user.id);
    if (success) {
      setPendingRequests(prev => prev.filter(r => r.id !== request.id));
      loadFriends();
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    const success = await rejectFriendRequest(requestId);
    if (success) {
      setPendingRequests(prev => prev.filter(r => r.id !== requestId));
    }
  };

  const handleCopyInvite = async () => {
    if (!inviteCode) return;
    const inviteUrl = `${window.location.origin}?invite=${inviteCode}`;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUseInviteCode = async () => {
    if (!user || !inviteCodeInput) return;
    const result = await useInviteCode(inviteCodeInput, user.id);
    alert(result.message);
    if (result.success) {
      setInviteCodeInput('');
      setShowInviteModal(false);
      loadFriends();
    }
  };

  const handleNudge = async (friendId: string, friendName: string) => {
    if (nudgedFriends.includes(friendId) || !user) return;

    // Optimistic Update
    setNudgedFriends(prev => [...prev, friendId]);

    try {
      await sendNotification(
        friendId,
        'nudge',
        `${user.name} seni dürtüyor! Zikrini unutma.`,
        user.id
      );
      alert(`${friendName} kişisine uyarı gönderildi! 🔔`);
    } catch (e) {
      console.error("Nudge failed", e);
    }

    // Cooldown
    setTimeout(() => {
      setNudgedFriends(prev => prev.filter(id => id !== friendId));
    }, 5000);
  };

  const getBadge = (rank: number) => {
    if (rank === 1) return 'gold';
    if (rank === 2) return 'silver';
    if (rank === 3) return 'bronze';
    return null;
  };

  const renderLeaderboard = () => (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
      {/* Top Stats */}
      <div className="bg-linear-to-r from-teal-600 to-emerald-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
        <div className="relative z-10 flex justify-between items-end">
          <div>
            <p className="text-teal-100 text-xs font-bold uppercase tracking-widest mb-1">Senin Sıralaman</p>
            <h3 className="text-3xl font-cinzel font-bold">
              {loading ? '...' : userStats ? `#${userStats.rank}` : '-'}
            </h3>
            <p className="text-sm text-teal-50 flex items-center gap-1 mt-1">
              <MapPin size={12} /> {user?.city || 'Türkiye'} Genelinde
            </p>
          </div>
          <div className="text-right">
            <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1.5 border border-white/10">
              <Flame size={14} className="text-amber-300 fill-amber-300" />
              <span className="font-bold font-mono">{userStats?.streak || 0} Gün</span>
            </div>
            <p className="text-[10px] text-teal-100 mt-1">Seri</p>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-emerald-50 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-stone-100 bg-stone-50/50 flex justify-between items-center">
          <h3 className="font-bold text-stone-700 flex items-center gap-2">
            <Crown size={18} className="text-amber-500" /> Haftanın Enleri
          </h3>
          <span className="text-[10px] text-stone-400">Pazar 23:59'da sıfırlanır</span>
        </div>

        {loading ? (
          <div className="p-8 flex justify-center">
            <Loader2 className="animate-spin text-teal-600" size={32} />
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="p-8 text-center text-stone-400">
            <p>Henüz liderlik tablosunda kimse yok.</p>
            <p className="text-sm mt-1">Tesbih çekerek ilk sen ol!</p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {leaderboard.map((entry, idx) => (
              <div key={entry.id} className="p-4 flex items-center justify-between hover:bg-stone-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 flex items-center justify-center font-bold rounded-full ${idx === 0 ? 'bg-amber-100 text-amber-700' :
                    idx === 1 ? 'bg-stone-200 text-stone-600' :
                      idx === 2 ? 'bg-orange-100 text-orange-700' : 'text-stone-400 font-mono text-sm'
                    }`}>
                    {idx + 1}
                  </div>
                  <div>
                    <h4 className="font-bold text-stone-800 text-sm flex items-center gap-1">
                      {entry.name}
                      {getBadge(idx + 1) === 'gold' && <Medal size={12} className="text-amber-500" />}
                    </h4>
                    <p className="text-xs text-stone-400 flex items-center gap-1">
                      <MapPin size={10} /> {entry.city || 'Türkiye'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="block font-mono font-bold text-teal-700">{entry.totalZikir.toLocaleString()}</span>
                  <span className="text-[10px] text-stone-400">Zikir</span>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="p-3 text-center border-t border-stone-100">
          <button onClick={loadLeaderboard} className="text-xs text-teal-600 font-bold hover:underline">
            Yenile
          </button>
        </div>
      </div>
    </div>
  );

  const renderFriends = () => (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
      {/* Search & Invite Box */}
      <div className="bg-stone-900 rounded-xl p-5 text-white shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-lg">Dua Kardeşliği</h3>
            <p className="text-xs text-stone-400">Arkadaşlarını ekle, hayırda yarışın.</p>
          </div>
          <button
            onClick={() => setShowInviteModal(true)}
            className="w-10 h-10 bg-teal-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-teal-500/30 hover:scale-105 transition-transform"
          >
            <Share2 size={18} />
          </button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-3 text-stone-400" />
          <input
            type="text"
            placeholder="İsim ile ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-stone-800 border border-stone-700 rounded-xl text-white placeholder-stone-500 text-sm focus:border-teal-500 outline-none"
          />
          {searching && <Loader2 size={16} className="absolute right-3 top-3 animate-spin text-teal-400" />}
        </div>

        {/* Search Error/Empty Message */}
        {searchError && searchResults.length === 0 && (
          <div className="mt-2 p-2 bg-stone-800/50 rounded-lg">
            <p className="text-xs text-stone-400 text-center">{searchError}</p>
          </div>
        )}

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mt-3 space-y-2 max-h-40 overflow-y-auto">
            {searchResults.map(u => (
              <div key={u.id} className="flex items-center justify-between bg-stone-800 p-3 rounded-lg">
                <div>
                  <p className="text-sm font-medium">{u.name}</p>
                  <p className="text-xs text-stone-400">{u.city || 'Türkiye'}</p>
                </div>
                <button
                  onClick={() => handleSendRequest(u.id)}
                  className="px-3 py-1.5 bg-teal-500 rounded-lg text-xs font-bold hover:bg-teal-400 transition-colors"
                >
                  Ekle
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <h4 className="text-sm font-bold text-amber-800 mb-3 flex items-center gap-2">
            <Clock size={16} /> Bekleyen İstekler ({pendingRequests.length})
          </h4>
          <div className="space-y-2">
            {pendingRequests.map(req => (
              <div key={req.id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-amber-100">
                <p className="text-sm font-medium text-stone-700">{req.fromUserName}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAcceptRequest(req)}
                    className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    onClick={() => handleRejectRequest(req.id)}
                    className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Friends List */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-emerald-50 shadow-sm">
        <div className="p-4 border-b border-stone-100 flex justify-between items-center">
          <h4 className="font-bold text-stone-700">Arkadaşlarım ({friends.length})</h4>
          <button onClick={loadFriends} className="text-xs text-teal-600 font-bold">Yenile</button>
        </div>

        {friendsLoading ? (
          <div className="p-8 flex justify-center">
            <Loader2 className="animate-spin text-teal-600" size={24} />
          </div>
        ) : friendsError ? (
          <div className="p-8 text-center text-red-400">
            <p className="text-sm">{friendsError}</p>
            <button onClick={loadFriends} className="mt-2 text-xs text-teal-600 font-bold underline">Tekrar Dene</button>
          </div>
        ) : friends.length === 0 ? (
          <div className="p-8 text-center text-stone-400">
            <Users size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">Henüz arkadaşınız yok.</p>
            <p className="text-xs mt-1">Yukarıdan arama yapın veya davet linki paylaşın!</p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {friends.map(friend => (
              <div key={friend.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center text-stone-500 font-bold">
                      {friend.name.substring(0, 1)}
                    </div>
                    {friend.isOnline && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>}
                  </div>
                  <div>
                    <h4 className="font-bold text-stone-800 text-sm">{friend.name}</h4>
                    <p className="text-xs text-stone-400">{friend.city || 'Türkiye'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setChatFriend({ id: friend.id, name: friend.name });
                      setShowChat(true);
                    }}
                    className="p-2 bg-teal-50 text-teal-600 rounded-lg hover:bg-teal-100 transition-colors"
                    title="Mesaj Gönder"
                  >
                    <MessageCircle size={20} />
                  </button>

                  <button
                    onClick={() => handleNudge(friend.id, friend.name)}
                    disabled={nudgedFriends.includes(friend.id)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${nudgedFriends.includes(friend.id)
                      ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                      : 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                      }`}
                  >
                    {nudgedFriends.includes(friend.id) ? <CheckCircle2 size={20} /> : <Hand size={20} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 bg-teal-50 border border-teal-100 rounded-xl flex items-start gap-3">
        <BellRing size={20} className="text-teal-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-bold text-teal-800">Sabah Namazı Uyanışı</h4>
          <p className="text-xs text-teal-700/80 mt-1">Arkadaşlarınız "Dürt" butonuna bastığında bildirim alırsınız.</p>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-stone-800">Arkadaş Davet Et</h3>
              <button onClick={() => setShowInviteModal(false)} className="p-2 hover:bg-stone-100 rounded-lg">
                <X size={20} />
              </button>
            </div>

            {/* Share Code */}
            <div className="mb-6">
              <p className="text-sm text-stone-600 mb-2">Davet kodunuz:</p>
              <div className="flex gap-2">
                <div className="flex-1 bg-stone-100 px-4 py-3 rounded-xl font-mono font-bold text-lg text-center tracking-widest">
                  {inviteCode || '...'}
                </div>
                <button
                  onClick={handleCopyInvite}
                  className={`px-4 rounded-xl transition-colors ${copied ? 'bg-green-500' : 'bg-teal-500'} text-white`}
                >
                  {copied ? <Check size={20} /> : <Copy size={20} />}
                </button>
              </div>
              <p className="text-xs text-stone-400 mt-2 text-center">Bu kodu arkadaşlarınızla paylaşın</p>
            </div>

            {/* Use Code */}
            <div className="border-t border-stone-200 pt-4">
              <p className="text-sm text-stone-600 mb-2">Kod kullan:</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="ABC123"
                  value={inviteCodeInput}
                  onChange={(e) => setInviteCodeInput(e.target.value.toUpperCase())}
                  className="flex-1 px-4 py-2 border border-stone-200 rounded-xl font-mono uppercase text-center tracking-widest focus:border-teal-500 outline-none"
                  maxLength={6}
                />
                <button
                  onClick={handleUseInviteCode}
                  disabled={inviteCodeInput.length < 4}
                  className="px-4 bg-stone-800 text-white rounded-xl disabled:opacity-50"
                >
                  <UserCheck size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-[#ecfdf5] relative pb-24">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-md px-6 pt-6 pb-2 border-b border-emerald-100 relative z-10 shadow-sm">
        <h2 className="text-2xl font-bold font-cinzel text-teal-900">Topluluk</h2>
        <p className="text-stone-500 text-xs font-serif mt-1">
          Hayırda yarışanlar, birbirine şahit olanlar.
        </p>

        {/* Custom Tabs */}
        <div className="flex p-1 bg-stone-100 rounded-xl mt-4">
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'leaderboard' ? 'bg-white text-teal-700 shadow-sm' : 'text-stone-400 hover:text-stone-600'
              }`}
          >
            <Trophy size={14} /> Liderler
          </button>
          <button
            onClick={() => setActiveTab('friends')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'friends' ? 'bg-white text-teal-700 shadow-sm' : 'text-stone-400 hover:text-stone-600'
              }`}
          >
            <Users size={14} /> Kardeşlik
            {pendingRequests.length > 0 && (
              <span className="w-4 h-4 bg-amber-500 text-white text-[10px] rounded-full flex items-center justify-center">
                {pendingRequests.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('hatim')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'hatim' ? 'bg-white text-teal-700 shadow-sm' : 'text-stone-400 hover:text-stone-600'
              }`}
          >
            <BookOpenCheck size={14} /> Hatim
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 no-scrollbar">
        {activeTab === 'leaderboard' && renderLeaderboard()}
        {activeTab === 'friends' && renderFriends()}
        {activeTab === 'hatim' && (
          <div className="animate-in fade-in slide-in-from-right-8">
            <HatimManager onClose={() => { }} />
          </div>
        )}
      </div>

      {/* Modals */}
      {showChat && chatFriend && user && (
        <ChatModal
          currentUser={user}
          friend={chatFriend}
          onClose={() => {
            setShowChat(false);
            setChatFriend(null);
          }}
        />
      )}
    </div>
  );
};

export default SocialHub;