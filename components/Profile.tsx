import React, { useMemo } from 'react';
import { Prayer, Quote, User } from '../types';
import Logo from './Logo';
import { Book, Activity, ArrowRight, History, LogOut, MapPin, Award, TrendingUp, Calendar, Star, Sparkles, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { getUserSpiritualPlans, SpiritualPlanDb, deleteSpiritualPlan } from '../services/supabase';

interface ProfileProps {
  prayers: Prayer[];
  onOpenPrayer: (prayer: Prayer) => void;
  quote: Quote;
  user?: User | null;
  onLogout?: () => void;
}

// Custom Tasbih Icon provided by user
const TasbihIcon: React.FC<{ size?: number; className?: string }> = ({ size = 24, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 200 200"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <g fill="currentColor">
      {/* Tesbih taneleri (dairesel dizilim) */}
      <circle cx="100" cy="50" r="7" />
      <circle cx="120" cy="55" r="7" />
      <circle cx="135" cy="65" r="7" />
      <circle cx="145" cy="80" r="7" />
      <circle cx="150" cy="100" r="7" />
      <circle cx="145" cy="120" r="7" />
      <circle cx="135" cy="135" r="7" />
      <circle cx="120" cy="145" r="7" />
      <circle cx="100" cy="150" r="7" />
      <circle cx="80" cy="145" r="7" />
      <circle cx="65" cy="135" r="7" />
      <circle cx="55" cy="120" r="7" />
      <circle cx="50" cy="100" r="7" />
      <circle cx="55" cy="80" r="7" />
      <circle cx="65" cy="65" r="7" />
      <circle cx="80" cy="55" r="7" />

      {/* İmame (püskül bağlantısı) */}
      <rect x="97" y="150" width="6" height="15" rx="1" />
      <circle cx="100" cy="167" r="4" />

      {/* Püskül */}
      <path d="M 95 172 L 90 190 L 95 188 L 100 190 L 105 188 L 110 190 L 105 172 Z" />
    </g>
  </svg>
);

const Profile: React.FC<ProfileProps> = ({ prayers, onOpenPrayer, quote, user, onLogout }) => {
  const [plans, setPlans] = React.useState<SpiritualPlanDb[]>([]);
  const [expandedPlanId, setExpandedPlanId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (user) {
      getUserSpiritualPlans(user.id).then(setPlans);
    }
  }, [user]);

  // Filter and categorize prayers
  const { activePrayers, completedPrayers, stats } = useMemo(() => {
    const active = prayers
      .filter(p => p.currentCount > 0 && (p.targetCount === 0 || p.currentCount < p.targetCount))
      .sort((a, b) => b.lastUpdated - a.lastUpdated);

    const completed = prayers
      .filter(p => p.targetCount > 0 && p.currentCount >= p.targetCount)
      .sort((a, b) => b.lastUpdated - a.lastUpdated);

    const totalDhikr = prayers.reduce((acc, curr) => acc + curr.currentCount, 0);
    const uniquePrayers = prayers.filter(p => p.currentCount > 0).length;
    const completedCount = completed.length;

    // Bu hafta yapılan zikirler
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const weeklyDhikr = prayers
      .filter(p => p.lastUpdated > weekAgo)
      .reduce((acc, curr) => acc + curr.currentCount, 0);

    return {
      activePrayers: active,
      completedPrayers: completed,
      stats: {
        totalDhikr,
        uniquePrayers,
        completedCount,
        weeklyDhikr
      }
    };
  }, [prayers]);

  return (
    <div className="min-h-screen bg-[#ecfdf5] relative pb-28">
      {/* Background Pattern - Fixed position so it doesn't scroll */}
      <div className="islamic-pattern fixed inset-0 z-0 pointer-events-none opacity-10"></div>

      {/* Top Section */}
      <div className="bg-linear-to-b from-white/80 to-[#ecfdf5]/90 backdrop-blur-sm pt-12 pb-8 px-6 border-b border-emerald-100 relative z-10 flex flex-col items-center text-center shadow-sm">
        <Logo size={100} className="mb-4" />
        <h1 className="text-2xl font-bold font-cinzel text-teal-900">Profilim</h1>
        <p className="text-stone-500 font-serif italic text-sm mt-1 max-w-[250px]">
          "{quote.text}" <br />({quote.source})
        </p>
      </div>

      {/* Statistics Cards - Enhanced 4-grid */}
      <div className="grid grid-cols-4 gap-2 px-4 -mt-6 z-20 relative">
        <div className="bg-white/90 p-3 rounded-xl shadow-md border border-emerald-50 flex flex-col items-center justify-center gap-1 backdrop-blur-sm">
          <TasbihIcon size={20} className="text-amber-500" />
          <span className="text-lg font-bold text-teal-900 font-mono">{stats.totalDhikr}</span>
          <span className="text-[9px] text-stone-400 font-bold uppercase">Toplam</span>
        </div>
        <div className="bg-white/90 p-3 rounded-xl shadow-md border border-emerald-50 flex flex-col items-center justify-center gap-1 backdrop-blur-sm">
          <Book size={18} className="text-teal-500" />
          <span className="text-lg font-bold text-teal-900 font-mono">{stats.uniquePrayers}</span>
          <span className="text-[9px] text-stone-400 font-bold uppercase">Dua</span>
        </div>
        <div className="bg-white/90 p-3 rounded-xl shadow-md border border-emerald-50 flex flex-col items-center justify-center gap-1 backdrop-blur-sm">
          <Award size={18} className="text-purple-500" />
          <span className="text-lg font-bold text-teal-900 font-mono">{stats.completedCount}</span>
          <span className="text-[9px] text-stone-400 font-bold uppercase">Tamam</span>
        </div>
        <div className="bg-white/90 p-3 rounded-xl shadow-md border border-emerald-50 flex flex-col items-center justify-center gap-1 backdrop-blur-sm">
          <TrendingUp size={18} className="text-green-500" />
          <span className="text-lg font-bold text-teal-900 font-mono">{stats.weeklyDhikr}</span>
          <span className="text-[9px] text-stone-400 font-bold uppercase">Hafta</span>
        </div>
      </div>

      {/* User Info & Logout */}
      {user && (
        <div className="mx-4 mt-4 p-4 bg-white/90 rounded-xl border border-emerald-50 shadow-sm backdrop-blur-sm relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center text-teal-700 font-bold text-lg">
                {user.name?.charAt(0) || 'K'}
              </div>
              <div>
                <h3 className="font-bold text-stone-800 flex items-center gap-2">
                  {user.name || 'Kullanıcı'}
                  {user.isPremium && <Star size={14} className="text-amber-500 fill-amber-500" />}
                </h3>
                <p className="text-xs text-stone-400 flex items-center gap-1">
                  <MapPin size={10} /> {user.city || 'Türkiye'}
                </p>
              </div>
            </div>
            {onLogout && (
              <button
                onClick={onLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors text-sm font-medium"
              >
                <LogOut size={16} />
                Çıkış
              </button>
            )}
          </div>
        </div>
      )}

      {/* Spiritual Plans Section (PRO) */}
      {plans.length > 0 && (
        <div className="mb-2 animate-in fade-in slide-in-from-bottom-4">
          <div className="px-6 mt-6 mb-3 flex items-center gap-2 relative z-10">
            <Sparkles size={18} className="text-amber-500" />
            <h2 className="text-base font-bold text-teal-900 font-serif">Manevi Reçetelerim</h2>
            <span className="ml-auto text-[10px] text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full font-bold border border-amber-200">PRO</span>
          </div>
          <div className="px-4 space-y-3 relative z-10">
            {plans.map((plan) => (
              <div key={plan.id} className="bg-white p-4 rounded-xl border border-amber-100 shadow-sm relative group overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-amber-400"></div>
                <div className="flex justify-between items-start pl-2">
                  <div className="flex-1" onClick={() => setExpandedPlanId(expandedPlanId === plan.id ? null : plan.id)}>
                    <h3 className="font-bold text-teal-900 font-serif flex items-center gap-2">
                      {plan.title}
                      {expandedPlanId === plan.id ? <ChevronUp size={14} className="text-stone-400" /> : <ChevronDown size={14} className="text-stone-400" />}
                    </h3>
                    <p className="text-xs text-stone-500 italic mt-0.5">{plan.description}</p>
                  </div>
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (confirm('Bu reçeteyi silmek istiyor musunuz?')) {
                        const success = await deleteSpiritualPlan(plan.id);
                        if (success) setPlans(prev => prev.filter(p => p.id !== plan.id));
                      }
                    }}
                    className="text-stone-300 hover:text-rose-500 p-1 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Expandable Details */}
                {expandedPlanId === plan.id && (
                  <div className="pl-2 mt-4 space-y-3 animate-in fade-in slide-in-from-top-1">
                    {plan.plan_data.days.map((d: any) => (
                      <div key={d.day} className="bg-stone-50 rounded-lg p-3 text-xs border border-stone-100">
                        <div className="font-bold text-teal-700 mb-1 flex justify-between">
                          <span>{d.day}. Gün: {d.focus}</span>
                          <span className="text-[10px] text-stone-400 font-normal">Zikir: {d.dhikr}</span>
                        </div>
                        <div className="grid grid-cols-1 gap-1 text-stone-600">
                          <div>☀️ {d.morning}</div>
                          <div>🌙 {d.evening}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Preview Chips if collapsed */}
                {expandedPlanId !== plan.id && (
                  <div className="pl-2 mt-3 flex gap-2 overflow-x-auto pb-1 no-scrollbar opacity-70" onClick={() => setExpandedPlanId(plan.id)}>
                    {plan.plan_data.days.map((d: any) => (
                      <div key={d.day} className="bg-stone-50 rounded px-2 py-1 text-[10px] text-stone-600 border border-stone-100 whitespace-nowrap">
                        Gün {d.day}: {d.focus}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed Prayers Section */}
      {completedPrayers.length > 0 && (
        <>
          <div className="px-6 mt-6 mb-3 flex items-center gap-2 relative z-10">
            <Award size={18} className="text-purple-500" />
            <h2 className="text-base font-bold text-teal-900 font-serif">Tamamlanan Hatimler</h2>
            <span className="ml-auto text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">{completedPrayers.length}</span>
          </div>
          <div className="px-4 space-y-2 z-10 relative">
            {completedPrayers.slice(0, 3).map((prayer) => (
              <div
                key={prayer.id}
                onClick={() => onOpenPrayer(prayer)}
                className="bg-linear-to-r from-purple-50 to-white p-3 rounded-xl border border-purple-100 flex items-center justify-between cursor-pointer hover:border-purple-200 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">
                    <Award size={16} />
                  </div>
                  <div>
                    <h3 className="font-bold text-stone-700 text-sm truncate max-w-[180px]">{prayer.title}</h3>
                    <p className="text-[10px] text-stone-400">{prayer.currentCount}/{prayer.targetCount} tamamlandı</p>
                  </div>
                </div>
                <ArrowRight size={16} className="text-purple-400" />
              </div>
            ))}
          </div>
        </>
      )}

      {/* Active Prayers List Header */}
      <div className="px-6 mt-6 mb-3 flex items-center gap-2 relative z-10">
        <History size={18} className="text-amber-500" />
        <h2 className="text-base font-bold text-teal-900 font-serif">Devam Eden Dualar</h2>
        <span className="ml-auto text-xs text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">{activePrayers.length}</span>
      </div>

      {/* List - Native scrolling enabled */}
      <div className="px-4 space-y-2 z-10 relative">
        {activePrayers.length === 0 ? (
          <div className="text-center py-8 bg-white/50 rounded-xl border border-dashed border-emerald-100 mx-2">
            <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-2 text-stone-400">
              <Activity size={20} />
            </div>
            <p className="text-stone-600 font-serif text-sm font-medium">Henüz başlanmış bir tesbihat yok.</p>
            <p className="text-stone-400 text-xs mt-1">Kütüphaneden bir dua seçip okumaya başlayın.</p>
          </div>
        ) : (
          activePrayers.map((prayer) => (
            <div
              key={prayer.id}
              onClick={() => onOpenPrayer(prayer)}
              className="bg-white/90 p-3 rounded-xl border border-emerald-50 shadow-sm flex items-center justify-between group active:scale-[0.99] transition-all cursor-pointer hover:border-teal-200 backdrop-blur-sm"
            >
              <div className="flex-1 min-w-0 pr-3">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-stone-800 text-sm truncate font-serif max-w-[180px]">{prayer.title}</h3>
                  <span className="text-[10px] text-stone-400 font-mono ml-2 flex items-center gap-1">
                    <Calendar size={10} />
                    {new Date(prayer.lastUpdated).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })}
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <div className="h-1.5 flex-1 bg-stone-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-linear-to-r from-teal-500 to-emerald-400 rounded-full transition-all duration-500"
                      style={{ width: `${prayer.targetCount > 0 ? Math.min((prayer.currentCount / prayer.targetCount) * 100, 100) : 50}%` }}
                    />
                  </div>
                  <span className="text-xs text-teal-700 font-mono font-bold min-w-[50px] text-right">
                    {prayer.currentCount}<span className="text-stone-300">/</span>{prayer.targetCount === 0 ? '∞' : prayer.targetCount}
                  </span>
                </div>
              </div>

              <button
                className="bg-teal-50 text-teal-700 w-8 h-8 rounded-full flex items-center justify-center border border-teal-100 hover:bg-teal-100 transition-colors shrink-0"
              >
                <ArrowRight size={16} />
              </button>
            </div>
          ))
        )}

        {/* Helper Text */}
        {(activePrayers.length > 0 || completedPrayers.length > 0) && (
          <div className="text-center mt-4 mb-2">
            <p className="text-[10px] text-stone-400 italic">Toplam {stats.uniquePrayers} farklı duadan {stats.totalDhikr} zikir çekildi.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;