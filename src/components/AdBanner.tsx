/// <reference types="vite/client" />
import React, { useEffect, useRef } from 'react';
import { UserProfile } from '../types';

interface AdBannerProps {
  user: UserProfile | null;
  slot?: string;
  format?: 'auto' | 'fluid' | 'rectangle';
}

export const AdBanner = ({ user, slot, format = 'auto' }: AdBannerProps) => {
  // Only show ads to free users
  if (!user || user.subscription !== 'free') {
    return null;
  }

  const adsenseClientId = import.meta.env.VITE_ADSENSE_CLIENT_ID;
  const adsenseSlotId = slot || import.meta.env.VITE_ADSENSE_SLOT_ID;

  const hasPushed = useRef(false);

  useEffect(() => {
    if (adsenseClientId && adsenseSlotId && !hasPushed.current) {
      const timer = setTimeout(() => {
        try {
          // Check if there are any available ad slots that haven't been initialized
          const ads = document.querySelectorAll('.adsbygoogle:not([data-adsbygoogle-status="done"])');
          
          if (ads.length > 0) {
            // @ts-ignore
            (window.adsbygoogle = window.adsbygoogle || []).push({});
            hasPushed.current = true;
          }
        } catch (e: any) {
          // Specifically ignore the "all elements already have ads" error as it's common in SPAs
          if (e?.message?.includes('already have ads')) {
            return;
          }
          console.error('AdSense error:', e);
        }
      }, 300); // Small delay to ensure DOM is ready

      return () => clearTimeout(timer);
    }
  }, [adsenseClientId, adsenseSlotId]);

  if (!adsenseClientId || !adsenseSlotId) {
    // Placeholder for development/demo
    return (
      <div className="w-full p-4 bg-zinc-100 dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 flex flex-col items-center justify-center min-h-[100px] my-4">
        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Advertisement</span>
        <div className="text-xs text-zinc-500 text-center px-4">
          AdMob/AdSense Placeholder. <br />
          <span className="text-[9px] opacity-50">Upgrade to Premium to remove ads.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full my-4 overflow-hidden rounded-2xl">
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={adsenseClientId}
        data-ad-slot={adsenseSlotId}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
};
