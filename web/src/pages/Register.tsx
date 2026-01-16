import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Loader2, Bolt, ShieldCheck, Cloud } from 'lucide-react';
import { supabase } from '../lib/supabase';

const features = [
    { icon: Bolt, title: 'Transfers in a flash', description: 'Lightning-fast uploads and downloads powered by modern infrastructure.' },
    { icon: ShieldCheck, title: 'End-to-end encryption', description: 'Your files are protected with military-grade encryption at every step.' },
    { icon: Cloud, title: 'Access from anywhere', description: 'Seamlessly sync across all your devices - phone, tablet, or desktop.' },
];

export const Register = ({ onBack, onSuccess }: { onBack: () => void, onSuccess: () => void }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: { full_name: name }
                }
            });
            if (error) throw error;
            onSuccess();
        } catch (err: any) {
            setError(err.message || 'Kunne ikke registrere bruker');
        } finally {
            setLoading(false);
        }
    };

    const inputStyle: React.CSSProperties = {
        height: '60px',
        borderRadius: '16px',
        padding: '0 24px',
        fontSize: '17px',
        color: '#000000',
        backgroundColor: '#FFFFFF',
        border: '1px solid #E5E5E5',
        outline: 'none',
        width: '100%',
        boxSizing: 'border-box',
    };

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: '#FFFFFF',
            display: 'flex',
            overflow: 'hidden'
        }}>
            {/* Left Side - Form */}
            <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '48px'
            }}>
                <div style={{
                    width: '100%',
                    maxWidth: '420px',
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: '550px'
                }}>
                    {/* Back Button */}
                    <motion.button
                        onClick={onBack}
                        initial={{ x: -10, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        style={{
                            width: '40px',
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '32px',
                            marginLeft: '-8px',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        <ChevronLeft size={28} color="#000000" />
                    </motion.button>

                    {/* Header */}
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        style={{ marginBottom: '40px' }}
                    >
                        <h1 style={{
                            fontSize: '36px',
                            fontWeight: 800,
                            color: '#000000',
                            margin: 0
                        }}>Create Account</h1>
                        <p style={{
                            fontSize: '16px',
                            color: '#666666',
                            margin: '8px 0 0 0'
                        }}>Join FlashFiles and start sharing</p>
                    </motion.div>

                    {/* Form */}
                    <motion.form
                        onSubmit={handleRegister}
                        style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        <input
                            type="text"
                            required
                            style={inputStyle}
                            placeholder="Full Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={loading}
                        />

                        <input
                            type="email"
                            required
                            style={inputStyle}
                            placeholder="Email Address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={loading}
                        />

                        <input
                            type="password"
                            required
                            style={inputStyle}
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                        />

                        {error && (
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                style={{ color: '#EF4444', fontSize: '14px', margin: 0 }}
                            >
                                {error}
                            </motion.p>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                height: '60px',
                                borderRadius: '16px',
                                backgroundColor: '#000000',
                                color: '#FFFFFF',
                                fontWeight: 'bold',
                                fontSize: '17px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginTop: '16px',
                                opacity: loading ? 0.7 : 1,
                                border: 'none',
                                cursor: 'pointer',
                                transition: 'opacity 0.2s'
                            }}
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Create Account'}
                        </button>

                        <p style={{
                            fontSize: '12px',
                            color: '#999999',
                            lineHeight: '18px',
                            marginTop: '8px',
                            textAlign: 'center'
                        }}>
                            By signing up, you agree to our <span style={{ fontWeight: 600, color: '#000000' }}>Terms of Service</span> and <span style={{ fontWeight: 600, color: '#000000' }}>Privacy Policy</span>.
                        </p>
                    </motion.form>

                    {/* Footer */}
                    <motion.div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginTop: 'auto',
                            paddingTop: '40px'
                        }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        <span style={{ color: '#666666' }}>Already have an account? </span>
                        <button
                            onClick={onBack}
                            style={{
                                fontWeight: 'bold',
                                color: '#000000',
                                marginLeft: '4px',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: 0
                            }}
                        >
                            Sign In
                        </button>
                    </motion.div>
                </div>
            </div>

            {/* Right Side - Features Panel */}
            <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                style={{
                    flex: 1,
                    background: 'linear-gradient(135deg, #F8FAFC 0%, #EEF2FF 100%)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '64px',
                    position: 'relative',
                    overflow: 'hidden'
                }}
            >
                {/* Decorative Blob */}
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '600px',
                    height: '600px',
                    background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)',
                    borderRadius: '50%',
                    pointerEvents: 'none'
                }} />

                <div style={{ maxWidth: '400px', position: 'relative', zIndex: 1 }}>
                    <motion.h2
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        style={{
                            fontSize: '28px',
                            fontWeight: 800,
                            color: '#1E293B',
                            marginBottom: '40px'
                        }}
                    >
                        Why FlashFiles?
                    </motion.h2>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                        {features.map((feature, index) => (
                            <motion.div
                                key={index}
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.5 + index * 0.1 }}
                                style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}
                            >
                                <div style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '12px',
                                    backgroundColor: '#FFFFFF',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                                    flexShrink: 0
                                }}>
                                    <feature.icon size={24} color="#007AFF" />
                                </div>
                                <div>
                                    <h3 style={{
                                        fontSize: '18px',
                                        fontWeight: 700,
                                        color: '#1E293B',
                                        margin: '0 0 4px 0'
                                    }}>
                                        {feature.title}
                                    </h3>
                                    <p style={{
                                        fontSize: '14px',
                                        color: '#64748B',
                                        margin: 0,
                                        lineHeight: '1.5'
                                    }}>
                                        {feature.description}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
