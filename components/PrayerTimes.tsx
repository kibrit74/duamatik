import React, { useState, useEffect } from 'react';
import { MapPin, Clock, Loader2, AlertCircle } from 'lucide-react';

const PRAYER_NAMES_TR: Record<string, string> = {
  Fajr: 'İmsak',
  Sunrise: 'Güneş',
  Dhuhr: 'Öğle',
  Asr: 'İkindi',
  Maghrib: 'Akşam',
  Isha: 'Yatsı'
};

const PrayerTimes: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextPrayer, setNextPrayer] = useState<{ name: string; time: string; remaining: string; isTomorrow?: boolean } | null>(null);
  const [locationName, setLocationName] = useState<string | null>(null);
  const [timings, setTimings] = useState<Record<string, string> | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Konum izni gerekli.");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          const date = new Date();
          const dateStr = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
          // Using Method 13 (Diyanet) for Turkey context
          const response = await fetch(
            `https://api.aladhan.com/v1/timings/${dateStr}?latitude=${latitude}&longitude=${longitude}&method=13`
          );
          
          if (!response.ok) throw new Error("Veri hatası");
          
          const data = await response.json();
          setTimings(data.data.timings);
          
          if (data.data.meta && data.data.meta.timezone) {
              // Extract city from timezone string like "Europe/Istanbul"
              const tz = data.data.meta.timezone;
              const city = tz.split('/')[1]?.replace(/_/g, ' ');
              setLocationName(city || "Konumunuz");
          }
        } catch (err) {
          setError("Vakitler alınamadı.");
        } finally {
            setLoading(false);
        }
      },
      (err) => {
        // Handle specific geolocation errors if needed
        if (err.code === 1) setError("Konum izni reddedildi.");
        else setError("Konum alınamadı.");
        setLoading(false);
      }
    );
  }, []);

  useEffect(() => {
      if (!timings) return;
      
      const timer = setInterval(() => {
          updateCountdown(timings);
      }, 1000);
      
      updateCountdown(timings);
      
      return () => clearInterval(timer);
  }, [timings]);

  const updateCountdown = (currentTimings: Record<string, string>) => {
    const now = new Date();
    const prayerOrder = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
    let found = false;

    for (const p of prayerOrder) {
        const timeStr = currentTimings[p];
        const [h, m] = timeStr.split(':').map(Number);
        const pDate = new Date();
        pDate.setHours(h, m, 0, 0);

        if (pDate > now) {
            const diff = pDate.getTime() - now.getTime();
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            
            setNextPrayer({
                name: PRAYER_NAMES_TR[p],
                time: timeStr,
                remaining: `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
            });
            found = true;
            break;
        }
    }

    if (!found) {
        // Next is Fajr tomorrow. 
        // We approximate tomorrow's Fajr time using today's Fajr + 24 hours for display purposes
        const fajrStr = currentTimings['Fajr'];
        const [fh, fm] = fajrStr.split(':').map(Number);
        const fDate = new Date();
        fDate.setDate(fDate.getDate() + 1);
        fDate.setHours(fh, fm, 0, 0);
        
        const diff = fDate.getTime() - now.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        setNextPrayer({
            name: "İmsak (Yarın)",
            time: fajrStr,
            remaining: `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
            isTomorrow: true
        });
    }
  };

  if (error) {
    return (
        <div className="mt-6 mb-1 w-full max-w-[280px] bg-red-50/80 border border-red-100 rounded-xl p-3 flex items-center justify-center gap-2 text-red-500 text-xs">
            <AlertCircle size={14} /> <span>{error}</span>
        </div>
    );
  }

  if (loading) {
    return (
        <div className="mt-6 mb-1 w-full max-w-[280px] bg-white/40 border border-emerald-100/50 rounded-xl p-3 flex items-center justify-center gap-2 text-stone-500 text-xs">
            <Loader2 size={14} className="animate-spin" /> <span>Konum ve vakitler alınıyor...</span>
        </div>
    );
  }

  if (!nextPrayer) return null;

  return (
    <div className="mt-6 mb-1 w-full max-w-[300px] bg-gradient-to-br from-teal-50/80 to-white/60 backdrop-blur-md border border-emerald-100/60 rounded-2xl p-4 flex items-center justify-between relative overflow-hidden shadow-[0_2px_10px_-5px_rgba(0,0,0,0.05)] animate-in slide-in-from-bottom-2">
       {/* Decorative */}
       <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-100/30 rounded-full -mr-8 -mt-8 blur-xl"></div>
       
       <div className="flex flex-col items-start z-10 gap-0.5">
          <div className="flex items-center gap-1 text-teal-600/80">
             <MapPin size={10} strokeWidth={2.5} />
             <span className="text-[9px] font-bold uppercase tracking-widest">{locationName || 'KONUM'}</span>
          </div>
          <span className="text-sm font-bold text-stone-700 font-cinzel leading-tight">{nextPrayer.name} <span className="text-stone-400 font-sans font-normal text-xs">vaktine</span></span>
       </div>

       <div className="flex flex-col items-end z-10">
          <span className="text-2xl font-mono font-bold text-teal-700 tracking-tight leading-none drop-shadow-sm">{nextPrayer.remaining}</span>
          <div className="flex items-center gap-1.5 text-[10px] text-stone-500 mt-1.5 bg-white/50 px-2 py-0.5 rounded-full border border-stone-100/50">
             <Clock size={10} />
             <span className="font-medium">Ezan: {nextPrayer.time}</span>
          </div>
       </div>
    </div>
  );
};

export default PrayerTimes;