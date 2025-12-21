export interface SelectedPlace {
  description: string;
  placeId: string;
  structuredFormatting?: {
    mainText: string;
    secondaryText?: string;
  };
  matchedSubstrings?: Array<{ offset: number; length: number }>;
  terms?: Array<{ value: string; offset: number }>;
  types?: string[];
}

export interface AutocompleteSuggestionTextPart {
  text?: string;
}

export interface AutocompleteSuggestionPrediction {
  placeId?: string;
  text?: AutocompleteSuggestionTextPart;
  structuredFormat?: {
    mainText?: AutocompleteSuggestionTextPart;
    secondaryText?: AutocompleteSuggestionTextPart;
  };
}

export interface AutocompleteSuggestion {
  placePrediction?: AutocompleteSuggestionPrediction;
  distanceMeters?: number;
}

export interface AutocompleteSuggestionRequest {
  input: string;
  sessionToken?: google.maps.places.AutocompleteSessionToken;
  language?: string;
  region?: string;
  componentRestrictions?: {
    country?: string[];
  };
}

export interface AutocompleteSuggestionResponse {
  suggestions?: AutocompleteSuggestion[];
  predictions?: google.maps.places.AutocompletePrediction[];
}

export interface AutocompleteSuggestionServiceLike {
  fetchSuggestions?: (
    request: AutocompleteSuggestionRequest
  ) => Promise<AutocompleteSuggestionResponse>;
  getSuggestions?: (
    request: AutocompleteSuggestionRequest,
    callback: (
      response: AutocompleteSuggestionResponse,
      status: google.maps.places.PlacesServiceStatus
    ) => void
  ) => void;
}

export type PlacesAutocompleteServiceLike =
  | google.maps.places.AutocompleteService
  | (AutocompleteSuggestionServiceLike & object);
