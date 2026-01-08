import React, { useState } from 'react';
import { searchPrayer } from '../services/geminiService';
import { Prayer, SearchResult } from '../types';
import { Loader2, Search, ExternalLink, Edit3, AlertCircle, RefreshCw, Sparkles, ChevronRight, Moon, Globe } from 'lucide-react';

interface SearchPrayerProps {
  onDraft: (prayerData: Partial<Prayer>) => void;
  onOpenCoach: () => void;
  onOpenDream: () => void;
}

const SearchPrayer: React.FC<SearchPrayerProps> = ({ onDraft, onOpenCoach, onOpenDream }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await searchPrayer(query);
      setResult(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Arama sırasında bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  const handleDraftFromResult = () => {
    if (!result) return;
    // Pass only the necessary data to the Add form
    const draftData: Partial<Prayer> = {
      title: query,
      turkish: result.text,
      tags: ['arama']
    };
    onDraft(draftData);
  };

  return (
    <div className="flex flex-col h-full bg-[#ecfdf5] p-4 pb-24 relative overflow-y-auto no-scrollbar">
      <h2 className="text-xl font-bold text-teal-900 mb-4 font-cinzel">Dua Ara & Keşfet</h2>

      {/* Feature Banners Grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {/* Coach Banner */}
        <div
          onClick={onOpenCoach}
          className="bg-linear-to-br from-indigo-500 to-violet-600 rounded-2xl p-4 text-white shadow-lg cursor-pointer relative overflow-hidden group active:scale-[0.98] transition-transform flex flex-col justify-between min-h-[120px]"
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-6 -mt-6 blur-xl group-hover:bg-white/20 transition-colors"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-1.5 mb-2 bg-white/20 w-fit px-2 py-0.5 rounded-full backdrop-blur-sm">
              <Sparkles size={12} className="text-indigo-100" />
              <span className="text-[9px] font-bold uppercase text-indigo-50">MANEVİ KOÇ</span>
            </div>
            <h3 className="text-base font-bold font-serif leading-tight">Nasıl<br />Hissediyorsun?</h3>
          </div>
          <div className="relative z-10 flex justify-end">
            <div className="bg-white/20 p-1.5 rounded-full backdrop-blur-sm">
              <ChevronRight size={16} />
            </div>
          </div>
        </div>

        {/* Dream Banner */}
        <div
          onClick={onOpenDream}
          className="bg-linear-to-br from-[#3b0764] to-[#6d28d9] rounded-2xl p-4 text-white shadow-lg cursor-pointer relative overflow-hidden group active:scale-[0.98] transition-transform flex flex-col justify-between min-h-[120px]"
        >
          {/* Stars effect */}
          <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '15px 15px' }}></div>

          <div className="relative z-10">
            <div className="flex items-center gap-1.5 mb-2 bg-white/10 w-fit px-2 py-0.5 rounded-full backdrop-blur-sm border border-white/10">
              <Moon size={12} className="text-purple-100" fill="currentColor" />
              <span className="text-[9px] font-bold uppercase text-purple-50">RÜYA TABİRİ</span>
            </div>
            <h3 className="text-base font-bold font-serif leading-tight">Rüyanda Ne<br />Gördün?</h3>
          </div>
          <div className="relative z-10 flex justify-end">
            <div className="bg-white/10 p-1.5 rounded-full backdrop-blur-sm border border-white/10">
              <ChevronRight size={16} />
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSearch} className="mb-6 relative z-10">
        <div className="relative shadow-sm">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Örn: Sınav stresi için dua..."
            disabled={loading}
            className="w-full p-4 pr-12 rounded-2xl border border-emerald-100 shadow-sm bg-white focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-stone-700 placeholder:text-stone-400 font-serif transition-all disabled:opacity-70 disabled:bg-stone-50"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="absolute right-2 top-2 py-3 bg-linear-to-r from-amber-500 to-amber-600 text-white rounded-xl font-bold text-sm hover:from-amber-600 hover:to-amber-700 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : <Search size={20} />}
          </button>
        </div>
        <p className="text-[10px] text-stone-500 mt-2 ml-1 flex items-center gap-1.5 opacity-80">
          <Globe size={12} className="text-teal-600" />
          <span>Google Search + Yapay Zeka ile web'den dua bulun</span>
        </p>
      </form>

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-4 flex items-start gap-3 animate-in slide-in-from-top-2">
          <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={20} />
          <div className="flex-1">
            <h4 className="text-red-800 font-bold text-sm mb-1">Bir Sorun Oluştu</h4>
            <p className="text-red-600 text-xs">{error}</p>
            <button
              onClick={handleSearch}
              className="mt-2 text-xs bg-red-100 text-red-700 px-3 py-1.5 rounded-full font-bold hover:bg-red-200 transition-colors flex items-center gap-1"
            >
              <RefreshCw size={12} /> Tekrar Dene
            </button>
          </div>
        </div>
      )}

      {loading && !result && (
        <div className="flex-1 flex flex-col items-center justify-center text-stone-400 animate-pulse py-10">
          <Loader2 size={40} className="animate-spin mb-4 text-teal-500" />
          <p className="text-sm font-serif">En uygun dua aranıyor...</p>
        </div>
      )}

      {result && (
        <div className="relative z-0">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-emerald-50 mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="font-bold text-teal-900 mb-3 border-b border-emerald-100 pb-2 font-serif flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-500"></span>
              Sonuç
            </h3>

            <div className="prose prose-sm prose-stone text-stone-700 mb-6 whitespace-pre-wrap font-serif leading-relaxed">
              {result.text}
            </div>

            {/* Sources Display */}
            {result.sources.length > 0 && (
              <div className="mb-6 bg-stone-50 p-4 rounded-xl border border-stone-100">
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-3">Kaynaklar</p>
                <ul className="space-y-2">
                  {result.sources.map((source, idx) => (
                    <li key={idx}>
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-teal-600 hover:text-teal-800 hover:underline flex items-start gap-2 transition-colors group"
                      >
                        <ExternalLink size={12} className="mt-0.5 shrink-0 group-hover:scale-110 transition-transform" />
                        <span className="truncate">{source.title}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <button
              onClick={handleDraftFromResult}
              className="w-full py-4 bg-linear-to-r from-teal-700 to-teal-600 text-white rounded-xl font-bold font-cinzel hover:shadow-lg hover:shadow-teal-700/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <Edit3 size={18} />
              DÜZENLE VE EKLE
            </button>
          </div>
        </div>
      )}

      {!result && !loading && !error && (
        <div className="flex-1 flex flex-col items-center justify-center text-stone-300 opacity-50 pb-10">
          <Search size={64} strokeWidth={1} className="mb-4 text-stone-200" />
          <p className="text-sm font-serif italic">Bir konu veya sıkıntı yazarak arama yapın.</p>
        </div>
      )}
    </div>
  );
};

export default SearchPrayer;