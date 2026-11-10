import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { MotionConfig } from 'motion/react';
import { StoreProvider } from './lib/store';
import { UIProvider } from './lib/ui';
import App from './App';
import './styles.css';

// Aplica o tema salvo antes do primeiro paint (evita "piscar")
try {
  const saved = JSON.parse(localStorage.getItem('curadoria:v1') ?? '{}');
  const t = saved?.prefs?.theme;
  const dark = t === 'dark' || (t === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
} catch {
  document.documentElement.dataset.theme = 'light';
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <MotionConfig reducedMotion="user">
        <StoreProvider>
          <UIProvider>
            <App />
          </UIProvider>
        </StoreProvider>
      </MotionConfig>
    </HashRouter>
  </StrictMode>,
);
