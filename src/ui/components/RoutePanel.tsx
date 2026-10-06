import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from 'react';
import type { DemoLocation } from '../../data/schema.ts';
import type { HazardId } from '../../domain/hazards.ts';
import type { ProfileConfig } from '../../domain/profiles.ts';
import type { EvacuationPlan } from '../../domain/routing.ts';
import { useI18n } from '../../i18n/I18nContext.ts';
import type { MessageKey } from '../../i18n/translate.ts';
import type { GeoErrorKind } from '../../platform/geolocation.ts';
import {
  describePlan,
  shortCode,
  spokenText,
  type PlanDescription,
  type PlanItem,
} from '../describePlan.ts';
import type { Navigation } from '../hooks/useNavigation.ts';
import type { ManeuverText } from '../navigationText.ts';
import { formatDistance } from '../format.ts';
import type { LocationState } from '../hooks/useLocation.ts';
import { useSpeech } from '../hooks/useSpeech.ts';
import { DrillMode } from './DrillMode.tsx';
import { LocationChooser } from './LocationChooser.tsx';
import { DEMO_WALK_SPEEDUP, LOW_ACCURACY_M } from '../../domain/constants.ts';
import {
  CheckIcon,
  ChevronRightIcon,
  ChildIcon,
  LockIcon,
  PinIcon,
  ShieldCheckIcon,
  SpeakerIcon,
  StopIcon,
  WalkIcon,
  WarningIcon,
} from './icons.tsx';

const ITEM_ICON: Record<PlanItem['kind'], ComponentType<{ className?: string }>> = {
  exit: WalkIcon,
  'meeting-point': PinIcon,
  'safe-area': ShieldCheckIcon,
};

const GPS_ERROR: Record<GeoErrorKind, MessageKey> = {
  unsupported: 'location.error.unsupported',
  denied: 'location.error.denied',
  unavailable: 'location.error.unavailable',
  timeout: 'location.error.timeout',
};

interface PlanViewProps {
  description: PlanDescription;
  /** Buttons shown right under the headline (Navigate, listen, change), before the steps. */
  actions?: ReactNode;
  /** Announce the headline and the steps to screen readers when they change. */
  live?: boolean;
}

