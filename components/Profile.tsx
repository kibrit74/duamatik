import React from 'react';
import { Prayer, Quote, User } from '../types';
import Logo from './Logo';
import { Book, Activity, ArrowRight, History, LogOut, MapPin } from 'lucide-react';

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
  // Filter for prayers that have actually been started (count > 0)
  // And sort them by lastUpdated so the most recently read ones appear first
  const activePrayers = prayers
    .filter(p => p.currentCount > 0)
    .sort((a, b) => b.lastUpdated - a.lastUpdated);

  const totalPrayers = prayers.length;
  const totalDhikr = prayers.reduce((acc, curr) => acc + curr.currentCount, 0);

  return (
    <div className="min-h-screen bg-[#ecfdf5] relative pb-28">
      {/* Background Pattern - Fixed position so it doesn't scroll */}
      <div className="islamic-pattern fixed inset-0 z-0 pointer-events-none opacity-10"></div>

      {/* Top Section */}
      <div className="bg-gradient-to-b from-white/80 to-[#ecfdf5]/90 backdrop-blur-sm pt-12 pb-8 px-6 border-b border-emerald-100 relative z-10 flex flex-col items-center text-center shadow-sm">
        <Logo size={100} className="mb-4" />
        <h1 className="text-2xl font-bold font-cinzel text-teal-900">Profilim</h1>
        <p className="text-stone-500 font-serif italic text-sm mt-1 max-w-[250px]">
          "{quote.text}" <br />({quote.source})
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 gap-4 px-4 -mt-6 z-20 relative">
        <div className="bg-white/90 p-4 rounded-xl shadow-md border border-emerald-50 flex flex-col items-center justify-center gap-2 backdrop-blur-sm">
          <div className="w-10 h-10 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center">
            <Book size={20} />
          </div>
          <div className="text-center">
            <span className="block text-2xl font-bold text-teal-900 font-cinzel">{totalPrayers}</span>
            <span className="text-xs text-stone-500 font-bold uppercase tracking-wider">Kütüphane</span>
          </div>
        </div>
        <div className="bg-white/90 p-4 rounded-xl shadow-md border border-emerald-50 flex flex-col items-center justify-center gap-2 backdrop-blur-sm">
          <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
            <TasbihIcon size={24} />
          </div>
          <div className="text-center">
            <span className="block text-2xl font-bold text-teal-900 font-cinzel">{totalDhikr}</span>
            <span className="text-xs text-stone-500 font-bold uppercase tracking-wider">Toplam Zikir</span>
          </div>
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
                <h3 className="font-bold text-stone-800">{user.name || 'Kullanıcı'}</h3>
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

      {/* Active Prayers List Header */}
      <div className="px-6 mt-8 mb-4 flex items-center gap-2 relative z-10">
        <History size={18} className="text-amber-500" />
        <h2 className="text-lg font-bold text-teal-900 font-serif">Okuduğum Dualar</h2>
      </div>

      {/* List - Native scrolling enabled */}
      <div className="px-4 space-y-3 z-10 relative">
        {activePrayers.length === 0 ? (
          <div className="text-center py-12 bg-white/50 rounded-xl border border-dashed border-emerald-100 mx-2">
            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-3 text-stone-400">
              <Activity size={24} />
            </div>
            <p className="text-stone-600 font-serif font-medium">Henüz başlanmış bir tesbihat yok.</p>
            <p className="text-stone-400 text-xs mt-1">Kütüphaneden bir dua seçip okumaya başlayabilirsiniz.</p>
          </div>
        ) : (
          activePrayers.map((prayer) => (
            <div
              key={prayer.id}
              onClick={() => onOpenPrayer(prayer)}
              className="bg-white/90 p-4 rounded-xl border border-emerald-50 shadow-sm flex items-center justify-between group active:scale-[0.99] transition-all cursor-pointer hover:border-teal-200 backdrop-blur-sm"
            >
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-stone-800 text-base truncate font-serif">{prayer.title}</h3>
                  <span className="text-[10px] text-stone-400 font-mono mt-0.5 ml-2">
                    {new Date(prayer.lastUpdated).toLocaleDateString('tr-TR')}
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <div className="h-1.5 w-24 bg-stone-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-teal-500 rounded-full transition-all duration-500"
                      style={{ width: `${prayer.targetCount > 0 ? Math.min((prayer.currentCount / prayer.targetCount) * 100, 100) : 0}%` }}
                    />
                  </div>
                  <span className="text-xs text-stone-500 font-mono font-bold">
                    {prayer.currentCount} <span className="text-stone-300 font-normal">/</span> {prayer.targetCount === 0 ? '∞' : prayer.targetCount}
                  </span>
                </div>
              </div>

              <button
                className="bg-stone-50 text-teal-700 w-8 h-8 rounded-full flex items-center justify-center border border-stone-200 hover:bg-teal-50 hover:border-teal-200 transition-colors"
              >
                <ArrowRight size={16} />
              </button>
            </div>
          ))
        )}

        {/* Helper Text */}
        {activePrayers.length > 0 && (
          <div className="text-center mt-6 mb-2">
            <p className="text-[10px] text-stone-400 italic">Sadece işlem yaptığınız dualar burada listelenir.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;