
import { supabase } from './supabase';
import { defaultPrayers } from '../data/defaults';

export const seedPrayers = async () => {
    console.log('🔄 Starting prayer seed with static IDs...');

    try {
        const prayersPayload = defaultPrayers.map(p => ({
            id: p.id,
            title: p.title,
            turkish: p.turkish,
            meaning: p.meaning,
            arabic: p.arabic,
            target_count: p.targetCount,
            tags: p.tags
        }));

        console.log(`Payload prepared for ${prayersPayload.length} prayers.`);

        const { data, error } = await supabase
            .from('prayers')
            .upsert(prayersPayload, { onConflict: 'id' })
            .select();

        if (error) {
            // 23505 = unique_violation (duplicate key value violates unique constraint)
            if (error.code === '23505' || error.code === '409') {
                console.log('ℹ️ Prayers already exist (duplicate title), skipping seed.');
            } else {
                console.error('❌ Error seeding prayers:', error);
                if (error.code === '42501') {
                    console.warn('⚠️ RLS Policy Error. Please check Supabase policies for "prayers" table.');
                }
                throw error; // Re-throw real errors
            }
        } else {
            console.log('✅ Prayers seeded successfully!', data?.length, 'records upserted.');
        }
    } catch (e) {
        console.error('❌ Seed failed unexpectedly:', e);
    }
};
