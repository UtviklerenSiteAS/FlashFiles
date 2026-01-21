import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Download, Clock, FileText, Image, Video, Files, LayoutGrid, Check, X, Settings } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { supabase } from '../lib/supabase';
import { SecureImage } from '../components/SecureImage';
import { useLanguage } from '../lib/LanguageContext';
import fullLogo from '../assets/full-logo.png';


const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

interface ReceivedFile {
    fileId: string;
    filename: string;
    size: number;
    receivedAt?: string;
    title?: string;
    description?: string;
}

export const Dashboard = () => {
    const { language, setLanguage, t } = useLanguage();
    const [files, setFiles] = useState<ReceivedFile[]>([]);
    const [connected, setConnected] = useState(false);
    const [activeCategory, setActiveCategory] = useState('All Files');
    const [incomingFile, setIncomingFile] = useState<ReceivedFile | null>(null);
    const [rememberChoice, setRememberChoice] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [autoAcceptEnabled, setAutoAcceptEnabled] = useState(() => localStorage.getItem('flashfiles_auto_accept') === 'true');



    const socketRef = useRef<Socket | null>(null);

    // Function to connect socket with a given token
    const connectSocket = (accessToken: string, userId: string) => {
        // Disconnect existing socket if any
        if (socketRef.current) {
            socketRef.current.disconnect();
        }

        const newSocket = io(BACKEND_URL, {
            auth: { token: accessToken }
        });

        socketRef.current = newSocket;

        newSocket.on('connect', () => {
            console.log('Koblet til WebSocket ✅ User:', userId);
            setConnected(true);
        });

        newSocket.on('file_received', (file: ReceivedFile) => {
            console.log('Ny fil mottatt via WebSocket! 📩', file);
            const fileWithDate = { ...file, receivedAt: new Date().toISOString() };

            // If auto-accept is enabled, add directly without showing popup
            const shouldAutoAccept = localStorage.getItem('flashfiles_auto_accept') === 'true';
            if (shouldAutoAccept) {
                setFiles(prev => {
                    if (prev.some(f => f.fileId === file.fileId)) return prev;
                    return [fileWithDate, ...prev];
                });
            } else {
                setIncomingFile(fileWithDate);
            }
        });

        newSocket.on('disconnect', (reason) => {
            console.log('Koblet fra WebSocket ❌ Årsak:', reason);
            setConnected(false);
        });

        newSocket.on('connect_error', (error) => {
            console.log('WebSocket connect error:', error.message);
            setConnected(false);
        });
    };

    useEffect(() => {
        // Initial connection with forced session refresh
        const initSocket = async () => {
            // First try to refresh the session to get a fresh token
            const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();

            if (refreshError) {
                console.log('Session refresh failed, trying existing session...', refreshError.message);
                // Fall back to existing session
                const { data: { session } } = await supabase.auth.getSession();
                if (session) {
                    connectSocket(session.access_token, session.user.id);
                } else {
                    console.log('No valid session found, user needs to log in again');
                }
            } else if (refreshData.session) {
                console.log('Session refreshed successfully, connecting...');
                connectSocket(refreshData.session.access_token, refreshData.session.user.id);
            }
        };

        initSocket();

        // Listen for auth state changes (token refresh, sign out, etc.)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            console.log('Auth state changed:', event);

            if (event === 'TOKEN_REFRESHED' && session) {
                console.log('Token refreshed, reconnecting WebSocket...');
                connectSocket(session.access_token, session.user.id);
            } else if (event === 'SIGNED_OUT') {
                if (socketRef.current) {
                    socketRef.current.disconnect();
                    socketRef.current = null;
                }
                setConnected(false);
            }
        });

        return () => {
            subscription.unsubscribe();
            if (socketRef.current) {
                console.log('Rydder opp WebSocket-tilkobling...');
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, []);

    const handleAcceptFile = () => {
        if (incomingFile) {
            // Save preference if checkbox is checked
            if (rememberChoice) {
                localStorage.setItem('flashfiles_auto_accept', 'true');
                setAutoAcceptEnabled(true); // Sync with settings dropdown
            }
            setFiles(prev => {
                if (prev.some(f => f.fileId === incomingFile.fileId)) return prev;
                return [incomingFile, ...prev];
            });
            setIncomingFile(null);
            setRememberChoice(false);
        }
    };

    const handleDeclineFile = () => {
        setIncomingFile(null);
        setRememberChoice(false);
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.reload();
    };

    const handleDownload = async (fileId: string) => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        try {
            const response = await fetch(`${BACKEND_URL}/api/download/${fileId}`, {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            });

            if (!response.ok) throw new Error('Nedlasting feilet');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;

            const fileInfo = files.find(f => f.fileId === fileId);
            a.download = fileInfo?.filename || 'download';

            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            console.error(err);
            alert('Kunne ikke laste ned filen. Kanskje den har utløpt?');
        }
    };


    const formatFilename = (name: string) => {
        const parts = name.split('.');
        if (parts.length > 1) {
            const ext = parts.pop();
            const base = parts.join('.');
            if (base.length <= 8) return name;
            return `${base.substring(0, 4)}..${base.substring(base.length - 2)}.${ext}`;
        }
        if (name.length <= 8) return name;
        return `${name.substring(0, 4)}..${name.substring(name.length - 2)}`;
    };

    const getFileCategory = (filename: string) => {
        const ext = filename.split('.').pop()?.toLowerCase() || '';
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'bmp'].includes(ext)) return 'Images';
        if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)) return 'Videos';
        return 'Documents';
    };

    const filteredFiles = files.filter(file => {
        if (activeCategory === 'All Files') return true;
        if (activeCategory === 'Images') return getFileCategory(file.filename) === 'Images';
        if (activeCategory === 'Videos') return getFileCategory(file.filename) === 'Videos';
        if (activeCategory === 'Documents') return getFileCategory(file.filename) === 'Documents';

        return false;
    });

    const formatRelativeDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

        const timeStr = date.toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' });

        if (diffDays === 0) return `I dag, ${timeStr}`;
        if (diffDays === 1) return `I går, ${timeStr}`;
        return date.toLocaleDateString('nb-NO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="h-screen bg-[#FBFBFD] text-[#1D1D1F] font-sans flex flex-col" style={{ height: '100vh', overflow: 'hidden' }}>
            <header className="w-full bg-white flex justify-center p-2 md:p-4" style={{ borderBottom: '1px solid #F0F0F0', flexShrink: 0 }}>
                <div className="w-full flex items-center justify-between" style={{ maxWidth: '1200px' }}>
                    <div className="flex items-center gap-3">
                        <img src={fullLogo} alt="FlashFiles Logo" style={{ height: '45px', width: 'auto' }} />
                        <div
                            className="rounded-full"
                            style={{
                                width: '8px',
                                height: '8px',
                                backgroundColor: connected ? '#34C759' : '#FF3B30',
                                marginLeft: '1px'
                            }}
                            title={connected ? 'Connected' : 'Disconnected'}
                        />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' }}>
                        {/* Settings Button */}
                        <button
                            onClick={() => setShowSettings(!showSettings)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '48px',
                                height: '48px',
                                padding: '8px',
                                borderRadius: '50%',
                                backgroundColor: showSettings ? '#f3f4f6' : '#fafafa',
                                color: '#6b7280',
                                border: '1px solid #e5e7eb',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                            title="Innstillinger"
                        >
                            <Settings size={20} strokeWidth={2} />
                        </button>

                        {/* Settings Dropdown */}
                        {showSettings && (
                            <div
                                style={{
                                    position: 'absolute',
                                    top: '56px',
                                    right: '0',
                                    width: '280px',
                                    backgroundColor: 'white',
                                    borderRadius: '20px',
                                    boxShadow: '0 20px 40px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)',
                                    padding: '16px',
                                    zIndex: 100
                                }}
                            >
                                <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#111', marginBottom: '12px' }}>{t.dashboard.settings}</h4>

                                {/* Language Selector */}
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '12px 14px',
                                        backgroundColor: '#f9fafb',
                                        borderRadius: '12px',
                                        marginBottom: '8px'
                                    }}
                                >
                                    <span style={{ fontSize: '14px', color: '#374151', fontWeight: 500 }}>{t.dashboard.language}</span>
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                        <button
                                            onClick={() => setLanguage('no')}
                                            style={{
                                                width: '40px',
                                                height: '28px',
                                                borderRadius: '6px',
                                                border: language === 'no' ? '2px solid #007AFF' : '2px solid transparent',
                                                backgroundColor: language === 'no' ? '#E3F2FD' : '#f3f4f6',
                                                cursor: 'pointer',
                                                fontSize: '16px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                        >
                                            🇳🇴
                                        </button>
                                        <button
                                            onClick={() => setLanguage('en')}
                                            style={{
                                                width: '40px',
                                                height: '28px',
                                                borderRadius: '6px',
                                                border: language === 'en' ? '2px solid #007AFF' : '2px solid transparent',
                                                backgroundColor: language === 'en' ? '#E3F2FD' : '#f3f4f6',
                                                cursor: 'pointer',
                                                fontSize: '16px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                        >
                                            🇺🇸
                                        </button>
                                    </div>
                                </div>

                                <label
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '12px 14px',
                                        backgroundColor: '#f9fafb',
                                        borderRadius: '12px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <span style={{ fontSize: '14px', color: '#374151', fontWeight: 500 }}>{t.dashboard.autoReceive}</span>
                                    <input
                                        type="checkbox"
                                        checked={autoAcceptEnabled}
                                        onChange={(e) => {
                                            setAutoAcceptEnabled(e.target.checked);
                                            localStorage.setItem('flashfiles_auto_accept', e.target.checked ? 'true' : 'false');
                                        }}
                                        style={{
                                            width: '20px',
                                            height: '20px',
                                            accentColor: '#007AFF',
                                            cursor: 'pointer'
                                        }}
                                    />
                                </label>
                            </div>
                        )}

                        {/* Logout Button */}
                        <button
                            onClick={handleLogout}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '48px',
                                height: '48px',
                                padding: '8px',
                                borderRadius: '50%',
                                backgroundColor: '#fafafa',
                                color: '#6b7280',
                                border: '1px solid #e5e7eb',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                            title="Logg ut"
                        >
                            <LogOut size={20} strokeWidth={2} />
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex-1 flex justify-center" style={{ overflow: 'hidden', height: '100%' }}>
                <div className="w-full flex" style={{ maxWidth: '1200px', height: '100%' }}>
                    {/* Sidebar */}
                    <aside
                        className="hidden md:flex flex-col w-64 p-4 border-r bg-white"
                        style={{
                            flexShrink: 0,
                            height: '100%',
                            overflowY: 'auto',
                            scrollbarWidth: 'none',
                            msOverflowStyle: 'none'
                        }}
                    >
                        <button
                            onClick={() => setActiveCategory('All Files')}
                            className={`sidebar-item ${activeCategory === 'All Files' ? 'active' : ''}`}
                        >
                            <LayoutGrid size={20} />
                            <span>{t.dashboard.allFiles}</span>
                        </button>
                        <button
                            onClick={() => setActiveCategory('Images')}
                            className={`sidebar-item ${activeCategory === 'Images' ? 'active' : ''}`}
                        >
                            <Image size={20} />
                            <span>{t.dashboard.images}</span>
                        </button>
                        <button
                            onClick={() => setActiveCategory('Videos')}
                            className={`sidebar-item ${activeCategory === 'Videos' ? 'active' : ''}`}
                        >
                            <Video size={20} />
                            <span>{t.dashboard.videos}</span>
                        </button>
                        <button
                            onClick={() => setActiveCategory('Documents')}
                            className={`sidebar-item ${activeCategory === 'Documents' ? 'active' : ''}`}
                        >
                            <Files size={20} />
                            <span>{t.dashboard.documents}</span>
                        </button>
                    </aside>

                    {/* Content Area */}
                    <div className="flex-1 p-6 md:p-10 flex flex-col gap-10" style={{ overflowY: 'auto', height: '100%' }}>
                        <section>
                            <h2 className="text-3xl font-bold mb-2 m-0">
                                {activeCategory === 'All Files' ? t.dashboard.allFiles :
                                    activeCategory === 'Images' ? t.dashboard.images :
                                        activeCategory === 'Videos' ? t.dashboard.videos :
                                            activeCategory === 'Documents' ? t.dashboard.documents :
                                                activeCategory}
                            </h2>
                            <p className="text-gray-500 m-0">
                                {activeCategory === 'All Files' ? t.dashboard.filesAppear :
                                    `${t.dashboard.noFiles.split(' ')[0]} ${activeCategory.toLowerCase()}.`}
                            </p>
                        </section>

                        <section
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                                gap: '24px',
                                alignItems: 'start'
                            }}
                        >
                            <AnimatePresence mode="popLayout">
                                {filteredFiles.length === 0 ? (
                                    <motion.div
                                        key="empty"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="col-span-full py-20 text-center text-gray-400"
                                        style={{ gridColumn: '1 / -1' }}
                                    >
                                        <div
                                            className="flex items-center justify-center mx-auto mb-4"
                                            style={{ width: '64px', height: '64px', backgroundColor: '#F9F9F9', borderRadius: '50%' }}
                                        >
                                            <Files size={32} />
                                        </div>
                                        <p className="font-medium text-lg">{t.dashboard.noFiles}</p>
                                    </motion.div>
                                ) : (
                                    filteredFiles.map((file) => (
                                        <motion.div
                                            key={file.fileId}
                                            layout
                                            initial={{ y: 20, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            exit={{ scale: 0.9, opacity: 0 }}
                                            className="bg-white rounded-20 overflow-hidden border border-gray-100 shadow-premium hover:shadow-premium-hover transition-all duration-500 flex flex-col"
                                        >
                                            <SecureImage
                                                fileId={file.fileId}
                                                filename={file.filename}
                                                backendUrl={BACKEND_URL}
                                                className="w-full aspect-square md:aspect-4-3 bg-gray-50 overflow-hidden"
                                                imgClassName="hover:scale-105 transition-all duration-700 ease-out"
                                            />

                                            {/* Metadata Area (Under Image) */}
                                            <div className="flex flex-col flex-1 gap-1" style={{ padding: '12px 10px 16px' }}>
                                                <div className="flex flex-col gap-1.5">
                                                    <h3 className="font-bold text-xl text-black tracking-tight line-clamp-1" style={{ marginTop: '0' }}>
                                                        {file.title || formatFilename(file.filename)}
                                                    </h3>
                                                    {file.description && (
                                                        <p className="text-sm text-gray-500 leading-relaxed line-clamp-2">
                                                            {file.description}
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="pt-1 flex flex-col gap-4">
                                                    <div className="flex items-center justify-between text-gray-400 tracking-tight" style={{ fontSize: '12px', fontWeight: 600 }}>
                                                        <div className="flex items-center gap-2 px-2 py-1.5 rounded-full">
                                                            <Clock size={14} className="opacity-60" />
                                                            {formatRelativeDate(file.receivedAt!)}
                                                        </div>
                                                        <div className="flex items-center gap-2 px-2 py-1.5 rounded-full">
                                                            <FileText size={14} className="opacity-60" />
                                                            {(file.size / (1024 * 1024)).toFixed(2)} MB
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-3">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleDownload(file.fileId); }}
                                                            className="flex-1 bg-primary text-white py-2 rounded-full font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
                                                            style={{ boxShadow: '0 4px 12px rgba(0,122,255,0.3)' }}
                                                        >
                                                            <Download size={18} strokeWidth={2.5} />
                                                            {t.dashboard.download}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </AnimatePresence>
                        </section>
                    </div>
                </div>
            </main>
            {/* Incoming File Popup */}
            <AnimatePresence>
                {incomingFile && (
                    <motion.div
                        initial={{ y: 60, opacity: 0, scale: 0.95 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: 30, opacity: 0, scale: 0.95 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        style={{
                            position: 'fixed',
                            bottom: '48px',
                            right: '48px',
                            width: '340px',
                            maxWidth: 'calc(100vw - 96px)',
                            backgroundColor: 'white',
                            borderRadius: '32px',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)',
                            overflow: 'hidden',
                            zIndex: 9999
                        }}
                    >
                        {/* Image Preview */}
                        <div style={{ padding: '12px' }}>
                            <div
                                style={{
                                    width: '100%',
                                    aspectRatio: '1 / 1',
                                    borderRadius: '24px',
                                    overflow: 'hidden',
                                    backgroundColor: '#f5f5f5'
                                }}
                            >
                                <SecureImage
                                    fileId={incomingFile.fileId}
                                    filename={incomingFile.filename}
                                    backendUrl={BACKEND_URL}
                                    className="w-full h-full"
                                    imgClassName="object-cover w-full h-full"
                                />
                            </div>
                        </div>

                        {/* Info & Actions */}
                        <div style={{ padding: '0 20px 20px 20px' }}>
                            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                                <h3 style={{ fontWeight: 700, fontSize: '18px', color: '#111', margin: 0 }}>
                                    {t.dashboard.fileReceived}
                                </h3>
                                <p style={{ fontSize: '14px', color: '#888', margin: '4px 0 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {incomingFile.filename}
                                </p>
                            </div>

                            {/* Remember choice checkbox */}
                            <label
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    padding: '12px 16px',
                                    backgroundColor: '#f9fafb',
                                    borderRadius: '12px',
                                    cursor: 'pointer',
                                    marginBottom: '12px'
                                }}
                            >
                                <input
                                    type="checkbox"
                                    checked={rememberChoice}
                                    onChange={(e) => setRememberChoice(e.target.checked)}
                                    style={{
                                        width: '20px',
                                        height: '20px',
                                        accentColor: '#007AFF',
                                        cursor: 'pointer'
                                    }}
                                />
                                <span style={{ fontSize: '14px', color: '#555', fontWeight: 500 }}>
                                    {t.dashboard.autoReceive}
                                </span>
                            </label>

                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button
                                    onClick={handleDeclineFile}
                                    style={{
                                        flex: 1,
                                        padding: '14px 0',
                                        borderRadius: '16px',
                                        backgroundColor: '#f3f4f6',
                                        color: '#374151',
                                        fontWeight: 600,
                                        fontSize: '15px',
                                        border: 'none',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '6px',
                                        transition: 'background-color 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e5e7eb'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                                >
                                    <X size={18} />
                                    {t.dashboard.decline}
                                </button>
                                <button
                                    onClick={handleAcceptFile}
                                    style={{
                                        flex: 1,
                                        padding: '14px 0',
                                        borderRadius: '16px',
                                        backgroundColor: '#007AFF',
                                        color: 'white',
                                        fontWeight: 600,
                                        fontSize: '15px',
                                        border: 'none',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '6px',
                                        boxShadow: '0 8px 20px rgba(0, 122, 255, 0.35)',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = '#0066DD';
                                        e.currentTarget.style.boxShadow = '0 12px 28px rgba(0, 122, 255, 0.45)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = '#007AFF';
                                        e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 122, 255, 0.35)';
                                    }}
                                >
                                    <Check size={18} />
                                    {t.dashboard.accept}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
