
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Prayer, User } from '../types';
import { generatePrayerAudio } from '../services/geminiService';
import { getCachedAudio, saveCachedAudio, getAdRates } from '../services/supabase';
import { dbService } from '../services/db';
import { logger } from '../utils/logger';
import RewardAdModal from './RewardAdModal';
import HistoryModal from './HistoryModal';
import { ChevronLeft, ChevronRight, RotateCcw, Check, Settings2, Play, Pause, Type, Minus, Plus, History, Volume2, Smartphone, X, DownloadCloud, Loader2, Trash2, Headphones, MessageCircle, CheckCircle2, Crown } from 'lucide-react';

interface CounterProps {
  prayer: Prayer;
  onUpdate: (prayer: Prayer) => void;
  onBack: () => void;
  user: User | null;
  onOpenPremium?: () => void; // Optional if not always passed
}

// Virtual Tasbih Beads Component
const BeadString: React.FC<{ count: number }> = ({ count }) => {
  return (
    <div className="absolute top-1/2 left-0 w-full -translate-y-1/2 overflow-hidden h-32 pointer-events-none opacity-30 z-0">
      <div
        className="flex items-center gap-4 transition-transform duration-300 ease-out"
        style={{ transform: `translateX(calc(50% - ${count * 40}px - 16px))` }} // 32px bead + 8px gap
      >
        {Array.from({ length: Math.max(count + 10, 33) }).map((_, i) => (
          <div
            key={i}
            className={`flex-shrink-0 w-8 h-8 rounded-full shadow-inner border border-emerald-200/60 ${i < count ? 'bg-teal-700' : 'bg-[#e0f2fe]'
              }`}
          />
        ))}
      </div>
      {/* String Line */}
      <div className="absolute top-1/2 left-0 w-full h-0.5 bg-emerald-200/50 -z-10 -translate-y-1/2"></div>
    </div>
  );
};

