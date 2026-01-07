
import React, { useState, useEffect, useRef } from 'react';
import { createChatHistory, sendChatMessage, ChatMessage } from '../services/geminiService';
import { saveSpiritualPlan, getAdRates } from '../services/supabase';
import { SpiritualPlan } from '../types';
import { Sparkles, Send, ArrowRight, User, Save, CheckCircle2, Sun, Moon } from 'lucide-react';
import { dbService } from '../services/db';
import RewardAdModal from './RewardAdModal';

interface PrayerCoachProps {
    onClose: () => void;
    isPremium: boolean;
    onOpenPremium: () => void;
}

type MessageItem = {
    id: string;
    sender: 'ai' | 'user';
    text?: string;
    type: 'text' | 'plan' | 'typing';
    planData?: SpiritualPlan;
};

const PrayerCoach: React.FC<PrayerCoachProps> = ({ onClose, isPremium, onOpenPremium }) => {
    const [messages, setMessages] = useState<MessageItem[]>([]);
    const [inputText, setInputText] = useState('');
    const [chatSession, setChatSession] = useState<any>(null);
    const [isTyping, setIsTyping] = useState(false);
    const [savingPlanId, setSavingPlanId] = useState<string | null>(null);

    // Ad modal states for free users
    const [showAdModal, setShowAdModal] = useState(false);
    const [adWatched, setAdWatched] = useState(false);
    const [adRate, setAdRate] = useState(2);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const initializedRef = useRef(false);

    // Init Chat - show ad modal for free users first
    useEffect(() => {
        if (initializedRef.current) return;

        // For free users, load ad rate and show modal
        if (!isPremium) {
            getAdRates().then(rates => {
                setAdRate(rates.chat || 2);
                setShowAdModal(true);
            });
            return;
        }

        // For premium users, init chat directly
        initChat();
    }, [isPremium]);

    const initChat = async () => {
        if (initializedRef.current) return;
        initializedRef.current = true;

        const session = await createChatHistory();
        setChatSession(session);

        setTimeout(() => {
            addMessage({
                id: 'init-1',
                sender: 'ai',
                type: 'text',
                text: 'Selamun Aleyküm canım kardeşim. 🌹\n\nBen senin Manevi Asistanınım. Dertleşmek, huzur bulmak veya sana özel bir manevi program hazırlamamı istersen buradayım. Bugün kalbin nasıl?'
            });
        }, 500);
    };

    const handleAdComplete = () => {
        setShowAdModal(false);
        setAdWatched(true);
        initChat();
    };

    useEffect(() => {
        if (!isPremium && !adWatched) return;
        scrollToBottom();
    }, [messages, isPremium, adWatched]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const addMessage = (msg: MessageItem) => {
        setMessages(prev => [...prev, msg]);
    };

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!inputText.trim() || !chatSession) return;

        const text = inputText;
        setInputText('');

        // User Msg
        addMessage({ id: `user-${Date.now()}`, sender: 'user', type: 'text', text });
        setIsTyping(true);

        // AI Response
        try {
            const response = await sendChatMessage(chatSession, text);
            setIsTyping(false);

            // Add Text Response
            if (response.text.trim()) {
                addMessage({
                    id: `ai-${Date.now()}`,
                    sender: 'ai',
                    type: 'text',
                    text: response.text
                });
            }

            // Add Plan Card if exists
            if (response.plan) {
                addMessage({
                    id: `plan-${Date.now()}`,
                    sender: 'ai',
                    type: 'plan',
                    planData: response.plan
                });
            }

        } catch (error) {
            console.error(error);
            setIsTyping(false);
            addMessage({
                id: `err-${Date.now()}`,
                sender: 'ai',
                type: 'text',
                text: 'Bağlantıda bir kopukluk oldu, lütfen tekrar dene.'
            });
        }
    };

    const handleSavePlan = async (plan: SpiritualPlan, msgId: string) => {
        try {
            setSavingPlanId(msgId);
            const userId = dbService.getUserId(); // Use cached user ID from DB Service
            if (!userId) {
                alert("Kullanıcı ID bulunamadı. Lütfen tekrar giriş yapın.");
                return;
            }

            // Varsayılan mood olarak "genel" diyebiliriz veya plan açıklamasından çıkarabiliriz.
            // Şimdilik "Manevi Sohbet" olarak kaydedelim.
            await saveSpiritualPlan(userId, "Manevi Sohbet", plan);

            // Update UI to show saved state (local state hack for now, or just alert)
            alert("Programın 'Profilim' sayfasına kaydedildi. Allah kabul etsin. 🌹");

        } catch (e) {
            console.error(e);
            alert("Kaydederken bir hata oluştu.");
        } finally {
            setSavingPlanId(null);
        }
    };

    // Show ad modal for free users who haven't watched ads yet
    if (!isPremium && showAdModal) {
        return (
            <div className="flex flex-col h-full bg-[#ecfdf5] relative">
                <RewardAdModal
                    cost={adRate}
                    title="Manevi Asistan"
                    description="Yapay zeka destekli kişisel manevi koçunuzla sohbet etmek için reklam izleyin. Sınırsız mesaj gönderebilirsiniz."
                    onComplete={handleAdComplete}
                    onCancel={onClose}
                    onOpenPremium={onOpenPremium}
                />
            </div>
        );
    }

    // Show loading state while initializing for free users who watched ads
    if (!isPremium && adWatched && !chatSession) {
        return (
            <div className="flex flex-col h-full bg-[#ecfdf5] relative items-center justify-center">
                <div className="animate-spin w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full"></div>
                <p className="mt-4 text-teal-700">Manevi Asistan hazırlanıyor...</p>
            </div>
        );
    }



    return (
        <div className="flex flex-col h-full bg-[#ecfdf5] relative overflow-hidden pb-0">
            <div className="islamic-pattern absolute inset-0 z-0 pointer-events-none opacity-5"></div>

            {/* Header */}
            <div className="bg-white/90 backdrop-blur-md px-4 py-3 border-b border-emerald-100 relative z-10 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="bg-gradient-to-tr from-teal-500 to-emerald-600 w-10 h-10 rounded-full flex items-center justify-center text-white shadow-md border-2 border-white">
                            <Sparkles size={20} />
                        </div>
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full animate-pulse"></div>
                    </div>
                    <div>
                        <h2 className="text-base font-bold font-cinzel text-teal-900 leading-tight">
                            Manevi Asistan
                        </h2>
                        <p className="text-teal-600 text-[10px] font-medium">Yapay Zeka Destekli</p>
                    </div>
                </div>
                <button onClick={onClose} className="bg-stone-100 p-2 rounded-full text-stone-500 hover:bg-stone-200">
                    <ArrowRight size={18} />
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 z-10 space-y-4 pb-24">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.sender === 'ai' && (
                            <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 shrink-0 mr-2 mt-auto border border-teal-200">
                                <Sparkles size={14} />
                            </div>
                        )}

                        <div className={`max-w-[85%] ${msg.type === 'plan' ? 'w-full' : ''}`}>
                            {/* Text Message */}
                            {msg.type === 'text' && (
                                <div className={`p-4 rounded-2xl shadow-sm whitespace-pre-wrap leading-relaxed text-[15px] font-serif ${msg.sender === 'user'
                                    ? 'bg-teal-600 text-white rounded-br-none'
                                    : 'bg-white text-stone-800 border border-stone-100 rounded-bl-none'
                                    }`}>
                                    {msg.text}
                                </div>
                            )}

                            {/* Plan Card */}
                            {msg.type === 'plan' && msg.planData && (
                                <div className="bg-white rounded-2xl shadow-lg border border-amber-100 overflow-hidden mt-2 animate-in fade-in slide-in-from-bottom-4">
                                    <div className="bg-amber-50 p-4 border-b border-amber-100">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="text-lg font-bold text-amber-900 font-serif">{msg.planData.title}</h3>
                                            <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">Özel Reçete</span>
                                        </div>
                                        <p className="text-sm text-amber-800/80 italic">{msg.planData.description}</p>
                                    </div>

                                    <div className="p-4 space-y-4">
                                        {msg.planData.days.map((day) => (
                                            <div key={day.day} className="bg-stone-50 rounded-xl p-3 border border-stone-100">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-xs font-bold text-stone-500">Gün {day.day}</span>
                                                    <span className="text-xs font-bold text-teal-600 uppercase">{day.focus}</span>
                                                </div>
                                                <div className="grid grid-cols-1 gap-2 text-sm">
                                                    <div className="flex gap-2">
                                                        <Sun size={14} className="text-amber-500 mt-0.5 shrink-0" />
                                                        <span className="text-stone-700">{day.morning}</span>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Moon size={14} className="text-indigo-500 mt-0.5 shrink-0" />
                                                        <span className="text-stone-700">{day.evening}</span>
                                                    </div>
                                                </div>
                                                <div className="mt-2 text-center bg-white p-2 rounded border border-stone-100">
                                                    <p className="text-xs font-bold text-teal-700">"{day.dhikr}"</p>
                                                </div>
                                            </div>
                                        ))}

                                        <button
                                            onClick={() => msg.planData && handleSavePlan(msg.planData, msg.id)}
                                            disabled={savingPlanId === msg.id}
                                            className="w-full py-3 bg-stone-900 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-stone-800 transition-colors disabled:opacity-70"
                                        >
                                            {savingPlanId === msg.id ? (
                                                <span className="animate-spin">⌛</span>
                                            ) : (
                                                <Save size={16} />
                                            )}
                                            Reçeteyi Kaydet
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {isTyping && (
                    <div className="flex items-center gap-1 ml-10">
                        <span className="w-2 h-2 bg-teal-400 rounded-full animate-bounce"></span>
                        <span className="w-2 h-2 bg-teal-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                        <span className="w-2 h-2 bg-teal-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="absolute bottom-0 left-0 right-0 bg-white p-4 border-t border-stone-100 z-20">
                <form onSubmit={handleSend} className="flex gap-2 items-center">
                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Derdini yaz, derman arayalım..."
                        className="flex-1 bg-stone-50 border border-stone-200 rounded-full px-5 py-3.5 text-base focus:outline-none focus:border-teal-500 font-serif placeholder:text-stone-400"
                    />
                    <button
                        type="submit"
                        disabled={!inputText.trim() || isTyping}
                        className="p-3.5 bg-teal-600 text-white rounded-full hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-teal-200"
                    >
                        <Send size={20} />
                    </button>
                </form>
            </div>

        </div>
    );
};

export default PrayerCoach;
