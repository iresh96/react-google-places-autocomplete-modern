import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { debounce } from '../utils/debounce';
import { useGoogleMaps } from './useGoogleMaps';
import {
  AutocompleteSuggestion,
  AutocompleteSuggestionRequest,
  AutocompleteSuggestionResponse,
  AutocompleteSuggestionServiceLike,
  SelectedPlace,
} from '../types/google';

export interface UsePlacesAutocompleteOptions {
  apiKey?: string;
  value: string;
  debounceMs?: number;
  countries?: string[];
  language?: string;
  minLength?: number;
  autoClearSuggestions?: boolean;
  onSelect?: (place: SelectedPlace) => void;
}

export interface UsePlacesAutocompleteResult {
  suggestions: SelectedPlace[];
  loading: boolean;
  ready: boolean;
  status: 'idle' | 'loading' | 'success' | 'error';
  error?: string;
  select: (place: SelectedPlace) => void;
}

const OK_STATUSES: string[] = ['OK', 'ZERO_RESULTS'];

function toSelectedPlaceFromSuggestion(
  suggestion: AutocompleteSuggestion
): SelectedPlace | undefined {
  const prediction = suggestion.placePrediction;
  if (!prediction) return undefined;

  const placeId = prediction.placeId;
  const mainText =
    prediction.structuredFormat?.mainText?.text || prediction.text?.text;
  const secondaryText = prediction.structuredFormat?.secondaryText?.text;
  const description = [mainText, secondaryText].filter(Boolean).join(' · ');

  if (!placeId || !description) return undefined;

  return {
    placeId,
    description,
    structuredFormatting: {
      mainText: mainText || description,
      secondaryText,
    },
  };
}

function toSelectedPlaceFromPrediction(
  prediction: google.maps.places.AutocompletePrediction
): SelectedPlace | undefined {
  if (!prediction.description || !prediction.place_id) return undefined;

  return {
    description: prediction.description,
    placeId: prediction.place_id,
    structuredFormatting: prediction.structured_formatting
      ? {
          mainText: prediction.structured_formatting.main_text,
          secondaryText: prediction.structured_formatting.secondary_text,
        }
      : undefined,
    matchedSubstrings: prediction.matched_substrings?.map((match) => ({
      offset: match.offset,
      length: match.length,
    })),
    terms: prediction.terms?.map((term) => ({
      offset: term.offset,
      value: term.value,
    })),
    types: prediction.types,
  };
}

async function fetchWithSuggestionService(
  service: AutocompleteSuggestionServiceLike,
  request: AutocompleteSuggestionRequest
): Promise<AutocompleteSuggestionResponse> {
  if (typeof service.fetchSuggestions === 'function') {
    return service.fetchSuggestions(request);
  }

  if (typeof service.getSuggestions === 'function') {
    return new Promise<AutocompleteSuggestionResponse>((resolve, reject) => {
      service.getSuggestions!(request, (response, status) => {
        if (!status || OK_STATUSES.includes(status)) {
          resolve(response);
        } else {
          reject(
            new Error(`Autocomplete suggestion failed with status ${status}`)
          );
        }
      });
    });
  }

  throw new Error(
    'No supported methods found on AutocompleteSuggestionService.'
  );
}

async function fetchWithLegacyService(
  service: google.maps.places.AutocompleteService,
  request: google.maps.places.AutocompletionRequest
): Promise<google.maps.places.AutocompletePrediction[]> {
  return new Promise((resolve, reject) => {
    service.getPlacePredictions(request, (predictions, status) => {
      if (status && OK_STATUSES.includes(status)) {
        resolve(predictions ?? []);
      } else {
        reject(
          new Error(`Autocomplete prediction failed with status ${status}`)
        );
      }
    });
  });
}

