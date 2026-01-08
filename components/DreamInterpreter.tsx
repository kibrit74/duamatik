
import React, { useState, useEffect } from 'react';
import { interpretDream } from '../services/geminiService';
import { getAdRates } from '../services/supabase';
import { Moon, Stars, ArrowLeft, Send, Sparkles, AlertCircle, Quote } from 'lucide-react';
import RewardAdModal from './RewardAdModal';

interface DreamInterpreterProps {
    onClose: () => void;
    isPremium: boolean;
    onOpenPremium: () => void;
}

const DreamInterpreter: React.FC<DreamInterpreterProps> = ({ onClose, isPremium, onOpenPremium }) => {
    const [dreamText, setDreamText] = useState('');
    const [interpretation, setInterpretation] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showAdModal, setShowAdModal] = useState(false);
    const [dreamAdRate, setDreamAdRate] = useState(1);

    // Load dream ad rate on mount
    useEffect(() => {
        getAdRates().then(rates => setDreamAdRate(rates.dream || 1));
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!dreamText.trim()) return;

        if (isPremium) {
            processInterpretation();
        } else {
            setShowAdModal(true);
        }
    };

    const handleAdComplete = () => {
        setShowAdModal(false);
        processInterpretation();
    };

    const processInterpretation = async () => {
        setLoading(true);
        setError(null);
        setInterpretation('');

        try {
            const result = await interpretDream(dreamText);
            setInterpretation(result);
        } catch (err: any) {
            setError(err.message || "Rüyanız yorumlanırken bir hata oluştu.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#f8f7ff] relative overflow-hidden">
            {/* Night Sky Background */}
            <div className="absolute inset-0 bg-linear-to-b from-[#2e1065] to-[#4c1d95] z-0"></div>
            <div className="absolute inset-0 z-0 opacity-30" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>

            {showAdModal && (
                <RewardAdModal
                    cost={dreamAdRate}
                    title="Rüya Tabiri"
                    description={`İslami kaynaklardan süzülmüş, yapay zeka destekli detaylı bir rüya yorumu almak için ${dreamAdRate} reklam izleyin.`}
                    onComplete={handleAdComplete}
                    onCancel={() => setShowAdModal(false)}
                    onOpenPremium={onOpenPremium}
                />
            )}

            {/* Header */}
            <div className="relative z-10 px-4 py-4 flex items-center justify-between text-white/90">
                <button onClick={onClose} className="p-2 bg-white/10 rounded-full hover:bg-white/20 backdrop-blur-md transition-colors">
                    <ArrowLeft size={24} />
                </button>
                <div className="flex flex-col items-center">
                    <h2 className="font-cinzel font-bold text-lg tracking-wider text-amber-100 flex items-center gap-2">
                        <Moon size={18} fill="currentColor" /> RÜYA TABİRLERİ
                    </h2>
                    <p className="text-[10px] text-purple-200 uppercase tracking-widest">İslami Kaynaklar Işığında</p>
                </div>
                <div className="w-10"></div> {/* Spacer for center alignment */}
            </div>

            <div className="flex-1 relative z-10 flex flex-col p-4 overflow-y-auto no-scrollbar">

                {/* Intro Card */}
                {!interpretation && !loading && (
                    <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-6 text-center text-purple-100 mb-6 animate-in fade-in slide-in-from-bottom-4">
                        <div className="w-16 h-16 bg-linear-to-br from-amber-300 to-amber-500 rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg shadow-amber-500/30">
                            <Stars size={32} className="text-purple-900" />
                        </div>
                        <p className="font-serif italic text-lg mb-2">"Rüya, nübüvvetin kırk altı cüzünden bir cüzdür."</p>
                        <p className="text-xs text-purple-300 opacity-80">(Hadis-i Şerif)</p>
                        <p className="text-sm mt-4 leading-relaxed opacity-90">
                            Gördüğünüz rüyayı hayra yormak niyetiyle aşağıya yazın. Yapay zeka asistanımız, İslami kaynaklardan süzülen hikmetle yorumlasın.
                        </p>
                    </div>
                )}

                {/* Input Area */}
                {!interpretation && (
                    <form onSubmit={handleSubmit} className="relative z-10 space-y-4">
                        <div className="relative">
                            <textarea
                                value={dreamText}
                                onChange={(e) => setDreamText(e.target.value)}
                                placeholder="Rüyanızı detaylı bir şekilde anlatın..."
                                className="w-full h-48 bg-white/95 backdrop-blur-sm rounded-2xl p-4 text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-xl resize-none font-serif text-base leading-relaxed"
                                disabled={loading}
                            />
                            <Sparkles className="absolute right-4 top-4 text-amber-500 opacity-50" size={20} />
                        </div>

                        {error && (
                            <div className="bg-red-500/20 backdrop-blur-md border border-red-500/30 text-red-100 p-3 rounded-xl flex items-center gap-2 text-sm">
                                <AlertCircle size={16} /> {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || !dreamText.trim()}
                            className="w-full py-4 bg-linear-to-r from-amber-500 to-orange-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-orange-500/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
                        >
                            {loading ? (
                                <>
                                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                    Yorumlanıyor...
                                </>
                            ) : (
                                <>
                                    <Stars size={20} className="group-hover:rotate-12 transition-transform" />
                                    {isPremium ? 'TABİR ET' : 'TABİR ET (1 Reklam)'}
                                </>
                            )}
                        </button>
                        {!isPremium && (
                            <p className="text-center text-[10px] text-purple-200 opacity-70">
                                Premium üyeler reklamsız kullanabilir.
                            </p>
                        )}
                    </form>
                )}

                {/* Result Area */}
                {interpretation && (
                    <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-700 border border-purple-100 relative">
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-amber-500 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest shadow-md flex items-center gap-1">
                            <Sparkles size={12} /> Rüya Tabiri
                        </div>

                        <div className="prose prose-stone prose-sm max-w-none font-serif text-base leading-7 text-stone-700">
                            <Quote size={24} className="text-purple-200 mb-2" />
                            {interpretation.split('\n').map((line, i) => (
                                <p key={i} className="mb-2">{line}</p>
                            ))}
                        </div>

                        <div className="mt-6 pt-6 border-t border-purple-100 flex gap-3">
                            <button
                                onClick={() => { setInterpretation(''); setDreamText(''); }}
                                className="flex-1 py-3 bg-purple-100 text-purple-700 rounded-xl font-bold text-sm hover:bg-purple-200 transition-colors"
                            >
                                Yeni Rüya
                            </button>
                            {!isPremium && (
                                <button
                                    onClick={onOpenPremium}
                                    className="flex-1 py-3 bg-stone-900 text-white rounded-xl font-bold text-sm hover:bg-stone-800 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Stars size={16} /> Premium
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DreamInterpreter;
