
import React, { useState, useEffect, useMemo, useRef } from 'react';
import Navigation from './components/Navigation';
import Counter from './components/Counter';
import Logo from './components/Logo';
const AddPrayer = React.lazy(() => import('./components/AddPrayer'));
const SearchPrayer = React.lazy(() => import('./components/SearchPrayer'));
const Profile = React.lazy(() => import('./components/Profile'));
const Settings = React.lazy(() => import('./components/Settings'));
const ReminderModal = React.lazy(() => import('./components/ReminderModal'));
const ShareModal = React.lazy(() => import('./components/ShareModal'));
const HistoryModal = React.lazy(() => import('./components/HistoryModal'));
const SocialHub = React.lazy(() => import('./components/SocialHub'));
const NotificationCenter = React.lazy(() => import('./components/NotificationCenter'));
const PrayerTimes = React.lazy(() => import('./components/PrayerTimes'));
const Auth = React.lazy(() => import('./components/Auth'));
const PrayerCoach = React.lazy(() => import('./components/PrayerCoach'));
const DreamInterpreter = React.lazy(() => import('./components/DreamInterpreter'));
const PremiumModal = React.lazy(() => import('./components/PremiumModal'));
import LoadingScreen from './components/LoadingScreen';
import { dbService } from './services/db';
import { getQuotes, getActiveBanners, getAppConfig, Banner, AppConfig } from './services/supabase';
import { runSeed } from './services/seedData';
import { authService } from './services/authService';

// Expose runSeed to window for console access
if (typeof window !== 'undefined') {
  (window as any).runSeed = runSeed;
}
import { Loader2 } from 'lucide-react';
import { defaultPrayers } from './data/defaults';
import { quotes } from './data/quotes';
import { Prayer, ViewState, Quote, User } from './types';
import { Share2, Trash2, BookOpen, Search, Tag, X, Plus, Bell, CalendarClock, ChevronDown, LogOut, History, Sparkles, ChevronRight, Moon } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

// ... (TasbihIcon remains same - abbreviated for brevity)
const TasbihIcon: React.FC<{ size?: number; className?: string }> = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className={className}>
    <g fill="currentColor">
      <circle cx="100" cy="50" r="7" /><circle cx="120" cy="55" r="7" /><circle cx="135" cy="65" r="7" /><circle cx="145" cy="80" r="7" /><circle cx="150" cy="100" r="7" /><circle cx="145" cy="120" r="7" /><circle cx="135" cy="135" r="7" /><circle cx="120" cy="145" r="7" /><circle cx="100" cy="150" r="7" /><circle cx="80" cy="145" r="7" /><circle cx="65" cy="135" r="7" /><circle cx="55" cy="120" r="7" /><circle cx="50" cy="100" r="7" /><circle cx="55" cy="80" r="7" /><circle cx="65" cy="65" r="7" /><circle cx="80" cy="55" r="7" /><rect x="97" y="150" width="6" height="15" rx="1" /><circle cx="100" cy="167" r="4" /><path d="M 95 172 L 90 190 L 95 188 L 100 190 L 105 188 L 110 190 L 105 172 Z" />
    </g>
  </svg>
);

