import React, { useEffect, useState } from 'react';
import { ArrowLeft, Calendar, Tag, Share2, Type, Minus, Plus } from 'lucide-react';
import { Article, supabase } from '../services/supabase';
import { Share } from '@capacitor/share';

interface ArticleDetailProps {
    article: Article;
    onBack: () => void;
}

const ArticleDetail: React.FC<ArticleDetailProps> = ({ article, onBack }) => {
    const [fontSize, setFontSize] = useState(16);
    const [showFontControls, setShowFontControls] = useState(false);

    useEffect(() => {
        // Increment view count in database
        if (article.id) {
            supabase
                .from('articles')
                .update({ view_count: (article.view_count || 0) + 1 })
                .eq('id', article.id)
                .then(() => { });
        }
    }, [article.id]);

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const handleShare = async () => {
        // Tam içerikten ilk 500 karakter + özet
        const contentPreview = article.content.substring(0, 500) + (article.content.length > 500 ? '...' : '');
        const shareText = `${article.title}\n\n${contentPreview}\n\n📿 Dijital Tesbih & Dua Uygulaması`;
        try {
            await Share.share({
                title: article.title,
                text: shareText,
                dialogTitle: 'Makaleyi Paylaş'
            });
        } catch (error: any) {
            // User cancelled or error occurred
            if (error?.message !== 'Share canceled') {
                // Fallback: copy to clipboard
                try {
                    await navigator.clipboard.writeText(shareText);
                    alert('Makale metni kopyalandı!');
                } catch (clipErr) {
                    console.error('Paylaşım başarısız:', error);
                }
            }
        }
    };

    const increaseFontSize = () => {
        if (fontSize < 24) setFontSize(fontSize + 2);
    };

    const decreaseFontSize = () => {
        if (fontSize > 12) setFontSize(fontSize - 2);
    };

    return (
        <div className="h-full flex flex-col bg-white">
            {/* Fixed Header */}
            <div className="shrink-0 bg-white/95 backdrop-blur-lg border-b border-stone-100 z-10">
                <div className="flex items-center justify-between px-4 py-3">
                    <button
                        onClick={onBack}
                        className="p-2 -ml-2 hover:bg-stone-100 rounded-lg transition-colors"
                    >
                        <ArrowLeft size={24} className="text-stone-700" />
                    </button>
                    <div className="flex items-center gap-2">
                        {/* Font Size Toggle */}
                        <button
                            onClick={() => setShowFontControls(!showFontControls)}
                            className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
                        >
                            <Type size={20} className="text-stone-600" />
                        </button>
                        <button
                            onClick={handleShare}
                            className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
                        >
                            <Share2 size={20} className="text-stone-600" />
                        </button>
                    </div>
                </div>

                {/* Font Size Controls */}
                {showFontControls && (
                    <div className="flex items-center justify-center gap-4 py-3 border-t border-stone-100 bg-stone-50">
                        <button
                            onClick={decreaseFontSize}
                            className="p-2 bg-white border border-stone-200 rounded-lg hover:bg-stone-100 disabled:opacity-50"
                            disabled={fontSize <= 12}
                        >
                            <Minus size={18} />
                        </button>
                        <span className="text-sm font-medium text-stone-600 w-16 text-center">
                            {fontSize}px
                        </span>
                        <button
                            onClick={increaseFontSize}
                            className="p-2 bg-white border border-stone-200 rounded-lg hover:bg-stone-100 disabled:opacity-50"
                            disabled={fontSize >= 24}
                        >
                            <Plus size={18} />
                        </button>
                    </div>
                )}
            </div>

            {/* Scrollable Content */}
            <div
                className="flex-1 overflow-y-auto"
                style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#0d9488 #e7e5e4'
                }}
            >
                {/* Cover Image */}
                {article.cover_image && (
                    <div
                        className="h-48 bg-cover bg-center"
                        style={{ backgroundImage: `url(${article.cover_image})` }}
                    />
                )}

                {/* Content */}
                <div className="px-5 py-6">
                    {/* Category */}
                    {article.category_name && (
                        <div className="flex items-center gap-1 text-xs text-teal-600 font-bold mb-3">
                            <Tag size={12} />
                            {article.category_name}
                        </div>
                    )}

                    {/* Title */}
                    <h1 className="text-2xl font-bold text-stone-800 mb-4 leading-tight">
                        {article.title}
                    </h1>

                    {/* Meta - Sadece tarih */}
                    <div className="flex items-center gap-4 text-sm text-stone-400 mb-6 pb-6 border-b border-stone-100">
                        <span className="flex items-center gap-1">
                            <Calendar size={14} />
                            {formatDate(article.published_at)}
                        </span>
                    </div>

                    {/* Article Body */}
                    <div
                        className="prose prose-stone max-w-none"
                        style={{
                            fontSize: `${fontSize}px`,
                            lineHeight: 1.9
                        }}
                    >
                        {article.content.split('\n\n').map((paragraph, idx) => {
                            // Bold başlıkları tespit et
                            if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
                                return (
                                    <h3 key={idx} className="font-bold text-stone-800 mt-6 mb-3" style={{ fontSize: `${fontSize + 2}px` }}>
                                        {paragraph.replace(/\*\*/g, '')}
                                    </h3>
                                );
                            }
                            // Liste öğeleri
                            if (paragraph.startsWith('- ')) {
                                const items = paragraph.split('\n').filter(line => line.startsWith('- '));
                                return (
                                    <ul key={idx} className="list-disc list-inside space-y-2 my-4 text-stone-700">
                                        {items.map((item, i) => (
                                            <li key={i}>{item.replace('- ', '')}</li>
                                        ))}
                                    </ul>
                                );
                            }
                            // Normal paragraf
                            return (
                                <p key={idx} className="mb-4 text-stone-700">
                                    {paragraph.split('**').map((part, i) =>
                                        i % 2 === 1 ? <strong key={i}>{part}</strong> : part
                                    )}
                                </p>
                            );
                        })}
                    </div>
                </div>

                {/* Bottom Padding */}
                <div className="h-24" />
            </div>
        </div>
    );
};

export default ArticleDetail;
