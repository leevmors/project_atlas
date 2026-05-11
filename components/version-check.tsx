'use client';

import { useEffect, useRef, useState } from 'react';

type VersionPayload = {
  version: string | null;
  enabled: boolean;
};

export default function VersionCheck() {
  const [needsRefresh, setNeedsRefresh] = useState(false);
  const initialVersion = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch('/api/version', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data: VersionPayload) => {
        if (!data.enabled || !data.version) return;
        if (!cancelled) {
          initialVersion.current = data.version;
        }
      })
      .catch(() => {});

    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/version', { cache: 'no-store' });
        if (!res.ok) return;

        const data = (await res.json()) as VersionPayload;
        if (!data.enabled || !data.version) return;

        if (!initialVersion.current) {
          initialVersion.current = data.version;
          return;
        }

        if (data.version !== initialVersion.current) {
          setNeedsRefresh(true);
        }
      } catch {
        // ignore transient network errors
      }
    }, 30000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
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
