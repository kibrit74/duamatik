/**
 * Logger utility for managing application logs.
 * Suppresses logs in production environment using import.meta.env.PROD.
 */
class Logger {
    private isDev: boolean;

    constructor() {
        // Check if we are in production
        // Vite uses import.meta.env.PROD
        this.isDev = import.meta.env.DEV;
    }

    log(message: string, ...args: any[]): void {
        if (this.isDev) {
            console.log(`[LOG] ${message}`, ...args);
        }
    }

    warn(message: string, ...args: any[]): void {
        if (this.isDev) {
            console.warn(`[WARN] ${message}`, ...args);
        }
    }

    error(message: string, error?: any, ...args: any[]): void {
        // Errors might be useful to log even in prod if we had a service like Sentry
        // For now, allow errors to be logged to console in dev, 
        // maybe suppress in prod if strictly requested, but usually errors are good to keep.
        // However, user asked to remove console.logs in production. 
        // We will keep errors as they are critical.
        if (this.isDev) {
            console.error(`[ERROR] ${message}`, error || '', ...args);
        } else {
            // In prod, maybe we still want to silence them to clean up console?
            // Let's stick to the rule: "Production'da console.log'ları kaldır" generally implies info logs.
            // But strict adherence might require silencing all. 
            // Let's be safe and print errors but maybe less verbose?
            // Actually, usually you WANT errors in prod console for debugging if no Sentry.
            // But let's assume "clean console" is the goal.
            // Re-reading: "Production'da console.log'ları kaldır". Usually refers to .log.
            // I will allow .error but suppress .log and .warn.
            console.error(message, error);
        }
    }
}

export const logger = new Logger();
