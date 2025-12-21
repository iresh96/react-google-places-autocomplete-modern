import { createRoot } from 'react-dom/client';
import { StrictMode } from 'react';
import App from './App';
import './style.css';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root container missing');
}

const root = createRoot(container);
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
