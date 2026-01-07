import { logger } from '../../utils/logger';
import { supabase } from './client';

const AUDIO_BUCKET = 'prayer-audio';

export async function uploadPrayerAudio(
    userId: string,
    prayerId: string,
    audioBase64: string
): Promise<string | null> {
    try {
        // Convert base64 to Blob
        const byteCharacters = atob(audioBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'audio/wav' });

        const filePath = `${userId}/${prayerId}.wav`;

        const { error } = await supabase.storage
            .from(AUDIO_BUCKET)
            .upload(filePath, blob, {
                upsert: true,
                contentType: 'audio/wav'
            });

        if (error) {
            logger.error('Error uploading audio:', error);
            return null;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from(AUDIO_BUCKET)
            .getPublicUrl(filePath);

        return urlData?.publicUrl || null;
    } catch (e) {
        logger.error('Error in uploadPrayerAudio:', e);
        return null;
    }
}

export async function deletePrayerAudio(userId: string, prayerId: string): Promise<boolean> {
    const filePath = `${userId}/${prayerId}.wav`;

    const { error } = await supabase.storage
        .from(AUDIO_BUCKET)
        .remove([filePath]);

    return !error;
}

export async function downloadPrayerAudio(audioUrl: string): Promise<string | null> {
    try {
        const response = await fetch(audioUrl);
        if (!response.ok) return null;

        const blob = await response.blob();
        const reader = new FileReader();

        return new Promise((resolve) => {
            reader.onloadend = () => {
                const base64 = (reader.result as string).split(',')[1];
                resolve(base64);
            };
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(blob);
        });
    } catch (e) {
        logger.error('Error downloading audio:', e);
        return null;
    }
}
