import React, { useState, useEffect } from 'react';
import { Bell, Smartphone, History, User as UserIcon, AlertCircle, LogOut, Mail, Crown, MapPin, ArrowRight, Calendar } from 'lucide-react';
import { dbService } from '../services/db';
import { defaultPrayers } from '../data/defaults';
import { User, Prayer } from '../types';

// @ts-ignore
import { Capacitor } from '@capacitor/core';

interface SettingsProps {
  notificationsEnabled: boolean;
  setNotificationsEnabled: (enabled: boolean) => void;
  user?: User | null;
  onLogout?: () => void;
  prayers?: Prayer[];
  onOpenPrayer?: (prayer: Prayer) => void;
}

const Settings: React.FC<SettingsProps> = ({ notificationsEnabled, setNotificationsEnabled, user, onLogout, prayers = [], onOpenPrayer }) => {
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  const isNative = Capacitor.isNativePlatform();

  // Son açılan dualar (currentCount > 0 ve lastUpdated'e göre sıralı)
  // Son açılan dualar (currentCount > 0 ve lastUpdated'e göre sıralı)
  // Duplicate ID'leri filtrele
  const uniquePrayersMap = new Map();
  prayers.forEach(p => {
    if (p.currentCount > 0) {
      uniquePrayersMap.set(p.id, p);
    }
  });

  const recentPrayers = Array.from(uniquePrayersMap.values())
    .sort((a, b) => b.lastUpdated - a.lastUpdated)
    .slice(0, 5);

  useEffect(() => {
    if ('Notification' in window) {
      setPermissionStatus(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      alert("Tarayıcınız bildirimleri desteklemiyor.");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);

      if (permission === 'granted') {
        setNotificationsEnabled(true);
        new Notification("Bildirim İzni Alındı", {
          body: "Tesbihat hatırlatıcıları artık çalışacak.",
          icon: '/icon.png'
        });
      } else if (permission === 'denied') {
        setNotificationsEnabled(false);
        alert("Bildirim izni reddedildi. Lütfen tarayıcı ayarlarından (adres çubuğundaki kilit simgesi) bildirimlere izin verin.");
      } else {
        setNotificationsEnabled(false);
      }
    } catch (error) {
      console.error("İzin istenirken hata oluştu", error);
    }
  };

  const toggleNotifications = () => {
    if (notificationsEnabled) {
      setNotificationsEnabled(false);
    } else {
      if (permissionStatus === 'granted') {
        setNotificationsEnabled(true);
      } else if (permissionStatus === 'denied') {
        alert("Bildirimler tarayıcı ayarlarınızdan engellenmiş. Lütfen ayarları açıp izin verin.");
      } else {
        requestPermission();
      }
    }
  };

  const sendTestNotification = () => {
    if (permissionStatus === 'granted' && notificationsEnabled) {
      try {
        new Notification("Test Bildirimi", {
          body: "Bu bir test bildirimidir.",
          icon: '/icon.png',
          vibrate: [200, 100, 200]
        } as any);
      } catch (e) {
        alert("Bildirim gönderilemedi.");
      }
    } else {
      alert("Önce bildirimlere izin vermeli ve aktifleştirmelisiniz.");
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-[#ecfdf5] pb-28 relative">
      <div className="islamic-pattern fixed inset-0 z-0 pointer-events-none opacity-10"></div>

      {/* Header */}
      <div className="bg-white/90 backdrop-blur-md px-6 py-6 border-b border-emerald-100 relative z-10 shadow-sm">
        <h2 className="text-2xl font-bold font-cinzel text-teal-900">Profilim</h2>
        <p className="text-stone-500 text-sm font-serif">Hesap bilgilerinizi ve son aktivitelerinizi görün.</p>
      </div>

      <div className="p-6 space-y-6 relative z-10">

        {/* User Profile Card */}
        {user && (
          <div className="bg-white/90 rounded-2xl shadow-sm border border-emerald-50 p-5">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                {user.name?.charAt(0) || 'K'}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg text-stone-800">{user.name || 'Kullanıcı'}</h3>
                  {user.isPremium ? (
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-amber-400 to-amber-500 text-white text-[10px] font-bold rounded-full shadow-sm">
                      <Crown size={10} /> PRO
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-stone-200 text-stone-600 text-[10px] font-bold rounded-full">
                      FREE
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-sm text-stone-500 mt-1">
                  <Mail size={12} />
                  <span>{user.email}</span>
                </div>
                {user.city && (
                  <div className="flex items-center gap-1 text-sm text-stone-400 mt-0.5">
                    <MapPin size={12} />
                    <span>{user.city}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Logout Button */}
            {onLogout && (
              <button
                onClick={onLogout}
                className="mt-4 w-full flex items-center justify-center gap-2 py-3 bg-red-50 text-red-600 rounded-xl font-bold text-sm hover:bg-red-100 transition-colors border border-red-100"
              >
                <LogOut size={18} />
                Çıkış Yap
              </button>
            )}
          </div>
        )}

        {/* Account Info (Native Placeholder) */}
        {isNative && !user && (
          <div className="bg-white/90 rounded-2xl shadow-sm border border-emerald-50 p-4 flex items-center gap-3">
            <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center text-teal-700">
              <UserIcon size={24} />
            </div>
            <div>
              <h3 className="font-bold text-stone-800">Hesap Durumu</h3>
              <p className="text-xs text-stone-500">Google Play / App Store ile giriş yapıldı.</p>
            </div>
          </div>
        )}

        {/* Recent Prayers List */}
        <div className="bg-white/90 rounded-2xl shadow-sm border border-emerald-50 overflow-hidden">
          <div className="p-4 border-b border-stone-100 bg-stone-50/50 flex items-center gap-2">
            <History size={18} className="text-amber-500" />
            <h3 className="font-bold text-stone-700">Son Okuduğum Dualar</h3>
            <span className="ml-auto text-xs text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">{recentPrayers.length}</span>
          </div>
          <div className="p-3 space-y-2">
            {recentPrayers.length === 0 ? (
              <div className="text-center py-6 text-stone-400">
                <History size={24} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">Henüz bir dua okumadınız.</p>
              </div>
            ) : (
              recentPrayers.map((prayer) => (
                <div
                  key={prayer.id}
                  onClick={() => onOpenPrayer?.(prayer)}
                  className="bg-stone-50 p-3 rounded-xl flex items-center justify-between cursor-pointer hover:bg-teal-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-stone-700 text-sm truncate">{prayer.title}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-teal-600 font-mono font-bold">
                        {prayer.currentCount}{prayer.targetCount > 0 ? `/${prayer.targetCount}` : ''}
                      </span>
                      <span className="text-[10px] text-stone-400 flex items-center gap-1">
                        <Calendar size={10} />
                        {new Date(prayer.lastUpdated).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })}
                      </span>
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-stone-400" />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Custom Prayers List */}
        <div className="bg-white/90 rounded-2xl shadow-sm border border-emerald-50 overflow-hidden">
          <div className="p-4 border-b border-stone-100 bg-stone-50/50 flex items-center gap-2">
            <Smartphone size={18} className="text-teal-600" />
            <h3 className="font-bold text-stone-700">Eklediğim Dualar</h3>
            <span className="ml-auto text-xs text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">
              {prayers.filter(p => (p as any)._isCustom).length}
            </span>
          </div>
          <div className="p-3 space-y-2">
            {prayers.filter(p => (p as any)._isCustom).length === 0 ? (
              <div className="text-center py-6 text-stone-400">
                <Smartphone size={24} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">Henüz kendiniz dua eklemediniz.</p>
                <p className="text-xs mt-1">Ana sayfadaki (+) butonundan ekleyebilirsiniz.</p>
              </div>
            ) : (
              prayers
                .filter(p => (p as any)._isCustom)
                .sort((a, b) => b.lastUpdated - a.lastUpdated)
                .map((prayer) => (
                  <div
                    key={prayer.id}
                    onClick={() => onOpenPrayer?.(prayer)}
                    className="bg-stone-50 p-3 rounded-xl flex items-center justify-between cursor-pointer hover:bg-teal-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-stone-700 text-sm truncate">{prayer.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-teal-600 font-mono font-bold">
                          {prayer.currentCount}{prayer.targetCount > 0 ? `/${prayer.targetCount}` : ''}
                        </span>
                        <span className="text-[10px] text-stone-400 flex items-center gap-1">
                          <Calendar size={10} />
                          {new Date(prayer.lastUpdated).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })}
                        </span>
                      </div>
                    </div>
                    <ArrowRight size={16} className="text-stone-400" />
                  </div>
                ))
            )}
          </div>
        </div>

        {/* Notification Settings Card */}
        <div className="bg-white/90 rounded-2xl shadow-sm border border-emerald-50 overflow-hidden">
          <div className="p-4 border-b border-stone-100 bg-stone-50/50 flex items-center gap-2">
            <Bell size={18} className="text-teal-700" />
            <h3 className="font-bold text-stone-700">Bildirim Ayarları</h3>
          </div>

          <div className="p-5 space-y-6">
            <div className="flex items-center justify-between">
              <div className="pr-4">
                <p className="font-medium text-stone-800">Hatırlatıcıları Etkinleştir</p>
                <p className="text-xs text-stone-500 mt-1">Belirlediğiniz zamanlarda dua hatırlatmaları alın.</p>
                {permissionStatus === 'denied' && (
                  <p className="text-[10px] text-red-500 flex items-center gap-1 mt-1 font-bold">
                    <AlertCircle size={10} /> Tarayıcıdan engellendi
                  </p>
                )}
              </div>
              <button
                onClick={toggleNotifications}
                className={`w-12 h-7 rounded-full transition-colors relative ${notificationsEnabled ? 'bg-teal-600' : 'bg-stone-300'}`}
              >
                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${notificationsEnabled ? 'left-6' : 'left-1'}`}></div>
              </button>
            </div>

            <button
              onClick={sendTestNotification}
              disabled={!notificationsEnabled || permissionStatus !== 'granted'}
              className="w-full py-3 border border-stone-200 rounded-xl text-stone-600 text-sm font-bold hover:bg-stone-50 active:bg-stone-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Smartphone size={16} />
              Bildirimi Test Et
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Settings;