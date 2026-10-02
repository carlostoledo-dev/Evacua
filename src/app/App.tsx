import { useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_HAZARD, layersForHazard, type HazardId } from '../domain/hazards.ts';
import { useI18n } from '../i18n/I18nContext.ts';
import { ConnectionPill } from '../ui/components/ConnectionPill.tsx';
import { Disclaimer } from '../ui/components/Disclaimer.tsx';
import { TabBar, type View } from '../ui/components/TabBar.tsx';
import { UpdatePrompt } from '../ui/components/UpdatePrompt.tsx';
import { useCommuneData } from '../ui/hooks/useCommuneData.ts';
import { useEvacuationPlan } from '../ui/hooks/useEvacuationPlan.ts';
import { locationPosition, useLocation } from '../ui/hooks/useLocation.ts';
import { useOnlineStatus } from '../ui/hooks/useOnlineStatus.ts';
import { useServiceWorker } from '../ui/hooks/useServiceWorker.ts';
import { useTheme } from '../ui/hooks/useTheme.ts';
import { DataScreen } from '../ui/screens/DataScreen.tsx';
import { GuideScreen } from '../ui/screens/GuideScreen.tsx';
import { MapScreen } from '../ui/screens/MapScreen.tsx';
import { SettingsScreen } from '../ui/screens/SettingsScreen.tsx';

const VIEW_TITLE_ID: Record<View, string> = {
  map: 'view-title-map',
  guide: 'view-title-guide',
  data: 'data-title',
  settings: 'view-title-settings',
};

export function App() {
  const { t } = useI18n();
  const online = useOnlineStatus();
  const serviceWorker = useServiceWorker();
  const commune = useCommuneData();
  const { preference, theme, setPreference } = useTheme();
  const [hazard, setHazard] = useState<HazardId>(DEFAULT_HAZARD);
  const [view, setView] = useState<View>('map');

  // After a tab change, move focus to the new screen's title so screen readers announce it.
  const firstRenderRef = useRef(true);
  useEffect(() => {
    if (firstRenderRef.current) {
      firstRenderRef.current = false;
      return;
    }
    document.getElementById(VIEW_TITLE_ID[view])?.focus();
  }, [view]);

  const data = commune.state.status === 'ready' ? commune.state.data : null;
  const visibleLayers = useMemo(() => {
    if (!data) return [];
    const ids = new Set(
      layersForHazard(
        hazard,
        data.layers.map((l) => l.entry),
      ).map((e) => e.id),
    );
    return data.layers.filter((l) => ids.has(l.entry.id));
  }, [data, hazard]);

  const location = useLocation();
  const plan = useEvacuationPlan(data, visibleLayers, locationPosition(location.state));

  return (
    <div className="app">
      <a className="skip-link" href="#main">
        {t('nav.skipToContent')}
      </a>

      <header className="app-bar">
        <div className="brand">
          <img className="brand__logo" src="/logo.svg" alt="" width="36" height="36" />
          <p className="brand__name">{t('app.name')}</p>
        </div>
        <ConnectionPill offline={serviceWorker.offline} online={online} />
      </header>

      {serviceWorker.updateAvailable && (
        <UpdatePrompt onApply={serviceWorker.applyUpdate} onDismiss={serviceWorker.dismissUpdate} />
      )}

      <main id="main" className="app-main" tabIndex={-1}>
        <MapScreen
          active={view === 'map'}
          commune={commune.state}
          hazard={hazard}
          onHazardChange={setHazard}
          visibleLayers={visibleLayers}
          theme={theme}
          onShowData={() => {
            setView('data');
          }}
          location={location.state}
          locationActions={location}
          plan={plan}
        />
        {view === 'guide' && <GuideScreen hazard={hazard} onHazardChange={setHazard} />}
        {view === 'data' && <DataScreen state={commune.state} onRetry={commune.retry} />}
        {view === 'settings' && (
          <SettingsScreen
            offline={serviceWorker.offline}
            online={online}
            themePreference={preference}
            onThemeChange={setPreference}
          />
        )}
      </main>

      <footer className="app-footer">
        <Disclaimer />
        <TabBar value={view} onChange={setView} />
      </footer>
    </div>
  );
}
