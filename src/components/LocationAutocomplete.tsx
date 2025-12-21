import { ReactNode, useId } from 'react';
import { usePlacesAutocomplete } from '../hooks/usePlacesAutocomplete';
import { SelectedPlace } from '../types';

export interface LocationAutocompleteProps {
  apiKey?: string;
  value: string;
  onChange: (value: string) => void;
  onSelect?: (place: SelectedPlace) => void;
  placeholder?: string;
  disabled?: boolean;
  debounceMs?: number;
  countries?: string[];
  language?: string;
  className?: string;
  inputClassName?: string;
  suggestionsClassName?: string;
  minLength?: number;
  autoClearSuggestions?: boolean;
  renderSuggestion?: (suggestion: SelectedPlace) => ReactNode;
  error?: string | boolean;
}

export function LocationAutocomplete(props: LocationAutocompleteProps) {
  const {
    apiKey,
    value,
    onChange,
    onSelect,
    placeholder,
    disabled,
    debounceMs,
    countries,
    language,
    className,
    inputClassName,
    suggestionsClassName,
    minLength,
    autoClearSuggestions,
    renderSuggestion,
    error,
  } = props;

  const listId = useId();

  const {
    suggestions,
    loading,
    error: hookError,
    ready,
    select,
  } = usePlacesAutocomplete({
    apiKey,
    value,
    debounceMs,
    countries,
    language,
    minLength,
    autoClearSuggestions,
    onSelect,
  });

  const mergedError = (() => {
    if (typeof error === 'string') return error;
    if (error === true) return hookError || 'Unable to fetch suggestions.';
    return hookError;
  })();

  return (
    <div className={className} aria-live='polite'>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={inputClassName}
        aria-invalid={Boolean(mergedError)}
        aria-autocomplete='list'
        aria-controls={listId}
        aria-busy={loading || !ready}
        autoComplete='off'
      />

      {mergedError ? (
        <div role='alert' style={{ color: '#b91c1c', marginTop: 4 }}>
          {mergedError}
        </div>
      ) : null}

      {suggestions.length > 0 ? (
        <ul id={listId} className={suggestionsClassName} role='listbox'>
          {suggestions.map((suggestion) => (
            <li key={suggestion.placeId} role='option'>
              <button
                type='button'
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => select(suggestion)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  background: 'transparent',
                  border: 'none',
                  padding: '8px 12px',
                  cursor: 'pointer',
                }}
              >
                {renderSuggestion ? (
                  renderSuggestion(suggestion)
                ) : (
                  <DefaultSuggestionContent suggestion={suggestion} />
                )}
              </button>
            </li>
          ))}
          {loading ? (
            <li style={{ padding: '6px 12px', opacity: 0.6 }}>Loading...</li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}

function DefaultSuggestionContent({
  suggestion,
}: {
  suggestion: SelectedPlace;
}) {
  return (
    <div>
      <div>
        {suggestion.structuredFormatting?.mainText ?? suggestion.description}
      </div>
      {suggestion.structuredFormatting?.secondaryText ? (
        <div style={{ fontSize: 12, color: '#4b5563' }}>
          {suggestion.structuredFormatting.secondaryText}
        </div>
      ) : null}
    </div>
  );
}
