import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, X, Save, Loader2 } from 'lucide-react';
import { getCatalogPrayers, addCatalogPrayer, updateCatalogPrayer, deleteCatalogPrayer, DbPrayer } from '../services/supabase';

interface PrayerForm {
    title: string;
    turkish: string;
    arabic: string;
    meaning: string;
    targetCount: number;
    tags: string;
}

const emptyForm: PrayerForm = {
    title: '',
    turkish: '',
    arabic: '',
    meaning: '',
    targetCount: 33,
    tags: ''
};

const AdminPrayers: React.FC = () => {
    const [prayers, setPrayers] = useState<DbPrayer[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<PrayerForm>(emptyForm);
    const [saving, setSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadPrayers();
    }, []);

    const loadPrayers = async () => {
        setLoading(true);
        const data = await getCatalogPrayers();
        setPrayers(data);
        setLoading(false);
    };

    const resetForm = () => {
        setForm(emptyForm);
        setEditingId(null);
        setShowForm(false);
    };

    const startEdit = (prayer: DbPrayer) => {
        setEditingId(prayer.id);
        setForm({
            title: prayer.title,
            turkish: prayer.turkish,
            arabic: prayer.arabic || '',
            meaning: prayer.meaning || '',
            targetCount: prayer.target_count,
            tags: prayer.tags.join(', ')
        });
        setShowForm(true);
    };

    const handleSave = async () => {
        if (!form.title || !form.turkish) return;
        setSaving(true);

        const prayerData = {
            title: form.title,
            turkish: form.turkish,
            arabic: form.arabic || undefined,
            meaning: form.meaning || undefined,
            target_count: form.targetCount,
            tags: form.tags.split(',').map(t => t.trim()).filter(t => t)
        };

        if (editingId) {
            const success = await updateCatalogPrayer(editingId, prayerData);
            if (success) {
                setPrayers(prayers.map(p =>
                    p.id === editingId ? { ...p, ...prayerData } : p
                ));
                resetForm();
                alert('Dua güncellendi!');
            }
        } else {
            const newPrayer = await addCatalogPrayer(prayerData);
            if (newPrayer) {
                setPrayers([newPrayer, ...prayers]);
                resetForm();
                alert('Dua eklendi!');
            }
        }
        setSaving(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bu duayı kalıcı olarak silmek istediğinize emin misiniz?')) return;
        const success = await deleteCatalogPrayer(id);
        if (success) {
            setPrayers(prayers.filter(p => p.id !== id));
        }
    };

    const filteredPrayers = prayers.filter(p =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 size={32} className="animate-spin text-teal-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h3 className="font-bold text-stone-800 text-lg">Katalog Duaları ({prayers.length})</h3>
                <button
                    onClick={() => { resetForm(); setShowForm(true); }}
                    className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-colors"
                >
                    <Plus size={18} /> Yeni Dua Ekle
                </button>
            </div>

            {/* Add/Edit Form */}
            {showForm && (
                <div className="bg-white p-6 rounded-2xl border-2 border-teal-200 shadow-lg">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="font-bold text-lg">{editingId ? 'Dua Düzenle' : 'Yeni Dua Ekle'}</h4>
                        <button onClick={resetForm} className="text-stone-400 hover:text-stone-600">
                            <X size={20} />
                        </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-stone-600 mb-2">Başlık *</label>
                            <input
                                type="text"
                                placeholder="Dua adı"
                                value={form.title}
                                onChange={e => setForm({ ...form, title: e.target.value })}
                                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 outline-none focus:border-teal-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-stone-600 mb-2">Hedef Sayı</label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="number"
                                    value={form.targetCount === 0 ? '' : form.targetCount}
                                    onChange={e => setForm({ ...form, targetCount: parseInt(e.target.value) || 0 })}
                                    disabled={form.targetCount === 0}
                                    placeholder="∞"
                                    className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 outline-none focus:border-teal-500 disabled:bg-stone-100 disabled:text-stone-400"
                                />
                                <label className="flex items-center gap-2 cursor-pointer whitespace-nowrap">
                                    <input
                                        type="checkbox"
                                        checked={form.targetCount === 0}
                                        onChange={e => setForm({ ...form, targetCount: e.target.checked ? 0 : 33 })}
                                        className="w-5 h-5 accent-teal-600"
                                    />
                                    <span className="text-stone-600 text-sm">Sonsuz ∞</span>
                                </label>
                            </div>
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-bold text-stone-600 mb-2">Türkçe Metin *</label>
                            <textarea
                                placeholder="Duanın Türkçe metni"
                                value={form.turkish}
                                onChange={e => setForm({ ...form, turkish: e.target.value })}
                                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 h-24 outline-none focus:border-teal-500"
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-bold text-stone-600 mb-2">Arapça Metin</label>
                            <textarea
                                placeholder="Duanın Arapça metni (isteğe bağlı)"
                                value={form.arabic}
                                onChange={e => setForm({ ...form, arabic: e.target.value })}
                                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 h-20 outline-none focus:border-teal-500 font-amiri text-xl text-right"
                                dir="rtl"
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-bold text-stone-600 mb-2">Meal / Anlam</label>
                            <textarea
                                placeholder="Duanın anlamı (isteğe bağlı)"
                                value={form.meaning}
                                onChange={e => setForm({ ...form, meaning: e.target.value })}
                                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 h-20 outline-none focus:border-teal-500"
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-bold text-stone-600 mb-2">Etiketler</label>
                            <input
                                type="text"
                                placeholder="Virgülle ayırarak yazın: Sabah, Akşam, Şükür"
                                value={form.tags}
                                onChange={e => setForm({ ...form, tags: e.target.value })}
                                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 outline-none focus:border-teal-500"
                            />
                        </div>
                    </div>
                    <div className="flex gap-3 mt-6">
                        <button
                            onClick={handleSave}
                            disabled={saving || !form.title || !form.turkish}
                            className="flex-1 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                            {editingId ? 'Güncelle' : 'Kaydet'}
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

            {/* Search */}
            <div className="relative">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                    type="text"
                    placeholder="Dua ara..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white border border-stone-200 rounded-xl outline-none focus:border-teal-500"
                />
            </div>

            {/* Prayer List */}
            <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
                <div className="divide-y divide-stone-100 max-h-[600px] overflow-y-auto">
                    {filteredPrayers.length === 0 ? (
                        <div className="p-8 text-center text-stone-400">Dua bulunamadı.</div>
                    ) : (
                        filteredPrayers.slice(0, 100).map(prayer => (
                            <div key={prayer.id} className="p-4 hover:bg-stone-50 transition-colors">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-stone-800">{prayer.title}</h4>
                                        <p className="text-stone-500 text-sm mt-1 line-clamp-2">{prayer.turkish}</p>
                                        <div className="flex gap-1 mt-2 flex-wrap">
                                            {prayer.tags.slice(0, 5).map(tag => (
                                                <span key={tag} className="text-[10px] px-2 py-0.5 bg-stone-100 text-stone-500 rounded-full">
                                                    {tag}
                                                </span>
                                            ))}
                                            <span className="text-[10px] px-2 py-0.5 bg-teal-50 text-teal-600 rounded-full font-medium">
                                                {prayer.target_count === 0 ? '∞' : `${prayer.target_count}x`}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex gap-1 ml-4">
                                        <button
                                            onClick={() => startEdit(prayer)}
                                            className="p-2 text-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(prayer.id)}
                                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                    {filteredPrayers.length > 100 && (
                        <div className="p-4 text-center text-stone-400 text-sm">
                            {filteredPrayers.length - 100} dua daha var. Arama yaparak daraltın.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminPrayers;
