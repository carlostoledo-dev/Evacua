import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { DemoLocation } from '../../data/schema.ts';
import type { HazardId } from '../../domain/hazards.ts';
import type { ProfileConfig } from '../../domain/profiles.ts';
import type { EvacuationPlan } from '../../domain/routing.ts';
import { useI18n } from '../../i18n/I18nContext.ts';
import type { MessageKey } from '../../i18n/translate.ts';
import type { GeoErrorKind } from '../../platform/geolocation.ts';
import { describePlan, spokenText, type PlanDescription } from '../describePlan.ts';
import { formatDistance } from '../format.ts';
import type { LocationState } from '../hooks/useLocation.ts';
import { useSpeech } from '../hooks/useSpeech.ts';
import { DrillMode } from './DrillMode.tsx';
import { LocationChooser } from './LocationChooser.tsx';
import { CheckIcon, ChevronRightIcon, ChildIcon, SpeakerIcon, WarningIcon } from './icons.tsx';

const GPS_ERROR: Record<GeoErrorKind, MessageKey> = {
  unsupported: 'location.error.unsupported',
  denied: 'location.error.denied',
  unavailable: 'location.error.unavailable',
  timeout: 'location.error.timeout',
};

function PlanView({ description }: { description: PlanDescription }) {
  const Icon = description.tone === 'safe' ? CheckIcon : WarningIcon;
  const simpleOnly = description.steps.length === 0;
  return (
    <div data-testid="plan">
      <p className={`plan plan--${description.tone}`}>
        <Icon />
        {simpleOnly ? <span>{description.headline}</span> : <strong>{description.headline}</strong>}
      </p>
      {description.intro && <p className="plan-note">{description.intro}</p>}
      {description.straightLine && (
        <p className="plan plan--warning">
          <WarningIcon />
          <strong>{description.steps[0]}</strong>
        </p>
      )}
      {description.steps.length > 0 && (
        <ol className="plan-steps">
          {(description.straightLine ? description.steps.slice(1) : description.steps).map(
            (step) => (
              <li key={step}>{step}</li>
            ),
          )}
        </ol>
      )}
      {description.notes.map((note) => (
        <p key={note} className="muted small">
          {note}
        </p>
      ))}
    </div>
  );
}

interface RoutePanelProps {
  location: LocationState;
  plan: EvacuationPlan | null;
  hazard: HazardId;
  profile: ProfileConfig;
  sectorName: string;
  demoLocations: readonly DemoLocation[];
  onGps: () => void;
  onPick: () => void;
  onSimulate: (demo: DemoLocation) => void;
  onClear: () => void;
}

export function RoutePanel({
  location,
  plan,
  hazard,
  profile,
  sectorName,
  demoLocations,
  onGps,
  onPick,
  onSimulate,
  onClear,
}: RoutePanelProps) {
  const { t, locale } = useI18n();
  const speech = useSpeech(locale);
  const demo =
    location.kind === 'demo' ? demoLocations.find((d) => d.id === location.demoId) : undefined;
  const guardian = profile.guardianMessage ? t('route.guardian') : null;

  const description = useMemo(
    () => (plan ? describePlan(plan, { t, locale, profile, hazard, sectorName }) : null),
    [plan, t, locale, profile, hazard, sectorName],
  );
  const text = description ? spokenText(description, guardian) : null;

  // The sheet can be folded to its title to see more map. It unfolds by itself as soon as the
  // location or the plan changes, so a new plan is never hidden.
  const bodyId = useId();
  const [foldedAt, setFoldedAt] = useState<{
    kind: LocationState['kind'];
    plan: EvacuationPlan | null;
  } | null>(null);
  const folded = foldedAt !== null && foldedAt.kind === location.kind && foldedAt.plan === plan;

  // A new location shows a new plan: bring the sheet back to its top so the plan is in view.
  const panelRef = useRef<HTMLElement>(null);
  useEffect(() => {
    panelRef.current?.scrollTo({ top: 0 });
  }, [location.kind, plan]);

  // Older-adult profile: read new instructions aloud right away (the user just acted).
  const spokenRef = useRef<string | null>(null);
  const { say } = speech;
  useEffect(() => {
    if (!profile.autoSpeak || !text || spokenRef.current === text) return;
    spokenRef.current = text;
    say(text);
  }, [profile.autoSpeak, text, say]);

  return (
    <section
      ref={panelRef}
      className="route-panel glass-sheet"
      aria-labelledby="route-title"
      data-testid="route-panel"
      data-tour="route"
    >
      <div className="route-panel__head">
        <div>
          <h2 id="route-title">{t('route.title')}</h2>
          <p className="route-panel__subtitle">{t('route.subtitle')}</p>
        </div>
        <button
          type="button"
          className="sheet-toggle"
          aria-expanded={!folded}
          aria-controls={bodyId}
          aria-label={t('route.toggle')}
          onClick={() => {
            setFoldedAt(folded ? null : { kind: location.kind, plan });
          }}
        >
          <ChevronRightIcon className="icon" />
        </button>
      </div>

      {guardian && (
        <p className="guardian" data-testid="guardian">
          <ChildIcon className="icon icon--large" />
          <strong>{guardian}</strong>
        </p>
      )}

      <div id={bodyId} className="route-panel__body" hidden={folded}>
        {(location.kind === 'none' || location.kind === 'gps-error') && (
          <>
            {location.kind === 'gps-error' && (
              <p className="plan plan--warning" role="alert">
                <WarningIcon />
                <span>{t(GPS_ERROR[location.error])}</span>
              </p>
            )}
            <LocationChooser
              demoLocations={demoLocations}
              simple={profile.simpleMode}
              onGps={onGps}
              onPick={onPick}
              onSimulate={onSimulate}
            />
          </>
        )}

        {(location.kind === 'locating' || location.kind === 'picking') && (
          <div className="route-wait">
            <p role="status">
              {t(location.kind === 'locating' ? 'location.locating' : 'location.picking')}
            </p>
            <button type="button" className="button" onClick={onClear}>
              {t('location.cancel')}
            </button>
          </div>
        )}

        {'position' in location && (
          <>
            <p className="location-source">
              {location.kind === 'demo' && (
                <span className="badge" data-status="demo">
                  {t('location.demoBadge')}
                </span>
              )}{' '}
              {location.kind === 'gps' &&
                t('location.source.gps', {
                  meters: formatDistance(location.accuracyMeters, locale),
                })}
              {location.kind === 'manual' && t('location.source.manual')}
              {location.kind === 'demo' &&
                t('location.source.demo', { label: demo ? demo.label[locale] : location.demoId })}
            </p>
            <div aria-live="polite">{description && <PlanView description={description} />}</div>
            {text && (
              <div className="voice">
                {speech.supported ? (
                  <button
                    type="button"
                    className="button button--block"
                    aria-pressed={speech.speaking}
                    onClick={() => {
                      if (speech.speaking) speech.stop();
                      else speech.say(text);
                    }}
                  >
                    <SpeakerIcon />
                    <span>{speech.speaking ? t('voice.stop') : t('voice.listen')}</span>
                  </button>
                ) : (
                  <p className="muted small">{t('voice.unsupported')}</p>
                )}
              </div>
            )}
            {profile.drill && plan?.kind === 'route' && <DrillMode />}
            <button type="button" className="button button--block" onClick={onClear}>
              {t('location.change')}
            </button>
          </>
        )}

        <p className="muted small">{t('location.privacy')}</p>
      </div>
    </section>
  );
}
