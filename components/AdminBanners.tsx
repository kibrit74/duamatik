import React, { useState, useEffect } from 'react';
import { Image, Plus, Trash2, Eye, EyeOff, Calendar, Palette } from 'lucide-react';
import { getAllBanners, createBanner, updateBanner, deleteBanner, Banner } from '../services/supabase';

const AdminBanners: React.FC = () => {
    const [banners, setBanners] = useState<Banner[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    // Form state
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [bgColor, setBgColor] = useState('#10b981');
    const [textColor, setTextColor] = useState('#ffffff');
    const [target, setTarget] = useState('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    useEffect(() => {
        loadBanners();
    }, []);

    const loadBanners = async () => {
        setLoading(true);
        const data = await getAllBanners();
        setBanners(data);
        setLoading(false);
    };

    const handleCreate = async () => {
        if (!title) return;

        const banner = await createBanner({
            title,
            message,
            bg_color: bgColor,
            text_color: textColor,
            target,
            start_date: startDate || undefined,
            end_date: endDate || undefined,
            is_active: true,
            priority: 0
        });

        if (banner) {
            setBanners([banner, ...banners]);
            resetForm();
        }
    };

    const handleToggleActive = async (banner: Banner) => {
        const success = await updateBanner(banner.id!, { is_active: !banner.is_active });
        if (success) {
            setBanners(banners.map(b => b.id === banner.id ? { ...b, is_active: !b.is_active } : b));
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bu banner\'ı silmek istediğinize emin misiniz?')) return;
        const success = await deleteBanner(id);
        if (success) {
            setBanners(banners.filter(b => b.id !== id));
        }
    };

    const resetForm = () => {
        setTitle('');
        setMessage('');
        setBgColor('#10b981');
        setTextColor('#ffffff');
        setTarget('all');
        setStartDate('');
        setEndDate('');
        setShowForm(false);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-stone-800">Dinamik Bannerlar</h2>
                    <p className="text-stone-500 text-sm">Özel günler için anlık duyurular</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors"
                >
                    <Plus size={18} />
                    Yeni Banner
                </button>
            </div>

            {/* Form */}
            {showForm && (
                <div className="bg-white rounded-2xl border-2 border-teal-200 p-6 space-y-4">
                    <h3 className="font-bold text-stone-800">Yeni Banner Oluştur</h3>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-stone-600 mb-1">Başlık *</label>
                            <input
                                type="text"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                placeholder="Örn: Hayırlı Kandiller!"
                                className="w-full px-4 py-2 border border-stone-200 rounded-xl focus:border-teal-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-stone-600 mb-1">Hedef Kitle</label>
                            <select
                                value={target}
                                onChange={e => setTarget(e.target.value)}
                                className="w-full px-4 py-2 border border-stone-200 rounded-xl focus:border-teal-500 outline-none"
                            >
                                <option value="all">Herkes</option>
                                <option value="premium">Premium</option>
                                <option value="free">Ücretsiz</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-stone-600 mb-1">Mesaj</label>
                        <textarea
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                            placeholder="Banner mesajı..."
                            className="w-full px-4 py-2 border border-stone-200 rounded-xl focus:border-teal-500 outline-none h-20"
                        />
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                        <div>
                            <label className="text-sm font-medium text-stone-600 mb-1 flex items-center gap-1">
                                <Palette size={14} /> Arka Plan
                            </label>
                            <input
                                type="color"
                                value={bgColor}
                                onChange={e => setBgColor(e.target.value)}
                                className="w-full h-10 rounded-xl cursor-pointer"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-stone-600 mb-1">Metin Rengi</label>
                            <input
                                type="color"
                                value={textColor}
                                onChange={e => setTextColor(e.target.value)}
                                className="w-full h-10 rounded-xl cursor-pointer"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-stone-600 mb-1 flex items-center gap-1">
                                <Calendar size={14} /> Başlangıç
                            </label>
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

                    {/* Preview */}
                    <div>
                        <label className="block text-sm font-medium text-stone-600 mb-2">Önizleme</label>
                        <div
                            className="p-4 rounded-xl text-center"
                            style={{ backgroundColor: bgColor, color: textColor }}
                        >
                            <h4 className="font-bold">{title || 'Banner Başlığı'}</h4>
                            {message && <p className="text-sm opacity-90 mt-1">{message}</p>}
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={handleCreate}
                            className="flex-1 py-3 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700"
                        >
                            Oluştur
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

            {/* Banner List */}
            <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
                <div className="p-4 border-b border-stone-100 bg-stone-50">
                    <h3 className="font-bold text-stone-800 flex items-center gap-2">
                        <Image size={18} className="text-teal-600" />
                        Mevcut Bannerlar ({banners.length})
                    </h3>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-stone-400">Yükleniyor...</div>
                ) : banners.length === 0 ? (
                    <div className="p-8 text-center text-stone-400">Henüz banner oluşturulmamış.</div>
                ) : (
                    <div className="divide-y divide-stone-100">
                        {banners.map(banner => (
                            <div key={banner.id} className="p-4 flex items-center gap-4 hover:bg-stone-50">
                                <div
                                    className="w-16 h-16 rounded-xl flex items-center justify-center text-white font-bold text-xs text-center p-1"
                                    style={{ backgroundColor: banner.bg_color, color: banner.text_color }}
                                >
                                    {banner.title.slice(0, 20)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-bold text-stone-800 truncate">{banner.title}</h4>
                                        {banner.is_active ? (
                                            <span className="text-[10px] bg-green-100 text-green-600 px-2 py-0.5 rounded-full">Aktif</span>
                                        ) : (
                                            <span className="text-[10px] bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full">Pasif</span>
                                        )}
                                        <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full capitalize">{banner.target}</span>
                                    </div>
                                    {banner.message && <p className="text-sm text-stone-500 truncate">{banner.message}</p>}
                                    <div className="flex gap-2 mt-1 text-[10px] text-stone-400">
                                        {banner.start_date && <span>Başlangıç: {new Date(banner.start_date).toLocaleDateString('tr-TR')}</span>}
                                        {banner.end_date && <span>Bitiş: {new Date(banner.end_date).toLocaleDateString('tr-TR')}</span>}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleToggleActive(banner)}
                                        className={`p-2 rounded-lg transition-colors ${banner.is_active ? 'text-green-600 hover:bg-green-50' : 'text-stone-400 hover:bg-stone-100'}`}
                                        title={banner.is_active ? 'Pasife Al' : 'Aktif Et'}
                                    >
                                        {banner.is_active ? <Eye size={18} /> : <EyeOff size={18} />}
                                    </button>
                                    <button
                                        onClick={() => handleDelete(banner.id!)}
                                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminBanners;
