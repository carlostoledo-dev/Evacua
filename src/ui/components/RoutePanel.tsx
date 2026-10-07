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
import { DEMO_WALK_SPEEDUP, LOW_ACCURACY_M } from '../../domain/constants.ts';
import type { HazardId } from '../../domain/hazards.ts';
import { streetLegs, type ManeuverKind } from '../../domain/navigation.ts';
import type { ProfileConfig } from '../../domain/profiles.ts';
import type { EvacuationPlan } from '../../domain/routing.ts';
import { useI18n } from '../../i18n/I18nContext.ts';
import type { MessageKey } from '../../i18n/translate.ts';
import type { GeoErrorKind } from '../../platform/geolocation.ts';
import {
  describePlan,
  formatShortTime,
  shortCode,
  spokenText,
  type PlanDescription,
  type PlanItem,
} from '../describePlan.ts';
import { formatDistance } from '../format.ts';
import type { LocationState } from '../hooks/useLocation.ts';
import type { Navigation } from '../hooks/useNavigation.ts';
import { useSpeech } from '../hooks/useSpeech.ts';
import type { ManeuverText } from '../navigationText.ts';
import { DrillMode } from './DrillMode.tsx';
import { HazardGuidance } from './HazardGuidance.tsx';
import { LocationChooser } from './LocationChooser.tsx';
import {
  ArrowRightIcon,
  CheckIcon,
  ChildIcon,
  LockIcon,
  MenuIcon,
  PinIcon,
  ShieldCheckIcon,
  SpeakerIcon,
  WalkIcon,
  WarningIcon,
} from './icons.tsx';

const ITEM_ICON: Record<PlanItem['kind'], ComponentType<{ className?: string }>> = {
  exit: WalkIcon,
  'meeting-point': PinIcon,
  'safe-area': ShieldCheckIcon,
};

const TURN_ACTION: Record<Exclude<ManeuverKind, 'arrive'>, MessageKey> = {
  'slight-left': 'nav.slightLeft',
  'slight-right': 'nav.slightRight',
  left: 'nav.left',
  right: 'nav.right',
  'sharp-left': 'nav.sharpLeft',
  'sharp-right': 'nav.sharpRight',
};

const GPS_ERROR: Record<GeoErrorKind, MessageKey> = {
  unsupported: 'location.error.unsupported',
  denied: 'location.error.denied',
  unavailable: 'location.error.unavailable',
  timeout: 'location.error.timeout',
};

/**
 * The plan's headline, its legs (with icons, distances and times) and its notes.
 * `headlineShown`: false when the red card on top of the map already says it (screen readers
 * still get it here, in the plan).
 */
