type LoadScriptOptions = {
  apiKey?: string;
  language?: string;
  region?: string;
  nonce?: string;
};

const scriptPromises = new Map<string, Promise<typeof google>>();

const GOOGLE_BASE_URL = 'https://maps.googleapis.com/maps/api/js';

export function loadGoogleMapsScript(
  options: LoadScriptOptions
): Promise<typeof google> {
  const { apiKey, language, region, nonce } = options;

  if (typeof window === 'undefined') {
    return Promise.reject(
      new Error('Google Maps can only be loaded in a browser environment.')
    );
  }

  if ((window as any).google?.maps?.places) {
    return Promise.resolve((window as any).google as typeof google);
  }

  if (!apiKey) {
    return Promise.reject(
      new Error('Google Maps API is not available and no apiKey was provided.')
    );
  }

  const url = new URL(GOOGLE_BASE_URL);
  url.searchParams.set('key', apiKey);
  url.searchParams.set('libraries', 'places');
  if (language) url.searchParams.set('language', language);
  if (region) url.searchParams.set('region', region);

  const src = url.toString();

  const existingPromise = scriptPromises.get(src);
  if (existingPromise) {
    return existingPromise;
  }

  const promise = new Promise<typeof google>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.defer = true;
    if (nonce) {
      script.nonce = nonce;
    }

    script.onload = () => {
      if ((window as any).google?.maps?.places) {
        resolve((window as any).google as typeof google);
      } else {
        reject(
          new Error(
            'Google Maps script loaded but Places library is unavailable.'
          )
        );
      }
    };

    script.onerror = () => {
      reject(new Error('Failed to load Google Maps script.'));
    };

    document.head.appendChild(script);
  });

  scriptPromises.set(src, promise);
  return promise;
}
