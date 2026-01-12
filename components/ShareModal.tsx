import React, { useRef, useState, useEffect } from 'react';
import { Prayer } from '../types';
import { X, Share2, Download, Copy, Loader2, AlertCircle } from 'lucide-react';
import { toPng } from 'html-to-image';
import Logo from './Logo';
import { Share } from '@capacitor/share';

interface ShareModalProps {
  prayer: Prayer;
  onClose: () => void;
}

const ShareModal: React.FC<ShareModalProps> = ({ prayer, onClose }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [shareFile, setShareFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Base64 dataUrl'i tutmak için state
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const generateImage = async () => {
      await new Promise(resolve => setTimeout(resolve, 500));

      if (!cardRef.current) return;

      try {
        const url = await toPng(cardRef.current, {
          cacheBust: true,
          pixelRatio: 2,
          skipAutoScale: true
        });

        const res = await fetch(url);
        const blob = await res.blob();
        const file = new File([blob], 'dua-kart.png', { type: 'image/png' });

        if (isMounted) {
          setDataUrl(url);
          setShareFile(file);
          setLoading(false);
        }
      } catch (err) {
        console.error("Image generation error:", err);
        if (isMounted) {
          setError("Resim oluşturulamadı.");
          setLoading(false);
        }
      }
    };

    generateImage();

    return () => { isMounted = false; };
  }, [prayer]);

  const handleShare = async () => {
    if (!shareFile) return;

    const shareText = `"${prayer.title}" duasını seninle paylaşıyorum.\n\n${prayer.turkish}\n\n📿 Dijital Tesbih & Dua Uygulaması`;

    // Try Web Share API with files first (works on newer Android/iOS)
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [shareFile] })) {
      try {
        await navigator.share({
          title: prayer.title,
          text: shareText,
          files: [shareFile]
        });
        return;
      } catch (e: any) {
        if (e.name === 'AbortError') return;
        console.log('Web Share with files failed, trying text-only');
      }
    }

    // Fallback: Share text only via Capacitor
    try {
      await Share.share({
        title: prayer.title,
        text: shareText + '\n\n💡 Resmi indirmek için uygulamadaki "Resmi İndir" butonunu kullanın.',
        dialogTitle: 'Duayı Paylaş'
      });
    } catch (shareError: any) {
      if (shareError?.message !== 'Share canceled') {
        copyText();
        alert('Metin kopyalandı! Galeriden resmi paylaşabilirsiniz.');
      }
    }
  };

  const handleDownload = () => {
    if (!dataUrl) return;

    // Yeni pencerede aç - kullanıcı uzun basarak indirebilir
    const newWindow = window.open();
    if (newWindow) {
      newWindow.document.write(`
        <html>
          <head><title>${prayer.title} - Dua Kartı</title></head>
          <body style="margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#1a1a1a;">
            <div style="text-align:center;color:white;font-family:sans-serif;">
              <p style="margin-bottom:16px;">📱 Resmi indirmek için resme uzun basın veya sağ tıklayın</p>
              <img src="${dataUrl}" style="max-width:90vw;max-height:80vh;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,0.3);" />
            </div>
          </body>
        </html>
      `);
      newWindow.document.close();
    } else {
      // Popup engellenmiş - alternatif olarak kopyala
      copyText();
      alert('Resim yeni sekmede açılamadı. Metin kopyalandı.');
    }
  };

  const copyText = () => {
    let textToCopy = `${prayer.title}\n\n${prayer.turkish}`;
    if (prayer.meaning) {
      textToCopy += `\n\nAnlamı: ${prayer.meaning}`;
    }
    textToCopy += `\n\n📿 Dijital Tesbih & Dua`;
    navigator.clipboard.writeText(textToCopy);
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-hidden">
      <div className="w-full h-full overflow-y-auto flex items-center justify-center py-8">
        <div className="w-full max-w-sm flex flex-col gap-4 relative">

          <div className="flex justify-between items-center text-white px-2 sticky top-0 z-50 drop-shadow-md">
            <h3 className="font-cinzel font-bold text-lg">Dua Paylaş</h3>
            <button onClick={onClose} className="bg-white/10 p-2 rounded-full hover:bg-white/20 backdrop-blur-md">
              <X size={20} />
            </button>
          </div>

          <div className="relative shadow-2xl rounded-2xl overflow-hidden bg-stone-100 transform transition-transform mx-auto w-full" ref={cardRef}>
            <div className="absolute inset-0 bg-[#0f766e]">
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
              <div className="absolute inset-0 bg-linear-to-t from-stone-900/90 via-stone-900/40 to-stone-900/10"></div>
            </div>

            <div className="relative p-8 min-h-[450px] flex flex-col items-center text-center z-10">
              <div className="bg-white/10 backdrop-blur-md p-3 rounded-full border border-white/20 mb-6 shrink-0">
                <Logo size={50} />
              </div>

              <div className="flex-1 flex flex-col justify-center gap-5 my-2 w-full">
                <h2 className="text-3xl font-cinzel font-bold text-amber-400 drop-shadow-sm leading-tight">{prayer.title}</h2>

                {prayer.arabic && (
                  <p className="text-2xl font-amiri text-white/95 dir-rtl leading-loose drop-shadow-sm py-2">{prayer.arabic}</p>
                )}

                <div className="w-12 h-1 bg-amber-400/50 mx-auto rounded-full shrink-0"></div>

                <p className="font-serif text-stone-100 text-lg leading-relaxed whitespace-pre-wrap">
                  "{prayer.turkish}"
                </p>

                {prayer.meaning && (
                  <div className="mt-2 pt-2 border-t border-white/10">
                    <p className="font-serif italic text-stone-300 text-sm leading-relaxed whitespace-pre-wrap">
                      "{prayer.meaning}"
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-8 pt-4 border-t border-white/10 w-full shrink-0">
                <p className="text-[10px] text-teal-100 uppercase tracking-[0.3em] font-bold">Dijital Tesbih & Dua</p>
              </div>
            </div>

            {loading && (
              <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-[2px] z-50 flex items-center justify-center flex-col gap-3 text-white">
                <Loader2 size={32} className="animate-spin" />
                <span className="text-sm font-bold tracking-wider">Kart Hazırlanıyor...</span>
              </div>
            )}

            {error && (
              <div className="absolute inset-0 bg-red-900/80 backdrop-blur-[2px] z-50 flex items-center justify-center flex-col gap-3 text-white p-4 text-center">
                <AlertCircle size={32} />
                <span className="text-sm font-bold">{error}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 mt-2 pb-safe">
            <button
              onClick={() => { copyText(); alert('Metin kopyalandı!'); }}
              className="py-3 bg-white text-stone-700 rounded-xl font-bold text-xs hover:bg-stone-50 flex flex-col items-center justify-center gap-1 shadow-lg"
            >
              <Copy size={18} />
              Kopyala
            </button>
            <button
              onClick={handleDownload}
              disabled={loading || !!error}
              className="py-3 bg-teal-600 text-white rounded-xl font-bold text-xs hover:bg-teal-700 flex flex-col items-center justify-center gap-1 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={18} />
              {loading ? '...' : 'Resmi İndir'}
            </button>
            <button
              onClick={handleShare}
              disabled={loading || !!error}
              className="py-3 bg-linear-to-r from-amber-500 to-amber-600 text-white rounded-xl font-bold text-xs hover:from-amber-600 hover:to-amber-700 flex flex-col items-center justify-center gap-1 shadow-lg shadow-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Share2 size={18} />
              {loading ? '...' : 'Paylaş'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;