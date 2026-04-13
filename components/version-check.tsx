'use client';

import { useEffect, useState } from 'react';

const BUILD_VERSION = Date.now().toString(); // Set at build time

export function VersionCheck() {
  const [needsRefresh, setNeedsRefresh] = useState(false);

  useEffect(() => {
    // Store the current version on first load
    const storedVersion = sessionStorage.getItem('atlas_build_version');
    if (!storedVersion) {
      sessionStorage.setItem('atlas_build_version', BUILD_VERSION);
      return;
    }

    // If version changed since page was loaded, show refresh banner
    if (storedVersion !== BUILD_VERSION) {
      setNeedsRefresh(true);
    }

    // Also poll the server for version changes every 30 seconds
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/version', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          const currentStored = sessionStorage.getItem('atlas_build_version');
          if (data.version && currentStored && data.version !== currentStored) {
            setNeedsRefresh(true);
          }
        }
      } catch {
        // ignore
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  if (!needsRefresh) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[200] bg-amber-500 text-black text-center py-3 px-4 font-semibold text-sm shadow-lg">
      A new version is available.{' '}
      <button
        onClick={() => {
          sessionStorage.removeItem('atlas_build_version');
          window.location.reload();
        }}
        className="underline font-bold hover:text-white transition-colors"
      >
        Refresh the page
      </button>
    </div>
  );
}
