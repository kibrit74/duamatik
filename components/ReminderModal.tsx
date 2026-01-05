import React, { useState } from 'react';
import { Prayer, Reminder } from '../types';
import { Bell, Calendar, Clock, X, Check, Repeat } from 'lucide-react';

interface ReminderModalProps {
  prayer: Prayer;
  onSave: (prayer: Prayer) => void;
  onClose: () => void;
}

const ReminderModal: React.FC<ReminderModalProps> = ({ prayer, onSave, onClose }) => {
  const [type, setType] = useState<'onetime' | 'weekly'>(prayer.reminder?.type || 'onetime');
  const [time, setTime] = useState(prayer.reminder?.time || '12:00');
  const [date, setDate] = useState(prayer.reminder?.date ? new Date(prayer.reminder.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
  const [day, setDay] = useState(prayer.reminder?.day ?? 5); // Default Friday (5)

  const days = [
    { id: 1, label: 'Pzt' },
    { id: 2, label: 'Sal' },
    { id: 3, label: 'Çar' },
    { id: 4, label: 'Per' },
    { id: 5, label: 'Cum' },
    { id: 6, label: 'Cmt' },
    { id: 0, label: 'Paz' },
  ];

  const handleSave = () => {
    // Request permission if not granted
    if (Notification.permission !== 'granted') {
      Notification.requestPermission();
    }

    const newReminder: Reminder = {
      active: true,
      type,
      time,
      day: type === 'weekly' ? day : undefined,
      date: type === 'onetime' ? date : undefined
    };

    onSave({ ...prayer, reminder: newReminder });
    onClose();
  };

  const handleDelete = () => {
    const updatedPrayer = { ...prayer };
    delete updatedPrayer.reminder;
    onSave(updatedPrayer);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl border border-stone-200 overflow-hidden">
        <div className="p-4 border-b border-stone-100 flex justify-between items-center bg-stone-50">
          <div className="flex items-center gap-2 text-teal-800">
            <Bell size={20} />
            <h3 className="font-cinzel font-bold">Hatırlatıcı Ekle</h3>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-6">
          {/* Type Selection */}
          <div className="flex bg-stone-100 p-1 rounded-lg">
            <button 
              onClick={() => setType('onetime')}
              className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${type === 'onetime' ? 'bg-white text-teal-700 shadow-sm' : 'text-stone-500'}`}
            >
              Tek Seferlik
            </button>
            <button 
              onClick={() => setType('weekly')}
              className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${type === 'weekly' ? 'bg-white text-teal-700 shadow-sm' : 'text-stone-500'}`}
            >
              Haftalık
            </button>
          </div>

          {/* Date/Day Picker */}
          <div>
            <label className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2 block">
              {type === 'onetime' ? 'Tarih' : 'Gün'}
            </label>
            
            {type === 'onetime' ? (
              <div className="relative">
                <input 
                  type="date" 
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:border-teal-500 font-serif"
                />
                <Calendar className="absolute right-3 top-3 text-stone-400 pointer-events-none" size={20} />
              </div>
            ) : (
              <div className="flex justify-between gap-1">
                {days.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setDay(d.id)}
                    className={`w-9 h-9 rounded-full text-xs font-bold border flex items-center justify-center transition-all ${
                      day === d.id 
                        ? 'bg-teal-600 text-white border-teal-600' 
                        : 'bg-white text-stone-500 border-stone-200 hover:border-teal-300'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Time Picker */}
          <div>
            <label className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2 block">Saat</label>
            <div className="relative">
               <input 
                  type="time" 
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:border-teal-500 font-mono text-lg text-center tracking-widest"
                />
                <Clock className="absolute left-4 top-4 text-stone-400 pointer-events-none" size={20} />
            </div>
          </div>
          
          <div className="flex gap-3 pt-2">
            {prayer.reminder && (
              <button 
                onClick={handleDelete}
                className="flex-1 py-3 border border-red-200 text-red-600 rounded-xl font-bold text-sm hover:bg-red-50 transition-colors"
              >
                Kaldır
              </button>
            )}
            <button 
              onClick={handleSave}
              className="flex-[2] py-3 bg-teal-700 text-white rounded-xl font-bold text-sm hover:bg-teal-800 transition-colors shadow-lg shadow-teal-700/20 flex items-center justify-center gap-2"
            >
              <Check size={18} />
              {prayer.reminder ? 'Güncelle' : 'Oluştur'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReminderModal;