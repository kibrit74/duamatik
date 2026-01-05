import React from 'react';
import { User, Prayer } from '../types';
import { Users, BookOpen, ShieldAlert, BarChart3, Search, Trash2, Ban, Flag, Bell } from 'lucide-react';

interface AdminDashboardProps {
  prayers: Prayer[];
  onBack: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ prayers, onBack }) => {
  // Mock Admin Stats
  const stats = [
    { label: 'Toplam Kullanıcı', value: '1,245', icon: Users, color: 'bg-blue-500' },
    { label: 'Günlük Aktif', value: '432', icon: BarChart3, color: 'bg-green-500' },
    { label: 'Toplam Dua', value: prayers.length, icon: BookOpen, color: 'bg-teal-500' },
    { label: 'Raporlananlar', value: '5', icon: ShieldAlert, color: 'bg-red-500' },
  ];

  // Mock User List
  const users = [
    { id: 1, name: 'Mehmet Yılmaz', email: 'mehmet@test.com', status: 'active', reports: 0 },
    { id: 2, name: 'Spam Bot', email: 'bot@spam.com', status: 'banned', reports: 12 },
    { id: 3, name: 'Ayşe Demir', email: 'ayse@test.com', status: 'active', reports: 0 },
    { id: 4, name: 'Kötü Niyetli', email: 'bad@actor.com', status: 'warning', reports: 3 },
  ];

  return (
    <div className="min-h-screen bg-stone-50 pb-20">
      {/* Header */}
      <div className="bg-stone-900 text-white p-6 pb-12 rounded-b-[2rem] shadow-lg relative overflow-hidden">
         <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/20 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none"></div>
         <div className="flex justify-between items-center relative z-10">
            <div>
                <h1 className="text-2xl font-cinzel font-bold">Yönetici Paneli</h1>
                <p className="text-stone-400 text-xs mt-1">Sistem durumu ve kullanıcı yönetimi</p>
            </div>
            <div className="p-2 bg-white/10 rounded-full relative">
                <Bell size={20} />
                <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-stone-900"></span>
            </div>
         </div>
      </div>

      <div className="px-4 -mt-8 relative z-10">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
            {stats.map((stat, idx) => (
                <div key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-stone-200 flex flex-col gap-2">
                    <div className={`w-8 h-8 rounded-lg ${stat.color} text-white flex items-center justify-center`}>
                        <stat.icon size={16} />
                    </div>
                    <div>
                        <span className="block text-xl font-bold text-stone-800">{stat.value}</span>
                        <span className="text-[10px] text-stone-500 font-bold uppercase">{stat.label}</span>
                    </div>
                </div>
            ))}
        </div>

        {/* User Management */}
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden mb-6">
            <div className="p-4 border-b border-stone-100 flex justify-between items-center bg-stone-50">
                <h3 className="font-bold text-stone-800 flex items-center gap-2">
                    <Users size={18} className="text-teal-600"/> Kullanıcı Listesi
                </h3>
                <button className="text-xs bg-stone-200 px-2 py-1 rounded text-stone-600 font-bold">Tümü</button>
            </div>
            
            <div className="p-3">
               <div className="relative mb-4">
                  <input type="text" placeholder="Kullanıcı ara..." className="w-full bg-stone-50 border border-stone-200 rounded-lg py-2 pl-9 pr-3 text-sm outline-none focus:border-teal-500" />
                  <Search size={16} className="absolute left-3 top-2.5 text-stone-400" />
               </div>

               <div className="space-y-3">
                   {users.map(user => (
                       <div key={user.id} className="flex items-center justify-between p-3 border border-stone-100 rounded-lg hover:bg-stone-50 transition-colors">
                           <div>
                               <h4 className="font-bold text-sm text-stone-800">{user.name}</h4>
                               <p className="text-xs text-stone-400">{user.email}</p>
                               <span className={`text-[9px] px-1.5 py-0.5 rounded border mt-1 inline-block ${
                                   user.status === 'active' ? 'bg-green-50 text-green-600 border-green-100' : 
                                   user.status === 'banned' ? 'bg-red-50 text-red-600 border-red-100' : 
                                   'bg-amber-50 text-amber-600 border-amber-100'
                               }`}>
                                   {user.status.toUpperCase()}
                               </span>
                           </div>
                           <div className="flex gap-2">
                               {user.reports > 0 && (
                                   <div className="flex items-center gap-1 text-xs text-red-500 font-bold bg-red-50 px-2 py-1 rounded">
                                       <Flag size={12} /> {user.reports}
                                   </div>
                               )}
                               <button className="p-2 text-stone-400 hover:text-red-500 transition-colors" title="Banla"><Ban size={16} /></button>
                               <button className="p-2 text-stone-400 hover:text-red-500 transition-colors" title="Sil"><Trash2 size={16} /></button>
                           </div>
                       </div>
                   ))}
               </div>
            </div>
        </div>

        {/* Global Notifications */}
        <div className="bg-gradient-to-r from-teal-700 to-teal-900 rounded-xl p-5 text-white shadow-lg mb-6">
            <h3 className="font-bold mb-2">Sistem Duyurusu Yayınla</h3>
            <p className="text-xs text-teal-100 mb-4 opacity-80">Tüm kullanıcılara anlık bildirim gönderin.</p>
            <div className="flex gap-2">
                <input type="text" placeholder="Mesajınız..." className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder:text-teal-200/50 outline-none focus:bg-white/20" />
                <button className="bg-white text-teal-900 px-4 py-2 rounded-lg text-xs font-bold hover:bg-teal-50 transition-colors">Gönder</button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;