// Helper for Base64 decoding
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Helper for PCM Decoding
async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const Counter: React.FC<CounterProps> = ({ prayer, onUpdate, onBack, user, onOpenPremium }) => {
  const [count, setCount] = useState(prayer.currentCount);
  const [isCompleted, setIsCompleted] = useState(false);

  const sessionStartCountRef = useRef(prayer.currentCount);

  const [showSettings, setShowSettings] = useState(false);
  const [fontSize, setFontSize] = useState(1.125); // rem
  const [fontFamily, setFontFamily] = useState<'serif' | 'amiri' | 'sans'>('serif');

  const [showHistory, setShowHistory] = useState(false);
  const [isPocketMode, setIsPocketMode] = useState(false);
  const [showAdModal, setShowAdModal] = useState(false);
  const [ttsAdRate, setTtsAdRate] = useState(2);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(() => {
    const saved = localStorage.getItem('audioPlaybackSpeed');
    return saved ? parseFloat(saved) : 1.0;
  });

  // Load TTS ad rate on mount
  useEffect(() => {
    getAdRates().then(rates => setTtsAdRate(rates.tts || 2));
  }, []);

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const [textPage, setTextPage] = useState(0);

  const [isAutoCounting, setIsAutoCounting] = useState(false);
  const isAutoCountingRef = useRef(isAutoCounting);
  const autoLoopTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    isAutoCountingRef.current = isAutoCounting;
  }, [isAutoCounting]);

  useEffect(() => {
    if (prayer.currentCount === 0 && count !== 0) {
      setCount(0);
      sessionStartCountRef.current = 0;
      setIsCompleted(false);
      setTextPage(0);
    }
  }, [prayer.currentCount]);

  const textChunks = useMemo(() => {
    if (!prayer.turkish) return [];
    if (prayer.turkish.length < 250) return [prayer.turkish];

    const words = prayer.turkish.split(' ');
    const chunks: string[] = [];
    let currentChunk: string[] = [];
    let currentLength = 0;

    for (const word of words) {
      currentChunk.push(word);
      currentLength += word.length + 1;

      if (currentLength > 180 && (word.endsWith('.') || word.endsWith(',') || word.endsWith('!') || word.endsWith('?'))) {
        chunks.push(currentChunk.join(' '));
        currentChunk = [];
        currentLength = 0;
      } else if (currentLength > 250) {
        chunks.push(currentChunk.join(' '));
        currentChunk = [];
        currentLength = 0;
      }
    }
    if (currentChunk.length > 0) chunks.push(currentChunk.join(' '));
    return chunks;
  }, [prayer.turkish]);

  useEffect(() => {
    setTextPage(0);
  }, [isPocketMode, prayer.id]);

  useEffect(() => {
    if (prayer.targetCount > 0 && count >= prayer.targetCount && !isCompleted) {
      setIsCompleted(true);
      setIsAutoCounting(false);
      if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 100]);
    }
  }, [count, prayer.targetCount, isCompleted]);

  useEffect(() => {
    const runAutoLoop = async () => {
      if (!isAutoCountingRef.current) return;
      if (prayer.targetCount > 0 && count >= prayer.targetCount) {
        setIsAutoCounting(false);
        return;
      }

      // Bekleme süresini hıza göre ayarla (hızlı = kısa bekleme)
      const baseDelay = 800;
      const adjustedDelay = Math.round(baseDelay / playbackSpeed);

      if (prayer.audioBase64) {
        try {
          await playAudioWithCallback(() => {
            if (isAutoCountingRef.current) {
              handleIncrement(false);
              autoLoopTimeoutRef.current = window.setTimeout(() => {
                runAutoLoop();
              }, adjustedDelay);
            }
          });
        } catch (e) {
          console.error("Auto loop audio error", e);
          setIsAutoCounting(false);
        }
      } else {
        handleIncrement(false);
        // Ses yoksa daha uzun bekleme (hıza göre ayarlanmış)
        const noAudioDelay = Math.round(2000 / playbackSpeed);
        autoLoopTimeoutRef.current = window.setTimeout(() => {
          runAutoLoop();
        }, noAudioDelay);
      }
    };

    if (isAutoCounting) {
      runAutoLoop();
    } else {
      stopAudio();
      if (autoLoopTimeoutRef.current) {
        clearTimeout(autoLoopTimeoutRef.current);
        autoLoopTimeoutRef.current = null;
      }
    }

    return () => {
      if (autoLoopTimeoutRef.current) {
        clearTimeout(autoLoopTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAutoCounting, prayer.audioBase64, playbackSpeed]);

  useEffect(() => {
    return () => {
      stopAudio();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const stopAudio = () => {
    if (audioSourceRef.current) {
      try {
        audioSourceRef.current.stop();
        audioSourceRef.current.onended = null;
      } catch (e) {
        // ignore
      }
      audioSourceRef.current = null;
    }
    setIsSpeaking(false);
  };

  const playAudioWithCallback = async (onEndedCallback?: () => void) => {
    if (isSpeaking && !isAutoCountingRef.current) {
      stopAudio();
      return;
    }

    if (!prayer.audioBase64) {
      const utterance = new SpeechSynthesisUtterance(prayer.turkish);
      utterance.lang = 'tr-TR';
      utterance.rate = 0.9;
      utterance.onend = () => {
        setIsSpeaking(false);
        if (onEndedCallback) onEndedCallback();
      };
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
      return;
    }

    try {
      if (audioSourceRef.current) {
        try { audioSourceRef.current.stop(); } catch (e) { logger.warn('Audio stop error', e); }
        audioSourceRef.current = null;
      }
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }

      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      const audioBuffer = await decodeAudioData(
        decode(prayer.audioBase64),
        ctx,
        24000,
        1
      );

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.playbackRate.value = playbackSpeed; // Hız ayarı
      source.connect(ctx.destination);

      source.onended = () => {
        setIsSpeaking(false);
        if (onEndedCallback) onEndedCallback();
      };

      source.start();
      audioSourceRef.current = source;

    } catch (error) {
      console.error("Audio playback error:", error);
      setIsSpeaking(false);
      if (!isAutoCountingRef.current) alert("Ses oynatılırken bir hata oluştu.");
    }
  };

  const handlePlayAudioUI = () => {
    if (isAutoCounting) {
      setIsAutoCounting(false);
      stopAudio();
    } else {
      playAudioWithCallback();
    }
  };

  const initiateAudioGeneration = () => {
    if (user?.isPremium) {
      // Instant generation for Premium
      handleAdComplete();
    } else {
      // Show Ad modal for Free users
      setShowAdModal(true);
    }
  };

  const handleAdComplete = async () => {
    setShowAdModal(false);
    setIsGeneratingAudio(true);

    try {
      const textToSpeak = prayer.turkish;

      // Önce cache'e bak - başkası zaten bu sesi üretmiş olabilir
      const cachedAudio = await getCachedAudio(textToSpeak);

      let audioBase64: string;

      if (cachedAudio) {
        // Cache'den al - API maliyeti yok! 🎉
        audioBase64 = cachedAudio;
        console.log('🎯 Audio found in cache - no API cost!');
      } else {
        // Cache'de yok, yeni üret
        audioBase64 = await generatePrayerAudio(textToSpeak);

        // Başarılı üretildiyse cache'e kaydet (arka planda)
        saveCachedAudio(textToSpeak, audioBase64, user?.id).catch(() => { });
      }

      // Kullanıcının kendi dua kaydına da ekle
      let audioUrl: string | undefined;
      try {
        const uploaded = await dbService.uploadAudio(prayer.id, audioBase64);
        if (uploaded) {
          audioUrl = uploaded;
        }
      } catch (e) {
        console.warn('Audio upload to Supabase failed, using local only:', e);
      }

      onUpdate({
        ...prayer,
        audioBase64: audioBase64,
        _audioUrl: audioUrl,
        lastUpdated: Date.now()
      } as Prayer);

    } catch (error: any) {
      console.error(error);

      // Kullanıcıya tarayıcı sesini kullanma seçeneği sun
      const useBrowserTTS = window.confirm(
        error.message + "\n\nTarayıcının yerleşik sesini şimdi dinlemek ister misiniz?"
      );

      if (useBrowserTTS && 'speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(prayer.turkish);
        utterance.lang = 'tr-TR';
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
      }
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const handleDeleteAudio = async () => {
    if (window.confirm("İndirilen ses dosyasını silmek istediğinize emin misiniz?")) {
      // Try to delete from Supabase Storage
      try {
        await dbService.deleteAudio(prayer.id);
      } catch (e) {
        console.warn('Audio delete from Supabase failed:', e);
      }

      const updatedPrayer = { ...prayer };
      delete updatedPrayer.audioBase64;
      delete (updatedPrayer as any)._audioUrl;
      onUpdate(updatedPrayer);
    }
  };

  const handleIncrement = (vibrate = true) => {
    if (prayer.targetCount > 0 && count >= prayer.targetCount) return;
    setTextPage(0);
    setCount(prev => {
      const newCount = prev + 1;
      onUpdate({ ...prayer, currentCount: newCount, lastUpdated: Date.now() });
      return newCount;
    });
    if (vibrate && navigator.vibrate) navigator.vibrate(15);
  };

  const handleReset = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (window.confirm('Tesbihatı sıfırlamak istiyor musunuz? Bu işlem mevcut oturum geçmişini de kaydeder.')) {
      const sessionCount = count - sessionStartCountRef.current;
      let updatedHistory = prayer.history || [];
      if (sessionCount > 0) {
        updatedHistory = [{
          date: new Date().toISOString(),
          count: sessionCount
        }, ...updatedHistory];
      }
      setCount(0);
      setIsCompleted(false);
      setIsAutoCounting(false);
      setTextPage(0);
      sessionStartCountRef.current = 0;
      onUpdate({ ...prayer, currentCount: 0, history: updatedHistory, lastUpdated: Date.now() });
    }
  };

  const saveSessionHistory = () => {
    const sessionCount = count - sessionStartCountRef.current;
    if (sessionCount > 0) {
      const newEntry = {
        date: new Date().toISOString(),
        count: sessionCount
      };
      const updatedHistory = [newEntry, ...(prayer.history || [])];
      onUpdate({ ...prayer, currentCount: count, history: updatedHistory, lastUpdated: Date.now() });
    }
  };

  const handleBack = () => {
    saveSessionHistory();
    stopAudio();
    setIsAutoCounting(false);
    onBack();
  };

  const handlePageChange = (e: React.MouseEvent, dir: 'next' | 'prev') => {
    e.stopPropagation();
    if (dir === 'next') {
      setTextPage(p => Math.min(p + 1, textChunks.length - 1));
    } else {
      setTextPage(p => Math.max(p - 1, 0));
    }
  };

  const notifyHatimComplete = () => {
    const message = `Selamun Aleyküm, bana verilen ${prayer.hatimPartNo}. Cüz'ü okudum, Allah kabul etsin.`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const progress = prayer.targetCount > 0 ? Math.min((count / prayer.targetCount) * 100, 100) : 0;

  const getFontClass = () => {
    switch (fontFamily) {
      case 'amiri': return 'font-amiri';
      case 'sans': return 'font-sans';
      default: return 'font-serif';
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#ecfdf5] relative overflow-hidden">
      <div className="islamic-pattern absolute inset-0 z-0 pointer-events-none"></div>

      {showAdModal && (
        <RewardAdModal
          cost={ttsAdRate}
          title="Ses Dosyası Oluştur"
          description={`Yapay zeka ile doğal ve akıcı bir seslendirme oluşturmak yüksek işlem gücü gerektirir. Devam etmek için lütfen ${ttsAdRate} adet reklam izleyin.`}
          onComplete={handleAdComplete}
          onCancel={() => setShowAdModal(false)}
          onOpenPremium={onOpenPremium}
        />
      )}

      {isPocketMode && (
        <div
          className="absolute inset-0 z-[100] bg-black cursor-pointer flex flex-col justify-between p-6 touch-manipulation pb-safe shadow-[inset_0_0_100px_rgba(45,212,191,0.6)] border-4 border-teal-400/50"
          onClick={() => handleIncrement(true)}
        >
          {/* ... Pocket Mode Content ... */}
          <div className="flex justify-between items-start text-stone-600 select-none">
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-1">
                <Smartphone size={20} className="text-teal-600" />
                <span className="text-xs font-bold uppercase tracking-widest text-teal-600">Cep Modu</span>
              </div>
              <span className="text-[10px] text-stone-500">Ekranın ortasına dokunarak sayın</span>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setIsPocketMode(false); }}
              className="p-3 bg-stone-900 rounded-full border border-stone-800 text-stone-400 hover:text-white hover:border-stone-600 transition-all active:scale-95"
            >
              <X size={24} />
            </button>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center my-4 overflow-hidden relative">
            <div className="text-[120px] font-mono font-bold text-stone-200 leading-none tracking-tighter drop-shadow-lg select-none pointer-events-none">
              {count}
            </div>
            {prayer.targetCount > 0 && (
              <div className="mt-4 w-48 h-1 bg-stone-800 rounded-full overflow-hidden shrink-0 pointer-events-none">
                <div
                  className="h-full bg-teal-600 transition-all duration-300"
                  style={{ width: `${Math.min((count / prayer.targetCount) * 100, 100)}%` }}
                ></div>
              </div>
            )}

            {/* Pocket Mode Prayer Text */}
            <div className="mt-8 w-full max-w-sm text-center overflow-y-auto no-scrollbar mask-gradient z-10 px-4">
              <p className="text-xl font-serif text-stone-400 leading-relaxed pointer-events-none">
                {prayer.turkish}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="px-4 py-4 flex items-center justify-between bg-[#ecfdf5]/90 backdrop-blur-sm border-b border-emerald-100 z-20 sticky top-0">
        <button onClick={handleBack} className="p-2 -ml-2 text-stone-600 hover:text-teal-700 transition-colors">
          <ChevronLeft size={28} />
        </button>
        <h2 className="font-cinzel font-bold text-lg text-teal-900 truncate max-w-[160px]">{prayer.title}</h2>

        <div className="flex items-center">
          <button
            onClick={() => setShowHistory(true)}
            title="Geçmiş"
            className="p-2 text-stone-400 hover:text-teal-600 transition-colors"
          >
            <History size={22} />
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            title="Ayarlar"
            className={`p-2 transition-colors ${showSettings ? 'text-teal-600' : 'text-stone-400'}`}
          >
            <Settings2 size={24} />
          </button>
        </div>
      </div>

      {showHistory && (
        <HistoryModal prayer={prayer} onClose={() => setShowHistory(false)} />
      )}

      {showSettings && (
        <div className="bg-white border-b border-stone-200 p-4 z-20 animate-in slide-in-from-top-2">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-stone-600">Hedef (0 = Sınırsız)</span>
              <input
                type="number"
                min="0"
                value={prayer.targetCount || ''}
                placeholder="∞"
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  onUpdate({ ...prayer, targetCount: isNaN(val) ? 0 : val });
                }}
                className="w-20 p-2 text-right bg-stone-50 border border-stone-200 rounded-lg text-sm font-mono focus:border-teal-500 outline-none"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-stone-600">Yazı Boyutu</span>
              <div className="flex items-center gap-3 bg-stone-100 rounded-lg p-1">
                <button onClick={() => setFontSize(Math.max(0.8, fontSize - 0.1))} className="p-2 hover:bg-white rounded-md"><Minus size={16} /></button>
                <span className="w-8 text-center text-sm">{Math.round(fontSize * 16)}</span>
                <button onClick={() => setFontSize(Math.min(3, fontSize + 0.1))} className="p-2 hover:bg-white rounded-md"><Plus size={16} /></button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-stone-600">Yazı Tipi</span>
              <div className="flex gap-2">
                <button onClick={() => setFontFamily('serif')} className={`px-3 py-1 rounded text-xs border ${fontFamily === 'serif' ? 'bg-teal-50 border-teal-500 text-teal-700' : 'border-stone-200'}`}>Klasik</button>
                <button onClick={() => setFontFamily('amiri')} className={`px-3 py-1 rounded text-xs border font-amiri ${fontFamily === 'amiri' ? 'bg-teal-50 border-teal-500 text-teal-700' : 'border-stone-200'}`}>Hat</button>
                <button onClick={() => setFontFamily('sans')} className={`px-3 py-1 rounded text-xs border font-sans ${fontFamily === 'sans' ? 'bg-teal-50 border-teal-500 text-teal-700' : 'border-stone-200'}`}>Modern</button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-stone-600 flex items-center gap-2">
                <Volume2 size={16} className="text-teal-600" />
                Ses Hızı
              </span>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={playbackSpeed}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setPlaybackSpeed(val);
                    localStorage.setItem('audioPlaybackSpeed', String(val));
                  }}
                  className="w-24 accent-teal-600"
                />
                <span className="text-sm font-mono w-12 text-right">{playbackSpeed.toFixed(1)}x</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto no-scrollbar z-10 p-6">
        <div className="max-w-xl mx-auto space-y-6">
          {/* Hatim Completion Banner */}
          {prayer.isHatimPart && isCompleted && (
            <div className="bg-gradient-to-r from-teal-600 to-teal-500 p-4 rounded-xl shadow-lg text-white animate-in slide-in-from-top-4 mb-4">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle2 size={24} className="text-teal-200" />
                <h3 className="font-bold text-lg">Cüz Tamamlandı!</h3>
              </div>
              <p className="text-xs text-teal-100 mb-4 opacity-90">
                Okumanız bitti. Hatimi organize eden kişiye haber verin.
              </p>
              <button
                onClick={notifyHatimComplete}
                className="w-full py-3 bg-white text-teal-700 rounded-lg font-bold text-sm shadow-md flex items-center justify-center gap-2 hover:bg-teal-50 active:scale-[0.98] transition-all"
              >
                <MessageCircle size={18} />
                WhatsApp İle Bildir
              </button>
            </div>
          )}

          {prayer.arabic && (
            <div className="bg-white/60 p-6 rounded-2xl border border-emerald-100 shadow-sm backdrop-blur-sm">
              <p className="text-3xl text-right font-amiri leading-[2.5] text-teal-900" dir="rtl">
                {prayer.arabic}
              </p>
            </div>
          )}

          <div className="relative">
            <div className={`text-stone-800 leading-relaxed ${getFontClass()}`} style={{ fontSize: `${fontSize}rem` }}>
              {prayer.turkish}
            </div>

            {prayer.meaning && (
              <div className="mt-8 pt-8 border-t border-emerald-100/60 relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#ecfdf5] px-4 text-[10px] font-bold text-teal-600 tracking-widest uppercase font-cinzel">
                  ANLAMI
                </div>
                <p className="text-stone-600 italic font-serif leading-relaxed opacity-90" style={{ fontSize: `${Math.max(0.9, fontSize - 0.15)}rem` }}>
                  {prayer.meaning}
                </p>
              </div>
            )}

            <div className="absolute -right-2 -bottom-10 flex gap-2">
              {prayer.audioBase64 ? (
                <>
                  <button
                    onClick={handlePlayAudioUI}
                    title={isSpeaking ? "Durdur" : "Kaydedilmiş Sesi Dinle"}
                    className={`p-2 rounded-full shadow-sm border transition-all ${isSpeaking ? 'bg-amber-100 text-amber-600 border-amber-200 animate-pulse' : 'bg-teal-600 text-white border-teal-600 hover:bg-teal-700'}`}
                  >
                    {isSpeaking ? <Pause size={16} /> : <Headphones size={16} />}
                  </button>
                  <button
                    onClick={handleDeleteAudio}
                    title="İndirilen Sesi Sil"
                    className="p-2 rounded-full shadow-sm border bg-white text-stone-400 border-stone-200 hover:text-red-500 hover:bg-red-50 transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-1">
                  {!user?.isPremium && (
                    <button
                      onClick={onOpenPremium}
                      className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-1 rounded-full border border-amber-200 flex items-center gap-1 animate-pulse"
                    >
                      <Crown size={10} /> PRO
                    </button>
                  )}
                  <button
                    onClick={initiateAudioGeneration}
                    disabled={isGeneratingAudio}
                    title="Yapay Zeka Seslendirmesi İndir"
                    className={`p-2 rounded-full shadow-sm border transition-all flex items-center gap-1 ${isGeneratingAudio ? 'bg-stone-100 text-stone-400 border-stone-200' : 'bg-white text-teal-600 border-stone-200 hover:border-teal-400'}`}
                  >
                    {isGeneratingAudio ? <Loader2 size={16} className="animate-spin" /> : <DownloadCloud size={16} />}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border-t border-emerald-100 z-20 pb-12 pt-4 px-6 rounded-t-3xl shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)] relative">
        {prayer.targetCount > 0 && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-stone-100 overflow-hidden rounded-t-3xl">
            <div className="h-full bg-amber-500 transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        )}

        <div className="h-16 mb-2 relative flex items-center justify-center">
          <BeadString count={count} />
          <div className="text-xs text-stone-400 bg-white/80 px-2 py-0.5 rounded-full backdrop-blur-sm border border-stone-200 z-10">
            {isAutoCounting ? 'Otomatik Mod Aktif' : 'Tesbih Çekmek İçin Dokunun'}
          </div>
        </div>

        <div className="flex items-center justify-between max-w-xs mx-auto gap-4">
          <div className="flex flex-col gap-3">
            <button
              onClick={() => setIsAutoCounting(!isAutoCounting)}
              title={isAutoCounting ? "Otomatik Saymayı Durdur" : "Otomatik Saymayı Başlat"}
              className={`p-3 rounded-full border transition-all ${isAutoCounting ? 'bg-amber-100 border-amber-300 text-amber-700' : 'border-stone-200 text-stone-400 hover:text-stone-600'}`}>
              {isAutoCounting ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
            </button>
            <button
              onClick={handleReset}
              title="Sıfırla ve Kaydet"
              className="p-3 rounded-full border border-stone-200 text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            >
              <RotateCcw size={20} />
            </button>
          </div>

          <button
            onClick={() => handleIncrement(true)}
            title="Sayaç"
            className="w-32 h-32 rounded-full bg-gradient-to-b from-teal-600 to-teal-800 shadow-[0_10px_30px_-10px_rgba(15,118,110,0.5)] flex flex-col items-center justify-center active:scale-95 transition-all active:shadow-none border-4 border-amber-500/30 group relative shrink-0"
          >
            <div className="absolute inset-2 border border-teal-400/30 rounded-full" />
            <span className="text-4xl font-bold text-white font-cinzel tabular-nums tracking-wider drop-shadow-md">
              {count}
            </span>
            {prayer.targetCount > 0 && (
              <span className="text-[10px] text-teal-100/80 mt-1 font-medium tracking-wide uppercase">
                Hedef: {prayer.targetCount}
              </span>
            )}
          </button>

          <div className="flex flex-col items-center gap-3 w-[44px]">
            <button
              onClick={() => setIsPocketMode(true)}
              title="Cep Modu (OLED Siyah)"
              className="p-3 rounded-full border border-stone-200 text-stone-400 hover:text-stone-800 hover:bg-stone-50 transition-colors flex flex-col items-center justify-center gap-1 group"
            >
              <Smartphone size={20} />
            </button>
            <span className="text-[9px] text-stone-300 font-bold uppercase text-center leading-tight">Cep<br />Modu</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Counter;
