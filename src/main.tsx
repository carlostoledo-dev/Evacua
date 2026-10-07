import './zodConfig.ts'; // must stay first: see the file
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App.tsx';
import { I18nProvider } from './i18n/I18nProvider.tsx';
import { browserStore } from './platform/storage.ts';
import './platform/install.ts'; // capture the install prompt before React mounts
import './ui/styles/global.css';

const container = document.getElementById('root');
if (!container) throw new Error('Missing #root element in index.html');

createRoot(container).render(
  <StrictMode>
    <I18nProvider store={browserStore}>
      <App />
    </I18nProvider>
  </StrictMode>,
);
