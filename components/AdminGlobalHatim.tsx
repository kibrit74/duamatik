import React, { useState, useEffect } from 'react';
import { Globe, Plus, Users, Target, Calendar, Trash2, Play, Pause } from 'lucide-react';
import { getAllCampaigns, createCampaign, updateCampaign, getCampaignParticipations, HatimCampaign, HatimParticipation } from '../services/supabase';

const AdminGlobalHatim: React.FC = () => {
    const [campaigns, setCampaigns] = useState<HatimCampaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [selectedCampaign, setSelectedCampaign] = useState<HatimCampaign | null>(null);
    const [participations, setParticipations] = useState<HatimParticipation[]>([]);

    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [goal, setGoal] = useState(1000);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    useEffect(() => {
        loadCampaigns();
    }, []);

    const loadCampaigns = async () => {
        setLoading(true);
        const data = await getAllCampaigns();
        setCampaigns(data);
        setLoading(false);
    };

    const handleCreate = async () => {
        if (!title || goal < 1) return;

        const campaign = await createCampaign({
            title,
            description,
            goal,
            start_date: startDate || undefined,
            end_date: endDate || undefined,
            is_active: true
        });

        if (campaign) {
            setCampaigns([campaign, ...campaigns]);
            resetForm();
        }
    };

    const handleToggleActive = async (campaign: HatimCampaign) => {
        const success = await updateCampaign(campaign.id!, { is_active: !campaign.is_active });
        if (success) {
            setCampaigns(campaigns.map(c => c.id === campaign.id ? { ...c, is_active: !c.is_active } : c));
        }
    };

    const handleViewDetails = async (campaign: HatimCampaign) => {
        setSelectedCampaign(campaign);
        const parts = await getCampaignParticipations(campaign.id!);
        setParticipations(parts);
    };

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setGoal(1000);
        setStartDate('');
        setEndDate('');
        setShowForm(false);
    };

    const getProgress = (campaign: HatimCampaign) => {
        return Math.min(((campaign.current_count || 0) / campaign.goal) * 100, 100);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-stone-800">Global Hatim Kampanyaları</h2>
                    <p className="text-stone-500 text-sm">Topluluk hatim organizasyonları</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors"
                >
                    <Plus size={18} />
                    Yeni Kampanya
                </button>
            </div>

            {/* Form */}
            {showForm && (
                <div className="bg-white rounded-2xl border-2 border-teal-200 p-6 space-y-4">
                    <h3 className="font-bold text-stone-800">Yeni Kampanya Oluştur</h3>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-stone-600 mb-1">Kampanya Adı *</label>
                            <input
                                type="text"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                placeholder="Örn: Kadir Gecesi 1000 Hatim"
                                className="w-full px-4 py-2 border border-stone-200 rounded-xl focus:border-teal-500 outline-none"
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-stone-600 mb-1">Açıklama</label>
                            <textarea
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="Kampanya açıklaması..."
                                className="w-full px-4 py-2 border border-stone-200 rounded-xl focus:border-teal-500 outline-none h-20"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-stone-600 mb-1 flex items-center gap-1">
                                <Target size={14} /> Hedef (Hatim Sayısı)
                            </label>
                            <input
                                type="number"
                                value={goal}
                                onChange={e => setGoal(parseInt(e.target.value) || 0)}
                                min={1}
                                className="w-full px-4 py-2 border border-stone-200 rounded-xl focus:border-teal-500 outline-none"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-sm font-medium text-stone-600 mb-1">Başlangıç</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={e => setStartDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-stone-600 mb-1">Bitiş</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={e => setEndDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={handleCreate}
                            className="flex-1 py-3 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700"
                        >
                            Kampanyayı Başlat
                        </button>
                        <button
                            onClick={resetForm}
                            className="px-6 py-3 bg-stone-100 text-stone-600 rounded-xl font-bold hover:bg-stone-200"
                        >
                            İptal
                        </button>
                    </div>
                </div>
            )}

            {/* Campaign List */}
            <div className="grid grid-cols-2 gap-4">
                {loading ? (
                    <div className="col-span-2 text-center py-12 text-stone-400">Yükleniyor...</div>
                ) : campaigns.length === 0 ? (
                    <div className="col-span-2 text-center py-12 text-stone-400">Henüz kampanya oluşturulmamış.</div>
                ) : (
                    campaigns.map(campaign => (
                        <div key={campaign.id} className="bg-white rounded-2xl border border-stone-200 p-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50 rounded-full -mr-16 -mt-16" />

                            <div className="relative z-10">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-bold text-stone-800">{campaign.title}</h3>
                                            {campaign.is_active ? (
                                                <span className="text-[10px] bg-green-100 text-green-600 px-2 py-0.5 rounded-full">Aktif</span>
                                            ) : (
                                                <span className="text-[10px] bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full">Durduruldu</span>
                                            )}
                                        </div>
                                        {campaign.description && (
                                            <p className="text-sm text-stone-500 line-clamp-2">{campaign.description}</p>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => handleToggleActive(campaign)}
                                        className={`p-2 rounded-lg transition-colors ${campaign.is_active ? 'text-green-600 hover:bg-green-50' : 'text-stone-400 hover:bg-stone-100'}`}
                                    >
                                        {campaign.is_active ? <Pause size={18} /> : <Play size={18} />}
                                    </button>
                                </div>

                                {/* Progress */}
                                <div className="mb-4">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-stone-500">İlerleme</span>
                                        <span className="font-bold text-teal-600">{campaign.current_count || 0} / {campaign.goal}</span>
                                    </div>
                                    <div className="h-3 bg-stone-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all"
                                            style={{ width: `${getProgress(campaign)}%` }}
                                        />
                                    </div>
                                    <p className="text-right text-xs text-stone-400 mt-1">%{getProgress(campaign).toFixed(1)}</p>
                                </div>

                                {/* Dates */}
                                <div className="flex items-center gap-4 text-xs text-stone-400 mb-4">
                                    {campaign.start_date && (
                                        <span className="flex items-center gap-1">
                                            <Calendar size={12} />
                                            {new Date(campaign.start_date).toLocaleDateString('tr-TR')}
                                        </span>
                                    )}
                                    {campaign.end_date && (
                                        <span>→ {new Date(campaign.end_date).toLocaleDateString('tr-TR')}</span>
                                    )}
                                </div>

                                <button
                                    onClick={() => handleViewDetails(campaign)}
                                    className="w-full py-2 bg-stone-100 text-stone-600 rounded-xl text-sm font-medium hover:bg-stone-200 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Users size={14} />
                                    Katılımcıları Gör
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Participation Modal */}
            {selectedCampaign && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden">
                        <div className="p-6 border-b border-stone-100">
                            <h3 className="font-bold text-stone-800">{selectedCampaign.title} - Katılımcılar</h3>
                            <p className="text-sm text-stone-500">{participations.length} katılım</p>
                        </div>
                        <div className="p-4 max-h-[400px] overflow-y-auto">
                            {participations.length === 0 ? (
                                <p className="text-center text-stone-400 py-8">Henüz katılım yok.</p>
                            ) : (
                                <div className="grid grid-cols-6 gap-2">
                                    {Array.from({ length: 30 }, (_, i) => i + 1).map(partNo => {
                                        const part = participations.find(p => p.part_no === partNo);
                                        return (
                                            <div
                                                key={partNo}
                                                className={`aspect-square rounded-lg flex items-center justify-center text-sm font-bold ${part?.completed
                                                        ? 'bg-green-500 text-white'
                                                        : part
                                                            ? 'bg-amber-100 text-amber-700 border-2 border-amber-200'
                                                            : 'bg-stone-100 text-stone-400'
                                                    }`}
                                            >
                                                {partNo}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-t border-stone-100">
                            <button
                                onClick={() => setSelectedCampaign(null)}
                                className="w-full py-3 bg-stone-100 text-stone-600 rounded-xl font-bold hover:bg-stone-200"
                            >
                                Kapat
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminGlobalHatim;
