import React from 'react';
import Logo from './Logo';

interface LoadingScreenProps {
    message?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ message = "Yükleniyor..." }) => {
    return (
        <div className="fixed inset-0 z-50 bg-gradient-to-b from-[#ecfdf5] to-[#ccfbf1] flex flex-col items-center justify-center p-6">
            {/* Decorative Background Elements */}
            <div className="islamic-pattern absolute inset-0 opacity-10 pointer-events-none"></div>

            <div className="relative">
                {/* Pulsing Glow Effect */}
                <div className="absolute inset-0 bg-teal-500/20 rounded-full blur-2xl animate-pulse"></div>

                {/* Animated Logo */}
                <div className="relative animate-[spin_3s_linear_infinite]">
                    <Logo size={96} />
                </div>
            </div>

            {/* Loading Text */}
            <div className="mt-8 flex flex-col items-center gap-2 relative z-10">
                <h3 className="text-xl font-bold font-cinzel text-teal-800 tracking-wider animate-pulse">
                    DUAMATİK
                </h3>
                <p className="text-sm font-serif italic text-teal-600/80">
                    {message}
                </p>
            </div>

            {/* Footer Text */}
            <div className="absolute bottom-8 text-xs text-teal-700/40 font-serif italic">
                "Kalpler ancak Allah'ı anmakla huzur bulur."
            </div>
        </div>
    );
};

export default LoadingScreen;
