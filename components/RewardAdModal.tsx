
import React, { useState, useEffect } from 'react';
import { Play, Loader2, XCircle, CheckCircle2 } from 'lucide-react';

interface RewardAdModalProps {
  onComplete: () => void;
  onCancel: () => void;
  cost: number; // Number of ads to watch
  title?: string; // e.g. "Ses Dosyası İndir"
  description?: string; // Context specific message
}

const RewardAdModal: React.FC<RewardAdModalProps> = ({ 
  onComplete, 
  onCancel, 
  cost,
  title = "Özelliği Aç",
  description = "Bu özellik yüksek sunucu maliyeti oluşturmaktadır. Devam etmek için lütfen reklam izleyerek bize destek olun."
}) => {
  const [adsWatched, setAdsWatched] = useState(0);
  const [isWatching, setIsWatching] = useState(false);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    let interval: number;
    if (isWatching && timer > 0) {
      interval = window.setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (isWatching && timer === 0) {
      // Ad finished
      setIsWatching(false);
      const newCount = adsWatched + 1;
      setAdsWatched(newCount);
      if (newCount >= cost) {
        setTimeout(() => {
            onComplete();
        }, 800);
      }
    }
    return () => clearInterval(interval);
  }, [isWatching, timer, adsWatched, cost, onComplete]);

  const startAd = () => {
    setIsWatching(true);
    setTimer(5); // Simulate 5 seconds ad for demo (in real app 15-30s)
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-sm bg-white rounded-2xl overflow-hidden relative shadow-2xl">
        
        {/* Header */}
        <div className="bg-stone-100 p-4 border-b border-stone-200 flex justify-between items-center">
            <h3 className="font-bold text-stone-800">{title}</h3>
            {!isWatching && (
                <button onClick={onCancel} className="text-stone-400 hover:text-stone-600">
                    <XCircle size={24} />
                </button>
            )}
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col items-center text-center">
            
            {isWatching ? (
                <div className="py-8 w-full">
                    <div className="relative w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 36 36">
                            <path className="text-stone-200" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="2" />
                            <path className="text-teal-600 transition-all duration-1000 ease-linear" strokeDasharray={`${(timer / 5) * 100}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="2" />
                        </svg>
                        <span className="font-mono text-2xl font-bold text-teal-700">{timer}</span>
                    </div>
                    <p className="text-stone-600 font-medium animate-pulse">Reklam İzleniyor...</p>
                    <p className="text-xs text-stone-400 mt-2">Lütfen kapatmayınız.</p>
                </div>
            ) : (
                <>
                    <div className="mb-4 bg-amber-50 p-4 rounded-full text-amber-500 border-4 border-amber-100">
                        <Loader2 size={40} />
                    </div>
                    
                    <h4 className="text-lg font-bold text-stone-800 mb-2">
                        Maliyet: {cost} Reklam
                    </h4>
                    
                    <p className="text-sm text-stone-500 mb-6 leading-relaxed">
                        {description}
                    </p>

                    <div className="flex gap-2 mb-6">
                        {Array.from({ length: cost }).map((_, i) => (
                            <div 
                                key={i}
                                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                                    i < adsWatched 
                                        ? 'bg-teal-500 border-teal-500 text-white' 
                                        : 'border-stone-200 text-stone-300'
                                }`}
                            >
                                {i < adsWatched ? <CheckCircle2 size={18} /> : <span>{i + 1}</span>}
                            </div>
                        ))}
                    </div>

                    <button 
                        onClick={startAd}
                        className="w-full py-3 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-xl font-bold shadow-lg shadow-teal-700/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        <Play size={20} fill="currentColor" />
                        {adsWatched === 0 ? 'İlk Reklamı İzle' : 'Sıradaki Reklamı İzle'}
                    </button>
                </>
            )}
        </div>
      </div>
    </div>
  );
};

export default RewardAdModal;
