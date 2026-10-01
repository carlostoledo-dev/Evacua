import { useI18n } from '../i18n/I18nContext.ts';
import { AppStatus } from '../ui/components/AppStatus.tsx';
import { Disclaimer } from '../ui/components/Disclaimer.tsx';
import { LanguageSwitcher } from '../ui/components/LanguageSwitcher.tsx';
import { UpdatePrompt } from '../ui/components/UpdatePrompt.tsx';
import { useOnlineStatus } from '../ui/hooks/useOnlineStatus.ts';
import { useServiceWorker } from '../ui/hooks/useServiceWorker.ts';

export function App() {
  const { t } = useI18n();
  const online = useOnlineStatus();
  const serviceWorker = useServiceWorker();

  return (
    <div className="layout">
      <a className="skip-link" href="#main">
        {t('nav.skipToContent')}
      </a>

      <header className="header">
        <div className="brand">
          <img className="brand__logo" src="/logo.svg" alt="" width="48" height="48" />
          <div>
            <p className="brand__name">{t('app.name')}</p>
            <p className="brand__tagline">{t('app.tagline')}</p>
          </div>
        </div>
        <LanguageSwitcher />
      </header>

      {serviceWorker.updateAvailable && (
        <UpdatePrompt onApply={serviceWorker.applyUpdate} onDismiss={serviceWorker.dismissUpdate} />
      )}

      <main id="main" className="main" tabIndex={-1}>
        <AppStatus offline={serviceWorker.offline} online={online} />
        <section className="card" aria-labelledby="home-title">
          <h1 id="home-title">{t('home.title')}</h1>
          <p className="pilot">{t('app.pilotSector')}</p>
          <p>{t('home.intro')}</p>
          <p className="muted">{t('home.comingSoon')}</p>
        </section>
      </main>

      <footer className="footer">
        <Disclaimer />
        <p className="footer__version">{t('footer.version', { version: __APP_VERSION__ })}</p>
      </footer>
    </div>
  );
}