// MOBILE APP - Clean mobile-only code, no admin logic
const MobileApp: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isDataLoading, setIsDataLoading] = useState(false); // Data loading state
  const [view, setView] = useState<ViewState>('HOME');
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [selectedPrayer, setSelectedPrayer] = useState<Prayer | null>(null);
  const [dailyQuote, setDailyQuote] = useState<Quote>(quotes[0]);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeBanners, setActiveBanners] = useState<Banner[]>([]);
  const [appConfig, setAppConfig] = useState<AppConfig>({});
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);

  // Settings State
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('notificationsEnabled');
    if (saved !== null) return saved === 'true';
    return 'Notification' in window && Notification.permission === 'granted';
  });

  const [draftPrayer, setDraftPrayer] = useState<Partial<Prayer> | null>(null);
  const [activeReminderPrayer, setActiveReminderPrayer] = useState<Prayer | null>(null);
  const [activeSharePrayer, setActiveSharePrayer] = useState<Prayer | null>(null);
  const [activeHistoryPrayer, setActiveHistoryPrayer] = useState<Prayer | null>(null);
  const [libraryQuery, setLibraryQuery] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(10);

  const totalDhikr = prayers.reduce((acc, curr) => acc + curr.currentCount, 0);
  const reminderInterval = useRef<number | null>(null);
  const prayersRef = useRef<Prayer[]>([]);
  const notificationsEnabledRef = useRef(notificationsEnabled);

  // AUTH CHECK ON LOAD with Supabase listener
  useEffect(() => {
    const initAuth = async () => {
      // Initialize auth service (checks for existing session)
      await authService.init();

      // Get initial user after init
      const currentUser = authService.getCurrentUser();
      setUser(currentUser);

      // If on admin route and user is admin, set view immediately
      if (window.location.pathname === '/admin' && currentUser?.role === 'admin') {
        setView('ADMIN');
      }

      setAuthLoading(false);
    };

    initAuth();

    // Listen for auth state changes
    const unsubscribe = authService.onAuthStateChange((newUser) => {
      setUser(newUser);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    prayersRef.current = prayers;
  }, [prayers]);

  useEffect(() => {
    notificationsEnabledRef.current = notificationsEnabled;
    localStorage.setItem('notificationsEnabled', String(notificationsEnabled));
  }, [notificationsEnabled]);

  useEffect(() => {
    setVisibleCount(10);
  }, [libraryQuery, activeTag]);



  useEffect(() => {
    if (user) {
      // Set userId for Supabase sync
      dbService.setUserId(user.id);
      initializeData();
      loadDailyQuote();
      checkDeepLink();
      loadBannersAndConfig();
    } else {
      dbService.setUserId(null);
    }
  }, [user]);

  const loadBannersAndConfig = async () => {
    try {
      const [banners, config] = await Promise.all([
        getActiveBanners(user?.isPremium),
        getAppConfig()
      ]);
      setActiveBanners(banners);
      setAppConfig(config);
      setIsMaintenanceMode(config.maintenance_mode?.enabled || false);
    } catch (e) {
      console.warn('Failed to load banners/config:', e);
    }
  };

  const loadDailyQuote = async () => {
    try {
      // Try Supabase quotes first
      const supabaseQuotes = await getQuotes();
      const sourceQuotes = supabaseQuotes.length > 0 ? supabaseQuotes : quotes;
      const randomIndex = Math.floor(Math.random() * sourceQuotes.length);
      setDailyQuote(sourceQuotes[randomIndex]);
    } catch (e) {
      // Fallback to local
      const randomIndex = Math.floor(Math.random() * quotes.length);
      setDailyQuote(quotes[randomIndex]);
    }
  };

  // Reminder Logic
  useEffect(() => {
    reminderInterval.current = window.setInterval(() => {
      checkReminders();
    }, 20000);

    return () => {
      if (reminderInterval.current) clearInterval(reminderInterval.current);
    };
  }, []);

  const checkDeepLink = async () => {
    const params = new URLSearchParams(window.location.search);
    const action = params.get('action');
    const part = params.get('part');

    if (action === 'import_hatim' && part) {
      const partNo = parseInt(part);
      if (!isNaN(partNo) && partNo >= 1 && partNo <= 30) {
        // Confirm with user
        if (window.confirm(`Hatim Listesi: ${partNo}. Cüz'ü listenize eklemek ister misiniz?`)) {

          const hatimPrayer: Prayer = {
            id: uuidv4(),
            title: `${partNo}. Cüz Hatim`,
            turkish: `Kur'an-ı Kerim ${partNo}. Cüz okuması.`,
            meaning: "Allah kabul etsin.",
            targetCount: 1, // Reading 1 Juz
            currentCount: 0,
            tags: ['Hatim', 'Kuran'],
            lastUpdated: Date.now(),
            isHatimPart: true,
            hatimPartNo: partNo
          };

          await dbService.savePrayer(hatimPrayer);
          await loadPrayers();
          alert(`${partNo}. Cüz listenize eklendi. Okumayı bitirince 'Bildir' butonuna basmayı unutmayın.`);

          // Clean URL
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    }
  };

  const checkReminders = () => {
    if (!notificationsEnabledRef.current) return;
    if (!("Notification" in window) || Notification.permission !== "granted") return;

    const currentPrayers = prayersRef.current;
    const now = new Date();
    const currentDay = now.getDay();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const currentTime = `${hours}:${minutes}`;
    const currentDate = now.toISOString().split('T')[0];
    const prayersToUpdate: Prayer[] = [];

    currentPrayers.forEach(prayer => {
      if (prayer.reminder && prayer.reminder.active) {
        let shouldNotify = false;
        let disableAfter = false;

        if (prayer.reminder.time === currentTime) {
          if (prayer.reminder.type === 'weekly' && prayer.reminder.day === currentDay) {
            shouldNotify = true;
          } else if (prayer.reminder.type === 'onetime' && prayer.reminder.date === currentDate) {
            shouldNotify = true;
            disableAfter = true;
          }
        }

        if (shouldNotify) {
          try {
            new Notification("Tesbihat Vakti", {
              body: `${prayer.title} okuma zamanı geldi.`,
              icon: '/icon.png',
              tag: `prayer-${prayer.id}-${currentTime}`,
              vibrate: [200, 100, 200],
              requireInteraction: true
            } as any);

            if (disableAfter) {
              prayersToUpdate.push({
                ...prayer,
                reminder: { ...prayer.reminder, active: false }
              });
            }
          } catch (e) {
            console.error("Notification failed", e);
          }
        }
      }
    });

    if (prayersToUpdate.length > 0) {
      prayersToUpdate.forEach(p => handleUpdatePrayer(p));
    }
  };

  const initializeData = async () => {
    setIsDataLoading(true);
    try {
      // dbService will sync from Supabase if available
      let loadedPrayers = await dbService.getAllPrayers();

      if (loadedPrayers.length === 0) {
        // First time - seed with defaults
        await dbService.seedPrayers(defaultPrayers);
        loadedPrayers = await dbService.getAllPrayers();
      } else {
        // Run cleanup for existing users to fix duplicate issues
        const removed = await dbService.runDeduplication();
        if (removed > 0) {
          // Reload if we removed items
          loadedPrayers = await dbService.getAllPrayers();
        }
      }

      setPrayers(loadedPrayers.sort((a, b) => b.lastUpdated - a.lastUpdated));
    } catch (error) {
      console.error("Failed to load prayers", error);
    } finally {
      setIsDataLoading(false);
    }
  };

  const loadPrayers = async () => {
    const loadedPrayers = await dbService.getAllPrayers();
    setPrayers(loadedPrayers.sort((a, b) => b.lastUpdated - a.lastUpdated));
  };

  const handleSavePrayer = async (prayer: Prayer) => {
    await dbService.savePrayer(prayer);
    await loadPrayers();
    setDraftPrayer(null);
    setView('HOME');
  };

  const handleUpdatePrayer = async (updatedPrayer: Prayer) => {
    await dbService.savePrayer(updatedPrayer);
    setPrayers(prev => prev.map(p => p.id === updatedPrayer.id ? updatedPrayer : p));
    if (selectedPrayer && selectedPrayer.id === updatedPrayer.id) {
      setSelectedPrayer(updatedPrayer);
    }
  };

  const handleDeletePrayer = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm("Bu duayı kütüphaneden silmek istediğinize emin misiniz?")) {
      try {
        const previousPrayers = [...prayers];
        setPrayers(prev => prev.filter(p => p.id !== id));
        try {
          await dbService.deletePrayer(id);
        } catch (dbError) {
          console.error("DB Delete failed", dbError);
          setPrayers(previousPrayers);
          alert("Silme işlemi veritabanında başarısız oldu.");
        }
      } catch (error) {
        console.error("Delete failed", error);
      }
    }
  };

  const handleShareClick = (e: React.MouseEvent, prayer: Prayer) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveSharePrayer(prayer);
  };

  const handleReminderClick = (e: React.MouseEvent, prayer: Prayer) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveReminderPrayer(prayer);
  };

  const handleHistoryClick = (e: React.MouseEvent, prayer: Prayer) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveHistoryPrayer(prayer);
  };

  const openCounter = (prayer: Prayer) => {
    setSelectedPrayer(prayer);
    setView('COUNTER');
  };

  const handleAddNewPrayer = () => {
    setDraftPrayer(null);
    setView('ADD');
  };

  const handleDraftFromSearch = (data: Partial<Prayer>) => {
    setDraftPrayer(data);
    setView('ADD');
  };

  const handleNavigationChange = (newView: ViewState) => {
    if (newView === 'ADD') setDraftPrayer(null);
    setView(newView);
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    setView('HOME');
  };

  const handlePurchasePremium = async () => {
    await authService.upgradeToPremium();
    setUser(prev => prev ? { ...prev, isPremium: true } : null);
    setShowPremiumModal(false);
    alert("Tebrikler! Premium üyeliğiniz aktif edildi.");
  };

  const uniqueTags = useMemo(() => {
    const tags = new Set<string>();
    prayers.forEach(p => p.tags && p.tags.forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  }, [prayers]);

  const filteredPrayers = prayers.filter(p => {
    const query = libraryQuery.toLowerCase();
    const matchesSearch = p.title.toLowerCase().includes(query) ||
      p.tags?.some(t => t.toLowerCase().includes(query));
    const matchesTag = activeTag ? p.tags?.includes(activeTag) : true;
    return matchesSearch && matchesTag;
  });

  const displayedPrayers = filteredPrayers.slice(0, visibleCount);
  const hasMore = filteredPrayers.length > visibleCount;

  // --- RENDERING ---

  // Loading state while checking auth or fetching initial data
  if (authLoading || isDataLoading) {
    return <LoadingScreen message={authLoading ? "Başlatılıyor..." : "Dualar Yükleniyor..."} />;
  }

  if (!user) {
    return <Auth onLogin={(u) => setUser(u)} />;
  }

  // Maintenance Mode Screen
  if (isMaintenanceMode) {
    return (
      <div className="min-h-screen bg-stone-900 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-20 h-20 bg-amber-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">Bakım Modu</h1>
          <p className="text-stone-400 max-w-sm mx-auto">
            {appConfig.maintenance_mode?.message || 'Uygulama bakımda, lütfen daha sonra tekrar deneyin.'}
          </p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    if (view === 'COUNTER' && selectedPrayer) {
      return (
        <Counter
          prayer={selectedPrayer}
          onUpdate={handleUpdatePrayer}
          onBack={() => setView('HOME')}
          user={user}
          onOpenPremium={() => setShowPremiumModal(true)}
        />
      );
    }
    if (view === 'ADD') {
      return <AddPrayer onSave={handleSavePrayer} onCancel={() => setView('HOME')} initialData={draftPrayer} onOpenPremium={() => setShowPremiumModal(true)} />;
    }
    if (view === 'SEARCH') {
      return (
        <SearchPrayer
          onDraft={handleDraftFromSearch}
          onOpenCoach={() => setView('COACH')}
          onOpenDream={() => setView('DREAM')}
        />
      );
    }
    if (view === 'COACH') {
      return (
        <PrayerCoach
          onClose={() => setView('HOME')}
          isPremium={!!user.isPremium}
          onOpenPremium={() => setShowPremiumModal(true)}
        />
      );
    }
    if (view === 'DREAM') {
      return (
        <DreamInterpreter
          onClose={() => setView('SEARCH')}
          isPremium={!!user.isPremium}
          onOpenPremium={() => setShowPremiumModal(true)}
        />
      );
    }
    if (view === 'PROFILE') {
      return (
        <Profile
          prayers={prayers}
          onOpenPrayer={openCounter}
          quote={dailyQuote}
          user={user}
          onLogout={handleLogout}
        />
      );
    }
    if (view === 'SETTINGS') {
      return <Settings notificationsEnabled={notificationsEnabled} setNotificationsEnabled={setNotificationsEnabled} user={user} onLogout={handleLogout} prayers={prayers} onOpenPrayer={(prayer) => { setSelectedPrayer(prayer); setView('COUNTER'); }} />;
    }
    if (view === 'SOCIAL') {
      return <SocialHub onClose={() => setView('HOME')} user={user} />;
    }

    // HOME VIEW

    return (
      <div className="h-full pb-32 relative overflow-y-auto no-scrollbar">
        <NotificationCenter
          isOpen={showNotifications}
          onClose={() => setShowNotifications(false)}
          user={user}
        />
        <div className="islamic-pattern absolute inset-0 z-0 pointer-events-none opacity-10 fixed"></div>

        <div className="bg-white/60 backdrop-blur-md pt-8 pb-8 px-4 rounded-b-[2rem] shadow-sm border-b border-emerald-100/50 z-10 flex flex-col items-center text-center relative">

          <button
            onClick={() => setShowNotifications(true)}
            className="absolute top-6 right-6 p-2 bg-white/80 rounded-full border border-stone-200 text-stone-500 hover:text-orange-500 hover:border-orange-200 transition-colors shadow-sm"
          >
            <Bell size={20} />
            {/* Optional: Add red dot if unread */}
          </button>

          <div className="mb-2 p-1 border-2 border-emerald-100 rounded-xl bg-white/80">
            <Logo size={80} />
          </div>
          <h1 className="text-xl font-bold font-cinzel text-teal-900 tracking-wider">HOŞGELDİNİZ</h1>
          <p className="text-sm font-bold text-teal-700 mt-1 flex items-center gap-1">
            {user.name}
            {user.isPremium && <span className="text-[9px] bg-amber-400 text-white px-1.5 rounded-sm font-bold">PRO</span>}
          </p>
          <p className="text-stone-600 font-serif italic text-xl font-medium mt-3 max-w-[340px] leading-relaxed drop-shadow-sm">
            "{dailyQuote.text}"
          </p>
          <p className="text-xs text-stone-400 mt-1">({dailyQuote.source})</p>

          <PrayerTimes />
        </div>

        {/* Dynamic Banners */}
        {activeBanners.length > 0 && (
          <div className="px-6 mt-4 z-20 relative">
            {activeBanners.slice(0, 1).map(banner => (
              <div
                key={banner.id}
                className="p-4 rounded-2xl shadow-lg"
                style={{ backgroundColor: banner.bg_color || '#10b981', color: banner.text_color || '#fff' }}
              >
                <h4 className="font-bold text-lg">{banner.title}</h4>
                {banner.message && <p className="text-sm opacity-90 mt-1">{banner.message}</p>}
              </div>
            ))}
          </div>
        )}

        <div className={`grid grid-cols-2 gap-4 px-6 z-20 relative ${activeBanners.length > 0 ? 'mt-4' : '-mt-5'}`}>
          <div className="bg-white/90 p-4 rounded-xl shadow-[0_4px_15px_-5px_rgba(0,0,0,0.05)] border border-emerald-100 flex flex-col items-center justify-center backdrop-blur-sm">
            <div className="mb-1 text-teal-600 bg-teal-50 p-1.5 rounded-full">
              <BookOpen size={16} />
            </div>
            <span className="text-2xl font-bold text-teal-900 font-cinzel">{prayers.length}</span>
            <span className="text-[9px] text-stone-400 font-bold uppercase tracking-widest mt-0.5">KAYITLI DUA</span>
          </div>
          <div className="bg-white/90 p-4 rounded-xl shadow-[0_4px_15px_-5px_rgba(0,0,0,0.05)] border border-emerald-100 flex flex-col items-center justify-center backdrop-blur-sm">
            <div className="mb-1 text-amber-600 bg-amber-50 p-1.5 rounded-full">
              <TasbihIcon size={24} />
            </div>
            <span className="text-2xl font-bold text-teal-900 font-cinzel">{totalDhikr}</span>
            <span className="text-[9px] text-stone-400 font-bold uppercase tracking-widest mt-0.5">TOPLAM ZİKİR</span>
          </div>
        </div>

        {/* AI Features Grid */}
        <div className="px-6 mt-4 z-10 relative grid grid-cols-2 gap-3">
          {/* Coach Banner */}
          <div
            onClick={() => setView('COACH')}
            className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-4 text-white shadow-lg shadow-indigo-500/20 cursor-pointer relative overflow-hidden group active:scale-[0.98] transition-all flex flex-col justify-between min-h-[100px]"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8 blur-2xl group-hover:bg-white/20 transition-colors"></div>
            <div className="relative z-10">
              <div className="bg-white/20 p-1.5 rounded-full backdrop-blur-md border border-white/10 w-fit mb-2">
                <Sparkles size={14} className="text-indigo-100" />
              </div>
              <h3 className="font-bold font-cinzel text-sm leading-tight">Manevi Koç</h3>
              <p className="text-[10px] text-indigo-100 opacity-90 leading-tight mt-0.5">Dert ortağın.</p>
            </div>
            <div className="relative z-10 flex justify-end">
              <ChevronRight size={16} className="text-indigo-200" />
            </div>
          </div>

          {/* Dream Banner */}
          <div
            onClick={() => setView('DREAM')}
            className="bg-gradient-to-r from-purple-800 to-fuchsia-900 rounded-2xl p-4 text-white shadow-lg shadow-purple-500/20 cursor-pointer relative overflow-hidden group active:scale-[0.98] transition-all flex flex-col justify-between min-h-[100px]"
          >
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '12px 12px' }}></div>
            <div className="relative z-10">
              <div className="bg-white/20 p-1.5 rounded-full backdrop-blur-md border border-white/10 w-fit mb-2">
                <Moon size={14} className="text-purple-100" fill="currentColor" />
              </div>
              <h3 className="font-bold font-cinzel text-sm leading-tight">Rüya Tabiri</h3>
              <p className="text-[10px] text-purple-100 opacity-90 leading-tight mt-0.5">İslami yorumlar.</p>
            </div>
            <div className="relative z-10 flex justify-end">
              <ChevronRight size={16} className="text-purple-200" />
            </div>
          </div>
        </div>

        <div className="flex flex-col pt-4 z-10 relative">
          <div className="px-6 mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 bg-teal-500 rounded-full"></div>
              <h2 className="text-lg font-bold text-teal-900 font-serif">Dualarım</h2>
            </div>
            <button onClick={handleAddNewPrayer} className="text-teal-600 hover:bg-teal-50 p-1 rounded transition-colors active:bg-teal-100">
              <Plus size={20} />
            </button>
          </div>

          <div className="px-6 mb-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Dua veya etiket ara..."
                value={libraryQuery}
                onChange={(e) => setLibraryQuery(e.target.value)}
                className="w-full bg-white/70 border border-emerald-100/80 rounded-lg pl-9 pr-4 py-2.5 text-sm outline-none focus:border-teal-500 transition-all font-serif placeholder:italic shadow-sm backdrop-blur-sm focus:bg-white"
              />
              <Search size={16} className="absolute left-3 top-3 text-stone-400" />
              {libraryQuery && (
                <button
                  onClick={() => setLibraryQuery('')}
                  className="absolute right-3 top-3 text-stone-400 hover:text-stone-600"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          <div className="px-6 mb-4 overflow-x-auto no-scrollbar flex gap-2 pb-1">
            <button
              onClick={() => setActiveTag(null)}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap border active:scale-95 ${!activeTag ? 'bg-teal-700 text-white border-teal-700 shadow-sm' : 'bg-white/80 text-stone-500 border-stone-200 hover:border-teal-300'}`}
            >
              Tümü
            </button>
            {uniqueTags.map(tag => (
              <button
                key={tag}
                onClick={() => setActiveTag(tag === activeTag ? null : tag)}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap border flex items-center gap-1.5 active:scale-95 ${activeTag === tag ? 'bg-teal-700 text-white border-teal-700 shadow-sm' : 'bg-white/80 text-stone-500 border-stone-200 hover:border-teal-300'}`}
              >
                <Tag size={14} className={activeTag === tag ? 'text-teal-200' : 'text-stone-400'} />
                {tag}
              </button>
            ))}
          </div>

          <div className="px-4 pb-4 min-h-[200px]">
            {filteredPrayers.length === 0 ? (
              <div className="text-center py-10 opacity-50 bg-white/50 rounded-xl border border-dashed border-stone-200">
                <Search size={32} className="mx-auto mb-2 text-stone-300" />
                <p className="font-serif italic text-stone-400">Aradığınız kriterlere uygun dua bulunamadı.</p>
                <button onClick={() => { setLibraryQuery(''); setActiveTag(null) }} className="text-teal-600 text-xs font-bold mt-2 underline">Filtreleri Temizle</button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {displayedPrayers.map(prayer => (
                  <div
                    key={prayer.id}
                    onClick={() => openCounter(prayer)}
                    className="bg-white/90 rounded-2xl shadow-sm border border-emerald-50 active:scale-[0.98] transition-all cursor-pointer group hover:border-teal-200 hover:shadow-md relative overflow-hidden backdrop-blur-sm flex flex-row min-h-[140px]"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full -mr-8 -mt-8 opacity-50 z-0 pointer-events-none"></div>
                    <div className="flex-1 p-4 relative z-10 min-w-0">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100">
                          {prayer.currentCount}
                        </span>
                        {prayer.reminder?.active && <Bell size={12} className="text-amber-500 fill-amber-500" />}
                      </div>
                      <h3 className="font-bold text-stone-800 text-base font-serif mb-1 line-clamp-1 group-hover:text-teal-700 transition-colors">
                        {prayer.title}
                      </h3>
                      <p className="text-stone-500 text-xs leading-relaxed line-clamp-2 font-serif italic mb-2 opacity-80 h-8">
                        {prayer.turkish}
                      </p>
                      <div className="flex flex-col mt-auto pt-1">
                        <div className="flex flex-wrap gap-1">
                          {(prayer.tags || []).slice(0, 3).map((tag, i) => (
                            <span key={i} className="text-[9px] bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded border border-stone-200 truncate">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="w-12 border-l border-emerald-50 bg-stone-50/50 flex flex-col items-center justify-between py-2 z-10 backdrop-blur-sm">
                      <button onClick={(e) => handleShareClick(e, prayer)} className="p-2 text-stone-400 hover:text-teal-600 transition-colors active:scale-90"><Share2 size={16} /></button>
                      <button onClick={(e) => handleHistoryClick(e, prayer)} className="p-2 text-stone-400 hover:text-teal-600 transition-colors active:scale-90"><History size={16} /></button>
                      <button onClick={(e) => handleReminderClick(e, prayer)} className={`p-2 transition-colors active:scale-90 ${prayer.reminder?.active ? 'text-amber-500' : 'text-stone-400 hover:text-amber-500'}`}>{prayer.reminder?.active ? <CalendarClock size={16} /> : <Bell size={16} />}</button>
                      <button onClick={(e) => handleDeletePrayer(e, prayer.id)} className="p-2 text-stone-400 hover:text-red-500 transition-colors active:scale-90"><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))}
                {hasMore && (
                  <button onClick={() => setVisibleCount(prev => prev + 10)} className="w-full py-3 text-stone-500 text-xs font-bold bg-white/50 border border-stone-200 rounded-xl hover:bg-white hover:text-teal-700 transition-all flex items-center justify-center gap-1 shadow-sm active:scale-95">Daha Fazla Göster <ChevronDown size={14} /></button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const showNavigation = view === 'HOME' || view === 'SEARCH' || view === 'PROFILE' || view === 'SETTINGS' || view === 'SOCIAL';

  return (
    <div className="font-sans text-stone-900 bg-[#ecfdf5] w-full h-[100dvh] max-w-md mx-auto relative shadow-2xl overflow-hidden flex flex-col select-none">
      <React.Suspense fallback={<LoadingScreen message="Yükleniyor..." />}>
        <div className="flex-1 w-full relative overflow-hidden">
          {renderContent()}
        </div>
        {showNavigation && <Navigation currentView={view} setView={handleNavigationChange} user={user} />}
        {activeReminderPrayer && <ReminderModal prayer={activeReminderPrayer} onSave={(updated) => { handleUpdatePrayer(updated); setActiveReminderPrayer(null); }} onClose={() => setActiveReminderPrayer(null)} />}
        {activeSharePrayer && <ShareModal prayer={activeSharePrayer} onClose={() => setActiveSharePrayer(null)} />}
        {activeHistoryPrayer && <HistoryModal prayer={activeHistoryPrayer} onClose={() => setActiveHistoryPrayer(null)} />}
        {showPremiumModal && <PremiumModal onClose={() => setShowPremiumModal(false)} onPurchase={handlePurchasePremium} />}
      </React.Suspense>
    </div>
  );
};

// Export MobileApp as default for non-admin routes
export default MobileApp;
