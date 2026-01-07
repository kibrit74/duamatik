import React, { useEffect, useState } from 'react';
import { X, Bell, Calendar, Clock } from 'lucide-react';
import { User, AdminNotification } from '../types';
import { getUserNotifications } from '../services/supabase';

interface NotificationCenterProps {
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ isOpen, onClose, user }) => {
    const [notifications, setNotifications] = useState<AdminNotification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen && user) {
            loadNotifications();
        }
    }, [isOpen, user]);

    const loadNotifications = async () => {
        setLoading(true);
        if (user) {
            const data = await getUserNotifications(user);
            setNotifications(data);

            // Mark as read in local storage (simplified "read" logic)
            if (data.length > 0) {
                localStorage.setItem('last_read_notif_date', new Date().toISOString());
            }
        }
        setLoading(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pointer-events-none">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
                onClick={onClose}
            />

            {/* Content */}
            <div className="relative w-full max-w-md bg-stone-50 rounded-t-3xl sm:rounded-3xl shadow-2xl pointer-events-auto flex flex-col max-h-[85vh] sm:max-h-[600px] animate-in slide-in-from-bottom duration-300">

                {/* Header */}
                <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-white rounded-t-3xl">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600">
                            <Bell size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-stone-800">Duyurular</h2>
                            <p className="text-xs text-stone-500">Yönetimden Mesajlar</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-stone-100 text-stone-500 hover:bg-stone-200 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 text-stone-400">
                            <div className="w-8 h-8 border-2 border-stone-200 border-t-teal-500 rounded-full animate-spin mb-2" />
                            <p className="text-sm">Yükleniyor...</p>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-stone-400 text-center">
                            <Bell size={48} className="mb-4 opacity-20" />
                            <p className="font-medium">Henüz bildirim yok</p>
                            <p className="text-xs mt-1 max-w-[200px]">Yeni duyurular olduğunda burada görünecek.</p>
                        </div>
                    ) : (
                        notifications.map((notif) => (
                            <div key={notif.id} className="bg-white p-4 rounded-2xl border border-stone-100 shadow-sm relative overflow-hidden group">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-stone-800 pr-6">{notif.title}</h3>
                                    {/* New badge logic could go here based on date comparison */}
                                </div>
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
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotificationCenter;
