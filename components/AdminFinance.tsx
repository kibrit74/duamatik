import React, { useState, useEffect } from 'react';
import { DollarSign, Ticket, Plus, Trash2, TrendingUp, Calendar } from 'lucide-react';
import { getAllCoupons, createCoupon, deleteCoupon, getRevenueStats, Coupon } from '../services/supabase';

const AdminFinance: React.FC = () => {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [stats, setStats] = useState({ total: 0, monthly: 0, yearly: 0 });
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [code, setCode] = useState('');
    const [discountType, setDiscountType] = useState('percent');
    const [discountValue, setDiscountValue] = useState(10);
    const [maxUses, setMaxUses] = useState(100);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        const [c, s] = await Promise.all([getAllCoupons(), getRevenueStats()]);
        setCoupons(c); setStats(s); setLoading(false);
    };

    const generateCode = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        setCode(Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join(''));
    };

    const handleCreate = async () => {
        if (!code) return;
        const coupon = await createCoupon({ code: code.toUpperCase(), discount_type: discountType, discount_value: discountValue, max_uses: maxUses, is_active: true });
        if (coupon) { setCoupons([coupon, ...coupons]); setCode(''); setShowForm(false); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bu kuponu silmek istediğinize emin misiniz?')) return;
        if (await deleteCoupon(id)) setCoupons(coupons.filter(c => c.id !== id));
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-stone-800">Finansal Yönetim</h2>

            <div className="grid grid-cols-3 gap-4">
                <div className="bg-linear-to-br from-green-500 to-emerald-600 p-6 rounded-2xl text-white">
                    <div className="flex items-center gap-2 mb-2 opacity-80"><DollarSign size={18} /><span className="text-sm">Toplam</span></div>
                    <span className="text-3xl font-bold">{stats.total.toLocaleString('tr-TR')}₺</span>
                </div>
                <div className="bg-linear-to-br from-blue-500 to-indigo-600 p-6 rounded-2xl text-white">
                    <div className="flex items-center gap-2 mb-2 opacity-80"><TrendingUp size={18} /><span className="text-sm">Bu Ay</span></div>
                    <span className="text-3xl font-bold">{stats.monthly.toLocaleString('tr-TR')}₺</span>
                </div>
                <div className="bg-linear-to-br from-purple-500 to-fuchsia-600 p-6 rounded-2xl text-white">
                    <div className="flex items-center gap-2 mb-2 opacity-80"><Calendar size={18} /><span className="text-sm">Bu Yıl</span></div>
                    <span className="text-3xl font-bold">{stats.yearly.toLocaleString('tr-TR')}₺</span>
                </div>
            </div>

            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-stone-800 flex items-center gap-2"><Ticket size={20} className="text-amber-500" />Kuponlar</h3>
                <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl"><Plus size={18} />Yeni Kupon</button>
            </div>

            {showForm && (
                <div className="bg-white rounded-2xl border-2 border-amber-200 p-6 space-y-4">
                    <div className="flex gap-2">
                        <input type="text" value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="KUPONKODU" className="flex-1 px-4 py-2 border rounded-xl uppercase" />
                        <button onClick={generateCode} className="px-3 py-2 bg-stone-100 rounded-xl">Oluştur</button>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <select value={discountType} onChange={e => setDiscountType(e.target.value)} className="px-4 py-2 border rounded-xl">
                            <option value="percent">Yüzde (%)</option>
                            <option value="fixed">Sabit (₺)</option>
                            <option value="free_month">1 Ay Ücretsiz</option>
                        </select>
                        <input type="number" value={discountValue} onChange={e => setDiscountValue(parseInt(e.target.value) || 0)} className="px-4 py-2 border rounded-xl" />
                        <input type="number" value={maxUses} onChange={e => setMaxUses(parseInt(e.target.value) || 0)} placeholder="Max Kullanım" className="px-4 py-2 border rounded-xl" />
                    </div>
                    <button onClick={handleCreate} className="w-full py-3 bg-amber-500 text-white rounded-xl font-bold">Oluştur</button>
                </div>
            )}

            <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
                {loading ? <div className="p-8 text-center text-stone-400">Yükleniyor...</div> : coupons.length === 0 ? <div className="p-8 text-center text-stone-400">Kupon yok.</div> : (
                    <div className="divide-y">
                        {coupons.map(coupon => (
                            <div key={coupon.id} className="p-4 flex items-center justify-between hover:bg-stone-50">
                                <div>
                                    <code className="font-bold bg-stone-100 px-2 py-0.5 rounded">{coupon.code}</code>
                                    <span className="text-xs ml-2 text-amber-600">{coupon.discount_type === 'percent' ? `%${coupon.discount_value}` : coupon.discount_type}</span>
                                    <span className="text-xs text-stone-400 ml-2">{coupon.current_uses || 0}/{coupon.max_uses}</span>
                                </div>
                                <button onClick={() => handleDelete(coupon.id!)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminFinance;
