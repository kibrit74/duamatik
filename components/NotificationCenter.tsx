import React, { useEffect, useState } from 'react';
import { X, Bell, Users, BookOpen, Calendar, Clock, Check, XCircle, Loader2 } from 'lucide-react';
import { User, AdminNotification } from '../types';
import {
    getUserNotifications,
    getPendingRequests,
    acceptFriendRequest,
    rejectFriendRequest,
    getActiveCampaigns,
    FriendRequest,
    HatimCampaign
} from '../services/supabase';

interface NotificationCenterProps {
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
}

type TabType = 'announcements' | 'friends' | 'hatim';

const NotificationCenter: React.FC<NotificationCenterProps> = ({ isOpen, onClose, user }) => {
    const [activeTab, setActiveTab] = useState<TabType>('announcements');
    const [notifications, setNotifications] = useState<AdminNotification[]>([]);
    const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
    const [hatimCampaigns, setHatimCampaigns] = useState<HatimCampaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && user) {
            loadAllData();
        }
    }, [isOpen, user]);

    const loadAllData = async () => {
        setLoading(true);
        if (user) {
            const [notifs, requests, campaigns] = await Promise.all([
                getUserNotifications(user),
                getPendingRequests(user.id),
                getActiveCampaigns()
            ]);
            setNotifications(notifs);
            setFriendRequests(requests);
            setHatimCampaigns(campaigns);

            if (notifs.length > 0) {
                localStorage.setItem('last_read_notif_date', new Date().toISOString());
            }
        }
        setLoading(false);
    };

    const handleAcceptRequest = async (request: FriendRequest) => {
        setActionLoading(request.id);
        const success = await acceptFriendRequest(request.id, request.fromUserId, request.toUserId);
        if (success) {
            setFriendRequests(prev => prev.filter(r => r.id !== request.id));
        }
        setActionLoading(null);
    };

    const handleRejectRequest = async (request: FriendRequest) => {
        setActionLoading(request.id);
        const success = await rejectFriendRequest(request.id);
        if (success) {
            setFriendRequests(prev => prev.filter(r => r.id !== request.id));
        }
        setActionLoading(null);
    };

    if (!isOpen) return null;

    const tabs = [
        { id: 'announcements' as TabType, label: 'Duyurular', icon: Bell, count: notifications.length },
        { id: 'friends' as TabType, label: 'Arkadaşlık', icon: Users, count: friendRequests.length },
        { id: 'hatim' as TabType, label: 'Hatimler', icon: BookOpen, count: hatimCampaigns.length },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pointer-events-none">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
                onClick={onClose}
            />

            <div className="relative w-full max-w-md bg-stone-50 rounded-t-3xl sm:rounded-3xl shadow-2xl pointer-events-auto flex flex-col max-h-[85vh] sm:max-h-[600px] animate-in slide-in-from-bottom duration-300">

                {/* Header */}
                <div className="p-4 border-b border-stone-200 bg-white rounded-t-3xl">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-lg font-bold text-stone-800">Bildirimler</h2>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-stone-100 text-stone-500 hover:bg-stone-200 transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-1 bg-stone-100 p-1 rounded-xl">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all ${activeTab === tab.id
                                    ? 'bg-white text-teal-600 shadow-sm'
                                    : 'text-stone-500 hover:text-stone-700'
                                    }`}
                            >
                                <tab.icon size={14} />
                                <span className="hidden sm:inline">{tab.label}</span>
                                {tab.count > 0 && (
                                    <span className={`min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-bold ${activeTab === tab.id ? 'bg-teal-100 text-teal-700' : 'bg-stone-200 text-stone-600'
                                        }`}>
                                        {tab.count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 text-stone-400">
                            <div className="w-8 h-8 border-2 border-stone-200 border-t-teal-500 rounded-full animate-spin mb-2" />
                            <p className="text-sm">Yükleniyor...</p>
                        </div>
                    ) : (
                        <>
                            {/* Announcements Tab */}
                            {activeTab === 'announcements' && (
                                notifications.length === 0 ? (
                                    <EmptyState icon={Bell} message="Henüz duyuru yok" />
                                ) : (
                                    notifications.map((notif) => (
                                        <div key={notif.id} className="bg-white p-4 rounded-2xl border border-stone-100 shadow-sm">
                                            <h3 className="font-bold text-stone-800 mb-2">{notif.title}</h3>
                                            <p className="text-stone-600 text-sm leading-relaxed mb-3 whitespace-pre-wrap">
                                                {notif.message}
                                            </p>
                                            <div className="flex items-center gap-3 text-[10px] text-stone-400 font-medium">
                                                <span className="flex items-center gap-1 bg-stone-50 px-2 py-1 rounded-full">
                                                    <Calendar size={12} />
                                                    {new Date(notif.created_at).toLocaleDateString('tr-TR')}
                                                </span>
                                                <span className="flex items-center gap-1 bg-stone-50 px-2 py-1 rounded-full">
                                                    <Clock size={12} />
                                                    {new Date(notif.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )
                            )}

                            {/* Friends Tab */}
                            {activeTab === 'friends' && (
                                friendRequests.length === 0 ? (
                                    <EmptyState icon={Users} message="Bekleyen arkadaşlık isteği yok" />
                                ) : (
                                    friendRequests.map((request) => (
                                        <div key={request.id} className="bg-white p-4 rounded-2xl border border-stone-100 shadow-sm">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h3 className="font-bold text-stone-800">{request.fromUserName}</h3>
                                                    <p className="text-stone-500 text-xs">Arkadaşlık isteği gönderdi</p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleRejectRequest(request)}
                                                        disabled={actionLoading === request.id}
                                                        className="w-9 h-9 flex items-center justify-center rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition-colors disabled:opacity-50"
                                                    >
                                                        {actionLoading === request.id ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={18} />}
                                                    </button>
                                                    <button
                                                        onClick={() => handleAcceptRequest(request)}
                                                        disabled={actionLoading === request.id}
                                                        className="w-9 h-9 flex items-center justify-center rounded-full bg-teal-50 text-teal-600 hover:bg-teal-100 transition-colors disabled:opacity-50"
                                                    >
                                                        {actionLoading === request.id ? <Loader2 size={16} className="animate-spin" /> : <Check size={18} />}
                                                    </button>
                                                </div>
                                            </div>
                                            <p className="text-[10px] text-stone-400 mt-2">
                                                {new Date(request.createdAt).toLocaleDateString('tr-TR')}
                                            </p>
                                        </div>
                                    ))
                                )
                            )}

                            {/* Hatim Tab */}
                            {activeTab === 'hatim' && (
                                hatimCampaigns.length === 0 ? (
                                    <EmptyState icon={BookOpen} message="Aktif hatim kampanyası yok" />
                                ) : (
                                    hatimCampaigns.map((campaign) => (
                                        <div key={campaign.id} className="bg-white p-4 rounded-2xl border border-stone-100 shadow-sm">
                                            <div className="flex items-start justify-between mb-3">
                                                <div>
                                                    <h3 className="font-bold text-stone-800">{campaign.title}</h3>
                                                    {campaign.description && (
                                                        <p className="text-stone-500 text-xs mt-1">{campaign.description}</p>
                                                    )}
                                                </div>
                                                <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-1 rounded-full">
                                                    Aktif
                                                </span>
                                            </div>
                                            <div className="mb-3">
                                                <div className="flex justify-between text-xs text-stone-500 mb-1">
                                                    <span>İlerleme</span>
                                                    <span>{campaign.current_count}/{campaign.goal} Cüz</span>
                                                </div>
                                                <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-linear-to-r from-teal-400 to-emerald-500 rounded-full transition-all"
                                                        style={{ width: `${Math.min(100, ((campaign.current_count || 0) / campaign.goal) * 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                            <button className="w-full py-2 bg-teal-50 text-teal-700 rounded-xl font-bold text-sm hover:bg-teal-100 transition-colors">
                                                Hatme Katıl
                                            </button>
                                        </div>
                                    ))
                                )
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

const EmptyState: React.FC<{ icon: React.ElementType; message: string }> = ({ icon: Icon, message }) => (
    <div className="flex flex-col items-center justify-center py-12 text-stone-400 text-center">
        <Icon size={48} className="mb-4 opacity-20" />
        <p className="font-medium">{message}</p>
    </div>
);

export default NotificationCenter;