/** Order of a glance: am I in danger → what to tap → the steps. */
function PlanView({ description, actions, live = false }: PlanViewProps) {
  const Icon = description.tone === 'safe' ? CheckIcon : WarningIcon;
  const simpleOnly = description.steps.length === 0;
  const politeness = live ? 'polite' : undefined;
  return (
    <div data-testid="plan" className="plan-view">
      <div aria-live={politeness} className="plan-view__lead">
        <p className={`plan plan--${description.tone}`}>
          <Icon />
          {simpleOnly ? (
            <span>{description.headline}</span>
          ) : (
            <strong>{description.headline}</strong>
          )}
        </p>
        {description.intro && <p className="plan-note">{description.intro}</p>}
        {description.straightLine && (
          <p className="plan plan--warning">
            <WarningIcon />
            <strong>{description.steps[0]}</strong>
          </p>
        )}
      </div>
      {actions}
      <div aria-live={politeness} className="plan-view__details">
        {description.items.length > 0 ? (
          // Route summary for a glance: each step with its icon, where to, how far and how long.
          <ol className="route-steps">
            {description.items.map((item) => {
              const ItemIcon = ITEM_ICON[item.kind];
              return (
                <li key={item.kind} className="route-step" data-kind={item.kind}>
                  <span className="route-step__icon">
                    <ItemIcon className="icon" />
                  </span>
                  <span className="route-step__text">
                    <strong>{item.title}</strong> <span>{item.detail}</span>
                  </span>
                  {item.time && <span className="route-step__time"> {item.time}</span>}
                </li>
              );
            })}
          </ol>
        ) : (
          description.steps.length > 0 && (
            <ol className="plan-steps">
              {(description.straightLine ? description.steps.slice(1) : description.steps).map(
                (step) => (
                  <li key={step}>{step}</li>
                ),
              )}
            </ol>
          )
        )}
        {description.notes.map((note) => (
          <p key={note} className="muted small">
            {note}
          </p>
        ))}
      </div>
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
  navigation: Navigation;
  /** The next turn-by-turn instruction while navigating. */
  maneuverText: ManeuverText | null;
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
  navigation,
  maneuverText,
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
    if (navigation.active || !profile.autoSpeak || !text || spokenRef.current === text) return;
    spokenRef.current = text;
    say(text);
  }, [navigation.active, profile.autoSpeak, text, say]);

  // Navigation voice: each new instruction once (not every meter), then the arrival.
  const route = plan?.kind === 'route' ? plan : null;
  const arrivedText =
    route?.destination.kind === 'meeting-point'
      ? t('nav.arrivedMeeting', { code: shortCode(route.destination.code) })
      : t('nav.arrivedSafe');
  const navSpeech = navigation.arrived
    ? { key: 'arrived', words: arrivedText }
    : maneuverText
      ? { key: maneuverText.key, words: maneuverText.spoken }
      : null;
  const navKey = navSpeech?.key ?? null;
  const navWords = navSpeech?.words ?? null;
  const navKeyRef = useRef<string | null>(null);
  useEffect(() => {
    if (!navigation.active) {
      navKeyRef.current = null;
      return;
    }
    if (!navigation.voice || navKey === null || navWords === null || navKeyRef.current === navKey)
      return;
    navKeyRef.current = navKey;
    say(navWords);
  }, [navigation.active, navigation.voice, navKey, navWords, say]);

  const choosing = location.kind === 'none' || location.kind === 'gps-error';

  return (
    <section
      ref={panelRef}
      className="route-panel glass-sheet"
      aria-labelledby="route-title"
      data-testid="route-panel"
      data-tour="route"
    >
      {/* Stays at the top while the sheet scrolls, so folding is always one tap away. */}
      <div className="route-panel__head">
        <h2 id="route-title">{t('route.title')}</h2>
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
        {navigation.active && (
          <div className="nav-panel" data-testid="nav-panel">
            {navigation.mode === 'demo' && (
              <p className="nav-demo">
                <span className="badge" data-status="demo">
                  {t('location.demoBadge')}
                </span>{' '}
                {t('nav.demo', { factor: DEMO_WALK_SPEEDUP })}
              </p>
            )}
            {navigation.arrived ? (
              <p className="plan plan--safe" role="status">
                <CheckIcon />
                <strong>{arrivedText}</strong>
              </p>
            ) : location.kind === 'gps-error' ? (
              <p className="plan plan--warning" role="alert">
                <WarningIcon />
                <span>{t(GPS_ERROR[location.error])}</span>
              </p>
            ) : 'position' in location ? (
              description && <PlanView description={description} />
            ) : (
              <p role="status">{t('nav.waiting')}</p>
            )}
            {/* Screen readers hear each new instruction once, not every distance update. */}
            <p className="visually-hidden" aria-live="polite">
              {navigation.arrived ? '' : (maneuverText?.action ?? '')}
            </p>
            <div className="nav-actions">
              {speech.supported && (
                <button
                  type="button"
                  className="button"
                  aria-pressed={navigation.voice}
                  onClick={navigation.toggleVoice}
                >
                  <SpeakerIcon />
                  <span>{t('nav.voice')}</span>
                </button>
              )}
              <button type="button" className="button button--primary" onClick={navigation.stop}>
                <StopIcon />
                <span>{navigation.arrived ? t('nav.finish') : t('nav.stop')}</span>
              </button>
            </div>
          </div>
        )}

        {!navigation.active && choosing && (
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

        {!navigation.active && (location.kind === 'locating' || location.kind === 'picking') && (
          <div className="route-wait">
            <p role="status">
              {t(location.kind === 'locating' ? 'location.locating' : 'location.picking')}
            </p>
            <button type="button" className="button" onClick={onClear}>
              {t('location.cancel')}
            </button>
          </div>
        )}

        {!navigation.active && 'position' in location && (
          <>
            {location.kind === 'gps' && location.accuracyMeters > LOW_ACCURACY_M && (
              <div className="plan plan--warning low-accuracy" data-testid="low-accuracy">
                <WarningIcon />
                <div>
                  <p>
                    {t('location.lowAccuracy', {
                      meters: formatDistance(location.accuracyMeters, locale),
                    })}
                  </p>
                  <button type="button" className="button button--block" onClick={onPick}>
                    {t('location.pickOnMap')}
                  </button>
                </div>
              </div>
            )}
            {description && (
              <PlanView
                description={description}
                live
                actions={
                  <div className="plan-actions">
                    {route && (
                      <button
                        type="button"
                        className="button button--primary button--lg button--block nav-start"
                        onClick={navigation.start}
                      >
                        <WalkIcon />
                        <span>{t('nav.start')}</span>
                      </button>
                    )}
                    <div className="plan-actions__row">
                      {text && speech.supported && (
                        <button
                          type="button"
                          className="button button--tinted"
                          aria-pressed={speech.speaking}
                          onClick={() => {
                            if (speech.speaking) speech.stop();
                            else speech.say(text);
                          }}
                        >
                          <SpeakerIcon />
                          <span>{speech.speaking ? t('voice.stop') : t('voice.listen')}</span>
                        </button>
                      )}
                      <button
                        type="button"
                        className="button button--tinted"
                        aria-label={t('location.change')}
                        onClick={onClear}
                      >
                        <PinIcon />
                        <span>{t('location.changeShort')}</span>
                      </button>
                    </div>
                    {text && !speech.supported && (
                      <p className="muted small">{t('voice.unsupported')}</p>
                    )}
                  </div>
                }
              />
            )}
            {/* Where the plan comes from, after the actions (the map keeps its own DEMO label). */}
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
                t('location.source.demo', {
                  // The label's "(inside the evacuation area)" note only helps when choosing a
                  // test point; here the plan below already says it.
                  label: demo
                    ? demo.label[locale].replace(/\s*\([^)]*\)\s*$/, '')
                    : location.demoId,
                })}
            </p>
            {profile.drill && plan?.kind === 'route' && <DrillMode />}
          </>
        )}

        {/* Reassurance where it matters: while choosing how to share a location. */}
        {!navigation.active && choosing && (
          <p className="privacy-line">
            <LockIcon />
            <span>{t('location.privacy')}</span>
          </p>
        )}
      </div>
    </section>
  );
}
