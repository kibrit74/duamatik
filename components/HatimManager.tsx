import React, { useState, useEffect } from 'react';
import { Share2, CheckCircle2, Circle, MessageCircle, X, UserPlus, RefreshCw, Trash2, Users } from 'lucide-react';
import { dbService } from '../services/db';
import { HatimPartStatus, FriendProfile } from '../types';
import { getFriends, sendNotification } from '../services/supabase';
import { authService } from '../services/authService';
import { BookOpen } from 'lucide-react';

interface HatimManagerProps {
    onClose: () => void;
}

const HatimManager: React.FC<HatimManagerProps> = ({ onClose }) => {
    const [parts, setParts] = useState<HatimPartStatus[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPart, setSelectedPart] = useState<number | null>(null);
    const [assigneeName, setAssigneeName] = useState('');
    const [isAssigning, setIsAssigning] = useState(false);

    // Friend Selection
    const [friends, setFriends] = useState<FriendProfile[]>([]);
    const [showFriendPicker, setShowFriendPicker] = useState(false);

    useEffect(() => {
        loadStatus();
        loadFriends();
    }, []);

    const loadFriends = async () => {
        const user = authService.getCurrentUser();
        if (user) {
            try {
                const data = await getFriends(user.id);
                setFriends(data);
            } catch (e) {
                console.error("Failed to load friends", e);
            }
        }
    };

    const loadStatus = async () => {
        setLoading(true);
        try {
            const data = await dbService.getHatimStatus();
            setParts(data.sort((a, b) => a.partNo - b.partNo));
        } catch (e) {
            console.error("Failed to load Hatim status", e);
        } finally {
            setLoading(false);
        }
    };

    const handlePartClick = (part: HatimPartStatus) => {
        setSelectedPart(part.partNo);
        setAssigneeName(part.assignedTo || '');
        setIsAssigning(true);
        setShowFriendPicker(false);
    };

    const handleAssign = async (friendId?: string, friendName?: string) => {
        if (!selectedPart) return;

        const nameToUse = friendName || assigneeName;

        // Check if name is provided
        if (!nameToUse.trim()) return;

        const updatedPart: HatimPartStatus = {
            partNo: selectedPart,
            status: 'assigned',
            assignedTo: nameToUse,
            assignedDate: Date.now()
        };

        await dbService.saveHatimPart(updatedPart);
        await loadStatus();

        // Send notification if selected from friend list
        if (friendId) {
            const currentUser = authService.getCurrentUser();
            if (currentUser) {
                try {
                    await sendNotification(
                        friendId,
                        'hatim_invite',
                        `${currentUser.name} seni Hatim'e davet etti: ${selectedPart}. Cüz`,
                        currentUser.id,
                        { partNo: selectedPart }
                    );
                    alert(`${friendName} kişisine davet gönderildi.`);
                } catch (e) {
                    console.error("Failed to send invite", e);
                    // Fallback
                    alert("Bildirim gönderilemedi, lütfen linki paylaşın.");
                    shareLink(selectedPart, nameToUse);
                }
            }
        } else {
            // Fallback or manual entry -> share link
            shareLink(selectedPart, nameToUse);
        }

        setIsAssigning(false);
        setSelectedPart(null);
        setAssigneeName('');
        setShowFriendPicker(false);
    };

    const handleMarkComplete = async (partNo: number) => {
        const part = parts.find(p => p.partNo === partNo);
        if (!part) return;

        if (window.confirm(`${part.assignedTo || 'Kullanıcı'} bu cüzü bitirdi mi?`)) {
            await dbService.saveHatimPart({ ...part, status: 'completed' });
            await loadStatus();
            setIsAssigning(false);
        }
    };

    const handleClearPart = async (partNo: number) => {
        if (window.confirm("Bu cüz atamasını kaldırmak istediğinize emin misiniz?")) {
            await dbService.saveHatimPart({ partNo, status: 'empty' });
            await loadStatus();
            setIsAssigning(false);
        }
    };

    const handleResetAll = async () => {
        if (window.confirm("DİKKAT: Tüm hatim listesini sıfırlamak istediğinize emin misiniz? Bu işlem geri alınamaz.")) {
            await dbService.resetHatim();
            await loadStatus();
        }
    };

    const shareLink = (partNo: number, name: string) => {
        const baseUrl = window.location.origin + window.location.pathname;
        const params = new URLSearchParams();
        params.set('action', 'import_hatim');
        params.set('part', partNo.toString());

        const link = `${baseUrl}?${params.toString()}`;
        const message = `Selamun Aleyküm ${name || 'kardeşim'}. Hatim duamız için ${partNo}. Cüz'ü sana ayırdım.\n\nOkumak ve bitirince bana bildirmek için şu linke tıkla:\n${link}`;

        if (navigator.share) {
            navigator.share({ title: 'Hatim Paylaşımı', text: message }).catch(() => { });
        } else {
            const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, '_blank');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-teal-500 text-white border-teal-600';
            case 'assigned': return 'bg-amber-100 text-amber-800 border-amber-300';
            default: return 'bg-white text-stone-400 border-stone-200 hover:border-teal-300';
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#ecfdf5] relative pb-24">
            {/* Header */}
            <div className="bg-white/90 backdrop-blur-md px-6 py-4 border-b border-emerald-100 relative z-10 shadow-sm flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold font-cinzel text-teal-900">Hatim Dağıt</h2>
                    <p className="text-stone-500 text-[10px] font-serif mt-0.5">
                        Cüzleri dağıtın ve durumlarını takip edin.
                    </p>
                </div>
                <button onClick={handleResetAll} className="p-2 text-stone-400 hover:text-red-500 transition-colors" title="Listeyi Sıfırla">
                    <RefreshCw size={18} />
                </button>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto p-4 no-scrollbar">
                {loading ? (
                    <div className="flex items-center justify-center h-40 text-stone-400">Yükleniyor...</div>
                ) : (
                    <div className="grid grid-cols-4 gap-3">
                        {parts.map((part) => (
                            <button
                                key={part.partNo}
                                onClick={() => handlePartClick(part)}
                                className={`aspect-square rounded-xl border-2 flex flex-col items-center justify-center relative transition-all active:scale-95 ${getStatusColor(part.status)}`}
                            >
                                <span className="text-lg font-bold font-mono">{part.partNo}</span>
                                <span className="text-[8px] font-bold uppercase tracking-wide truncate w-full px-1 text-center">
                                    {part.status === 'completed' ? 'Bitti' : part.status === 'assigned' ? (part.assignedTo || 'Atandı') : 'Boş'}
                                </span>
                                {part.status === 'completed' && (
                                    <div className="absolute -top-2 -right-2 bg-teal-600 text-white rounded-full p-0.5 border-2 border-white">
                                        <CheckCircle2 size={12} />
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Assignment Modal */}
            {isAssigning && selectedPart && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
                        <div className="bg-stone-50 p-4 border-b border-stone-100 flex justify-between items-center">
                            <h3 className="font-bold text-stone-800 flex items-center gap-2">
                                <BookOpen size={18} className="text-teal-600" /> {selectedPart}. Cüz Yönetimi
                            </h3>
                            <button onClick={() => setIsAssigning(false)}><X size={20} className="text-stone-400" /></button>
                        </div>

                        <div className="p-5 space-y-4">
                            {parts.find(p => p.partNo === selectedPart)?.status === 'empty' ? (
                                <>
                                    <div>
                                        <label className="block text-xs font-bold text-stone-500 uppercase mb-2">Kime Verilecek?</label>

                                        {!showFriendPicker ? (
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={assigneeName}
                                                    onChange={(e) => setAssigneeName(e.target.value)}
                                                    placeholder="İsim giriniz..."
                                                    className="flex-1 p-3 border border-stone-200 rounded-xl outline-none focus:border-teal-500 font-serif bg-white text-stone-900 placeholder:text-stone-400"
                                                    autoFocus
                                                />
                                                <button
                                                    onClick={() => setShowFriendPicker(true)}
                                                    className="p-3 bg-teal-100 text-teal-700 rounded-xl hover:bg-teal-200 transition-colors"
                                                    title="Arkadaşlardan Seç"
                                                >
                                                    <Users size={20} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="bg-white border border-stone-200 rounded-xl max-h-48 overflow-y-auto">
                                                <div className="p-2 border-b border-stone-100 flex justify-between items-center bg-stone-50">
                                                    <span className="text-xs font-bold text-stone-500">Arkadaş Seç</span>
                                                    <button onClick={() => setShowFriendPicker(false)} className="text-stone-400 hover:text-red-500"><X size={14} /></button>
                                                </div>
                                                {friends.length === 0 ? (
                                                    <div className="p-4 text-center text-xs text-stone-400">Arkadaş bulunamadı.</div>
                                                ) : (
                                                    friends.map(f => (
                                                        <button
                                                            key={f.id}
                                                            onClick={() => handleAssign(f.id, f.name)}
                                                            className="w-full text-left p-3 hover:bg-teal-50 flex items-center gap-2 transition-colors border-b border-stone-50 last:border-0"
                                                        >
                                                            <div className="w-6 h-6 bg-stone-100 rounded-full flex items-center justify-center text-[10px] font-bold text-stone-500">
                                                                {f.name.substring(0, 1)}
                                                            </div>
                                                            <span className="text-sm text-stone-700">{f.name}</span>
                                                        </button>
                                                    ))
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {!showFriendPicker && (
                                        <button
                                            onClick={() => handleAssign()}
                                            disabled={!assigneeName.trim()}
                                            className="w-full py-3 bg-teal-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-teal-700 disabled:opacity-50"
                                        >
                                            <Share2 size={18} /> Kaydet ve Link Paylaş
                                        </button>
                                    )}
                                </>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    <div className="bg-amber-50 p-3 rounded-lg border border-amber-100 text-center">
                                        <span className="text-xs text-amber-600 font-bold uppercase">Şu anki Durum</span>
                                        <p className="font-bold text-stone-800 text-lg">
                                            {parts.find(p => p.partNo === selectedPart)?.assignedTo}
                                        </p>
                                        <p className="text-xs text-stone-500">
                                            {parts.find(p => p.partNo === selectedPart)?.status === 'completed' ? 'Okumayı Tamamladı' : 'Okuması Bekleniyor'}
                                        </p>
                                    </div>

                                    {parts.find(p => p.partNo === selectedPart)?.status !== 'completed' && (
                                        <button
                                            onClick={() => handleMarkComplete(selectedPart)}
                                            className="w-full py-3 bg-teal-600 text-white rounded-xl font-bold flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle2 size={18} /> Okundu Olarak İşaretle
                                        </button>
                                    )}

                                    <button
                                        onClick={() => shareLink(selectedPart, parts.find(p => p.partNo === selectedPart)?.assignedTo || '')}
                                        className="w-full py-3 bg-white border border-stone-200 text-stone-600 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-stone-50"
                                    >
                                        <Share2 size={18} /> Linki Tekrar Paylaş
                                    </button>

                                    <button
                                        onClick={() => handleClearPart(selectedPart)}
                                        className="w-full py-3 bg-white border border-red-100 text-red-500 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-50"
                                    >
                                        <Trash2 size={18} /> Atamayı Kaldır
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HatimManager;