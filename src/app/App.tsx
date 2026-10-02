import { lazy, Suspense, useState } from 'react';
import { DEFAULT_HAZARD, layersForHazard, type HazardId } from '../domain/hazards.ts';
import { useI18n } from '../i18n/I18nContext.ts';
import { AppStatus } from '../ui/components/AppStatus.tsx';
import { DataSources } from '../ui/components/DataSources.tsx';
import { Disclaimer } from '../ui/components/Disclaimer.tsx';
import { HazardGuidance } from '../ui/components/HazardGuidance.tsx';
import { HazardSelector } from '../ui/components/HazardSelector.tsx';
import { LanguageSwitcher } from '../ui/components/LanguageSwitcher.tsx';
import { MapLegend } from '../ui/components/MapLegend.tsx';
import { UpdatePrompt } from '../ui/components/UpdatePrompt.tsx';
import { useCommuneData } from '../ui/hooks/useCommuneData.ts';
import { useOnlineStatus } from '../ui/hooks/useOnlineStatus.ts';
import { useServiceWorker } from '../ui/hooks/useServiceWorker.ts';

// MapLibre is large; load it only once there is data to draw.
const MapView = lazy(() => import('../ui/map/MapView.tsx'));

export function App() {
  const { t } = useI18n();
  const online = useOnlineStatus();
  const serviceWorker = useServiceWorker();
  const commune = useCommuneData();
  const [hazard, setHazard] = useState<HazardId>(DEFAULT_HAZARD);

  const data = commune.state.status === 'ready' ? commune.state.data : null;
  const visibleIds = new Set(
    data
      ? layersForHazard(
          hazard,
          data.layers.map((layer) => layer.entry),
        ).map((e) => e.id)
      : [],
  );
  const visibleLayers = data ? data.layers.filter((layer) => visibleIds.has(layer.entry.id)) : [];

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
          <HazardSelector value={hazard} onChange={setHazard} />
        </section>

        {data && (
          <section className="card card--map" aria-label={t('map.title')}>
            <Suspense
              fallback={
                <p className="map-frame map-overlay" role="status">
                  {t('map.loading')}
                </p>
              }
            >
              <MapView commune={data} hazard={hazard} />
            </Suspense>
            <MapLegend layers={visibleLayers} />
            <p className="muted small">{t('home.comingSoon')}</p>
          </section>
        )}

        <HazardGuidance hazard={hazard} />

        <DataSources state={commune.state} onRetry={commune.retry} />
      </main>

      <footer className="footer">
        <Disclaimer />
        <p className="footer__version">{t('footer.version', { version: __APP_VERSION__ })}</p>
      </footer>
    </div>
  );
}
