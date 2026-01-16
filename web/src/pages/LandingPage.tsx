import { motion } from 'framer-motion';
import { Bolt, ShieldCheck, Cloud, ChevronRight } from 'lucide-react';
import { SwipeAnimation } from '../components/SwipeAnimation';
import iconLogo from '../assets/logo-only-icon.png';
import textLogo from '../assets/logo-only-text.png';

const features = [
    { icon: Bolt, text: 'Transfers in a flash' },
    { icon: ShieldCheck, text: 'End-to-end encryption' },
    { icon: Cloud, text: 'Access from anywhere' },
];

export const LandingPage = ({ onLogin, onRegister }: { onLogin: () => void, onRegister: () => void }) => {
    return (
        <div className="min-h-screen bg-white flex items-center justify-center p-6 md:p-10 overflow-hidden">
            <div className="w-full flex flex-col md:flex-row items-center justify-between gap-12 md:gap-24 px-10 md:px-20">

                {/* Left Section: Content */}
                <div className="flex flex-col items-start gap-8 z-10">
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="flex flex-col items-start gap-2"
                    >
                        <img
                            src={iconLogo}
                            alt="FlashFiles Icon"
                            style={{ height: '64px', width: 'auto', objectFit: 'contain', alignSelf: 'flex-start' }}
                        />
                        <img
                            src={textLogo}
                            alt="FlashFiles Text"
                            className="ml-[-2px]"
                            style={{ height: '28px', width: 'auto', objectFit: 'contain', alignSelf: 'flex-start' }}
                        />
                    </motion.div>

                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="space-y-2"
                    >
                        <h2 className="text-3xl font-bold text-gray-900">
                            Share speed. <br />
                            <span className="text-[#007AFF]">Share securely.</span>
                        </h2>
                        <p className="text-xl text-gray-500 font-medium max-w-md mt-4">
                            Lightning fast file transfers with end-to-end encryption. No limits, no hassle.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="flex flex-col gap-4 w-full"
                    >
                        {features.map((f, i) => (
                            <div key={i} className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100">
                                    <f.icon size={20} className="text-[#007AFF]" />
                                </div>
                                <span className="text-lg font-semibold text-gray-700">{f.text}</span>
                            </div>
                        ))}
                    </motion.div>

                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="flex gap-4 w-full md:w-auto mt-4"
                    >
                        <button
                            onClick={onRegister}
                            className="primary-button gap-2 shadow-lg hover:translate-y-[-2px] transition-all"
                            style={{ minWidth: '180px' }}
                        >
                            Sign Up <ChevronRight size={20} />
                        </button>
                        <button
                            onClick={onLogin}
                            className="secondary-button"
                            style={{ minWidth: '160px' }}
                        >
                            Sign In
                        </button>
                    </motion.div>
                </div>

                {/* Right Section: Animation */}
                <div className="flex items-center justify-end relative">
                    {/* Background Decorative Blob */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-50/50 rounded-full blur-3xl -z-10" />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, x: 50 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="relative z-10"
                    >
                        <SwipeAnimation />
                    </motion.div>
                </div>

            </div>
        </div>
    );
};
