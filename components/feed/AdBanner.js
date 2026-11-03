import { useEffect } from 'react';
import Script from 'next/script';

export default function AdBanner({ adClient, adSlot }) {
    useEffect(() => {
        if (!adClient || !adSlot) return;

        try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch { }
    }, [adClient, adSlot]);

    if (!adClient || !adSlot) return null;

    return (
        <>
            <Script
                async
                src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adClient}`}
                crossOrigin="anonymous"
                strategy="afterInteractive"
            />
            <ins
                className="adsbygoogle"
                style={{ display: 'block' }}
                data-ad-format="fluid"
                data-ad-layout-key="-fb+5w+4e-db+86"
                data-ad-client={adClient}
                data-ad-slot={adSlot}
            />
        </>
    );
}
