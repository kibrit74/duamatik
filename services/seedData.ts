/**
 * Seed Script for Supabase Database
 * 
 * Bu script, varsayılan duaları ve alıntıları Supabase'e yükler.
 * Sadece bir kere çalıştırılmalıdır.
 * 
 * Kullanım:
 * 1. Browser console'da:
 *    import('/src/services/seedData.ts').then(m => m.runSeed())
 */

import { seedCatalogPrayers, seedQuotes, checkTablesExist } from './supabase';
import { defaultPrayers } from '../data/defaults';
import { quotes } from '../data/quotes';

export async function runSeed(): Promise<void> {
    console.log('🌱 Starting database seed...');

    // Check if tables exist
    const tables = await checkTablesExist();
    console.log('📋 Tables status:', tables);

    if (!tables.prayers) {
        console.error('❌ prayers table does not exist! Please create it first.');
        console.log('Run the SQL schema in Supabase Dashboard → SQL Editor');
        return;
    }

    // Seed prayers
    console.log('📿 Seeding prayers...');
    const prayersToSeed = defaultPrayers.map(p => ({
        title: p.title,
        arabic: p.arabic,
        turkish: p.turkish,
        meaning: p.meaning,
        target_count: p.targetCount,
        tags: p.tags,
    }));

    const prayersSuccess = await seedCatalogPrayers(prayersToSeed);
    if (prayersSuccess) {
        console.log(`✅ Prayers seeded successfully (${prayersToSeed.length} items)`);
    } else {
        console.error('❌ Failed to seed prayers');
    }

    // Seed quotes
    if (tables.quotes) {
        console.log('💬 Seeding quotes...');
        const quotesSuccess = await seedQuotes(quotes);
        if (quotesSuccess) {
            console.log(`✅ Quotes seeded successfully (${quotes.length} items)`);
        } else {
            console.error('❌ Failed to seed quotes');
        }
    } else {
        console.warn('⚠️ quotes table does not exist, skipping quotes seed');
    }

    console.log('🎉 Seed complete!');
}

// Check database status
export async function checkStatus(): Promise<void> {
    const tables = await checkTablesExist();
    console.log('📋 Database Tables Status:');
    console.log('  - prayers:', tables.prayers ? '✅' : '❌');
    console.log('  - user_prayers:', tables.userPrayers ? '✅' : '❌');
    console.log('  - custom_prayers:', tables.customPrayers ? '✅' : '❌');
    console.log('  - quotes:', tables.quotes ? '✅' : '❌');
}
