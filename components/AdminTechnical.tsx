import React, { useState, useEffect } from 'react';
import { Settings, Power, ToggleLeft, ToggleRight, AlertTriangle, RefreshCw, Key, Save, Volume2, Image, MessageSquare, PlayCircle, DollarSign, TrendingUp, ShieldCheck, Sparkles, Moon } from 'lucide-react';
import { getAppConfig, setMaintenanceMode, setFeatureFlag, AppConfig, setAppSetting, getUsageStats, UsageSummary, getAdRates, AdRates, clearAdRatesCache } from '../services/supabase';
import { clearApiKeyCache } from '../services/geminiService';

const AdminTechnical: React.FC = () => {
    const [config, setConfig] = useState<AppConfig>({});
    const [loading, setLoading] = useState(true);
    const [maintenanceMessage, setMaintenanceMessage] = useState('');

    // API Key State - GÜVENLİK: Mevcut anahtar ASLA yüklenmez, sadece yeni anahtar girilebilir
    const [newApiKey, setNewApiKey] = useState('');
    const [hasExistingKey, setHasExistingKey] = useState(false);
    const [savingApiKey, setSavingApiKey] = useState(false);
    const [apiKeyMessage, setApiKeyMessage] = useState('');

    // Usage Stats State
    const [usageStats, setUsageStats] = useState<UsageSummary[]>([]);
    const [statsDays, setStatsDays] = useState(30);

    // Ad Rates State
    const [adRates, setAdRates] = useState<AdRates>({ tts: 2, ocr: 1, dream: 1, chat: 2 });
    const [savingAdRates, setSavingAdRates] = useState(false);
    const [adRatesMessage, setAdRatesMessage] = useState('');

    useEffect(() => { loadConfig(); loadUsageStats(); loadAdRates(); }, []);

    const loadConfig = async () => {
        setLoading(true);
        const data = await getAppConfig();
        setConfig(data);
        setMaintenanceMessage(data.maintenance_mode?.message || '');

        // GÜVENLİK: Sadece anahtar VAR MI YOK MU kontrolü - değeri ASLA çekilmez
        // Supabase RLS ile zaten korunuyor ama frontend'de de güvenlik katmanı
        try {
            // Supabase'den app_settings tablosunda key var mı kontrol et
            // Değeri çekmiyoruz, sadece varlığını kontrol ediyoruz
            const { data: settingData } = await import('../services/supabase').then(m =>
                m.supabase.from('app_settings').select('key').eq('key', 'gemini_api_key').single()
            );
            setHasExistingKey(!!settingData);
        } catch (e) {
            setHasExistingKey(false);
        }

        setLoading(false);
    };

    const loadUsageStats = async () => {
        try {
            const stats = await getUsageStats(statsDays);
            setUsageStats(stats);
        } catch (e) {
            console.warn('Usage stats tablosu henüz oluşturulmamış:', e);
            setUsageStats([]);
        }
    };

    const loadAdRates = async () => {
        try {
            const rates = await getAdRates();
            setAdRates(rates);
        } catch (e) {
            console.warn('Ad rates yüklenemedi:', e);
        }
    };

    const handleSaveAdRates = async () => {
        setSavingAdRates(true);
        setAdRatesMessage('');

        try {
            await Promise.all([
                setAppSetting('ad_rate_tts', String(adRates.tts)),
                setAppSetting('ad_rate_ocr', String(adRates.ocr)),
                setAppSetting('ad_rate_dream', String(adRates.dream)),
                setAppSetting('ad_rate_chat', String(adRates.chat)),
            ]);
            clearAdRatesCache();
            setAdRatesMessage('✅ Reklam oranları kaydedildi.');
        } catch (e) {
            setAdRatesMessage('❌ Kaydetme başarısız.');
        }
        setSavingAdRates(false);
    };

    const handleMaintenanceToggle = async () => {
        const newState = !config.maintenance_mode?.enabled;
        const success = await setMaintenanceMode(newState, maintenanceMessage);
        if (success) {
            setConfig({ ...config, maintenance_mode: { ...config.maintenance_mode!, enabled: newState, message: maintenanceMessage } });
        }
    };

    const handleFeatureToggle = async (feature: string) => {
        const current = config.feature_flags?.[feature] ?? true;
        const success = await setFeatureFlag(feature, !current);
        if (success) {
            setConfig({ ...config, feature_flags: { ...config.feature_flags, [feature]: !current } });
        }
    };

    const handleSaveApiKey = async () => {
        if (!newApiKey.trim() || newApiKey.length < 20) {
            setApiKeyMessage('❌ Geçerli bir API anahtarı girin (en az 20 karakter).');
            return;
        }
        setSavingApiKey(true);
        setApiKeyMessage('');

        const success = await setAppSetting('gemini_api_key', newApiKey.trim());

        if (success) {
            clearApiKeyCache(); // Eski cache'i temizle, yeni anahtar kullanılsın
            setApiKeyMessage('✅ API anahtarı kaydedildi. Sayfa yenilenince aktif olacak.');
            setNewApiKey(''); // Formu temizle
            setHasExistingKey(true);
        } else {
            setApiKeyMessage('❌ Kaydetme başarısız. Lütfen tekrar deneyin.');
        }
        setSavingApiKey(false);
    };

    const features = [
        { key: 'dream_interpreter', label: 'Rüya Tabiri', desc: 'AI rüya yorumlama' },
        { key: 'prayer_coach', label: 'Manevi Koç', desc: 'AI dua koçu' },
        { key: 'global_hatim', label: 'Global Hatim', desc: 'Topluluk hatim kampanyaları' },
        { key: 'social_features', label: 'Sosyal Özellikler', desc: 'Arkadaşlık ve mesajlaşma' },
    ];

    const getStatIcon = (type: string) => {
        switch (type) {
            case 'tts': return <Volume2 size={20} className="text-purple-500" />;
            case 'ocr': return <Image size={20} className="text-blue-500" />;
            case 'chat': return <MessageSquare size={20} className="text-teal-500" />;
            case 'ad_watched': return <PlayCircle size={20} className="text-green-500" />;
            default: return <TrendingUp size={20} className="text-stone-500" />;
        }
    };

    const getStatLabel = (type: string) => {
        switch (type) {
            case 'tts': return 'Ses Oluşturma (TTS)';
            case 'ocr': return 'Görsel Okuma (OCR)';
            case 'chat': return 'Sohbet Mesajı';
            case 'ad_watched': return 'İzlenen Reklam';
            default: return type;
        }
    };

    const getStatColor = (type: string) => {
        switch (type) {
            case 'tts': return 'bg-purple-50 border-purple-200';
            case 'ocr': return 'bg-blue-50 border-blue-200';
            case 'chat': return 'bg-teal-50 border-teal-200';
            case 'ad_watched': return 'bg-green-50 border-green-200';
            default: return 'bg-stone-50 border-stone-200';
        }
    };

    const totalCost = usageStats.reduce((sum, s) => sum + s.total_cost, 0);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-stone-800">Teknik Ayarlar</h2>
                    <p className="text-stone-500 text-sm">Bakım modu, API yönetimi ve kullanım istatistikleri</p>
                </div>
                <button onClick={() => { loadConfig(); loadUsageStats(); }} disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-stone-100 text-stone-600 rounded-xl hover:bg-stone-200">
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Yenile
                </button>
            </div>

            {loading ? <div className="text-center py-12 text-stone-400">Yükleniyor...</div> : (
                <>
                    {/* API Key Management - GÜVENLİ */}
                    <div className="bg-white rounded-2xl border border-amber-200 overflow-hidden">
                        <div className="p-4 border-b border-amber-100 bg-amber-50">
                            <h3 className="font-bold text-stone-800 flex items-center gap-2">
                                <Key size={18} className="text-amber-600" /> Gemini API Anahtarı
                                <span className="ml-auto flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                                    <ShieldCheck size={12} /> Güvenli Mod
                                </span>
                            </h3>
                        </div>
                        <div className="p-6 space-y-4">
                            {/* Mevcut Anahtar Durumu */}
                            <div className={`p-3 rounded-xl text-sm flex items-center gap-2 ${hasExistingKey ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-orange-50 text-orange-700 border border-orange-200'}`}>
                                {hasExistingKey ? (
                                    <>
                                        <ShieldCheck size={16} />
                                        <span>API anahtarı mevcut ve güvenli şekilde saklanıyor.</span>
                                    </>
                                ) : (
                                    <>
                                        <AlertTriangle size={16} />
                                        <span>API anahtarı tanımlanmamış. Lütfen bir anahtar girin.</span>
                                    </>
                                )}
                            </div>

                            {/* Yeni Anahtar Girişi */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-stone-600">
                                    {hasExistingKey ? 'Yeni Anahtar ile Değiştir' : 'API Anahtarı Girin'}
                                </label>
                                <div className="flex gap-3">
                                    <input
                                        type="password"
                                        value={newApiKey}
                                        onChange={e => setNewApiKey(e.target.value)}
                                        placeholder="Yeni API anahtarını yapıştırın..."
                                        autoComplete="off"
                                        onPaste={e => {
                                            e.preventDefault(); // Varsayılan yapıştırmayı engelle
                                            const pasted = e.clipboardData.getData('text').trim();
                                            setNewApiKey(pasted);
                                        }}
                                        onCopy={e => e.preventDefault()}
                                        onCut={e => e.preventDefault()}
                                        className="flex-1 px-4 py-3 border border-stone-200 rounded-xl outline-none focus:border-amber-500 font-mono text-sm select-none"
                                        style={{ WebkitTextSecurity: 'disc' } as any}
                                    />
                                    <button
                                        onClick={handleSaveApiKey}
                                        disabled={savingApiKey || !newApiKey.trim()}
                                        className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <Save size={18} />
                                        {savingApiKey ? 'Kaydediliyor...' : 'Kaydet'}
                                    </button>
                                </div>
                            </div>

                            {apiKeyMessage && (
                                <p className={`text-sm ${apiKeyMessage.includes('✅') ? 'text-green-600' : 'text-red-600'}`}>
                                    {apiKeyMessage}
                                </p>
                            )}

                            <p className="text-xs text-stone-400">
                                🔒 Güvenlik: API anahtarı asla görüntülenmez veya dışa aktarılmaz. Sadece yeni anahtar kaydedilebilir.
                            </p>
                        </div>
                    </div>

                    {/* Ad Rates Settings */}
                    <div className="bg-white rounded-2xl border border-teal-200 overflow-hidden">
                        <div className="p-4 border-b border-teal-100 bg-teal-50">
                            <h3 className="font-bold text-stone-800 flex items-center gap-2">
                                <PlayCircle size={18} className="text-teal-600" /> Reklam Ayarları (Free Kullanıcılar)
                            </h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-sm text-stone-500 mb-4">
                                Free kullanıcıların her özellik için kaç reklam izlemesi gerektiğini ayarlayın. 0 = Reklamsız.
                            </p>

                            <div className="grid grid-cols-2 gap-4">
                                {/* TTS */}
                                <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Volume2 size={18} className="text-purple-500" />
                                        <span className="font-medium text-stone-700">Ses Oluşturma (TTS)</span>
                                    </div>
                                    <input
                                        type="number"
                                        min="0"
                                        max="5"
                                        value={adRates.tts}
                                        onChange={e => setAdRates({ ...adRates, tts: parseInt(e.target.value) || 0 })}
                                        className="w-full px-3 py-2 border border-purple-200 rounded-lg text-center font-bold text-lg"
                                    />
                                </div>

                                {/* OCR */}
                                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Image size={18} className="text-blue-500" />
                                        <span className="font-medium text-stone-700">Resimden Dua (OCR)</span>
                                    </div>
                                    <input
                                        type="number"
                                        min="0"
                                        max="5"
                                        value={adRates.ocr}
                                        onChange={e => setAdRates({ ...adRates, ocr: parseInt(e.target.value) || 0 })}
                                        className="w-full px-3 py-2 border border-blue-200 rounded-lg text-center font-bold text-lg"
                                    />
                                </div>

                                {/* Dream */}
                                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Moon size={18} className="text-indigo-500" />
                                        <span className="font-medium text-stone-700">Rüya Tabiri</span>
                                    </div>
                                    <input
                                        type="number"
                                        min="0"
                                        max="5"
                                        value={adRates.dream}
                                        onChange={e => setAdRates({ ...adRates, dream: parseInt(e.target.value) || 0 })}
                                        className="w-full px-3 py-2 border border-indigo-200 rounded-lg text-center font-bold text-lg"
                                    />
                                </div>

                                {/* Chat */}
                                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Sparkles size={18} className="text-emerald-500" />
                                        <span className="font-medium text-stone-700">Manevi Koç</span>
                                    </div>
                                    <input
                                        type="number"
                                        min="0"
                                        max="5"
                                        value={adRates.chat}
                                        onChange={e => setAdRates({ ...adRates, chat: parseInt(e.target.value) || 0 })}
                                        className="w-full px-3 py-2 border border-emerald-200 rounded-lg text-center font-bold text-lg"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleSaveAdRates}
                                disabled={savingAdRates}
                                className="w-full py-3 bg-teal-500 hover:bg-teal-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                <Save size={18} />
                                {savingAdRates ? 'Kaydediliyor...' : 'Reklam Oranlarını Kaydet'}
                            </button>

                            {adRatesMessage && (
                                <p className={`text-sm text-center ${adRatesMessage.includes('✅') ? 'text-green-600' : 'text-red-600'}`}>
                                    {adRatesMessage}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
                        <div className="p-4 border-b border-stone-100 bg-stone-50 flex justify-between items-center">
                            <h3 className="font-bold text-stone-800 flex items-center gap-2">
                                <TrendingUp size={18} className="text-teal-600" /> Kullanım İstatistikleri
                            </h3>
                            <select
                                value={statsDays}
                                onChange={e => { setStatsDays(Number(e.target.value)); }}
                                className="px-3 py-1.5 border border-stone-200 rounded-lg text-sm outline-none"
                            >
                                <option value={7}>Son 7 Gün</option>
                                <option value={30}>Son 30 Gün</option>
                                <option value={90}>Son 90 Gün</option>
                            </select>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                {usageStats.map(stat => (
                                    <div key={stat.type} className={`p-4 rounded-xl border ${getStatColor(stat.type)}`}>
                                        <div className="flex items-center gap-2 mb-2">
                                            {getStatIcon(stat.type)}
                                            <span className="text-xs font-medium text-stone-600">{getStatLabel(stat.type)}</span>
                                        </div>
                                        <p className="text-2xl font-bold text-stone-800">{stat.total_count.toLocaleString()}</p>
                                        {stat.total_cost > 0 && (
                                            <p className="text-xs text-stone-500 mt-1">
                                                ~${stat.total_cost.toFixed(4)}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Total Cost */}
                            <div className="bg-gradient-to-r from-rose-50 to-orange-50 p-4 rounded-xl border border-rose-200">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-rose-500 rounded-xl flex items-center justify-center text-white">
                                            <DollarSign size={20} />
                                        </div>
                                        <div>
                                            <p className="text-sm text-stone-600">Tahmini Toplam Maliyet</p>
                                            <p className="text-xs text-stone-400">Son {statsDays} gün</p>
                                        </div>
                                    </div>
                                    <p className="text-3xl font-bold text-rose-600">${totalCost.toFixed(4)}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Maintenance Mode */}
                    <div className={`rounded-2xl p-6 border-2 ${config.maintenance_mode?.enabled ? 'bg-red-50 border-red-200' : 'bg-white border-stone-200'}`}>
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${config.maintenance_mode?.enabled ? 'bg-red-500 text-white' : 'bg-stone-100 text-stone-500'}`}>
                                    <Power size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-stone-800">Bakım Modu</h3>
                                    <p className="text-sm text-stone-500">Uygulamayı geçici olarak kapat</p>
                                </div>
                            </div>
                            <button onClick={handleMaintenanceToggle} className={`px-4 py-2 rounded-xl font-bold transition-colors ${config.maintenance_mode?.enabled ? 'bg-red-500 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}>
                                {config.maintenance_mode?.enabled ? 'Devre Dışı Bırak' : 'Aktif Et'}
                            </button>
                        </div>

                        {config.maintenance_mode?.enabled && (
                            <div className="flex items-center gap-2 p-3 bg-red-100 rounded-xl text-red-700 text-sm mb-4">
                                <AlertTriangle size={18} /> Uygulama şu anda bakım modunda!
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-stone-600 mb-1">Bakım Mesajı</label>
                            <textarea
                                value={maintenanceMessage}
                                onChange={e => setMaintenanceMessage(e.target.value)}
                                placeholder="Kullanıcılara gösterilecek mesaj..."
                                className="w-full px-4 py-2 border border-stone-200 rounded-xl outline-none h-20"
                            />
                        </div>
                    </div>

                    {/* Feature Flags */}
                    <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
                        <div className="p-4 border-b border-stone-100 bg-stone-50">
                            <h3 className="font-bold text-stone-800 flex items-center gap-2">
                                <Settings size={18} className="text-teal-600" /> Özellik Yönetimi (Remote Config)
                            </h3>
                        </div>
                        <div className="divide-y divide-stone-100">
                            {features.map(feature => (
                                <div key={feature.key} className="p-4 flex items-center justify-between hover:bg-stone-50">
                                    <div>
                                        <h4 className="font-bold text-stone-800">{feature.label}</h4>
                                        <p className="text-sm text-stone-500">{feature.desc}</p>
                                    </div>
                                    <button onClick={() => handleFeatureToggle(feature.key)} className="text-3xl">
                                        {config.feature_flags?.[feature.key] !== false ? (
                                            <ToggleRight className="text-green-500" />
                                        ) : (
                                            <ToggleLeft className="text-stone-300" />
                                        )}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* App Version */}
                    <div className="bg-white rounded-2xl border border-stone-200 p-6">
                        <h3 className="font-bold text-stone-800 mb-4">Minimum Uygulama Versiyonu</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-stone-50 p-4 rounded-xl">
                                <span className="text-sm text-stone-500">iOS</span>
                                <p className="font-bold text-stone-800">{config.min_app_version?.ios || '1.0.0'}</p>
                            </div>
                            <div className="bg-stone-50 p-4 rounded-xl">
                                <span className="text-sm text-stone-500">Android</span>
                                <p className="font-bold text-stone-800">{config.min_app_version?.android || '1.0.0'}</p>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default AdminTechnical;
