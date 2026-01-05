import React from 'react';
import { Prayer } from '../types';
import { X, History, Calendar, Clock } from 'lucide-react';

interface HistoryModalProps {
  prayer: Prayer;
  onClose: () => void;
}

const HistoryModal: React.FC<HistoryModalProps> = ({ prayer, onClose }) => {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden max-h-[70vh] flex flex-col">
        <div className="p-4 border-b border-stone-100 flex justify-between items-center bg-stone-50">
           <h3 className="font-bold text-teal-800 flex items-center gap-2">
             <History size={18} /> Okuma Geçmişi
           </h3>
           <button onClick={onClose} className="text-stone-400 hover:text-stone-600"><X size={20}/></button>
        </div>
        
        <div className="bg-emerald-50/50 p-3 border-b border-emerald-50">
            <h4 className="text-sm font-bold text-teal-900 truncate">{prayer.title}</h4>
            <p className="text-xs text-teal-700 mt-1">
                Toplam: <span className="font-mono font-bold">{prayer.currentCount}</span> 
                {prayer.targetCount > 0 && <span> / {prayer.targetCount}</span>}
            </p>
        </div>

        <div className="overflow-y-auto p-4 space-y-2 no-scrollbar">
          {!prayer.history || prayer.history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-stone-400">
                <Calendar size={32} strokeWidth={1.5} className="mb-2 opacity-50"/>
                <p className="text-sm italic">Henüz geçmiş kaydı bulunmuyor.</p>
            </div>
          ) : (
            prayer.history.map((entry, idx) => (
              <div key={idx} className="flex justify-between items-center p-3 bg-stone-50 rounded-xl border border-stone-100 hover:border-emerald-200 transition-colors">
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={12} className="text-stone-400"/>
                    <span className="text-xs font-bold text-stone-700">
                        {new Date(entry.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock size={12} className="text-stone-400"/>
                    <span className="text-[10px] text-stone-500 font-mono">
                        {new Date(entry.date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
                <div className="bg-white px-3 py-1.5 rounded-lg border border-teal-100 text-teal-700 font-mono font-bold text-sm shadow-sm">
                  +{entry.count}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoryModal;