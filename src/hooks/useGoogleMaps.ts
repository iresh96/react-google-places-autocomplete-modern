import { useEffect, useState } from 'react';
import { loadGoogleMapsScript } from '../utils/loadScript';

export interface UseGoogleMapsOptions {
  apiKey?: string;
  language?: string;
  region?: string;
  nonce?: string;
}

export function useGoogleMaps(options: UseGoogleMapsOptions = {}) {
  const [isReady, setIsReady] = useState<boolean>(
    typeof window !== 'undefined' &&
      Boolean((window as any).google?.maps?.places)
  );
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (isReady || typeof window === 'undefined') {
      return undefined;
    }

    loadGoogleMapsScript(options)
      .then(() => {
        if (!cancelled) {
          setIsReady(true);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    options.apiKey,
    options.language,
    options.region,
    options.nonce,
    isReady,
  ]);

  return {
    isReady,
    error,
    google:
      typeof window !== 'undefined'
        ? ((window as any).google as typeof google | undefined)
        : undefined,
  };
}
