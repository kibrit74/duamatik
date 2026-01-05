import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Loader2, MessageCircle } from 'lucide-react';
import { User, Message } from '../types';
import { getMessages, sendMessage, supabase } from '../services/supabase';

interface ChatModalProps {
    currentUser: User;
    friend: { id: string; name: string };
    onClose: () => void;
}

const ChatModal: React.FC<ChatModalProps> = ({ currentUser, friend, onClose }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadMessages();

        // Subscribe to new messages
        const channel = supabase
            .channel(`chat:${currentUser.id}-${friend.id}`)
            .on(
                'postgres_changes',
                {
                    event: "INSERT",
                    schema: 'public',
                    table: 'messages',
                    filter: `receiver_id=eq.${currentUser.id}`,
                },
                (payload) => {
                    const newMsg = payload.new as any;
                    if (newMsg.sender_id === friend.id) {
                        const formattedMsg: Message = {
                            id: newMsg.id,
                            senderId: newMsg.sender_id,
                            receiverId: newMsg.receiver_id,
                            content: newMsg.content,
                            isRead: newMsg.is_read,
                            createdAt: newMsg.created_at
                        };
                        setMessages((prev) => [...prev, formattedMsg]);
                        scrollToBottom();
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const loadMessages = async () => {
        setLoading(true);
        const data = await getMessages(currentUser.id, friend.id);
        setMessages(data);
        setLoading(false);
        scrollToBottom();
    };

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!newMessage.trim() || sending) return;

        setSending(true);
        const content = newMessage.trim();
        setNewMessage(''); // Optimistic clear

        // Optimistic UI update
        const tempMsg: Message = {
            id: Math.random().toString(),
            senderId: currentUser.id,
            receiverId: friend.id,
            content: content,
            isRead: false,
            createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, tempMsg]);
        scrollToBottom();

        await sendMessage(currentUser.id, friend.id, content);
        setSending(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-2xl w-full max-w-md h-[65vh] flex flex-col shadow-2xl overflow-hidden mb-24">
                {/* Header */}
                <div className="bg-teal-700 p-4 flex justify-between items-center text-white">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-bold">
                            {friend.name.substring(0, 1)}
                        </div>
                        <div>
                            <h3 className="font-bold">{friend.name}</h3>
                            <div className="flex items-center gap-1 text-xs text-teal-100">
                                <span className="w-2 h-2 bg-green-400 rounded-full"></span> Çevrimiçi
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 bg-stone-50 space-y-3">
                    {loading ? (
                        <div className="flex justify-center p-4">
                            <Loader2 className="animate-spin text-teal-600" />
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="text-center text-stone-400 mt-20">
                            <MessageCircle size={48} className="mx-auto mb-2 opacity-50" />
                            <p>Henüz mesaj yok. İlk selamı sen ver!</p>
                        </div>
                    ) : (
                        messages.map((msg, idx) => {
                            const isMe = msg.senderId === currentUser.id;
                            return (
                                <div key={msg.id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                    <div
                                        className={`max-w-[80%] p-3 rounded-2xl text-sm ${isMe
                                            ? 'bg-teal-600 text-white rounded-tr-none'
                                            : 'bg-white border border-stone-200 text-stone-800 rounded-tl-none'
                                            }`}
                                    >
                                        <p>{msg.content}</p>
                                        <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-teal-200' : 'text-stone-400'}`}>
                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={handleSend} className="p-4 bg-white border-t border-stone-100">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Bir mesaj yaz..."
                            className="flex-1 p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-teal-500 transition-colors"
                        />
                        <button
                            type="submit"
                            disabled={!newMessage.trim() || sending}
                            className="p-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 disabled:opacity-50 transition-colors"
                        >
                            {sending ? <Loader2 size={24} className="animate-spin" /> : <Send size={24} />}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ChatModal;
