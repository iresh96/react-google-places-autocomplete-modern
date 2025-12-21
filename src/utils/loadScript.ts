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
  url.searchParams.set('v', 'weekly');
  url.searchParams.set('loading', 'async');
  if (language) url.searchParams.set('language', language);
  if (region) url.searchParams.set('region', region);

  const cacheKey = url.toString();

  const existingPromise = scriptPromises.get(cacheKey);
  if (existingPromise) {
    return existingPromise;
  }

  const callbackName = `__google_maps_cb_${Math.random()
    .toString(36)
    .slice(2)}`;
  url.searchParams.set('callback', callbackName);
  const src = url.toString();

  const promise = new Promise<typeof google>((resolve, reject) => {
    (window as any)[callbackName] = () => {
      if ((window as any).google?.maps?.places) {
        resolve((window as any).google as typeof google);
      } else {
        reject(
          new Error('Google Maps API loaded but Places library is missing.')
        );
      }
      delete (window as any)[callbackName];
    };

    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.defer = true;
    if (nonce) {
      script.nonce = nonce;
    }

    script.onerror = () => {
      reject(new Error('Failed to load Google Maps script.'));
      delete (window as any)[callbackName];
    };

    document.head.appendChild(script);
  });

  scriptPromises.set(cacheKey, promise);
  return promise;
}
