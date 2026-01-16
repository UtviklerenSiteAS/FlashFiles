import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Download, Clock, FileText, Share2, ExternalLink } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { supabase } from '../lib/supabase';
import { SecureImage } from '../components/SecureImage';
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
    const [files, setFiles] = useState<ReceivedFile[]>([]);
    const [connected, setConnected] = useState(false);

    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        const initSocket = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            // Hvis vi allerede har en socket, ikke lag en ny (eller koble fra den gamle først)
            if (socketRef.current) {
                socketRef.current.disconnect();
            }

            const newSocket = io(BACKEND_URL, {
                auth: { token: session.access_token }
            });

            socketRef.current = newSocket;

            newSocket.on('connect', () => {
                console.log('Koblet til WebSocket ✅ User:', session.user.id);
                setConnected(true);
            });

            newSocket.on('file_received', (file: ReceivedFile) => {
                console.log('Ny fil mottatt via WebSocket! 📩', file);
                const fileWithDate = { ...file, receivedAt: new Date().toISOString() };
                setFiles(prev => {
                    // Unngå duplikater hvis meldingen sendes flere ganger
                    if (prev.some(f => f.fileId === file.fileId)) return prev;
                    return [fileWithDate, ...prev];
                });
            });

            newSocket.on('disconnect', (reason) => {
                console.log('Koblet fra WebSocket ❌ Årsak:', reason);
                setConnected(false);
            });
        };

        initSocket();

        return () => {
            if (socketRef.current) {
                console.log('Rydder opp WebSocket-tilkobling...');
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, []);

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

    const handleCopyLink = async (fileId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const link = `${BACKEND_URL}/api/download/${fileId}?token=${session.access_token}`;
        navigator.clipboard.writeText(link).then(() => {
            alert('Lenke kopiert!');
        });
    };

    const formatFilename = (name: string) => {
        if (name.length <= 16) return name;
        const parts = name.split('.');
        if (parts.length > 1) {
            const ext = parts.pop();
            const base = parts.join('.');
            return `${base.substring(0, 8)}...${base.substring(base.length - 4)}.${ext}`;
        }
        return `${name.substring(0, 12)}...`;
    };

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
        <div className="min-h-screen bg-[#FBFBFD] text-[#1D1D1F] font-sans flex flex-col items-center">
            <header className="w-full bg-white flex justify-center p-8 md:p-10" style={{ borderBottom: '1px solid #F0F0F0' }}>
                <div className="w-full flex items-center justify-between" style={{ maxWidth: '1200px' }}>
                    <div className="flex items-center gap-3">
                        <img src={fullLogo} alt="FlashFiles Logo" style={{ height: '45px', width: 'auto' }} />
                        <div
                            className="rounded-full"
                            style={{
                                width: '8px',
                                height: '8px',
                                backgroundColor: connected ? '#34C759' : '#FF3B30',
                                marginLeft: '1px',
                                borderRadius: '50%'
                            }}
                            title={connected ? 'Connected' : 'Disconnected'}
                        />
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 text-gray-500 font-semibold"
                    >
                        Logg ut <LogOut size={20} />
                    </button>
                </div>
            </header>

            <main className="w-full flex flex-col gap-10 p-10" style={{ maxWidth: '1000px', padding: '40px 24px' }}>
                <section>
                    <h2 className="text-3xl font-bold mb-2">Innlastet nå</h2>
                    <p className="text-gray-500">Her dukker filer opp automatisk når du sender fra mobilen.</p>
                </section>

                <section
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                        gap: '24px',
                        alignItems: 'start'
                    }}
                >
                    <AnimatePresence>
                        {files.length === 0 ? (
                            <motion.div
                                key="empty"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex flex-col items-center justify-center text-gray-400 gap-4"
                                style={{
                                    gridColumn: '1 / -1',
                                    padding: '80px 0',
                                    backgroundColor: 'white',
                                    borderRadius: '24px',
                                    border: '2px dashed #E5E5E5'
                                }}
                            >
                                <div
                                    className="flex items-center justify-center"
                                    style={{ width: '64px', height: '64px', backgroundColor: '#F9F9F9', borderRadius: '50%' }}
                                >
                                    <Clock size={32} />
                                </div>
                                <p className="font-medium text-lg">Ingen filer ennå – klar til å motta!</p>
                            </motion.div>
                        ) : (
                            files.map((file) => (
                                <motion.div
                                    key={file.fileId}
                                    initial={{ scale: 0.95, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.9, opacity: 0 }}
                                    whileHover={{ y: -8, transition: { duration: 0.3, ease: 'easeOut' } }}
                                    className="relative flex flex-col group cursor-pointer"
                                    style={{ borderRadius: '32px', overflow: 'hidden' }}
                                >
                                    <SecureImage
                                        fileId={file.fileId}
                                        filename={file.filename}
                                        backendUrl={BACKEND_URL}
                                    >
                                        {/* Top Actions (Visible on Hover) */}
                                        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                                            <button
                                                className="bg-white/20 hover:bg-white/30 backdrop-blur-md p-2.5 rounded-2xl border border-white/20 transition-all active:scale-90"
                                                onClick={(e) => handleCopyLink(file.fileId, e)}
                                                title="Kopier lenke"
                                            >
                                                <Share2 size={18} />
                                            </button>
                                            <button
                                                className="bg-white/20 hover:bg-white/30 backdrop-blur-md p-2.5 rounded-2xl border border-white/20 transition-all active:scale-90"
                                                onClick={(e) => { e.stopPropagation(); handleDownload(file.fileId); }}
                                                title="Åpne i ny fane"
                                            >
                                                <ExternalLink size={18} />
                                            </button>
                                        </div>

                                        {/* Floating Glass Panel */}
                                        <div className="w-full bg-black/30 backdrop-blur-2xl border border-white/10 rounded-[24px] p-5 shadow-2xl flex flex-col gap-3 relative overflow-hidden group/panel transition-transform duration-300 group-hover:scale-[1.01]">
                                            {/* Subtitle / Path Breadcrumb */}
                                            <div className="flex items-center gap-2 opacity-40 text-[9px] font-bold uppercase tracking-widest leading-none">
                                                <span className="truncate">{formatFilename(file.filename)}</span>
                                                <span className="w-1 h-1 bg-white rounded-full" />
                                                <span className="shrink-0">{new Date(file.receivedAt!).toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>

                                            <div className="flex flex-col gap-0.5">
                                                {file.title ? (
                                                    <>
                                                        <h3 className="font-extrabold text-2xl tracking-tight leading-tight text-white line-clamp-1">
                                                            {file.title}
                                                        </h3>
                                                        {file.description && (
                                                            <p className="font-medium opacity-70 text-sm leading-snug line-clamp-2 mt-1 pr-6">
                                                                {file.description}
                                                            </p>
                                                        )}
                                                    </>
                                                ) : (
                                                    <h3 className="font-extrabold text-xl tracking-tight text-white leading-tight">
                                                        {formatRelativeDate(file.receivedAt!)}
                                                    </h3>
                                                )}
                                            </div>

                                            {/* Bottom Metadata & Primary Action */}
                                            <div className="flex items-center justify-between gap-4 mt-2">
                                                <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-lg">
                                                    <FileText size={12} className="text-white/60" />
                                                    <span className="text-[10px] font-black tracking-tight uppercase opacity-80">
                                                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                                                    </span>
                                                </div>

                                                <motion.button
                                                    whileHover={{ scale: 1.1, rotate: 2 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    onClick={(e) => { e.stopPropagation(); handleDownload(file.fileId); }}
                                                    className="bg-white text-black p-3 rounded-full flex items-center justify-center shadow-[0_4px_20px_rgba(255,255,255,0.3)] hover:bg-gray-100 transition-all ring-4 ring-white/10"
                                                    title="Last ned"
                                                >
                                                    <Download size={20} strokeWidth={2.5} />
                                                </motion.button>
                                            </div>

                                            {/* Decorative glow effect */}
                                            <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-white/10 blur-[40px] rounded-full group-hover/panel:bg-white/20 transition-all duration-700" />
                                        </div>
                                    </SecureImage>
                                </motion.div>
                            ))
                        )}
                    </AnimatePresence>
                </section>
            </main>
        </div>
    );
};
