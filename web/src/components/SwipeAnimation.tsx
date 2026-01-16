import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';

export const SwipeAnimation = () => {
    return (
        <div
            className="relative flex items-center justify-center bg-white"
            style={{
                width: '240px',
                height: '480px',
                border: '6px solid #EEEEEE',
                borderRadius: '50px',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)'
            }}
        >
            {/* Dynamic File Card - Always Visible */}
            <motion.div
                className="absolute bg-[#F5F5F7] rounded-2xl flex items-center justify-center shadow-lg transform-gpu"
                style={{
                    width: '120px',
                    height: '160px',
                    zIndex: 10,
                }}
                animate={{
                    y: [140, -800], // Start lower, fly higher
                    scale: [1, 0.4],
                    rotate: [0, 15]
                }}
                transition={{
                    duration: 1.6,
                    ease: [0.8, 0, 1, 1],
                    repeat: Infinity,
                    repeatDelay: 0.6
                }}
            >
                <FileText size={40} color="#007AFF" fill="#007AFF" />
            </motion.div>

            {/* Finger/Touch Indicator */}
            <motion.div
                className="absolute rounded-full bg-[#007AFF]/50 backdrop-blur-sm"
                style={{
                    width: '40px',
                    height: '40px',
                    zIndex: 20,
                    border: '2px solid #007AFF',
                    borderRadius: '50%'
                }}
                animate={{
                    y: [180, 120], // Matches new scale path
                    opacity: [1, 0],
                    scale: [1, 0.8]
                }}
                transition={{
                    duration: 1.2,
                    ease: "easeOut",
                    repeat: Infinity,
                    repeatDelay: 1.0
                }}
            />

            {/* Phone Notch/Home bar decor */}
            <div
                className="absolute bottom-4 w-16 h-1.5 bg-[#EEEEEE] rounded-full"
            />
        </div>
    );
};
