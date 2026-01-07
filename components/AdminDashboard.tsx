import React, { useState, useEffect } from 'react';
import { User, Prayer, PrayerPackage, AdminNotification, Quote } from '../types';
import { Users, BookOpen, BarChart3, Trash2, Ban, Bell, Plus, Package, MessageSquare, Send, LogOut, Settings, ChevronRight, Quote as QuoteIcon, History, X, Image, Globe, Shield, FileText, DollarSign, Wrench } from 'lucide-react';
import { getAllUsers, sendGlobalNotification, getPackages, createPackage, updateUserStatus, createAdminNotification, getAdminNotifications, getQuotesFromDB, addQuote, deleteQuote } from '../services/supabase';
import AdminAnalytics from './AdminAnalytics';
import AdminBanners from './AdminBanners';
import AdminGlobalHatim from './AdminGlobalHatim';
import AdminModeration from './AdminModeration';
import AdminCMS from './AdminCMS';
import AdminFinance from './AdminFinance';
import AdminTechnical from './AdminTechnical';

interface AdminDashboardProps {
    prayers: Prayer[];
    onBack: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ prayers, onBack }) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'packages' | 'notifications' | 'quotes' | 'analytics' | 'banners' | 'hatim' | 'moderation' | 'cms' | 'finance' | 'technical'>('overview');
    const [users, setUsers] = useState<User[]>([]);
    const [packages, setPackages] = useState<PrayerPackage[]>([]);
    const [notifications, setNotifications] = useState<AdminNotification[]>([]);
    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [loading, setLoading] = useState(true);

    // Notification State
    const [notifTitle, setNotifTitle] = useState('');
    const [notifMessage, setNotifMessage] = useState('');
    const [notifTarget, setNotifTarget] = useState('all');
    const [sendingNotif, setSendingNotif] = useState(false);

    // Quote State
    const [newQuoteText, setNewQuoteText] = useState('');
    const [newQuoteSource, setNewQuoteSource] = useState('');

    // Package State
    const [showAddPackage, setShowAddPackage] = useState(false);
    const [newPkgTitle, setNewPkgTitle] = useState('');
    const [newPkgDesc, setNewPkgDesc] = useState('');
    const [isPkgPremium, setIsPkgPremium] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const [fetchedUsers, fetchedPackages, fetchedNotifs, fetchedQuotes] = await Promise.all([
            getAllUsers(),
            getPackages(),
            getAdminNotifications(),
            getQuotesFromDB()
        ]);
        setUsers(fetchedUsers);
        setPackages(fetchedPackages);
        setNotifications(fetchedNotifs);
        setQuotes(fetchedQuotes);
        setLoading(false);
    };

    const handleSendNotification = async () => {
        if (!notifTitle || !notifMessage) return;
        setSendingNotif(true);

        // Save to DB
        await createAdminNotification(notifTitle, notifMessage, notifTarget);

        // In a real app, you would verify this saved before "sending" via push
        // For simulation, we assume saving is enough to trigger "sending" logic or we call the push service here too
        await sendGlobalNotification(notifTitle, notifMessage); // Keeping legacy for simulation

        setSendingNotif(false);
        setNotifTitle('');
        setNotifMessage('');
        alert('Bildirim gönderildi ve kaydedildi!');
        loadData(); // Refresh history
    };

    const handleAddQuote = async () => {
        if (!newQuoteText || !newQuoteSource) return;
        await addQuote(newQuoteText, newQuoteSource);
        setNewQuoteText('');
        setNewQuoteSource('');
        loadData(); // Refresh quotes
    };

    const handleDeleteQuote = async (id: string) => {
        if (confirm('Bu sözü silmek istediğinize emin misiniz?')) {
            await deleteQuote(id);
            loadData();
        }
    };

    const handleCreatePackage = async () => {
        if (!newPkgTitle) return;
        const pkg = await createPackage(newPkgTitle, newPkgDesc, isPkgPremium);
        if (pkg) {
            setPackages([pkg, ...packages]);
            setShowAddPackage(false);
            setNewPkgTitle('');
            setNewPkgDesc('');
            alert('Paket oluşturuldu!');
        }
    };

    const handleBanUser = async (userId: string) => {
        if (confirm('Bu kullanıcıyı engellemek istediğinize emin misiniz?')) {
            await updateUserStatus(userId, 'banned');
            alert('Kullanıcı durumu güncellendi.');
        }
    };

    const stats = [
        { label: 'Toplam Kullanıcı', value: users.length, icon: Users, color: 'bg-blue-500' },
        { label: 'Dua Paketi', value: packages.length, icon: Package, color: 'bg-purple-500' },
        { label: 'Toplam Dua', value: prayers.length, icon: BookOpen, color: 'bg-teal-500' },
        { label: 'Bildirim', value: notifications.length, icon: Bell, color: 'bg-orange-500' },
    ];

    const navItems = [
        { id: 'overview', label: 'Genel Bakış', icon: BarChart3 },
        { id: 'analytics', label: 'Analitik', icon: BarChart3 },
        { id: 'users', label: 'Kullanıcılar', icon: Users },
        { id: 'packages', label: 'Dua Paketleri', icon: Package },
        { id: 'notifications', label: 'Bildirimler', icon: MessageSquare },
        { id: 'quotes', label: 'Günün Sözü', icon: QuoteIcon },
        { id: 'banners', label: 'Dinamik Banner', icon: Image },
        { id: 'hatim', label: 'Global Hatim', icon: Globe },
        { id: 'moderation', label: 'Moderasyon', icon: Shield },
        { id: 'cms', label: 'CMS / Makaleler', icon: FileText },
        { id: 'finance', label: 'Finansal', icon: DollarSign },
        { id: 'technical', label: 'Teknik Ayarlar', icon: Wrench },
    ];

    return (
        <div className="min-h-screen bg-stone-100 flex">
            {/* Sidebar */}
            <aside className="w-72 bg-stone-900 text-white flex flex-col min-h-screen fixed left-0 top-0 z-50">
                {/* Logo */}
                <div className="p-6 border-b border-stone-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl flex items-center justify-center">
                            <Settings size={20} />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold">Duamatik</h1>
                            <p className="text-stone-500 text-xs">Yönetici Paneli</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4">
                    <p className="text-stone-500 text-xs font-bold uppercase mb-3 px-3">Ana Menü</p>
                    <div className="space-y-1">
                        {navItems.map(item => (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id as any)}
                                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === item.id
                                    ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/30'
                                    : 'text-stone-400 hover:bg-stone-800 hover:text-white'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <item.icon size={18} />
                                    {item.label}
                                </div>
                                {activeTab === item.id && <ChevronRight size={16} />}
                            </button>
                        ))}
                    </div>
                </nav>

                {/* Footer */}
                <div className="p-4 border-t border-stone-800">
                    <button
                        onClick={onBack}
                        className="w-full flex items-center gap-3 px-4 py-3 text-stone-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl text-sm transition-all"
                    >
                        <LogOut size={18} /> Panelden Çıkış
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-72 p-8 h-screen overflow-y-auto">
                {/* Header */}
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-stone-800">
                        {activeTab === 'overview' && 'Genel Bakış'}
                        {activeTab === 'users' && 'Kullanıcı Yönetimi'}
                        {activeTab === 'packages' && 'Dua Paketleri'}
                        {activeTab === 'notifications' && 'Bildirim Merkezi'}
                        {activeTab === 'quotes' && 'İçerik Yönetimi'}
                    </h2>
                    <p className="text-stone-500 mt-1">Duamatik yönetim ve kontrol merkezi</p>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="text-teal-600 animate-pulse text-lg">Yükleniyor...</div>
                    </div>
                ) : (
                    <>
                        {/* OVERVIEW */}
                        {activeTab === 'overview' && (
                            <div className="grid grid-cols-4 gap-6">
                                {stats.map((stat, idx) => (
                                    <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 hover:shadow-md transition-shadow">
                                        <div className={`w-14 h-14 rounded-2xl ${stat.color} text-white flex items-center justify-center mb-4`}>
                                            <stat.icon size={28} />
                                        </div>
                                        <span className="block text-4xl font-bold text-stone-800">{stat.value}</span>
                                        <span className="text-sm text-stone-500 font-medium mt-1">{stat.label}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* USERS */}
                        {activeTab === 'users' && (
                            <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
                                <div className="p-6 border-b border-stone-100">
                                    <h3 className="font-bold text-stone-800 text-lg flex items-center gap-2">
                                        <Users size={20} className="text-teal-600" />
                                        Kayıtlı Kullanıcılar ({users.length})
                                    </h3>
                                </div>
                                <div className="divide-y divide-stone-100">
                                    {users.map(user => (
                                        <div key={user.id} className="p-4 flex items-center justify-between hover:bg-stone-50 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                                    {user.name?.charAt(0) || 'U'}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-bold text-stone-800">{user.name}</h4>
                                                        {user.isPremium && (
                                                            <span className="bg-amber-100 text-amber-700 text-[10px] px-1.5 py-0.5 rounded-full font-bold border border-amber-200">
                                                                PRO
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-stone-400">{user.email}</p>
                                                    <div className="flex gap-2 mt-1.5">
                                                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                                                            {user.city || 'Şehir Yok'}
                                                        </span>
                                                        <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 border border-purple-100 font-medium">
                                                            {user.stats?.totalZikir || 0} Zikir
                                                        </span>
                                                        <span className="text-xs px-2 py-0.5 rounded-full bg-teal-50 text-teal-600 border border-teal-100 font-medium">
                                                            {user.stats?.totalPrayers || 0} Dua
                                                        </span>
                                                        <span className="text-xs px-2 py-0.5 rounded-full bg-stone-100 text-stone-500">
                                                            {new Date(user.joinDate).toLocaleDateString('tr-TR')}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleBanUser(user.id)}
                                                className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Engelle"
                                            >
                                                <Ban size={18} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* PACKAGES */}
                        {activeTab === 'packages' && (
                            <div className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-bold text-stone-800 text-lg">Mevcut Paketler</h3>
                                    <button
                                        onClick={() => setShowAddPackage(!showAddPackage)}
                                        className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-colors"
                                    >
                                        <Plus size={18} /> Yeni Paket Oluştur
                                    </button>
                                </div>

                                {showAddPackage && (
                                    <div className="bg-white p-6 rounded-2xl border-2 border-teal-200 shadow-lg">
                                        <h4 className="font-bold text-lg mb-4">Yeni Paket</h4>
                                        <div className="space-y-4">
                                            <input
                                                type="text"
                                                placeholder="Paket Adı"
                                                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 outline-none focus:border-teal-500"
                                                value={newPkgTitle}
                                                onChange={e => setNewPkgTitle(e.target.value)}
                                            />
                                            <textarea
                                                placeholder="Açıklama"
                                                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 h-24 outline-none focus:border-teal-500"
                                                value={newPkgDesc}
                                                onChange={e => setNewPkgDesc(e.target.value)}
                                            />
                                            <label className="flex items-center gap-3 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={isPkgPremium}
                                                    onChange={e => setIsPkgPremium(e.target.checked)}
                                                    className="w-5 h-5 text-teal-600"
                                                />
                                                <span className="text-stone-600">Premium Üyelere Özel</span>
                                            </label>
                                            <button
                                                onClick={handleCreatePackage}
                                                className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-xl font-bold transition-colors"
                                            >
                                                Paketi Oluştur
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    {packages.length === 0 && (
                                        <div className="col-span-2 text-center py-12 text-stone-400">
                                            Henüz paket oluşturulmamış.
                                        </div>
                                    )}
                                    {packages.map(pkg => (
                                        <div key={pkg.id} className="bg-white p-6 rounded-2xl border border-stone-200 hover:shadow-md transition-shadow">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-bold text-stone-800 text-lg">{pkg.title}</h4>
                                                        {pkg.isPremium && (
                                                            <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full font-bold">PRO</span>
                                                        )}
                                                    </div>
                                                    <p className="text-stone-500 text-sm mt-1">{pkg.description}</p>
                                                    <p className="text-xs text-stone-400 mt-3">{pkg.itemCount || 0} Dua</p>
                                                </div>
                                                <button className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-colors">
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* NOTIFICATIONS */}
                        {activeTab === 'notifications' && (
                            <div className="grid grid-cols-2 gap-8">
                                <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-8 h-fit">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center text-white">
                                            <Bell size={24} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-stone-800 text-lg">Yeni Bildirim</h3>
                                            <p className="text-stone-500 text-sm">Anlık bildirim gönderin</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-bold text-stone-600 mb-2">Başlık</label>
                                            <input
                                                type="text"
                                                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 outline-none focus:border-orange-500"
                                                placeholder="Örn: Hayırlı Cumalar!"
                                                value={notifTitle}
                                                onChange={e => setNotifTitle(e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-stone-600 mb-2">Mesaj</label>
                                            <textarea
                                                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 h-32 outline-none focus:border-orange-500"
                                                placeholder="Mesajınız..."
                                                value={notifMessage}
                                                onChange={e => setNotifMessage(e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-stone-600 mb-2">Hedef Kitle</label>
                                            <select
                                                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 outline-none focus:border-orange-500"
                                                value={notifTarget}
                                                onChange={e => setNotifTarget(e.target.value)}
                                            >
                                                <option value="all">Tüm Kullanıcılar</option>
                                                <option value="premium">Sadece Premium</option>
                                                <option value="free">Sadece Ücretsiz</option>
                                            </select>
                                        </div>

                                        <button
                                            onClick={handleSendNotification}
                                            disabled={sendingNotif}
                                            className={`w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all ${sendingNotif
                                                ? 'bg-stone-400 cursor-not-allowed'
                                                : 'bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-200'
                                                }`}
                                        >
                                            {sendingNotif ? 'Gönderiliyor...' : <><Send size={20} /> Gönder</>}
                                        </button>
                                    </div>
                                </div>

                                {/* Notification History */}
                                <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden h-fit">
                                    <div className="p-6 border-b border-stone-100 bg-stone-50">
                                        <h3 className="font-bold text-stone-800 flex items-center gap-2">
                                            <History size={18} className="text-stone-500" />
                                            Gönderim Geçmişi
                                        </h3>
                                    </div>
                                    <div className="divide-y divide-stone-100 max-h-[600px] overflow-y-auto">
                                        {notifications.length === 0 && (
                                            <div className="p-8 text-center text-stone-400 text-sm">
                                                Henüz bildirim gönderilmemiş.
                                            </div>
                                        )}
                                        {notifications.map(n => (
                                            <div key={n.id} className="p-4 hover:bg-stone-50 transition-colors">
                                                <div className="flex justify-between items-start mb-1">
                                                    <h4 className="font-bold text-stone-800 text-sm">{n.title}</h4>
                                                    <span className="text-[10px] text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full">
                                                        {new Date(n.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <p className="text-stone-600 text-xs mb-2 line-clamp-2">{n.message}</p>
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${n.target === 'all' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                    n.target === 'premium' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                        'bg-slate-50 text-slate-600 border-slate-100'
                                                    }`}>
                                                    {n.target === 'all' ? 'Herkese' : n.target === 'premium' ? 'Premium' : 'Ücretsiz'}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* QUOTES */}
                        {activeTab === 'quotes' && (
                            <div className="grid grid-cols-2 gap-8">
                                <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-8 h-fit">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-12 h-12 bg-teal-500 rounded-xl flex items-center justify-center text-white">
                                            <QuoteIcon size={24} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-stone-800 text-lg">Yeni Söz Ekle</h3>
                                            <p className="text-stone-500 text-sm">Günün sözü havuzuna ekleme yapın</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <textarea
                                                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 h-32 outline-none focus:border-teal-500"
                                                placeholder="Söz metni..."
                                                value={newQuoteText}
                                                onChange={e => setNewQuoteText(e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <input
                                                type="text"
                                                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 outline-none focus:border-teal-500"
                                                placeholder="Kaynak / Yazar"
                                                value={newQuoteSource}
                                                onChange={e => setNewQuoteSource(e.target.value)}
                                            />
                                        </div>

                                        <button
                                            onClick={handleAddQuote}
                                            className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold transition-colors"
                                        >
                                            Listeye Ekle
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="font-bold text-stone-800 text-lg px-2">Mevcut Sözler ({quotes.length})</h3>
                                    <div className="space-y-3">
                                        {quotes.map(q => (
                                            <div key={q.id || Math.random()} className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm relative group">
                                                <p className="font-serif italic text-stone-800 mb-2">"{q.text}"</p>
                                                <p className="text-xs text-stone-500 font-bold text-right">- {q.source}</p>
                                                {q.id && (
                                                    <button
                                                        onClick={() => handleDeleteQuote(q.id!)}
                                                        className="absolute top-2 right-2 p-1.5 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* NEW MODULES */}
                        {activeTab === 'analytics' && <AdminAnalytics />}
                        {activeTab === 'banners' && <AdminBanners />}
                        {activeTab === 'hatim' && <AdminGlobalHatim />}
                        {activeTab === 'moderation' && <AdminModeration />}
                        {activeTab === 'cms' && <AdminCMS />}
                        {activeTab === 'finance' && <AdminFinance />}
                        {activeTab === 'technical' && <AdminTechnical />}
                    </>
                )}
            </main>
        </div>
    );
};

export default AdminDashboard;