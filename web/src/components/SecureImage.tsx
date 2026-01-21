import React, { useState, useEffect } from 'react';
import { FileText, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface SecureImageProps {
    fileId: string;
    filename: string;
    backendUrl: string;
    children?: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
    imgClassName?: string;
}

export const SecureImage: React.FC<SecureImageProps> = ({
    fileId,
    filename,
    backendUrl,
    children,
    className = '',
    style = {},
    imgClassName = ''
}) => {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);

    const isImage = (name: string) => {
        const ext = name.split('.').pop()?.toLowerCase();
        return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'heic', 'heif'].includes(ext || '');
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

    // Base container style - relative to allow children to be absolute if they want, 
    // but default is to just be a container.
    const containerClasses = `relative overflow-hidden flex flex-col ${className}`;

    if (!isImage(filename)) {
        return (
            <div className={`${containerClasses} bg-gray-50 border border-gray-100 items-center justify-center`} style={style}>
                <div className="flex flex-col items-center justify-center p-8 text-gray-400">
                    <FileText size={48} strokeWidth={1.5} />
                    <span className="mt-2 text-xs font-medium uppercase tracking-wider opacity-70">Document</span>
                </div>
                {children}
            </div>
        );
    }

    if (loading) {
        return (
            <div className={`${containerClasses} bg-gray-50 items-center justify-center`} style={style}>
                <Loader2 className="animate-spin text-gray-300" size={32} />
            </div>
        );
    }

    if (error || !imageUrl) {
        return (
            <div className={`${containerClasses} bg-gray-50 items-center justify-center`} style={style}>
                <FileText size={48} className="text-gray-300" strokeWidth={1} />
                {children}
            </div>
        );
    }

    return (
        <div className={containerClasses} style={style}>
            <img
                src={imageUrl}
                alt={filename}
                className={`w-full h-full object-cover block transition-transform duration-500 will-change-transform ${imgClassName}`}
            />
            {children}
        </div>
    );
};
