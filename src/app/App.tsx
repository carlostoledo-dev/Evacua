import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { DEFAULT_HAZARD, layersForHazard, type HazardId } from '../domain/hazards.ts';
import { useI18n } from '../i18n/I18nContext.ts';
import { ConnectionPill } from '../ui/components/ConnectionPill.tsx';
import { Disclaimer } from '../ui/components/Disclaimer.tsx';
import { TabBar, type View } from '../ui/components/TabBar.tsx';
import { UpdatePrompt } from '../ui/components/UpdatePrompt.tsx';
import { useCommuneData } from '../ui/hooks/useCommuneData.ts';
import { useElementHeight } from '../ui/hooks/useElementHeight.ts';
import { useEvacuationPlan } from '../ui/hooks/useEvacuationPlan.ts';
import { locationPosition, useLocation } from '../ui/hooks/useLocation.ts';
import { useOnlineStatus } from '../ui/hooks/useOnlineStatus.ts';
import { useServiceWorker } from '../ui/hooks/useServiceWorker.ts';
import { useTheme } from '../ui/hooks/useTheme.ts';
import { useUserProfile } from '../ui/hooks/useUserProfile.ts';
import { Tour } from '../ui/components/Tour.tsx';
import { Onboarding } from '../ui/screens/Onboarding.tsx';
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
  const profile = useUserProfile();
  const [tourRequested, setTourRequested] = useState(false);
  // The app bar and the tab bar float over the content (translucent, as on iOS): screens keep
  // their content clear of them with these heights.
  const [headerRef, headerHeight] = useElementHeight();
  const [footerRef, footerHeight] = useElementHeight();

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

  if (!profile.user) {
    return (
      <Onboarding
        onDone={(user) => {
          profile.save(user);
          setView('map');
        }}
      />
    );
  }
  const user = profile.user;
  const showTour = view === 'map' && (!user.tourDone || tourRequested);

  return (
    <div
      className="app"
      style={
        {
          '--chrome-top': `${String(headerHeight)}px`,
          '--chrome-bottom': `${String(footerHeight)}px`,
        } as CSSProperties
      }
    >
      <a className="skip-link" href="#main">
        {t('nav.skipToContent')}
      </a>

      {/* One compact band: brand, offline status and the permanent notice under them. */}
      <header className="app-bar" ref={headerRef}>
        <div className="app-bar__row">
          <div className="brand">
            <img className="brand__logo" src="/logo.png" alt="" width="40" height="40" />
            <p className="brand__name">{t('app.name')}</p>
            {data && (
              <p className="brand__place">{t('app.place', { commune: data.manifest.name })}</p>
            )}
          </div>
          <ConnectionPill offline={serviceWorker.offline} online={online} />
        </div>
        <div data-tour="disclaimer">
          <Disclaimer />
        </div>
        {serviceWorker.updateAvailable && (
          <UpdatePrompt
            onApply={serviceWorker.applyUpdate}
            onDismiss={serviceWorker.dismissUpdate}
          />
        )}
      </header>

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
          profile={profile.config}
          chrome={{ top: headerHeight, bottom: footerHeight }}
        />
        {view === 'guide' && (
          <GuideScreen
            hazard={hazard}
            onHazardChange={setHazard}
            pilot={data ? { sector: data.manifest.sector.name, commune: data.manifest.name } : null}
          />
        )}
        {view === 'data' && <DataScreen state={commune.state} onRetry={commune.retry} />}
        {view === 'settings' && (
          <SettingsScreen
            offline={serviceWorker.offline}
            online={online}
            themePreference={preference}
            onThemeChange={setPreference}
            user={user}
            onSaveUser={profile.save}
            onReplayTour={() => {
              setTourRequested(true);
              setView('map');
            }}
            onDeleteAll={() => {
              location.clear();
              profile.deleteAll();
            }}
          />
        )}
      </main>

      <footer className="app-footer" ref={footerRef}>
        <div data-tour="tabs">
          <TabBar value={view} onChange={setView} />
        </div>
      </footer>

      {showTour && (
        <Tour
          onClose={() => {
            setTourRequested(false);
            if (!user.tourDone) profile.save({ ...user, tourDone: true });
          }}
        />
      )}
    </div>
  );
}