export function usePlacesAutocomplete(
  options: UsePlacesAutocompleteOptions
): UsePlacesAutocompleteResult {
  const {
    apiKey,
    value,
    debounceMs = 250,
    countries,
    language,
    minLength = 2,
    autoClearSuggestions = true,
    onSelect,
  } = options;

  const { isReady, error: mapsError } = useGoogleMaps({ apiKey, language });
  const [suggestions, setSuggestions] = useState<SelectedPlace[]>([]);
  const [status, setStatus] =
    useState<UsePlacesAutocompleteResult['status']>('idle');
  const [error, setError] = useState<string | undefined>(undefined);
  const isMountedRef = useRef(true);
  const sessionTokenRef =
    useRef<google.maps.places.AutocompleteSessionToken | null>(null);

  const ensureSessionToken = useCallback(() => {
    if (!sessionTokenRef.current && (window as any).google?.maps?.places) {
      sessionTokenRef.current =
        new google.maps.places.AutocompleteSessionToken();
    }
    return sessionTokenRef.current;
  }, []);

  const select = useCallback(
    (place: SelectedPlace) => {
      onSelect?.(place);
      if (autoClearSuggestions) {
        setSuggestions([]);
      }
      sessionTokenRef.current = null;
    },
    [onSelect, autoClearSuggestions]
  );

  const fetchSuggestions = useCallback(
    async (raw: string) => {
      const input = raw.trim();

      if (!input || input.length < minLength) {
        setSuggestions([]);
        setStatus('idle');
        setError(undefined);
        return;
      }

      if (!isReady) {
        setStatus('idle');
        return;
      }

      const g = (window as any).google as typeof google | undefined;
      if (!g?.maps?.places) {
        setStatus('error');
        setError(
          mapsError?.message || 'Google Maps Places library is not available.'
        );
        return;
      }

      setStatus('loading');
      setError(undefined);

      const request: AutocompleteSuggestionRequest = {
        input,
        sessionToken: ensureSessionToken() || undefined,
        language,
        componentRestrictions:
          countries && countries.length
            ? {
                country: countries,
              }
            : undefined,
      };

      try {
        const SuggestionServiceCtor = (g.maps.places as any)
          .AutocompleteSuggestionService;

        if (typeof SuggestionServiceCtor === 'function') {
          const service =
            new SuggestionServiceCtor() as AutocompleteSuggestionServiceLike;
          const response = await fetchWithSuggestionService(service, request);
          const mappedSuggestions = (response?.suggestions || [])
            .map(toSelectedPlaceFromSuggestion)
            .filter(Boolean) as SelectedPlace[];
          const mappedPredictions = (response?.predictions || [])
            .map(toSelectedPlaceFromPrediction)
            .filter(Boolean) as SelectedPlace[];
          const mapped = [...mappedSuggestions, ...mappedPredictions];

          if (!isMountedRef.current) return;
          setSuggestions(mapped);
          setStatus('success');
          return;
        }

        const legacyService = new g.maps.places.AutocompleteService();
        const legacyRequest: google.maps.places.AutocompletionRequest = {
          input,
          sessionToken: request.sessionToken,
          componentRestrictions:
            request.componentRestrictions as google.maps.places.ComponentRestrictions,
        };

        const predictions = await fetchWithLegacyService(
          legacyService,
          legacyRequest
        );
        const mapped = (predictions || [])
          .map(toSelectedPlaceFromPrediction)
          .filter(Boolean) as SelectedPlace[];

        if (!isMountedRef.current) return;
        setSuggestions(mapped);
        setStatus('success');
      } catch (err) {
        if (!isMountedRef.current) return;
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        setStatus('error');
      }
    },
    [
      minLength,
      isReady,
      mapsError?.message,
      ensureSessionToken,
      language,
      countries,
    ]
  );

  const debouncedFetch = useMemo(
    () => debounce(fetchSuggestions, debounceMs),
    [fetchSuggestions, debounceMs]
  );

  useEffect(() => {
    isMountedRef.current = true;
    debouncedFetch(value);
    return () => {
      isMountedRef.current = false;
      debouncedFetch.cancel();
    };
  }, [value, debouncedFetch]);

  return {
    suggestions,
    loading: status === 'loading',
    ready: isReady,
    status,
    error,
    select,
  };
}
