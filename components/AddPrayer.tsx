
import React, { useState, useRef, useEffect } from 'react';
import { extractTextFromImage } from '../services/geminiService';
import { getAdRates } from '../services/supabase';
import { Prayer } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { Camera, Loader2, Save, X, Tag, ImagePlus, AlertCircle, ChevronDown, BookOpen } from 'lucide-react';
import RewardAdModal from './RewardAdModal';

interface AddPrayerProps {
  onSave: (prayer: Prayer) => void;
  onCancel: () => void;
  initialData?: Partial<Prayer> | null;
  onOpenPremium?: () => void;
  hideHeader?: boolean;
}

const CATEGORIES = [
  "Günlük", "Tesbihat", "Zikir", "Kuran", "Salavat",
  "Esma-ül Hüsna", "Namaz", "Hacet", "Şifa", "Korunma",
  "Rızık", "Tövbe", "Şükür", "Ramazan", "Kandil",
  "Aile", "Yolculuk", "Diğer"
];

const AddPrayer: React.FC<AddPrayerProps> = ({ onSave, onCancel, initialData, onOpenPremium, hideHeader }) => {
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [meaning, setMeaning] = useState(''); // New State for Meaning

  // Category State
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [customTags, setCustomTags] = useState('');

  const [target, setTarget] = useState<string>('0'); // Default to 0 (Sınırsız)
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Ad State
  const [showAdModal, setShowAdModal] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [ocrAdRate, setOcrAdRate] = useState(1);

  // Load OCR ad rate on mount
  useEffect(() => {
    getAdRates().then(rates => setOcrAdRate(rates.ocr || 1));
  }, []);

  // Load initial data if provided (e.g. from Search)
  useEffect(() => {
    if (initialData) {
      if (initialData.title) setTitle(initialData.title);
      if (initialData.turkish) setText(initialData.turkish);
      if (initialData.meaning) setMeaning(initialData.meaning);

      if (initialData.tags && initialData.tags.length > 0) {
        const firstTag = initialData.tags[0];
        // Case insensitive check could be better but strict match is fine for now
        if (CATEGORIES.includes(firstTag)) {
          setCategory(firstTag);
        } else {
          setCategory('Diğer');
          setCustomTags(initialData.tags.join(', '));
        }
      }
    }
  }, [initialData]);

  // Handle global paste events
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.type.indexOf('image') !== -1) {
          const file = item.getAsFile();
          if (file) {
            initiateImageProcessing(file);
            e.preventDefault();
          }
          break;
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const initiateImageProcessing = (file: File) => {
    setPendingFile(file);
    setShowAdModal(true);
  };

  const handleAdComplete = () => {
    setShowAdModal(false);
    if (pendingFile) {
      processImage(pendingFile);
      setPendingFile(null);
    }
  };

  const handleAdCancel = () => {
    setShowAdModal(false);
    setPendingFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Reset input
    }
  };

  const processImage = async (file: File) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      // Convert FileReader to a Promise to await the result properly
      const { base64Data, mimeType } = await new Promise<{ base64Data: string, mimeType: string }>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          // Extract proper mime type and clean base64 data
          // Data URL format: "data:image/png;base64,..."
          const matches = result.match(/^data:(.+);base64,(.+)$/);

          if (matches && matches.length === 3) {
            resolve({
              mimeType: matches[1],
              base64Data: matches[2]
            });
          } else {
            // Fallback if parsing fails, though uncommon for FileReader
            const data = result.includes(',') ? result.split(',')[1] : result;
            resolve({ mimeType: file.type || 'image/jpeg', base64Data: data });
          }
        };
        reader.onerror = () => reject(new Error("Dosya okuma hatası"));
        reader.readAsDataURL(file);
      });

      const extractedText = await extractTextFromImage(base64Data, mimeType);

      if (!extractedText) {
        throw new Error("Resimden metin çıkarılamadı.");
      }

      setText(prev => {
        const cleanExtracted = extractedText.trim();
        if (!cleanExtracted) return prev;
        return prev ? prev + '\n\n' + cleanExtracted : cleanExtracted;
      });
    } catch (error: any) {
      console.error(error);
      setErrorMsg(error.message || "Resim işlenirken beklenmedik bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      initiateImageProcessing(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !text.trim()) {
      setErrorMsg("Lütfen bir başlık ve dua metni giriniz.");
      return;
    }

    let tags: string[] = [];
    if (category === 'Diğer') {
      tags = customTags.trim() ? customTags.split(',').map(t => t.trim()).filter(t => t.length > 0) : [];
    } else {
      tags = [category];
    }

    // Fallback if no tag selected/entered
    if (tags.length === 0) tags = ["Genel"];

    let targetNum = parseInt(target);
    if (isNaN(targetNum) || targetNum < 0) targetNum = 0;

    const newPrayer: Prayer = {
      id: uuidv4(),
      title: title.trim(),
      turkish: text.trim(),
      meaning: meaning.trim(), // Add Meaning
      targetCount: targetNum,
      currentCount: 0,
      tags: tags,
      lastUpdated: Date.now()
    };

    onSave(newPrayer);
  };

  return (
    <div className="h-full overflow-y-auto bg-[#ecfdf5] w-full relative pb-28">
      {/* Background Pattern */}
      <div className="islamic-pattern fixed inset-0 z-0 pointer-events-none"></div>

      {/* Ad Modal */}
      {showAdModal && (
        <RewardAdModal
          cost={ocrAdRate}
          title="Fotoğraftan Metin Tara"
          description={`Yapay zeka görüntü işleme teknolojisi ile resimdeki yazıları metne dönüştürmek için ${ocrAdRate} reklam izleyin.`}
          onComplete={handleAdComplete}
          onCancel={handleAdCancel}
          onOpenPremium={onOpenPremium}
        />
      )}

      {/* Header */}
      {!hideHeader && (
        <div className="bg-white/90 backdrop-blur-md px-4 py-4 border-b border-emerald-100 flex items-center justify-between sticky top-0 z-30 shadow-sm">
          <button onClick={onCancel} className="text-stone-500 hover:text-stone-800 p-1">
            <X size={24} />
          </button>
          <h2 className="font-cinzel font-bold text-lg text-teal-900">Yeni Dua Ekle</h2>
          <div className="w-6"></div>
        </div>
      )}

      {/* Content Area */}
      <div className="p-5 relative z-10">
        <form onSubmit={handleSubmit} className="space-y-6">

          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2 animate-in slide-in-from-top-2">
              <AlertCircle size={20} className="shrink-0 mt-0.5" />
              <p className="text-sm font-medium">{errorMsg}</p>
            </div>
          )}

          <div className="bg-white/90 p-4 rounded-xl shadow-sm border border-emerald-50">
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">Başlık *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Örn: Rızık Duası"
              className="w-full p-2 text-lg font-serif border-b border-stone-200 focus:border-teal-600 focus:outline-none bg-transparent transition-colors placeholder:text-stone-300 text-teal-900"
              required
            />
          </div>

          <div className="bg-white/90 p-4 rounded-xl shadow-sm border border-emerald-50">
            <div className="flex items-center gap-2 mb-2">
              <Tag size={14} className="text-amber-500" />
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-500">Kategori</label>
            </div>

            <div className="relative">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2 bg-transparent border-b border-stone-200 focus:border-teal-600 focus:outline-none text-stone-700 font-serif appearance-none cursor-pointer relative z-10"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-2 top-2.5 text-stone-400 pointer-events-none z-0" />
            </div>

            {category === 'Diğer' && (
              <div className="mt-3 animate-in slide-in-from-top-1 fade-in">
                <input
                  type="text"
                  value={customTags}
                  onChange={(e) => setCustomTags(e.target.value)}
                  placeholder="Örn: Günlük, Şifa"
                  className="w-full p-2.5 bg-stone-50 rounded-lg border border-stone-200 focus:border-teal-500 outline-none text-sm text-stone-700 placeholder:text-stone-400"
                  autoFocus
                />
                <p className="text-[10px] text-stone-400 mt-1 ml-1">Birden fazla etiket için virgül kullanın.</p>
              </div>
            )}
          </div>

          <div className="bg-white/90 p-4 rounded-xl shadow-sm border border-emerald-50">
            <div className="flex justify-between items-center mb-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-500">Okunuş / Metin *</label>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                  className="text-xs flex items-center text-teal-700 font-bold bg-teal-50 border border-teal-100 px-3 py-1.5 rounded-full active:bg-teal-100 transition-colors"
                >
                  {loading ? <Loader2 size={12} className="animate-spin mr-1" /> : <Camera size={12} className="mr-1" />}
                  Fotoğraf Tara
                </button>
              </div>

              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
            </div>

            <div className="mb-2 px-3 py-3 bg-stone-50 rounded-lg border border-dashed border-stone-300 flex items-center justify-center gap-2 text-stone-500 text-xs select-none cursor-text hover:bg-stone-100 transition-colors" onClick={() => document.getElementById('prayer-text-area')?.focus()}>
              <ImagePlus size={14} />
              <span>Metin için fotoğraf çekin veya buraya resim yapıştırın</span>
            </div>

            <textarea
              id="prayer-text-area"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Duanın Arapça veya Türkçe okunuşunu yazın..."
              className="w-full p-3 rounded-lg bg-stone-50 border border-stone-300 min-h-[120px] focus:border-teal-500 focus:ring-1 focus:ring-teal-200 transition-all outline-none resize-none font-serif text-lg leading-relaxed text-stone-900 placeholder:text-stone-400"
              required
            />
            {loading && (
              <div className="flex items-center justify-center gap-2 text-teal-600 mt-2 bg-teal-50 p-2 rounded text-sm animate-pulse border border-teal-100 shadow-sm">
                <Loader2 size={16} className="animate-spin" />
                <span>Resim analizi yapılıyor...</span>
              </div>
            )}
          </div>

          {/* Meaning Field */}
          <div className="bg-white/90 p-4 rounded-xl shadow-sm border border-emerald-50">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen size={14} className="text-teal-600" />
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-500">Türkçe Meal (İsteğe Bağlı)</label>
            </div>

            <textarea
              value={meaning}
              onChange={(e) => setMeaning(e.target.value)}
              placeholder="Duanın Türkçe anlamını buraya ekleyebilirsiniz..."
              className="w-full p-3 rounded-lg bg-stone-50 border border-stone-300 min-h-[80px] focus:border-teal-500 focus:ring-1 focus:ring-teal-200 transition-all outline-none resize-none font-serif text-base leading-relaxed text-stone-700 placeholder:text-stone-400"
            />
          </div>

          <div className="bg-white/90 p-4 rounded-xl shadow-sm border border-emerald-50">
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-3">Hedef Sayı</label>
            <div className="flex gap-2 flex-wrap mb-3">
              <button
                type="button"
                onClick={() => setTarget('0')}
                className={`px-3 py-1.5 rounded-full text-sm font-serif border transition-all ${target === '0'
                  ? 'bg-teal-700 text-white border-teal-700 shadow-md'
                  : 'bg-stone-50 text-stone-600 border-stone-200 hover:border-teal-300 hover:bg-stone-100'
                  }`}
              >
                Sınırsız (∞)
              </button>
              {[33, 99, 100].map(num => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setTarget(num.toString())}
                  className={`px-3 py-1.5 rounded-full text-sm font-serif border transition-all ${target === num.toString()
                    ? 'bg-teal-700 text-white border-teal-700 shadow-md'
                    : 'bg-stone-50 text-stone-600 border-stone-200 hover:border-teal-300 hover:bg-stone-100'
                    }`}
                >
                  {num}
                </button>
              ))}
            </div>
            <input
              type="number"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg outline-none focus:border-teal-500 font-mono text-stone-900 text-sm focus:bg-white transition-colors"
              placeholder="Özel hedef giriniz..."
              min="0"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-linear-to-r from-teal-700 to-teal-800 text-amber-50 rounded-xl font-cinzel font-bold tracking-widest shadow-lg shadow-teal-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 border border-teal-600 disabled:opacity-50"
          >
            <Save size={20} />
            {loading ? 'ANALİZ EDİLİYOR...' : 'KAYDET'}
          </button>

          <div className="h-8"></div>
        </form>
      </div>
    </div>
  );
};

export default AddPrayer;
