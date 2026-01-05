
import React, { useState, useEffect, useRef } from 'react';
import { generateSpiritualPlan } from '../services/geminiService';
import { SpiritualPlan } from '../types';
import { Sparkles, CloudRain, Coffee, Frown, Brain, Heart, CheckCircle2, User, Fingerprint, Calendar, Sun, Moon, Send, ArrowRight, X } from 'lucide-react';
import RewardAdModal from './RewardAdModal';

interface PrayerCoachProps {
  onClose: () => void;
  isPremium: boolean;
  onOpenPremium: () => void;
}

const MOODS = [
  { id: 'anxious', label: 'Kaygılı', icon: CloudRain, color: 'bg-blue-100 text-blue-600', desc: "İçim daralıyor" },
  { id: 'sad', label: 'Hüzünlü', icon: Frown, color: 'bg-indigo-100 text-indigo-600', desc: "Mutsuzum" },
  { id: 'confused', label: 'Kararsız', icon: Brain, color: 'bg-purple-100 text-purple-600', desc: "Kafam karışık" },
  { id: 'tired', label: 'Yorgun', icon: Coffee, color: 'bg-amber-100 text-amber-600', desc: "Gücüm yok" },
  { id: 'grateful', label: 'Şükürlü', icon: Heart, color: 'bg-rose-100 text-rose-600', desc: "Huzurluyum" },
];

type Message = {
  id: string;
  sender: 'ai' | 'user';
  text?: string;
  type: 'text' | 'plan' | 'typing';
  planData?: SpiritualPlan;
};

