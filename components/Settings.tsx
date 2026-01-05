import React, { useState, useEffect } from 'react';
import { Bell, Shield, Smartphone, Database, DownloadCloud, Check, User as UserIcon, AlertCircle, LogOut, Mail, Crown, MapPin } from 'lucide-react';
import { dbService } from '../services/db';
import { defaultPrayers } from '../data/defaults';
import { User } from '../types';

// @ts-ignore
import { Capacitor } from '@capacitor/core';

interface SettingsProps {
  notificationsEnabled: boolean;
  setNotificationsEnabled: (enabled: boolean) => void;
  user?: User | null;
  onLogout?: () => void;
}

const Settings: React.FC<SettingsProps> = ({ notificationsEnabled, setNotificationsEnabled, user, onLogout }) => {
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  const [updatingLibrary, setUpdatingLibrary] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<string | null>(null);
  const isNative = Capacitor.isNativePlatform();

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
      // Turn off
      setNotificationsEnabled(false);
    } else {
      // Turn on
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

  const handleUpdateLibrary = async () => {
    setUpdatingLibrary(true);
    setUpdateStatus(null);
    try {
      const addedCount = await dbService.addMissingPrayers(defaultPrayers);
      setTimeout(() => {
        if (addedCount > 0) {
          setUpdateStatus(`${addedCount} yeni dua kütüphaneye eklendi.`);
        } else {
          setUpdateStatus("Kütüphaneniz zaten güncel.");
        }
        setUpdatingLibrary(false);
      }, 800);
    } catch (error) {
      console.error(error);
      setUpdateStatus("Güncelleme sırasında hata oluştu.");
      setUpdatingLibrary(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-[#ecfdf5] pb-28 relative">
      <div className="islamic-pattern fixed inset-0 z-0 pointer-events-none opacity-10"></div>

      {/* Header */}
      <div className="bg-white/90 backdrop-blur-md px-6 py-6 border-b border-emerald-100 relative z-10 shadow-sm">
        <h2 className="text-2xl font-bold font-cinzel text-teal-900">Profilim</h2>
        <p className="text-stone-500 text-sm font-serif">Hesap bilgilerinizi ve uygulama ayarlarını yönetin.</p>
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

        {/* Data Management Card */}
        <div className="bg-white/90 rounded-2xl shadow-sm border border-emerald-50 overflow-hidden">
          <div className="p-4 border-b border-stone-100 bg-stone-50/50 flex items-center gap-2">
            <Database size={18} className="text-teal-700" />
            <h3 className="font-bold text-stone-700">Veri Yönetimi</h3>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex flex-col gap-2">
              <p className="text-sm text-stone-600">
                Uygulama kütüphanesini en yeni dualar ve zikirlerle güncelleyin.
              </p>
              <button
                onClick={handleUpdateLibrary}
                disabled={updatingLibrary}
                className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${updateStatus && updateStatus.includes('hata') ? 'bg-red-50 text-red-600 border border-red-200' : updateStatus ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-stone-800 text-stone-50 hover:bg-stone-700'}`}
              >
                {updatingLibrary ? (
                  <span className="animate-pulse">Güncelleniyor...</span>
                ) : updateStatus ? (
                  <>
                    <Check size={16} /> {updateStatus}
                  </>
                ) : (
                  <>
                    <DownloadCloud size={16} /> Kütüphaneyi Genişlet
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Privacy Info Card (Static) */}
        <div className="bg-white/90 rounded-2xl shadow-sm border border-emerald-50 overflow-hidden opacity-80">
          <div className="p-4 border-b border-stone-100 bg-stone-50/50 flex items-center gap-2">
            <Shield size={18} className="text-teal-700" />
            <h3 className="font-bold text-stone-700">Gizlilik & Veri</h3>
          </div>
          <div className="p-5 text-sm text-stone-600 space-y-2">
            <p>
              Tüm dua kayıtlarınız ve istatistikleriniz cihazınızda saklanır.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Settings;