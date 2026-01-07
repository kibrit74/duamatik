import React, { useState, useEffect } from 'react';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import { supabase, getProfile } from './services/supabase';
import { User, Prayer } from './types';
import { Loader2 } from 'lucide-react';

/**
 * AdminApp - Completely separate entry point for admin panel
 * This is loaded ONLY when /admin route is accessed
 * No mobile app logic here at all
 */
const AdminApp: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [prayers, setPrayers] = useState<Prayer[]>([]);

    // Check for existing admin session on mount
    useEffect(() => {
        const checkAdminSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();

                if (session?.user) {
                    // Get profile to check role
                    const profile = await getProfile(session.user.id);

                    if (profile && profile.role === 'admin') {
                        setUser(profile);
                        loadPrayers();
                    }
                }
            } catch (e) {
                console.error('Admin session check failed:', e);
            } finally {
                setLoading(false);
            }
        };

        checkAdminSession();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_OUT') {
                setUser(null);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const loadPrayers = async () => {
        try {
            const { data, error } = await supabase.from('prayers').select('*').order('title');

            if (error) throw error;

            if (data) {
                setPrayers(data.map(p => ({
                    id: p.id,
                    title: p.title,
                    turkish: p.turkish,
                    arabic: p.arabic,
                    meaning: p.meaning,
                    targetCount: p.target_count,
                    currentCount: 0,
                    tags: p.tags || [],
                    lastUpdated: Date.now(),
                    history: [],
                })));
            }
        } catch (e) {
            console.error('Failed to load prayers:', e);
        }
    };

    const handleAdminLogin = (adminUser: User) => {
        setUser(adminUser);
        loadPrayers();
    };

    const handleBack = () => {
        window.location.href = '/';
    };

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="animate-spin text-indigo-600 mx-auto" size={48} />
                    <p className="mt-4 text-gray-600">Admin paneli yükleniyor...</p>
                </div>
            </div>
        );
    }

    // Not logged in - show admin login
    if (!user) {
        return (
            <AdminLogin
                onLogin={handleAdminLogin}
                onBack={handleBack}
            />
        );
    }

    // Not admin role - redirect away
    if (user.role !== 'admin') {
        window.location.href = '/';
        return null;
    }

    // Admin logged in - show dashboard
    return (
        <AdminDashboard
            prayers={prayers}
            onBack={handleBack}
        />
    );
};

export default AdminApp;
