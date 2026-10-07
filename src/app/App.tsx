import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { DEFAULT_HAZARD, layersForHazard, type HazardId } from '../domain/hazards.ts';
import { useI18n } from '../i18n/I18nContext.ts';
import { ConnectionPill } from '../ui/components/ConnectionPill.tsx';
import { Disclaimer } from '../ui/components/Disclaimer.tsx';
import { ChevronLeftIcon } from '../ui/components/icons.tsx';
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
import type { View } from '../ui/views.ts';

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
  // The app bar floats over the content (as on iOS); screens keep clear of it with its height.
  const [headerRef, headerHeight] = useElementHeight();

  // After a screen change, move focus to the new screen's title so screen readers announce it.
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
  const pill = <ConnectionPill offline={serviceWorker.offline} online={online} />;
  const updatePrompt = serviceWorker.updateAvailable && (
    <UpdatePrompt onApply={serviceWorker.applyUpdate} onDismiss={serviceWorker.dismissUpdate} />
  );
  const showTour = view === 'map' && (!user.tourDone || tourRequested);

  return (
    <div
      className="app"
      style={
        {
          '--chrome-top': `${String(view === 'map' ? 0 : headerHeight)}px`,
        } as CSSProperties
      }
    >
      <a className="skip-link" href="#main">
        {t('nav.skipToContent')}
      </a>

      {/* The map draws its own floating cards (notice, status); the other screens get a bar
          with a way back to the map, the status and the same notice. */}
      {view !== 'map' && (
        <header className="app-bar" ref={headerRef}>
          <div className="app-bar__row">
            <button
              type="button"
              className="back-button"
              aria-label={t('nav.backToMap')}
              onClick={() => {
                setView('map');
              }}
            >
              <ChevronLeftIcon className="icon" />
              <span>{t('nav.map')}</span>
            </button>
            {pill}
          </div>
          <Disclaimer />
          {updatePrompt}
        </header>
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
          profile={profile.config}
          status={pill}
          prompt={updatePrompt}
          onNavigate={setView}
          onReplayTour={() => {
            setTourRequested(true);
          }}
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

      {showTour && (
        <Tour
          simple={!profile.config.mapButtons}
          onClose={() => {
            setTourRequested(false);
            if (!user.tourDone) profile.save({ ...user, tourDone: true });
          }}
        />
      )}
    </div>
  );
}
