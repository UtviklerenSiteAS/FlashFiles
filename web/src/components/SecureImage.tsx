import React, { useState, useEffect } from 'react';
import { FileText, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface SecureImageProps {
    fileId: string;
    filename: string;
    backendUrl: string;
    children?: React.ReactNode;
}

export const SecureImage: React.FC<SecureImageProps> = ({ fileId, filename, backendUrl, children }) => {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);

    const isImage = (name: string) => {
        const ext = name.split('.').pop()?.toLowerCase();
        return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '');
    };

    useEffect(() => {
        if (!isImage(filename)) return;

        let isMounted = true;
        const fetchImage = async () => {
            setLoading(true);
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) throw new Error('No session');

                const response = await fetch(`${backendUrl}/api/download/${fileId}`, {
                    headers: {
                        'Authorization': `Bearer ${session.access_token}`
                    }
                });

                if (!response.ok) throw new Error('Failed to fetch image');

                const blob = await response.blob();
                const url = URL.createObjectURL(blob);

                if (isMounted) {
                    setImageUrl(url);
                }
            } catch (err) {
                console.error('Error fetching preview:', err);
                if (isMounted) setError(true);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchImage();

        return () => {
            isMounted = false;
            if (imageUrl) {
                URL.revokeObjectURL(imageUrl);
            }
        };
    }, [fileId, filename, backendUrl]);

    const containerStyle: React.CSSProperties = {
        width: '100%',
        backgroundColor: '#F5F5F7',
        borderRadius: '32px',
        overflow: 'hidden',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column'
    };

    if (!isImage(filename)) {
        return (
            <div style={{ ...containerStyle, aspectRatio: '4/5', justifyContent: 'center', alignItems: 'center' }}>
                <FileText size={64} className="text-[#007AFF]" strokeWidth={1} />
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '24px', background: 'linear-gradient(transparent, rgba(0,0,0,0.4))' }}>
                    {children}
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div style={{ ...containerStyle, aspectRatio: '4/5', justifyContent: 'center', alignItems: 'center' }}>
                <Loader2 className="animate-spin text-gray-300" size={32} />
            </div>
        );
    }

    if (error || !imageUrl) {
        return (
            <div style={{ ...containerStyle, aspectRatio: '4/5', justifyContent: 'center', alignItems: 'center' }}>
                <FileText size={64} className="text-gray-300" strokeWidth={1} />
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '24px', background: 'linear-gradient(transparent, rgba(0,0,0,0.6))' }}>
                    {children}
                </div>
            </div>
        );
    }

    return (
        <div style={containerStyle}>
            <img
                src={imageUrl}
                alt={filename}
                style={{
                    width: '100%',
                    height: 'auto',
                    display: 'block'
                }}
            />
            {/* Minimal Overly Canvas */}
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    padding: '16px',
                    color: 'white',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    background: 'linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 60%)'
                }}
            >
                {children}
            </div>
        </div>
    );
};
