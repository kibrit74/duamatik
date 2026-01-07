import React, { useState, useEffect } from 'react';
import { FileText, Plus, Trash2, Eye, EyeOff, FolderOpen, Edit2 } from 'lucide-react';
import {
    getAllArticles, getAllCategories, createArticle, updateArticle, deleteArticle,
    createCategory, deleteCategory, Article, ArticleCategory
} from '../services/supabase';

const AdminCMS: React.FC = () => {
    const [articles, setArticles] = useState<Article[]>([]);
    const [categories, setCategories] = useState<ArticleCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'articles' | 'categories'>('articles');
    const [showForm, setShowForm] = useState(false);
    const [editingArticle, setEditingArticle] = useState<Article | null>(null);

    // Article form state
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [excerpt, setExcerpt] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [isPublished, setIsPublished] = useState(false);

    // Category form state
    const [categoryName, setCategoryName] = useState('');
    const [showCategoryForm, setShowCategoryForm] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const [arts, cats] = await Promise.all([getAllArticles(), getAllCategories()]);
        setArticles(arts);
        setCategories(cats);
        setLoading(false);
    };

    const handleCreateArticle = async () => {
        if (!title || !content) return;

        const article = await createArticle({
            title,
            content,
            excerpt,
            category_id: categoryId || undefined,
            is_published: isPublished
        });

        if (article) {
            setArticles([article, ...articles]);
            resetForm();
        }
    };

    const handleUpdateArticle = async () => {
        if (!editingArticle || !title || !content) return;

        const success = await updateArticle(editingArticle.id!, {
            title,
            content,
            excerpt,
            category_id: categoryId || undefined,
            is_published: isPublished
        });

        if (success) {
            await loadData();
            resetForm();
        }
    };

    const handleTogglePublish = async (article: Article) => {
        const success = await updateArticle(article.id!, { is_published: !article.is_published });
        if (success) {
            setArticles(articles.map(a => a.id === article.id ? { ...a, is_published: !a.is_published } : a));
        }
    };

    const handleDeleteArticle = async (id: string) => {
        if (!confirm('Bu makaleyi silmek istediğinize emin misiniz?')) return;
        const success = await deleteArticle(id);
        if (success) {
            setArticles(articles.filter(a => a.id !== id));
        }
    };

    const handleCreateCategory = async () => {
        if (!categoryName) return;
        const cat = await createCategory({ name: categoryName });
        if (cat) {
            setCategories([...categories, cat]);
            setCategoryName('');
            setShowCategoryForm(false);
        }
    };

    const handleDeleteCategory = async (id: string) => {
        if (!confirm('Bu kategoriyi silmek istediğinize emin misiniz?')) return;
        const success = await deleteCategory(id);
        if (success) {
            setCategories(categories.filter(c => c.id !== id));
        }
    };

    const startEdit = (article: Article) => {
        setEditingArticle(article);
        setTitle(article.title);
        setContent(article.content);
        setExcerpt(article.excerpt || '');
        setCategoryId(article.category_id || '');
        setIsPublished(article.is_published || false);
        setShowForm(true);
    };

    const resetForm = () => {
        setTitle('');
        setContent('');
        setExcerpt('');
        setCategoryId('');
        setIsPublished(false);
        setShowForm(false);
        setEditingArticle(null);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-stone-800">İçerik Yönetimi (CMS)</h2>
                    <p className="text-stone-500 text-sm">Makale ve kategori yönetimi</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveTab('articles')}
                        className={`px-4 py-2 rounded-xl font-medium transition-colors ${activeTab === 'articles' ? 'bg-teal-600 text-white' : 'bg-stone-100 text-stone-600'}`}
                    >
                        Makaleler
                    </button>
                    <button
                        onClick={() => setActiveTab('categories')}
                        className={`px-4 py-2 rounded-xl font-medium transition-colors ${activeTab === 'categories' ? 'bg-teal-600 text-white' : 'bg-stone-100 text-stone-600'}`}
                    >
                        Kategoriler
                    </button>
                </div>
            </div>

            {activeTab === 'articles' && (
                <>
                    {/* New Article Button */}
                    <button
                        onClick={() => { resetForm(); setShowForm(true); }}
                        className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors"
                    >
                        <Plus size={18} />
                        Yeni Makale
                    </button>

                    {/* Article Form */}
                    {showForm && (
                        <div className="bg-white rounded-2xl border-2 border-teal-200 p-6 space-y-4">
                            <h3 className="font-bold text-stone-800">
                                {editingArticle ? 'Makale Düzenle' : 'Yeni Makale Oluştur'}
                            </h3>

                            <div>
                                <label className="block text-sm font-medium text-stone-600 mb-1">Başlık *</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    placeholder="Makale başlığı"
                                    className="w-full px-4 py-2 border border-stone-200 rounded-xl focus:border-teal-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-stone-600 mb-1">Özet</label>
                                <input
                                    type="text"
                                    value={excerpt}
                                    onChange={e => setExcerpt(e.target.value)}
                                    placeholder="Kısa açıklama"
                                    className="w-full px-4 py-2 border border-stone-200 rounded-xl focus:border-teal-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-stone-600 mb-1">İçerik * (Markdown)</label>
                                <textarea
                                    value={content}
                                    onChange={e => setContent(e.target.value)}
                                    placeholder="Makale içeriği... (Markdown desteklenir)"
                                    className="w-full px-4 py-2 border border-stone-200 rounded-xl focus:border-teal-500 outline-none h-48 font-mono text-sm"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-stone-600 mb-1">Kategori</label>
                                    <select
                                        value={categoryId}
                                        onChange={e => setCategoryId(e.target.value)}
                                        className="w-full px-4 py-2 border border-stone-200 rounded-xl focus:border-teal-500 outline-none"
                                    >
                                        <option value="">Kategori Seçin</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex items-center gap-3 pt-6">
                                    <input
                                        type="checkbox"
                                        id="published"
                                        checked={isPublished}
                                        onChange={e => setIsPublished(e.target.checked)}
                                        className="w-5 h-5"
                                    />
                                    <label htmlFor="published" className="text-sm text-stone-600">Yayınla</label>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={editingArticle ? handleUpdateArticle : handleCreateArticle}
                                    className="flex-1 py-3 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700"
                                >
                                    {editingArticle ? 'Güncelle' : 'Oluştur'}
                                </button>
                                <button
                                    onClick={resetForm}
                                    className="px-6 py-3 bg-stone-100 text-stone-600 rounded-xl font-bold hover:bg-stone-200"
                                >
                                    İptal
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Articles List */}
                    <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
                        <div className="p-4 border-b border-stone-100 bg-stone-50">
                            <h3 className="font-bold text-stone-800 flex items-center gap-2">
                                <FileText size={18} className="text-teal-600" />
                                Makaleler ({articles.length})
                            </h3>
                        </div>

                        {loading ? (
                            <div className="p-8 text-center text-stone-400">Yükleniyor...</div>
                        ) : articles.length === 0 ? (
                            <div className="p-8 text-center text-stone-400">Henüz makale oluşturulmamış.</div>
                        ) : (
                            <div className="divide-y divide-stone-100">
                                {articles.map(article => (
                                    <div key={article.id} className="p-4 flex items-center gap-4 hover:bg-stone-50">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-bold text-stone-800 truncate">{article.title}</h4>
                                                {article.is_published ? (
                                                    <span className="text-[10px] bg-green-100 text-green-600 px-2 py-0.5 rounded-full">Yayında</span>
                                                ) : (
                                                    <span className="text-[10px] bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full">Taslak</span>
                                                )}
                                                {article.category_name && (
                                                    <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{article.category_name}</span>
                                                )}
                                            </div>
                                            {article.excerpt && <p className="text-sm text-stone-500 truncate">{article.excerpt}</p>}
                                            <span className="text-xs text-stone-400">{new Date(article.created_at!).toLocaleDateString('tr-TR')}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => startEdit(article)}
                                                className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleTogglePublish(article)}
                                                className={`p-2 rounded-lg ${article.is_published ? 'text-green-600 hover:bg-green-50' : 'text-stone-400 hover:bg-stone-100'}`}
                                            >
                                                {article.is_published ? <Eye size={18} /> : <EyeOff size={18} />}
                                            </button>
                                            <button
                                                onClick={() => handleDeleteArticle(article.id!)}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}

            {activeTab === 'categories' && (
                <>
                    {/* New Category */}
                    <button
                        onClick={() => setShowCategoryForm(!showCategoryForm)}
                        className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors"
                    >
                        <Plus size={18} />
                        Yeni Kategori
                    </button>

                    {showCategoryForm && (
                        <div className="bg-white rounded-2xl border-2 border-teal-200 p-6 flex gap-4">
                            <input
                                type="text"
                                value={categoryName}
                                onChange={e => setCategoryName(e.target.value)}
                                placeholder="Kategori adı"
                                className="flex-1 px-4 py-2 border border-stone-200 rounded-xl focus:border-teal-500 outline-none"
                            />
                            <button
                                onClick={handleCreateCategory}
                                className="px-6 py-2 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700"
                            >
                                Ekle
                            </button>
                        </div>
                    )}

                    {/* Categories List */}
                    <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
                        <div className="p-4 border-b border-stone-100 bg-stone-50">
                            <h3 className="font-bold text-stone-800 flex items-center gap-2">
                                <FolderOpen size={18} className="text-purple-600" />
                                Kategoriler ({categories.length})
                            </h3>
                        </div>

                        {categories.length === 0 ? (
                            <div className="p-8 text-center text-stone-400">Henüz kategori oluşturulmamış.</div>
                        ) : (
                            <div className="divide-y divide-stone-100">
                                {categories.map(cat => (
                                    <div key={cat.id} className="p-4 flex items-center justify-between hover:bg-stone-50">
                                        <div>
                                            <h4 className="font-bold text-stone-800">{cat.name}</h4>
                                            <span className="text-xs text-stone-400">{cat.slug}</span>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteCategory(cat.id!)}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default AdminCMS;
