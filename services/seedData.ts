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
import { logger } from '../utils/logger';
import { seedArticles } from '../seedArticles';

export { seedArticles };

export async function runSeed(): Promise<void> {
    logger.log('🌱 Starting database seed...');

    // Check if tables exist
    const tables = await checkTablesExist();
    logger.log('📋 Tables status:', tables);

    if (!tables.prayers) {
        logger.error('❌ prayers table does not exist! Please create it first.');
        logger.log('Run the SQL schema in Supabase Dashboard → SQL Editor');
        return;
    }

    // Seed prayers
    logger.log('📿 Seeding prayers...');
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
        logger.log(`✅ Prayers seeded successfully (${prayersToSeed.length} items)`);
    } else {
        logger.error('❌ Failed to seed prayers');
    }

    // Seed quotes
    if (tables.quotes) {
        logger.log('💬 Seeding quotes...');
        const quotesSuccess = await seedQuotes(quotes);
        if (quotesSuccess) {
            logger.log(`✅ Quotes seeded successfully (${quotes.length} items)`);
        } else {
            logger.error('❌ Failed to seed quotes');
        }
    } else {
        logger.warn('⚠️ quotes table does not exist, skipping quotes seed');
    }

    logger.log('🎉 Seed complete!');
}

// Check database status
export async function checkStatus(): Promise<void> {
    const tables = await checkTablesExist();
    logger.log('📋 Database Tables Status:');
    logger.log('  - prayers:', tables.prayers ? '✅' : '❌');
    logger.log('  - user_prayers:', tables.userPrayers ? '✅' : '❌');
    logger.log('  - custom_prayers:', tables.customPrayers ? '✅' : '❌');
    logger.log('  - quotes:', tables.quotes ? '✅' : '❌');
}
