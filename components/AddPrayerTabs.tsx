import React, { useState } from 'react';
import { X, PlusCircle, Search } from 'lucide-react';
import { Prayer } from '../types';
import AddPrayer from './AddPrayer';
import SearchPrayer from './SearchPrayer';

interface AddPrayerTabsProps {
    onSave: (prayer: Prayer) => void;
    onCancel: () => void;
    onOpenPremium?: () => void;
    onOpenCoach: () => void;
    onOpenDream: () => void;
}

const AddPrayerTabs: React.FC<AddPrayerTabsProps> = ({
    onSave,
    onCancel,
    onOpenPremium,
    onOpenCoach,
    onOpenDream
}) => {
    const [activeTab, setActiveTab] = useState<'add' | 'search'>('add');
    const [draftData, setDraftData] = useState<Partial<Prayer> | null>(null);

    const handleDraft = (data: Partial<Prayer>) => {
        setDraftData(data);
        setActiveTab('add');
    };

    return (
        <div className="h-full flex flex-col bg-[#ecfdf5]">
            {/* Header with Tabs */}
            <div className="bg-white/95 backdrop-blur-md border-b border-emerald-100 sticky top-0 z-30">
                <div className="flex items-center justify-between px-4 py-3">
                    <button onClick={onCancel} className="text-stone-500 hover:text-stone-800 p-1">
                        <X size={24} />
                    </button>
                    <h2 className="font-cinzel font-bold text-lg text-teal-900">Dua Ekle</h2>
                    <div className="w-6"></div>
                </div>

                {/* Tab Buttons */}
                <div className="flex px-4 pb-3 gap-2">
                    <button
                        onClick={() => setActiveTab('add')}
                        className={`flex-1 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${activeTab === 'add'
                                ? 'bg-teal-600 text-white shadow-md'
                                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                            }`}
                    >
                        <PlusCircle size={16} />
                        Yeni Ekle
                    </button>
                    <button
                        onClick={() => setActiveTab('search')}
                        className={`flex-1 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${activeTab === 'search'
                                ? 'bg-teal-600 text-white shadow-md'
                                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                            }`}
                    >
                        <Search size={16} />
                        Keşfet
                    </button>
                </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-hidden">
                {activeTab === 'add' ? (
                    <AddPrayer
                        onSave={onSave}
                        onCancel={onCancel}
                        initialData={draftData}
                        onOpenPremium={onOpenPremium}
                        hideHeader={true}
                    />
                ) : (
                    <SearchPrayer
                        onDraft={handleDraft}
                        onOpenCoach={onOpenCoach}
                        onOpenDream={onOpenDream}
                    />
                )}
            </div>
        </div>
    );
};

export default AddPrayerTabs;
