import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, RefreshCw } from 'lucide-react';
import { getTopPrayers, getAnalyticsTrend, getAllUsers } from '../services/supabase';

const AdminAnalytics: React.FC = () => {
    const [topPrayers, setTopPrayers] = useState<{ prayer_title: string; total_count: number }[]>([]);
    const [trend, setTrend] = useState<{ date: string; count: number }[]>([]);
    const [userCount, setUserCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const [prayers, trendData, users] = await Promise.all([
            getTopPrayers(10),
            getAnalyticsTrend(7),
            getAllUsers()
        ]);
        setTopPrayers(prayers);
        setTrend(trendData);
        setUserCount(users.length);
        setLoading(false);
    };

    const maxCount = Math.max(...topPrayers.map(p => p.total_count), 1);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-stone-800">Analitik</h2>
                    <p className="text-stone-500 text-sm">Uygulama kullanım istatistikleri</p>
                </div>
                <button
                    onClick={loadData}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors disabled:opacity-50"
                >
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    Yenile
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="text-teal-600 animate-pulse">Yükleniyor...</div>
                </div>
            ) : (
                <>
                    {/* Stats Cards */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white p-6 rounded-2xl border border-stone-200">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                                    <Users size={20} />
                                </div>
                                <span className="text-stone-500 text-sm">Toplam Kullanıcı</span>
                            </div>
                            <span className="text-3xl font-bold text-stone-800">{userCount}</span>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-stone-200">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center text-teal-600">
                                    <BarChart3 size={20} />
                                </div>
                                <span className="text-stone-500 text-sm">Toplam Zikir</span>
                            </div>
                            <span className="text-3xl font-bold text-stone-800">
                                {topPrayers.reduce((sum, p) => sum + p.total_count, 0)}
                            </span>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-stone-200">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600">
                                    <TrendingUp size={20} />
                                </div>
                                <span className="text-stone-500 text-sm">Bu Hafta</span>
                            </div>
                            <span className="text-3xl font-bold text-stone-800">
                                {trend.reduce((sum, t) => sum + t.count, 0)}
                            </span>
                        </div>
                    </div>

                    {/* Top Prayers */}
                    <div className="bg-white rounded-2xl border border-stone-200 p-6">
                        <h3 className="font-bold text-stone-800 mb-4 flex items-center gap-2">
                            <BarChart3 size={18} className="text-teal-600" />
                            En Çok Okunan 10 Dua
                        </h3>
                        {topPrayers.length === 0 ? (
                            <p className="text-stone-400 text-center py-8">Henüz veri yok</p>
                        ) : (
                            <div className="space-y-3">
                                {topPrayers.map((prayer, idx) => (
                                    <div key={idx} className="flex items-center gap-4">
                                        <span className="w-6 h-6 bg-stone-100 rounded-full flex items-center justify-center text-xs font-bold text-stone-500">
                                            {idx + 1}
                                        </span>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-sm font-medium text-stone-700 truncate max-w-[200px]">
                                                    {prayer.prayer_title}
                                                </span>
                                                <span className="text-xs text-stone-500">{prayer.total_count} okuma</span>
                                            </div>
                                            <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all"
                                                    style={{ width: `${(prayer.total_count / maxCount) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Weekly Trend */}
                    <div className="bg-white rounded-2xl border border-stone-200 p-6">
                        <h3 className="font-bold text-stone-800 mb-4 flex items-center gap-2">
                            <TrendingUp size={18} className="text-purple-600" />
                            Haftalık Trend
                        </h3>
                        {trend.length === 0 ? (
                            <p className="text-stone-400 text-center py-8">Henüz veri yok</p>
                        ) : (
                            <div className="flex items-end gap-2 h-40">
                                {trend.map((day, idx) => {
                                    const maxDay = Math.max(...trend.map(t => t.count), 1);
                                    const height = (day.count / maxDay) * 100;
                                    return (
                                        <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                                            <span className="text-xs text-stone-500">{day.count}</span>
                                            <div
                                                className="w-full bg-gradient-to-t from-purple-500 to-purple-400 rounded-t-lg transition-all"
                                                style={{ height: `${Math.max(height, 5)}%` }}
                                            />
                                            <span className="text-[10px] text-stone-400">
                                                {new Date(day.date).toLocaleDateString('tr-TR', { weekday: 'short' })}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default AdminAnalytics;
