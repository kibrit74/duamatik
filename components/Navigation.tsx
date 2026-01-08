import React from 'react';
import { Home, Plus, Users, User as UserIcon, BookOpen } from 'lucide-react';
import { ViewState, User } from '../types';

interface NavigationProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
  user: User | null;
}

const Navigation: React.FC<NavigationProps> = ({ currentView, setView, user }) => {
  const navItemClass = (view: ViewState) => {
    const isActive = currentView === view;
    return `flex flex-col items-center justify-center flex-1 h-full space-y-0.5 transition-all duration-200 active:scale-90 ${isActive ? 'text-teal-700' : 'text-stone-400 hover:text-stone-600'}`;
  };

  return (
    <div className="fixed bottom-0 left-0 w-full bg-stone-50/95 backdrop-blur-xl border-t border-amber-200/50 z-50 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)] pb-safe">
      <div className="flex justify-between items-center h-[60px] px-2 max-w-md mx-auto">
        <button onClick={() => setView('HOME')} className={navItemClass('HOME')}>
          <Home size={20} strokeWidth={currentView === 'HOME' ? 2.5 : 1.5} />
          <span className="text-[8px] font-serif tracking-wide font-bold">Kütüphane</span>
        </button>

        <button onClick={() => setView('SOCIAL')} className={navItemClass('SOCIAL')}>
          <Users size={20} strokeWidth={currentView === 'SOCIAL' ? 2.5 : 1.5} />
          <span className="text-[8px] font-serif tracking-wide font-bold">Topluluk</span>
        </button>

        {/* Center Floating Add Button */}
        <div className="relative -top-5 mx-2">
          <button
            onClick={() => setView('ADD')}
            className="w-14 h-14 rounded-full bg-linear-to-tr from-teal-700 to-emerald-500 text-amber-50 shadow-xl shadow-teal-700/40 flex items-center justify-center transform transition-transform active:scale-90 border-[5px] border-[#ecfdf5]"
          >
            <Plus size={28} />
          </button>
        </div>

        <button onClick={() => setView('ARTICLES')} className={navItemClass('ARTICLES')}>
          <BookOpen size={20} strokeWidth={currentView === 'ARTICLES' ? 2.5 : 1.5} />
          <span className="text-[8px] font-serif tracking-wide font-bold">Makaleler</span>
        </button>

        <button onClick={() => setView('SETTINGS')} className={navItemClass('SETTINGS')}>
          <UserIcon size={20} strokeWidth={currentView === 'SETTINGS' ? 2.5 : 1.5} />
          <span className="text-[8px] font-serif tracking-wide font-bold">Profilim</span>
        </button>
      </div>
    </div>
  );
};

export default Navigation;
