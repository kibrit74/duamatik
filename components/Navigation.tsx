import React from 'react';
import { Home, Plus, Search, Users, User as UserIcon, Shield } from 'lucide-react';
import { ViewState, User } from '../types';

interface NavigationProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
  user: User | null;
}

const Navigation: React.FC<NavigationProps> = ({ currentView, setView, user }) => {
  const navItemClass = (view: ViewState) =>
    `flex flex-col items-center justify-center w-full h-full space-y-1 transition-all duration-200 active:scale-90 ${currentView === view ? 'text-teal-700' : 'text-stone-400 hover:text-stone-600'
    }`;

  return (
    <div className="fixed bottom-0 left-0 w-full bg-stone-50/95 backdrop-blur-xl border-t border-amber-200/50 z-50 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)] pb-safe">
      <div className="flex justify-between items-center h-[60px] px-4 max-w-md mx-auto">
        <button onClick={() => setView('HOME')} className={navItemClass('HOME')}>
          <Home size={22} strokeWidth={currentView === 'HOME' ? 2.5 : 1.5} />
          <span className="text-[9px] font-serif tracking-wide font-bold">Kütüphane</span>
        </button>

        <button onClick={() => setView('SOCIAL')} className={navItemClass('SOCIAL')}>
          <Users size={22} strokeWidth={currentView === 'SOCIAL' ? 2.5 : 1.5} />
          <span className="text-[9px] font-serif tracking-wide font-bold">Topluluk</span>
        </button>

        {/* Center Floating Add Button - Raised Effect */}
        <div className="relative -top-6">
          <button
            onClick={() => setView('ADD')}
            className="w-16 h-16 rounded-full bg-gradient-to-tr from-teal-700 to-emerald-500 text-amber-50 shadow-xl shadow-teal-700/40 flex items-center justify-center transform transition-transform active:scale-90 border-[6px] border-[#ecfdf5]"
          >
            <Plus size={32} />
          </button>
        </div>

        <button onClick={() => setView('SEARCH')} className={navItemClass('SEARCH')}>
          <Search size={22} strokeWidth={currentView === 'SEARCH' ? 2.5 : 1.5} />
          <span className="text-[9px] font-serif tracking-wide font-bold">Keşfet</span>
        </button>

        <button onClick={() => setView('SETTINGS')} className={navItemClass('SETTINGS')}>
          <UserIcon size={22} strokeWidth={currentView === 'SETTINGS' ? 2.5 : 1.5} />
          <span className="text-[9px] font-serif tracking-wide font-bold">Profilim</span>
        </button>

        {user?.role === 'admin' && (
          <button onClick={() => setView('ADMIN')} className={navItemClass('ADMIN')}>
            <Shield size={22} strokeWidth={currentView === 'ADMIN' ? 2.5 : 1.5} className="text-amber-600" />
            <span className="text-[9px] font-serif tracking-wide text-amber-600 font-bold">Yönetici</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default Navigation;
