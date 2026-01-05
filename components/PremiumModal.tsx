
import React from 'react';
import { Check, X, Crown, Zap, Shield, Image, Speaker } from 'lucide-react';
import Logo from './Logo';

interface PremiumModalProps {
  onClose: () => void;
  onPurchase: () => void;
}

const PremiumModal: React.FC<PremiumModalProps> = ({ onClose, onPurchase }) => {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden relative shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Close Button */}
        <button 
            onClick={onClose} 
            className="absolute top-4 right-4 z-10 w-8 h-8 bg-black/10 rounded-full flex items-center justify-center text-stone-600 hover:bg-black/20"
        >
            <X size={20} />
        </button>

        {/* Hero Section */}
        <div className="bg-gradient-to-br from-amber-300 via-amber-400 to-amber-500 p-8 pt-12 text-center relative overflow-hidden shrink-0">
             <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none" 
                  style={{ backgroundImage: 'radial-gradient(circle, #fff 2px, transparent 2px)', backgroundSize: '20px 20px' }}>
             </div>
             
             <div className="relative z-10 flex flex-col items-center">
                 <div className="bg-white p-2 rounded-2xl shadow-lg mb-4">
                     <Logo size={60} />
                 </div>
                 <h2 className="text-2xl font-cinzel font-bold text-white drop-shadow-sm tracking-wide">PREMIUM</h2>
                 <p className="text-amber-50 font-medium text-xs opacity-90 tracking-widest uppercase mt-1">Sınırsız Deneyim</p>
             </div>
        </div>

        {/* Features List */}
        <div className="p-6 flex-1 overflow-y-auto">
            <h3 className="text-center font-bold text-stone-800 mb-6">Ayrıcalıkların Tadını Çıkar</h3>
            
            <div className="space-y-4">
                <div className="flex items-center gap-4 bg-amber-50 p-3 rounded-xl border border-amber-100">
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                        <Zap size={20} fill="currentColor" />
                    </div>
                    <div>
                        <h4 className="font-bold text-stone-800 text-sm">Reklamsız Kullanım</h4>
                        <p className="text-xs text-stone-500">Ödüllü reklamları beklemeden tüm özellikleri kullan.</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 bg-amber-50 p-3 rounded-xl border border-amber-100">
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                        <Speaker size={20} />
                    </div>
                    <div>
                        <h4 className="font-bold text-stone-800 text-sm">Sınırsız Sesli Okuma</h4>
                        <p className="text-xs text-stone-500">Yapay zeka ile dilediğin kadar dua seslendir.</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 bg-amber-50 p-3 rounded-xl border border-amber-100">
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                        <Image size={20} />
                    </div>
                    <div>
                        <h4 className="font-bold text-stone-800 text-sm">Sınırsız Tarama</h4>
                        <p className="text-xs text-stone-500">Kitaplardan duaları sınırsızca tarat ve ekle.</p>
                    </div>
                </div>

                 <div className="flex items-center gap-4 bg-stone-50 p-3 rounded-xl border border-stone-100 opacity-70">
                    <div className="w-10 h-10 rounded-full bg-stone-200 flex items-center justify-center text-stone-500 shrink-0">
                        <Shield size={20} />
                    </div>
                    <div>
                        <h4 className="font-bold text-stone-800 text-sm">Geliştiriciye Destek</h4>
                        <p className="text-xs text-stone-500">Uygulamanın gelişmesine katkıda bulunun.</p>
                    </div>
                </div>
            </div>
        </div>

        {/* Action Button */}
        <div className="p-4 border-t border-stone-100 bg-stone-50 space-y-3">
            <button 
                onClick={onPurchase}
                className="w-full py-3.5 bg-gradient-to-r from-stone-900 to-stone-800 text-white rounded-xl font-bold text-lg shadow-xl shadow-stone-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
            >
                <Crown size={22} className="text-amber-400 group-hover:rotate-12 transition-transform" fill="currentColor" />
                <span>Yıllık 499.99 ₺ (Kazançlı)</span>
            </button>
            <button 
                onClick={onPurchase}
                className="w-full py-3 bg-white border border-stone-300 text-stone-700 rounded-xl font-bold text-sm hover:bg-stone-50 transition-colors"
            >
                Aylık 59.99 ₺
            </button>
            <p className="text-[10px] text-center text-stone-400 mt-1">İstediğin zaman iptal edebilirsin.</p>
        </div>

      </div>
    </div>
  );
};

export default PremiumModal;
