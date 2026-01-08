
import React, { useState } from 'react';
import { authService } from '../services/authService';
import { User } from '../types';
import Logo from './Logo';
import { Mail, User as UserIcon, MapPin, ArrowRight, Loader2, Lock, AlertCircle } from 'lucide-react';

interface AuthProps {
  onLogin: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [city, setCity] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validation
    if (password.length < 6) {
      setError('Şifre en az 6 karakter olmalı.');
      setLoading(false);
      return;
    }

    try {
      let user: User;
      if (isLogin) {
        user = await authService.login(email, password);
      } else {
        user = await authService.register(name, email, city, password);
      }
      onLogin(user);
    } catch (err: any) {
      setError(err.message || 'Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#ecfdf5] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="islamic-pattern fixed inset-0 z-0 opacity-10 pointer-events-none"></div>

      {/* Decorative Circles */}
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-teal-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-amber-500/10 rounded-full blur-3xl"></div>

      <div className="w-full max-w-sm bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-xl border border-emerald-100 relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-white p-4 rounded-2xl shadow-md mb-4">
            <Logo size={64} />
          </div>
          <h1 className="text-2xl font-cinzel font-bold text-teal-900 text-center">
            {isLogin ? 'Hoşgeldiniz' : 'Aramıza Katıl'}
          </h1>
          <p className="text-stone-600 text-lg font-serif italic mt-2 text-center">
            "Kalpler ancak Allah'ı anmakla huzur bulur."
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-sm">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Adınız Soyadınız"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:border-teal-500 focus:bg-white outline-none transition-all"
                  required
                />
                <UserIcon className="absolute left-3 top-3.5 text-stone-400" size={18} />
              </div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Şehir"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:border-teal-500 focus:bg-white outline-none transition-all"
                  required
                />
                <MapPin className="absolute left-3 top-3.5 text-stone-400" size={18} />
              </div>
            </>
          )}

          <div className="relative">
            <input
              type="email"
              placeholder="E-posta Adresiniz"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:border-teal-500 focus:bg-white outline-none transition-all"
              required
              autoComplete="email"
            />
            <Mail className="absolute left-3 top-3.5 text-stone-400" size={18} />
          </div>

          <div className="relative">
            <input
              type="password"
              placeholder="Şifre (min. 6 karakter)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:border-teal-500 focus:bg-white outline-none transition-all"
              required
              minLength={6}
              autoComplete="new-password"
            />
            <Lock className="absolute left-3 top-3.5 text-stone-400" size={18} />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-linear-to-r from-teal-700 to-teal-600 text-white rounded-xl font-bold font-cinzel shadow-lg shadow-teal-700/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-70"
          >
            {loading ? <Loader2 className="animate-spin" /> : (
              <>
                {isLogin ? 'GİRİŞ YAP' : 'KAYIT OL'} <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => { setIsLogin(!isLogin); setError(null); }}
            className="text-stone-500 text-sm hover:text-teal-700 font-medium transition-colors"
          >
            {isLogin ? 'Hesabın yok mu? Kayıt Ol' : 'Zaten hesabın var mı? Giriş Yap'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
