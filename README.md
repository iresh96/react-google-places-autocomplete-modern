# react-google-places-autocomplete-modern

Production-ready React component that wraps the new **Google Maps Places AutocompleteSuggestion API** with a defensive fallback to the legacy `AutocompleteService`. Built for strict TypeScript, tree-shakeable builds, and long-term maintainability.

## Features

- Uses Google’s new AutocompleteSuggestion API when available
- Automatic fallback to legacy AutocompleteService
- Strict TypeScript with exported public types
- Controlled React input
- Country & language restrictions
- Debounced requests with session token management
- Safe for Next.js (client-side)

## Who is this for?

- Teams migrating from legacy Google Places autocomplete
- New projects wanting a future-proof solution
- React and Next.js apps that need strict TypeScript support

## Why this exists

- Google is introducing the AutocompleteSuggestion API; many existing libraries only target the legacy service.
- Teams need a safe migration path that keeps working even if the new API is temporarily unavailable.
- This package isolates Google Maps loading, session token management, debouncing, and error handling so your UI stays focused on UX.

## Installation

```bash
npm install react-google-places-autocomplete-modern
```

Peer dependencies: `react` and `react-dom`.

## Google Maps setup

- Enable **Places API** (and Maps JavaScript API, which hosts it) in Google Cloud.
- Use an **HTTP referrer-restricted API key**. Example referrers: `https://yourdomain.com/*`, `https://*.yourdomain.com/*`, `http://localhost:3000/*` for local dev.
- Ensure billing is enabled on the project.
- If you already load the Maps script elsewhere, you can omit `apiKey` and the hook will reuse the existing instance.

### Providing the API key

Option A (recommended): pass the key via the component prop so the hook loads the script for you:

```tsx
<LocationAutocomplete
  apiKey={process.env.NEXT_PUBLIC_MAPS_KEY}
  value={value}
  onChange={setValue}
/>
```

Option B: load the Google Maps script yourself (with `libraries=places`) and omit `apiKey`:

```html
<script
  src="https://maps.googleapis.com/maps/api/js?key=YOUR_KEY&libraries=places"
  async
  defer
></script>
```

Use referrer restrictions on the key and avoid exposing unrestricted keys.

## Basic usage

```tsx
import { useState } from 'react';
import { LocationAutocomplete } from 'react-google-places-autocomplete-modern';

export function Example() {
  const [value, setValue] = useState('');

  return (
    <LocationAutocomplete
      value={value}
      onChange={setValue}
      onSelect={(place) => console.log(place)}
    />
  );
}
```

> ⚠️ Note for Next.js: This component must run in the browser. Use "use client" or a dynamic import with `ssr: false`.

## Advanced usage

- **Country restriction**: `countries={["fr", "ch"]}`
- **Custom rendering**: provide `renderSuggestion={(s) => <div>{s.description}</div>}`
- **Controlled forms**: `value` + `onChange` stay fully controlled.
- **Error handling**: pass `error` to override, or rely on built-in hook error messaging.
- **Next.js**: works client-side; ensure the component renders only in the browser (e.g., dynamic import with `ssr: false`).

```tsx
<LocationAutocomplete
  apiKey={process.env.NEXT_PUBLIC_MAPS_KEY}
  value={value}
  onChange={setValue}
  onSelect={(place) => console.log(place)}
  countries={['us']}
  language='en'
  debounceMs={250}
  minLength={2}
  autoClearSuggestions
  renderSuggestion={(s) => (
    <div>
      <strong>{s.structuredFormatting?.mainText ?? s.description}</strong>
      <small style={{ marginLeft: 6 }}>
        {s.structuredFormatting?.secondaryText}
      </small>
    </div>
  )}
/>
```

## Returned place object

```ts
interface SelectedPlace {
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
```

## Styling

- Works with any styling solution.
- Tailwind example: `className="space-y-2" inputClassName="w-full border px-3 py-2" suggestionsClassName="border rounded shadow bg-white"`.
- CSS-only: target your own classes; component avoids inline styling except minimal defaults for suggestions.
- Custom suggestion rendering: supply `renderSuggestion` for full control.

## API compatibility notes

- Prefers **AutocompleteSuggestion** when available.
- Falls back to **AutocompleteService.getPlacePredictions** automatically.
- Session tokens are renewed after selection; debounced input avoids quota noise.
- Defensive null checks keep the component from crashing when the API is missing or blocked.

## Troubleshooting

- **API not authorized**: confirm the key has Places API enabled and referrer restrictions are correct.
- **Places API blocked**: corporate networks or extensions can block requests; try another network.
- **`ERR_BLOCKED_BY_CLIENT`**: ad blockers may block Google domains; test in a clean profile.
- **Missing billing**: Maps JS and Places require an active billing account.
- **Localhost**: add `http://localhost:*/*` or the exact port to referrers.
- **No suggestions**: check `minLength`, ensure the script loaded, and inspect network errors in DevTools.

## Props reference

```ts
interface LocationAutocompleteProps {
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
  renderSuggestion?: (suggestion: SelectedPlace) => React.ReactNode;
  error?: string | boolean;
}
```

## Security & performance

- API keys are never embedded; you provide them at runtime or via your own script tag.
- Uses debouncing and session tokens to reduce quota usage.
- Cleans up timers on unmount; avoids memory leaks.
- Avoids re-renders by scoping state to the hook.

## Versioning & Stability

This package follows semantic versioning.
- Patch releases: bug fixes
- Minor releases: backward-compatible improvements
- Major releases: breaking changes (with migration notes)

## Build & publishing

- Built with TypeScript and tsup.
- Outputs ESM, CJS, and type declarations to `dist/`.
- Tree-shakeable with `sideEffects: false`.
- `npm run build` to produce artifacts; `npm run typecheck` for verification.

## License

MIT. Contributions welcome — please open an issue or PR with context and reproduction steps.