const PrayerCoach: React.FC<PrayerCoachProps> = ({ onClose, isPremium, onOpenPremium }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputVisible, setInputVisible] = useState(true);
  const [showTextInput, setShowTextInput] = useState(false);
  const [customInput, setCustomInput] = useState('');
  
  const [showAdModal, setShowAdModal] = useState(false);
  const [pendingMood, setPendingMood] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    // Initial Greeting - Warm and Spiritual
    const t1 = setTimeout(() => {
        addMessage({
            id: 'init-1',
            sender: 'ai',
            type: 'text',
            text: 'Selamun Aleyküm canım kardeşim. 🌹'
        });
    }, 500);

    const t2 = setTimeout(() => {
        addMessage({
            id: 'init-2',
            sender: 'ai',
            type: 'text',
            text: 'Gönlünü ferahlatmak, sana özel manevi bir reçete hazırlamak için buradayım. Bugün kalbin nasıl hissediyor?'
        });
    }, 1500);

    return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, showTextInput]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const addMessage = (msg: Message) => {
    setMessages(prev => [...prev, msg]);
  };

  const initiateMoodProcessing = (moodText: string) => {
      if (isPremium) {
          handleProcessMood(moodText);
      } else {
          setPendingMood(moodText);
          setShowAdModal(true);
      }
  };

  const handleAdComplete = () => {
      setShowAdModal(false);
      if (pendingMood) {
          handleProcessMood(pendingMood);
          setPendingMood(null);
      }
  };

  const handleProcessMood = async (moodText: string) => {
    setInputVisible(false);
    setShowTextInput(false);
    
    // User Message
    addMessage({
        id: `user-${Date.now()}`,
        sender: 'user',
        type: 'text',
        text: moodText
    });

    // AI Thinking...
    const typingId = `typing-${Date.now()}`;
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = window.setTimeout(() => {
        addMessage({
            id: typingId,
            sender: 'ai',
            type: 'typing'
        });
    }, 400);

    try {
      // Generate plan
      const plan = await generateSpiritualPlan(moodText);
      
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      setMessages(prev => prev.filter(m => m.id !== typingId));
      
      addMessage({
          id: `ai-plan-${Date.now()}`,
          sender: 'ai',
          type: 'plan',
          planData: plan
      });

    } catch (e) {
      console.error("Coach Error:", e);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      setMessages(prev => prev.filter(m => m.id !== typingId));
      
      addMessage({
          id: `err-${Date.now()}`,
          sender: 'ai',
          type: 'text',
          text: 'Şu an bağlantıda bir sorun oldu. Ama niyetin hayır, akıbetin hayır olsun. Lütfen biraz sonra tekrar dene.'
      });
      setInputVisible(true);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if(customInput.trim()) {
          initiateMoodProcessing(customInput);
          setCustomInput('');
      }
  };

  const handleRestart = () => {
      setMessages([]); // Clear chat
      setInputVisible(true);
      setShowTextInput(false);
      
      // Re-trigger greetings slightly differently
      setTimeout(() => {
        addMessage({
            id: 'restart-1',
            sender: 'ai',
            type: 'text',
            text: 'Yeni bir sayfa açalım. Şimdi nasıl hissediyorsun?'
        });
      }, 500);
  };

  return (
    <div className="flex flex-col h-full bg-[#ecfdf5] relative overflow-hidden pb-24">
      <div className="islamic-pattern absolute inset-0 z-0 pointer-events-none opacity-10"></div>

      {showAdModal && (
        <RewardAdModal 
            cost={1} 
            title="Manevi Koç"
            description="Durumunuza özel manevi bir reçete ve 3 günlük plan hazırlanması için 1 reklam izleyin."
            onComplete={handleAdComplete} 
            onCancel={() => {
                setShowAdModal(false);
                setPendingMood(null);
            }} 
        />
      )}

      {/* Chat Header */}
      <div className="bg-white/90 backdrop-blur-md px-4 py-3 border-b border-emerald-100 relative z-10 shadow-sm flex items-center justify-between">
         <div className="flex items-center gap-3">
            <div className="relative">
                <div className="bg-gradient-to-tr from-teal-500 to-emerald-600 w-10 h-10 rounded-full flex items-center justify-center text-white shadow-md border-2 border-white">
                    <Sparkles size={20} />
                </div>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
            </div>
            <div>
                <h2 className="text-base font-bold font-cinzel text-teal-900 leading-tight">
                    Manevi Asistan
                </h2>
                <p className="text-teal-600 text-[10px] font-medium animate-pulse">Çevrimiçi</p>
            </div>
         </div>
         <div className="flex gap-2">
            {!isPremium && (
                <button onClick={onOpenPremium} className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-1.5 rounded-full border border-amber-200 shadow-sm flex items-center gap-1">
                    <Fingerprint size={10} /> PRO
                </button>
            )}
            <button onClick={onClose} className="bg-stone-100 p-2 rounded-full text-stone-500 hover:bg-stone-200">
                <ArrowRight size={16} />
            </button>
         </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 z-10 space-y-4">
        {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.sender === 'ai' && (
                    <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 shrink-0 mr-2 mt-auto border border-teal-200">
                        <Sparkles size={14} />
                    </div>
                )}
                
                <div className={`max-w-[90%] rounded-2xl p-4 shadow-sm relative ${
                    msg.sender === 'user' 
                    ? 'bg-teal-600 text-white rounded-br-none' 
                    : 'bg-white text-stone-800 border border-stone-100 rounded-bl-none'
                }`}>
                    {msg.type === 'text' && (
                        <p className="text-base font-serif leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    )}

                    {msg.type === 'typing' && (
                        <div className="flex gap-1 h-4 items-center">
                            <span className="w-2 h-2 bg-teal-400 rounded-full animate-bounce"></span>
                            <span className="w-2 h-2 bg-teal-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                            <span className="w-2 h-2 bg-teal-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                        </div>
                    )}

                    {msg.type === 'plan' && msg.planData && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                            <div>
                                <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold uppercase tracking-wider">Sana Özel</span>
                                <h3 className="text-xl font-bold font-serif text-teal-800 mt-1">{msg.planData.title}</h3>
                                <p className="text-sm text-stone-500 italic mt-1 leading-relaxed">"{msg.planData.description}"</p>
                            </div>
                            
                            <div className="space-y-3">
                                {Array.isArray(msg.planData.days) && msg.planData.days.map((day) => (
                                    <div key={day.day} className="bg-stone-50 rounded-xl p-4 border border-stone-200">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-sm font-bold text-stone-500 bg-white px-3 py-1 rounded-full border border-stone-100">{day.day}. Gün</span>
                                            <span className="text-sm font-bold text-teal-700 uppercase tracking-wide">{day.focus}</span>
                                        </div>
                                        <div className="grid grid-cols-1 gap-3 mb-3">
                                            <div className="bg-white p-3 rounded-lg border border-stone-100">
                                                <div className="flex items-center gap-2 text-xs text-amber-600 font-bold mb-1.5"><Sun size={12}/> Sabah</div>
                                                <p className="text-sm text-stone-700 leading-normal">{day.morning}</p>
                                            </div>
                                            <div className="bg-white p-3 rounded-lg border border-stone-100">
                                                <div className="flex items-center gap-2 text-xs text-indigo-600 font-bold mb-1.5"><Moon size={12}/> Akşam</div>
                                                <p className="text-sm text-stone-700 leading-normal">{day.evening}</p>
                                            </div>
                                        </div>
                                        <div className="bg-teal-50 p-3 rounded-lg border border-teal-100 text-center">
                                            <p className="text-xs text-teal-600 font-bold mb-1">Günün Zikri</p>
                                            <p className="text-sm text-teal-900 font-serif italic">"{day.dhikr}"</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button 
                                onClick={() => {
                                    alert("Program kaydedildi. Allah kabul etsin.");
                                    onClose();
                                }}
                                className="w-full py-4 bg-stone-900 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-stone-800 transition-colors"
                            >
                                <CheckCircle2 size={18} /> Kabul Et ve Uygula
                            </button>
                            <button 
                                onClick={handleRestart}
                                className="w-full text-stone-400 text-xs hover:text-stone-600 underline"
                            >
                                Yeni Bir Durum Paylaş
                            </button>
                        </div>
                    )}
                </div>
            </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area (Chips or Text) */}
      {inputVisible && !showTextInput && (
          <div className="p-4 bg-white/80 backdrop-blur-md border-t border-emerald-100 z-20 animate-in slide-in-from-bottom-4">
              <p className="text-xs text-stone-500 font-bold mb-3 px-1">Hissiyatını seç ({!isPremium ? '1 Reklam' : 'Ücretsiz'}):</p>
              <div className="flex flex-wrap gap-2">
                  {MOODS.map(mood => (
                      <button
                        key={mood.id}
                        onClick={() => initiateMoodProcessing(mood.label)}
                        className={`px-4 py-2 rounded-full border flex items-center gap-2 transition-all active:scale-95 ${mood.color} bg-opacity-10 border-transparent hover:bg-opacity-20`}
                      >
                          <mood.icon size={16} />
                          <span className="text-xs font-bold text-stone-700">{mood.label}</span>
                      </button>
                  ))}
                  <button 
                    onClick={() => setShowTextInput(true)}
                    className="px-4 py-2 rounded-full border border-stone-200 bg-stone-50 text-stone-500 text-xs font-bold flex items-center gap-2 hover:bg-stone-100 active:scale-95"
                  >
                      Diğer / Kendim Yazayım...
                  </button>
              </div>
          </div>
      )}

      {inputVisible && showTextInput && (
          <div className="p-4 bg-white/90 backdrop-blur-md border-t border-emerald-100 z-20 animate-in slide-in-from-bottom-4">
              <form onSubmit={handleCustomSubmit} className="flex gap-2 items-center">
                  <button 
                    type="button" 
                    onClick={() => setShowTextInput(false)}
                    className="p-3 bg-stone-100 rounded-full text-stone-400 hover:text-stone-600"
                  >
                      <X size={18} />
                  </button>
                  <input 
                    type="text" 
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    placeholder="Sıkıntını veya durumunu kısaca yaz..."
                    className="flex-1 bg-stone-50 border border-stone-200 rounded-full px-4 py-3 text-sm focus:outline-none focus:border-teal-500 font-serif"
                    autoFocus
                  />
                  <button 
                    type="submit"
                    disabled={!customInput.trim()}
                    className="p-3 bg-teal-600 text-white rounded-full hover:bg-teal-700 disabled:bg-stone-300 disabled:cursor-not-allowed transition-colors"
                  >
                      <Send size={18} />
                  </button>
              </form>
          </div>
      )}
    </div>
  );
};

export default PrayerCoach;
