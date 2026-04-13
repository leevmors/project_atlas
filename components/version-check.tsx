'use client';

import { useEffect, useState, useRef } from 'react';

export default function VersionCheck() {
  const [needsRefresh, setNeedsRefresh] = useState(false);
  const initialVersion = useRef<string | null>(null);

  useEffect(() => {
    // Fetch the current version on first load and store it
    fetch('/api/version', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data.version) {
          initialVersion.current = data.version;
        }
      })
      .catch(() => {});

    // Poll every 30 seconds to check if version changed
    const interval = setInterval(async () => {
      if (!initialVersion.current) return;
      try {
        const res = await fetch('/api/version', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data.version && data.version !== initialVersion.current) {
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
        onClick={() => window.location.reload()}
        className="underline font-bold hover:text-white transition-colors"
      >
        Refresh the page
      </button>
    </div>
  );
}
