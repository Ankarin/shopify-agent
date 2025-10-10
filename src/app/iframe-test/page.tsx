'use client';

import { useState, useEffect } from 'react';

export default function IframeTestPage() {
    const [mounted, setMounted] = useState(false);
    const [count, setCount] = useState(0);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return null;
    }

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'system-ui',
            padding: '20px',
        }}>
            <h1 style={{ fontSize: '32px', marginBottom: '20px' }}>✅ Next.js Works in iframe!</h1>
            <p style={{ fontSize: '18px', marginBottom: '30px' }}>Client-side rendering successful</p>

            <button
                onClick={() => setCount(count + 1)}
                style={{
                    padding: '15px 30px',
                    fontSize: '18px',
                    background: 'white',
                    color: '#667eea',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                }}
            >
                Clicked: {count}
            </button>

            <div style={{ marginTop: '30px', fontSize: '14px', opacity: 0.8, textAlign: 'center' }}>
                <div>User Agent: {navigator.userAgent.slice(0, 60)}...</div>
                <div>Window Size: {window.innerWidth} x {window.innerHeight}</div>
                <div>In iframe: {window.parent !== window ? 'YES ✅' : 'NO'}</div>
                <div style={{ marginTop: '20px', fontSize: '16px', fontWeight: 'bold' }}>
                    If you see this on mobile, Next.js + SSR:false works!
                </div>
            </div>
        </div>
    );
}