function PlanView({
  description,
  headlineShown = true,
}: {
  description: PlanDescription;
  headlineShown?: boolean;
}) {
  const Icon = description.tone === 'safe' ? CheckIcon : WarningIcon;
  const simpleOnly = description.steps.length === 0;
  return (
    <div data-testid="plan" className="plan-view" aria-live="polite">
      <p className={headlineShown ? `plan plan--${description.tone}` : 'visually-hidden'}>
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
      {description.items.length > 0 ? (
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
  /** Route details shown under the summary (the sheet pulled up). */
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  /** Opens the quick menu (≡). */
  onOpenMenu: () => void;
}

/**
 * The bottom sheet, as in the design: choosing a location ("find my route" + ≡); with a route,
 * a summary (where to, how far, how long) and one big "start evacuation" button, with the
 * details below when pulled up; while navigating, the distance left, the progress and "leave".
 */
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
  expanded,
  onExpandedChange,
  onOpenMenu,
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
  const route = plan?.kind === 'route' ? plan : null;
  const detailsId = useId();

  // "Cómo llegar": leave the danger area, one line per street (with its turn), then arrive.
  const howTo = useMemo(() => {
    if (!route) return [];
    const steps: string[] = [];
    if (route.metersToSafety !== null) {
      steps.push(`${t('route.item.exit')} (${formatDistance(route.metersToSafety, locale)})`);
    }
    streetLegs(route.path, route.streets).forEach((leg, index) => {
      const action = leg.turn
        ? t(TURN_ACTION[leg.turn])
        : t(index === 0 ? 'route.legStart' : 'route.legStraight');
      const distance = formatDistance(leg.meters, locale);
      steps.push(
        leg.street
          ? t('route.leg', { action, street: leg.street, distance })
          : t('route.legNoName', { action, distance }),
      );
    });
    steps.push(
      route.destination.kind === 'meeting-point'
        ? t('route.howArriveMeeting', { code: shortCode(route.destination.code) })
        : t('route.howArriveSafe'),
    );
    return steps;
  }, [route, t, locale]);

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

  // Progress while navigating: the route left now against the route when it started.
  const [startMeters, setStartMeters] = useState<number | null>(null);
  const progress =
    route && startMeters ? Math.min(1, Math.max(0, 1 - route.meters / startMeters)) : 0;

  const choosing = location.kind === 'none' || location.kind === 'gps-error';
  const routeTime = route ? formatShortTime(route.time, profile, t) : null;

  const menuButton = (
    <button
      type="button"
      className="menu-button"
      aria-label={t('nav.menu')}
      aria-haspopup="dialog"
      data-tour="menu"
      onClick={onOpenMenu}
    >
      <MenuIcon className="icon" />
    </button>
  );

  const listenButton: ReactNode =
    text && speech.supported ? (
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
    ) : null;

  const changeButton = (
    <button
      type="button"
      className="button button--tinted"
      aria-label={t('location.change')}
      onClick={onClear}
    >
      <PinIcon />
      <span>{t('location.changeShort')}</span>
    </button>
  );

  const caption = 'position' in location && (
    <p className="location-source">
      {location.kind === 'demo' && (
        <span className="badge" data-status="demo">
          {t('location.demoBadge')}
        </span>
      )}{' '}
      {location.kind === 'gps' &&
        t('location.source.gps', { meters: formatDistance(location.accuracyMeters, locale) })}
      {location.kind === 'manual' && t('location.source.manual')}
      {location.kind === 'demo' &&
        t('location.source.demo', {
          // The label's "(inside the evacuation area)" note only helps when choosing a test
          // point; the plan already says it.
          label: demo ? demo.label[locale].replace(/\s*\([^)]*\)\s*$/, '') : location.demoId,
        })}
    </p>
  );

  return (
    <section
      ref={panelRef}
      className={
        navigation.active ? 'route-panel glass-sheet route-panel--nav' : 'route-panel glass-sheet'
      }
      aria-labelledby="route-title"
      data-testid="route-panel"
      data-tour="route"
    >
      <h2 id="route-title" className="visually-hidden">
        {t('route.title')}
      </h2>

      {/* Pulled up / down like an iOS sheet; a real button, so it works without a swipe. */}
      {route && !navigation.active ? (
        <button
          type="button"
          className="sheet-toggle"
          aria-expanded={expanded}
          aria-controls={detailsId}
          aria-label={t('route.toggle')}
          onClick={() => {
            onExpandedChange(!expanded);
          }}
        >
          <span className="sheet-grabber" aria-hidden="true" />
        </button>
      ) : (
        <div className="sheet-grabber" aria-hidden="true" />
      )}

      {guardian && (
        <p className="guardian" data-testid="guardian">
          <ChildIcon className="icon icon--large" />
          <strong>{guardian}</strong>
        </p>
      )}

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
          {location.kind === 'gps-error' ? (
            <p className="plan plan--warning" role="alert">
              <WarningIcon />
              <span>{t(GPS_ERROR[location.error])}</span>
            </p>
          ) : route ? (
            <div className="nav-card">
              <p className="nav-card__left">
                <WalkIcon className="icon nav-card__icon" />
                <strong>{formatDistance(route.meters, locale)}</strong>
                {routeTime && <span>{routeTime}</span>}
              </p>
              <div className="nav-card__actions">
                {speech.supported && (
                  <button
                    type="button"
                    className="nav-card__voice"
                    aria-pressed={navigation.voice}
                    aria-label={t('nav.voice')}
                    onClick={navigation.toggleVoice}
                  >
                    <SpeakerIcon className="icon" />
                  </button>
                )}
                <button
                  type="button"
                  className="button button--outline nav-card__leave"
                  onClick={navigation.stop}
                >
                  {t('nav.stop')}
                </button>
              </div>
            </div>
          ) : (
            <p role="status">{t('nav.waiting')}</p>
          )}
          {route && (
            <div
              className="nav-progress"
              role="progressbar"
              aria-label={t('nav.progress')}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(progress * 100)}
            >
              <span style={{ transform: `scaleX(${String(progress)})` }} />
            </div>
          )}
          {/* Screen readers hear each new instruction once, not every distance update. */}
          <p className="visually-hidden" aria-live="polite">
            {navigation.arrived ? '' : (maneuverText?.action ?? '')}
          </p>
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
            trailing={menuButton}
            onGps={onGps}
            onPick={onPick}
            onSimulate={onSimulate}
          />
          {/* Reassurance where it matters: while choosing how to share a location. */}
          <p className="privacy-line">
            <LockIcon />
            <span>{t('location.privacy')}</span>
          </p>
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

          {route ? (
            <>
              {/* Summary: where to, how far, how long, and one big button. */}
              <div className="plan-summary" data-testid="plan-summary">
                <span className="plan-summary__icon">
                  <WalkIcon className="icon" />
                </span>
                <p className="plan-summary__text">
                  <span>
                    {route.destination.kind === 'meeting-point'
                      ? t('route.nearestMeeting')
                      : t('route.item.safeArea')}
                  </span>
                  {route.destination.kind === 'meeting-point' && (
                    <strong>{shortCode(route.destination.code)}</strong>
                  )}
                  <span className="plan-summary__meta">
                    {routeTime
                      ? t('route.summary', {
                          distance: formatDistance(route.meters, locale),
                          time: routeTime,
                        })
                      : formatDistance(route.meters, locale)}
                  </span>
                </p>
                {menuButton}
              </div>
              <button
                type="button"
                className="button button--primary button--lg button--block nav-start"
                onClick={() => {
                  setStartMeters(route.meters);
                  navigation.start();
                }}
              >
                <span>{t('nav.start')}</span>
                <ArrowRightIcon />
              </button>

              {/* Children: the drill game right under the button, not hidden in the details. */}
              {profile.drill && <DrillMode />}

              <div id={detailsId} className="route-panel__details" hidden={!expanded}>
                {description && (
                  <PlanView description={description} headlineShown={!route.inDangerZone} />
                )}
                {howTo.length > 1 && (
                  <section className="how-to" aria-labelledby={`${detailsId}-how`}>
                    <h3 id={`${detailsId}-how`}>
                      <PinIcon className="icon" />
                      {t('route.howTo')}
                    </h3>
                    <ol>
                      {howTo.map((step) => (
                        <li key={step}>{step}</li>
                      ))}
                    </ol>
                  </section>
                )}
                <div className="plan-actions__row">
                  {listenButton}
                  {changeButton}
                </div>
                {text && !speech.supported && (
                  <p className="muted small">{t('voice.unsupported')}</p>
                )}
                <HazardGuidance hazard={hazard} brief />
                {caption}
              </div>
            </>
          ) : (
            <>
              <div className="plan-summary plan-summary--plain" data-testid="plan-summary">
                {description && <PlanView description={description} />}
                {menuButton}
              </div>
              <div className="plan-actions__row">
                {listenButton}
                {changeButton}
              </div>
              {text && !speech.supported && <p className="muted small">{t('voice.unsupported')}</p>}
              {caption}
            </>
          )}
        </>
      )}
    </section>
  );
}
