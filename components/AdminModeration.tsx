import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, CheckCircle, XCircle, Clock, User, MessageSquare } from 'lucide-react';
import { getAllReports, updateReportStatus, Report } from '../services/supabase';

const AdminModeration: React.FC = () => {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('all');
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    const [adminNote, setAdminNote] = useState('');

    useEffect(() => {
        loadReports();
    }, []);

    const loadReports = async () => {
        setLoading(true);
        const data = await getAllReports();
        setReports(data);
        setLoading(false);
    };

    const handleUpdateStatus = async (id: string, status: string) => {
        const success = await updateReportStatus(id, status, adminNote);
        if (success) {
            setReports(reports.map(r => r.id === id ? { ...r, status, admin_note: adminNote } : r));
            setSelectedReport(null);
            setAdminNote('');
        }
    };

    const filteredReports = reports.filter(r => {
        if (filter === 'all') return true;
        return r.status === filter;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-amber-100 text-amber-700';
            case 'reviewing': return 'bg-blue-100 text-blue-700';
            case 'resolved': return 'bg-green-100 text-green-700';
            case 'dismissed': return 'bg-stone-100 text-stone-500';
            default: return 'bg-stone-100 text-stone-500';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'pending': return 'Beklemede';
            case 'reviewing': return 'İnceleniyor';
            case 'resolved': return 'Çözüldü';
            case 'dismissed': return 'Reddedildi';
            default: return status;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-stone-800">Moderasyon</h2>
                    <p className="text-stone-500 text-sm">Şikayet ve içerik yönetimi</p>
                </div>
                <div className="flex gap-2">
                    {['all', 'pending', 'reviewing', 'resolved', 'dismissed'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilter(status)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === status
                                    ? 'bg-teal-600 text-white'
                                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                                }`}
                        >
                            {status === 'all' ? 'Tümü' : getStatusLabel(status)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-stone-200">
                    <div className="flex items-center gap-2 mb-1">
                        <Clock size={16} className="text-amber-500" />
                        <span className="text-sm text-stone-500">Beklemede</span>
                    </div>
                    <span className="text-2xl font-bold text-stone-800">
                        {reports.filter(r => r.status === 'pending').length}
                    </span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-stone-200">
                    <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle size={16} className="text-blue-500" />
                        <span className="text-sm text-stone-500">İnceleniyor</span>
                    </div>
                    <span className="text-2xl font-bold text-stone-800">
                        {reports.filter(r => r.status === 'reviewing').length}
                    </span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-stone-200">
                    <div className="flex items-center gap-2 mb-1">
                        <CheckCircle size={16} className="text-green-500" />
                        <span className="text-sm text-stone-500">Çözüldü</span>
                    </div>
                    <span className="text-2xl font-bold text-stone-800">
                        {reports.filter(r => r.status === 'resolved').length}
                    </span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-stone-200">
                    <div className="flex items-center gap-2 mb-1">
                        <XCircle size={16} className="text-stone-400" />
                        <span className="text-sm text-stone-500">Reddedildi</span>
                    </div>
                    <span className="text-2xl font-bold text-stone-800">
                        {reports.filter(r => r.status === 'dismissed').length}
                    </span>
                </div>
            </div>

            {/* Reports List */}
            <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
                <div className="p-4 border-b border-stone-100 bg-stone-50">
                    <h3 className="font-bold text-stone-800 flex items-center gap-2">
                        <Shield size={18} className="text-red-500" />
                        Şikayetler ({filteredReports.length})
                    </h3>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-stone-400">Yükleniyor...</div>
                ) : filteredReports.length === 0 ? (
                    <div className="p-8 text-center text-stone-400">Şikayet bulunamadı.</div>
                ) : (
                    <div className="divide-y divide-stone-100">
                        {filteredReports.map(report => (
                            <div key={report.id} className="p-4 hover:bg-stone-50 transition-colors">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-500">
                                        <AlertTriangle size={18} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${getStatusColor(report.status!)}`}>
                                                {getStatusLabel(report.status!)}
                                            </span>
                                            <span className="text-[10px] bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full capitalize">
                                                {report.content_type}
                                            </span>
                                        </div>
                                        <h4 className="font-bold text-stone-800">{report.reason}</h4>
                                        {report.description && (
                                            <p className="text-sm text-stone-500 line-clamp-2 mt-1">{report.description}</p>
                                        )}
                                        <div className="flex items-center gap-4 mt-2 text-xs text-stone-400">
                                            <span className="flex items-center gap-1">
                                                <User size={12} />
                                                Şikayet eden: {report.reporter_name}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <MessageSquare size={12} />
                                                Şikayet edilen: {report.reported_user_name}
                                            </span>
                                            <span>{new Date(report.created_at!).toLocaleDateString('tr-TR')}</span>
                                        </div>
                                        {report.admin_note && (
                                            <div className="mt-2 p-2 bg-blue-50 rounded-lg text-xs text-blue-700">
                                                <strong>Admin Notu:</strong> {report.admin_note}
                                            </div>
                                        )}
                                    </div>
                                    {report.status === 'pending' || report.status === 'reviewing' ? (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setSelectedReport(report)}
                                                className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200"
                                            >
                                                İncele
                                            </button>
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Review Modal */}
            {selectedReport && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6">
                        <h3 className="font-bold text-stone-800 mb-4">Şikayeti İncele</h3>

                        <div className="bg-stone-50 p-4 rounded-xl mb-4">
                            <p className="text-sm text-stone-600"><strong>Sebep:</strong> {selectedReport.reason}</p>
                            {selectedReport.description && (
                                <p className="text-sm text-stone-500 mt-2">{selectedReport.description}</p>
                            )}
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-stone-600 mb-1">Admin Notu</label>
                            <textarea
                                value={adminNote}
                                onChange={e => setAdminNote(e.target.value)}
                                placeholder="İşlem hakkında not..."
                                className="w-full px-4 py-2 border border-stone-200 rounded-xl focus:border-teal-500 outline-none h-24"
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            <button
                                onClick={() => handleUpdateStatus(selectedReport.id!, 'reviewing')}
                                className="py-2 bg-blue-100 text-blue-700 rounded-xl text-sm font-bold hover:bg-blue-200"
                            >
                                İnceleniyor
                            </button>
                            <button
                                onClick={() => handleUpdateStatus(selectedReport.id!, 'resolved')}
                                className="py-2 bg-green-100 text-green-700 rounded-xl text-sm font-bold hover:bg-green-200"
                            >
                                Çözüldü
                            </button>
                            <button
                                onClick={() => handleUpdateStatus(selectedReport.id!, 'dismissed')}
                                className="py-2 bg-stone-100 text-stone-600 rounded-xl text-sm font-bold hover:bg-stone-200"
                            >
                                Reddet
                            </button>
                        </div>

                        <button
                            onClick={() => { setSelectedReport(null); setAdminNote(''); }}
                            className="w-full mt-3 py-2 text-stone-500 text-sm hover:text-stone-700"
                        >
                            İptal
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminModeration;
