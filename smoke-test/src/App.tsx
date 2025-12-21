import { useState } from 'react';
import {
  LocationAutocomplete,
  useGoogleMaps,
} from 'react-google-places-autocomplete-modern';

function DebugInfo({ apiKey }: { apiKey?: string }) {
  const { isReady, error, google } = useGoogleMaps({ apiKey });

  return (
    <div className='card' style={{ marginTop: 16, fontSize: '0.9em' }}>
      <h3>Debug Info</h3>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'auto 1fr',
          gap: '4px 12px',
        }}
      >
        <span>API Key:</span>
        <span>{apiKey ? 'Provided' : 'Missing'}</span>

        <span>Script Ready:</span>
        <span style={{ color: isReady ? '#4ade80' : '#f87171' }}>
          {isReady ? 'Yes' : 'No'}
        </span>

        <span>Error:</span>
        <span style={{ color: error ? '#f87171' : 'inherit' }}>
          {error ? error.message : 'None'}
        </span>

        <span>Google Global:</span>
        <span>
          {typeof window !== 'undefined' && (window as any).google
            ? 'Present'
            : 'Missing'}
        </span>

        <span>Places Lib:</span>
        <span>{google?.maps?.places ? 'Present' : 'Missing'}</span>

        <span>New API:</span>
        <span>
          {(google?.maps?.places as any)?.AutocompleteSuggestionService
            ? 'Available (Using new API)'
            : 'Missing (Using fallback)'}
        </span>
      </div>
    </div>
  );
}

function App() {
  const [value, setValue] = useState('');
  const [selected, setSelected] = useState<{
    description: string;
    placeId: string;
  } | null>(null);
  const apiKey = import.meta.env.VITE_MAPS_API_KEY;

  return (
    <div className='page'>
      <header>
        <h1>react-google-places-autocomplete-modern</h1>
        <p>
          Simple smoke test to verify the component. Provide a &nbsp;
          <code>VITE_MAPS_API_KEY</code> in an <code>.env</code> file to try it
          live.
        </p>
      </header>
      <div className='card'>
        <label htmlFor='autocomplete'>Pick a place</label>
        <LocationAutocomplete
          apiKey={apiKey}
          value={value}
          onChange={setValue}
          onSelect={(place) => {
            setSelected({
              description: place.description,
              placeId: place.placeId,
            });
          }}
          placeholder='Start typing a city or address'
          countries={['us', 'ca', 'fr']}
          className='autocomplete'
          inputClassName='autocomplete-input'
          suggestionsClassName='autocomplete-list'
        />
      </div>
      <div className='card'>
        <h2>State</h2>
        <pre>{JSON.stringify({ value, selected }, null, 2)}</pre>
      </div>
      <DebugInfo apiKey={apiKey} />{' '}
    </div>
  );
}

export default App;
