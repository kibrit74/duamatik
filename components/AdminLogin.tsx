import React, { useState } from 'react';
import { ShieldCheck, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import Logo from './Logo';
import { supabase, getProfile } from '../services/supabase';
import { User } from '../types';

interface AdminLoginProps {
    onLogin: (user: User) => void;
    onBack: () => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin, onBack }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // 1. Authenticate with Supabase
            const { data, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (authError) {
                setError('E-posta veya şifre hatalı.');
                setLoading(false);
                return;
            }

            if (!data.user) {
                setError('Giriş yapılamadı.');
                setLoading(false);
                return;
            }

            // 2. Check if user is admin
            const profile = await getProfile(data.user.id);

            if (!profile || profile.role !== 'admin') {
                // Sign out if not admin
                await supabase.auth.signOut();
                setError('Bu hesabın yönetici yetkisi bulunmuyor.');
                setLoading(false);
                return;
            }

            // 3. Success - admin login
            onLogin(profile);
        } catch (err: any) {
            setError(err.message || 'Bir hata oluştu.');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-linear-to-br from-stone-900 via-stone-800 to-stone-900 flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-0 w-72 h-72 bg-red-500 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-orange-500 rounded-full blur-[120px]"></div>
            </div>

            {/* Back Button */}
            <button
                onClick={onBack}
                className="absolute top-6 left-6 text-stone-400 hover:text-white flex items-center gap-2 text-sm transition-colors"
            >
                <ArrowLeft size={16} /> Geri Dön
            </button>

            <div className="relative z-10 w-full max-w-sm">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-linear-to-br from-red-600 to-orange-600 rounded-2xl shadow-lg shadow-red-500/30 mb-4">
                        <ShieldCheck className="text-white" size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-white font-cinzel">Yönetici Girişi</h1>
                    <p className="text-stone-400 text-sm mt-2">Bu alan sadece yetkili yöneticiler içindir.</p>
                </div>

                {/* Login Form */}
                <form onSubmit={handleLogin} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
                    {error && (
                        <div className="bg-red-500/20 border border-red-500/40 rounded-lg p-3 mb-4 flex items-center gap-2 text-red-300 text-sm">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-stone-400 mb-1.5 uppercase tracking-wider">E-Posta</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-stone-500 outline-none focus:border-orange-500/50 focus:bg-white/15 transition-all"
                                placeholder="admin@example.com"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-stone-400 mb-1.5 uppercase tracking-wider">Şifre</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-stone-500 outline-none focus:border-orange-500/50 focus:bg-white/15 transition-all"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full mt-6 py-3.5 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 ${loading
                            ? 'bg-stone-700 cursor-not-allowed'
                            : 'bg-linear-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 shadow-lg shadow-orange-500/20 active:scale-[0.98]'
                            }`}
                    >
                        {loading ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Doğrulanıyor...
                            </>
                        ) : (
                            <>
                                <ShieldCheck size={18} />
                                Yönetici Olarak Giriş Yap
                            </>
                        )}
                    </button>
                </form>

                {/* Security Note */}
                <p className="text-center text-stone-500 text-[10px] mt-6 leading-relaxed">
                    Bu panele erişim kayıt altına alınmaktadır.<br />
                    Yetkisiz erişim girişimleri raporlanır.
                </p>
            </div>
        </div>
    );
};

export default AdminLogin;
