import React, { useEffect } from 'react';

import { UserProfile } from '../types';

interface AdBannerProps {
  user?: UserProfile;
  slotId?: string;
  format?: 'auto' | 'fluid' | 'rectangle';
  className?: string;
}

export function AdBanner({ user, slotId, format = 'auto', className }: AdBannerProps) {
  useEffect(() => {
    // Hide ads for paid subscribers
    if (user?.subscription && user.subscription !== 'free') {
      return;
    }

    try {
      (window as any).adsbygoogle = (window as any).adsbygoogle || [];
      (window as any).adsbygoogle.push({});
    } catch (e) {
      console.error('AdSense error:', e);
    }
  }, [user?.subscription]);

  // Hide ads for paid subscribers
  if (user?.subscription && user.subscription !== 'free') {
    return null;
  }

  const clientId = import.meta.env.VITE_ADSENSE_CLIENT_ID;
  const unitSlotId = slotId || import.meta.env.VITE_ADSENSE_SLOT_ID;

  if (!clientId) {
    return (
      <div className="w-full p-4 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-center border border-dashed border-zinc-300 dark:border-zinc-700">
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
          Ad Space (Set VITE_ADSENSE_CLIENT_ID in secrets)
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={clientId}
        data-ad-slot={unitSlotId}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
