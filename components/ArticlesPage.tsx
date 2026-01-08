import React, { useState, useEffect } from 'react';
import { BookOpen, Calendar, Eye, ChevronRight, ArrowLeft, Search, Tag } from 'lucide-react';
import { getPublishedArticles, getAllCategories, Article, ArticleCategory } from '../services/supabase';

interface ArticlesPageProps {
    onSelectArticle: (article: Article) => void;
    onBack: () => void;
}

const ArticlesPage: React.FC<ArticlesPageProps> = ({ onSelectArticle, onBack }) => {
    const [articles, setArticles] = useState<Article[]>([]);
    const [categories, setCategories] = useState<ArticleCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const [arts, cats] = await Promise.all([
            getPublishedArticles(),
            getAllCategories()
        ]);
        setArticles(arts);
        setCategories(cats);
        setLoading(false);
    };

    const filteredArticles = articles.filter(article => {
        const matchesCategory = !selectedCategory || article.category_id === selectedCategory;
        const matchesSearch = !searchQuery ||
            article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            article.excerpt?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div
            className="h-full overflow-y-auto bg-linear-to-b from-stone-50 to-white scrollbar-hide"
        >
            {/* Header */}
            <div className="bg-linear-to-r from-teal-600 to-teal-700 text-white px-4 pt-12 pb-8">
                <div className="flex items-center gap-3 mb-4">
                    <button
                        onClick={onBack}
                        className="p-2 -ml-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold">Makaleler</h1>
                        <p className="text-teal-100 text-sm">İslami bilgiler ve rehberlik</p>
                    </div>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-teal-300" />
                    <input
                        type="text"
                        placeholder="Makale ara..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-teal-200 outline-none focus:bg-white/20"
                    />
                </div>
            </div>

            {/* Categories */}
            {categories.length > 0 && (
                <div className="px-4 py-4 overflow-x-auto">
                    <div className="flex gap-2">
                        <button
                            onClick={() => setSelectedCategory(null)}
                            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${!selectedCategory
                                ? 'bg-teal-600 text-white'
                                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                                }`}
                        >
                            Tümü
                        </button>
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id || null)}
                                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${selectedCategory === cat.id
                                    ? 'bg-teal-600 text-white'
                                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                                    }`}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Articles List */}
            <div className="px-4 pb-24">
                {filteredArticles.length === 0 ? (
                    <div className="text-center py-16 text-stone-400">
                        <BookOpen size={48} className="mx-auto mb-4 opacity-50" />
                        <p>Makale bulunamadı</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredArticles.map(article => (
                            <button
                                key={article.id}
                                onClick={() => onSelectArticle(article)}
                                className="w-full bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow text-left"
                            >
                                {article.cover_image && (
                                    <div
                                        className="h-40 bg-cover bg-center"
                                        style={{ backgroundImage: `url(${article.cover_image})` }}
                                    />
                                )}
                                <div className="p-4">
                                    {article.category_name && (
                                        <div className="flex items-center gap-1 text-xs text-teal-600 font-medium mb-2">
                                            <Tag size={12} />
                                            {article.category_name}
                                        </div>
                                    )}
                                    <h3 className="font-bold text-stone-800 text-lg mb-2 line-clamp-2">
                                        {article.title}
                                    </h3>
                                    {article.excerpt && (
                                        <p className="text-stone-500 text-sm line-clamp-2 mb-3">
                                            {article.excerpt}
                                        </p>
                                    )}
                                    <div className="flex items-center justify-between text-xs text-stone-400">
                                        <div className="flex items-center gap-4">
                                            <span className="flex items-center gap-1">
                                                <Calendar size={12} />
                                                {formatDate(article.published_at)}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Eye size={12} />
                                                {article.view_count || 0}
                                            </span>
                                        </div>
                                        <ChevronRight size={16} className="text-teal-500" />
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ArticlesPage;
