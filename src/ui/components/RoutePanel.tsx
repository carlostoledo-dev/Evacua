import type { DemoLocation } from '../../data/schema.ts';
import type { HazardId } from '../../domain/hazards.ts';
import type { EvacuationPlan, StraightLineReason } from '../../domain/routing.ts';
import { useI18n } from '../../i18n/I18nContext.ts';
import type { MessageKey } from '../../i18n/translate.ts';
import type { GeoErrorKind } from '../../platform/geolocation.ts';
import { formatDistance } from '../format.ts';
import type { LocationState } from '../hooks/useLocation.ts';
import { LocationChooser } from './LocationChooser.tsx';
import { CheckIcon, WarningIcon } from './icons.tsx';

const GPS_ERROR: Record<GeoErrorKind, MessageKey> = {
  unsupported: 'location.error.unsupported',
  denied: 'location.error.denied',
  unavailable: 'location.error.unavailable',
  timeout: 'location.error.timeout',
};

const STRAIGHT_LINE_REASON: Record<StraightLineReason, MessageKey> = {
  'no-graph': 'route.straightLine.noGraph',
  'far-from-network': 'route.straightLine.farFromNetwork',
  'no-path': 'route.straightLine.noPath',
};

/** "PE029" from the official code "08102PE029". */
function shortCode(code: string): string {
  return code.replace(/^\d+/, '');
}

function PlanSummary({
  plan,
  hazard,
  sectorName,
}: {
  plan: EvacuationPlan;
  hazard: HazardId;
  sectorName: string;
}) {
  const { t, locale } = useI18n();
  const distance = (meters: number) => formatDistance(meters, locale);

  if (plan.kind === 'outside-service-area') {
    return (
      <p className="plan plan--warning" data-testid="plan">
        <WarningIcon />
        <span>{t('route.outside', { sector: sectorName })}</span>
      </p>
    );
  }
  if (plan.kind === 'already-safe') {
    return (
      <p className="plan plan--safe" data-testid="plan">
        <CheckIcon />
        <span>{t('route.alreadySafe')}</span>
      </p>
    );
  }
  if (plan.kind === 'no-destination') {
    return (
      <p className="plan plan--warning" data-testid="plan">
        <WarningIcon />
        <span>{t('route.noDestination')}</span>
      </p>
    );
  }

  const zone = plan.inDangerZone ? (
    <p className="plan plan--danger">
      <WarningIcon />
      <strong>{t('route.inDanger')}</strong>
    </p>
  ) : (
    <p className="plan plan--safe">
      <CheckIcon />
      <strong>{t('route.notInDanger')}</strong>
    </p>
  );
  const earthquakeIntro =
    hazard === 'earthquake' && plan.inDangerZone ? (
      <p className="plan-note">{t('route.earthquakeFirst')}</p>
    ) : null;

  if (plan.kind === 'straight-line') {
    return (
      <div data-testid="plan">
        {zone}
        {earthquakeIntro}
        <p className="plan plan--warning">
          <WarningIcon />
          <strong>{t('route.straightLine.title')}</strong>
        </p>
        <p>
          {t('route.straightLine.body', {
            code: shortCode(plan.destination.code),
            distance: distance(plan.meters),
            direction: t(`compass.${plan.compass}`),
          })}
        </p>
        <p className="muted small">{t(STRAIGHT_LINE_REASON[plan.reason])}</p>
      </div>
    );
  }

  return (
    <div data-testid="plan">
      {zone}
      {earthquakeIntro}
      <ol className="plan-steps">
        {plan.metersToSafety !== null && plan.timeToSafety && (
          <li>
            {t('route.toSafety', {
              distance: distance(plan.metersToSafety),
              fast: plan.timeToSafety.fastestMinutes,
              slow: plan.timeToSafety.slowestMinutes,
            })}
          </li>
        )}
        {plan.destination.kind === 'meeting-point' ? (
          <li>
            {t(plan.inDangerZone ? 'route.toMeetingPoint' : 'route.nearestMeetingPoint', {
              code: shortCode(plan.destination.code),
              distance: distance(plan.meters),
              fast: plan.time.fastestMinutes,
              slow: plan.time.slowestMinutes,
            })}
          </li>
        ) : (
          <li>{t('route.toSafeArea')}</li>
        )}
      </ol>
      <p className="muted small">{t('route.timeNote')}</p>
    </div>
  );
}

interface RoutePanelProps {
  location: LocationState;
  plan: EvacuationPlan | null;
  hazard: HazardId;
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
  sectorName,
  demoLocations,
  onGps,
  onPick,
  onSimulate,
  onClear,
}: RoutePanelProps) {
  const { t, locale } = useI18n();
  const demo =
    location.kind === 'demo' ? demoLocations.find((d) => d.id === location.demoId) : undefined;

  return (
    <section className="route-panel" aria-labelledby="route-title" data-testid="route-panel">
      <h2 id="route-title">{t('route.title')}</h2>

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
              t('location.source.gps', { meters: formatDistance(location.accuracyMeters, locale) })}
            {location.kind === 'manual' && t('location.source.manual')}
            {location.kind === 'demo' &&
              t('location.source.demo', { label: demo ? demo.label[locale] : location.demoId })}
          </p>
          <div aria-live="polite">
            {plan && <PlanSummary plan={plan} hazard={hazard} sectorName={sectorName} />}
          </div>
          <button type="button" className="button button--block" onClick={onClear}>
            {t('location.change')}
          </button>
        </>
      )}

      <p className="muted small">{t('location.privacy')}</p>
    </section>
  );
}
