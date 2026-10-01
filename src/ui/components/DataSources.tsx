import type { DataError, DataErrorKind, LoadedLayer } from '../../data/loader.ts';
import type { LayerRole } from '../../data/schema.ts';
import { useI18n } from '../../i18n/I18nContext.ts';
import type { MessageKey } from '../../i18n/translate.ts';
import type { HazardId } from '../../domain/hazards.ts';
import type { CommuneState } from '../hooks/useCommuneData.ts';
import { LayerBadge } from './LayerBadge.tsx';
import { WarningIcon } from './icons.tsx';

const ROLE_LABEL: Record<LayerRole, MessageKey> = {
  'evacuation-area': 'layer.role.evacuationArea',
  'safe-line': 'layer.role.safeLine',
  'evacuation-route': 'layer.role.evacuationRoute',
  'meeting-point': 'layer.role.meetingPoint',
};

const HAZARD_LABEL: Record<HazardId, MessageKey> = {
  tsunami: 'hazard.tsunami',
  wildfire: 'hazard.wildfire',
  earthquake: 'hazard.earthquake',
};

const ERROR_MESSAGE: Record<DataErrorKind, MessageKey> = {
  network: 'data.error.network',
  'not-found': 'data.error.notFound',
  invalid: 'data.error.invalid',
};

function formatDate(isoDate: string, locale: string): string {
  // Dates are calendar days; format in UTC so no timezone can shift them.
  return new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeZone: 'UTC' }).format(
    new Date(`${isoDate}T00:00:00Z`),
  );
}

function LayerItem({ layer }: { layer: LoadedLayer }) {
  const { t, locale } = useI18n();
  const hazards = layer.entry.hazards.map((hazard) => t(HAZARD_LABEL[hazard])).join(' · ');
  const link = layer.source.catalogUrl ?? layer.source.url;
  return (
    <li className="layer-item" data-testid={`layer-${layer.entry.id}`}>
      <div className="layer-item__head">
        <p className="layer-item__name">
          {t(ROLE_LABEL[layer.entry.role])} <span className="muted">{`(${hazards})`}</span>
        </p>
        <LayerBadge status={layer.status} />
      </div>
      <p className="layer-item__meta">
        {t('layer.count', { count: layer.collection.features.length })}
        {' · '}
        {t('layer.source', { source: layer.source.name })}
        {' · '}
        {t('layer.retrievedAt', { date: formatDate(layer.source.retrievedAt, locale) })}
      </p>
      <p className="layer-item__meta">
        <a href={link} target="_blank" rel="noopener noreferrer">
          {t('layer.sourceLink')}
        </a>
      </p>
    </li>
  );
}

function DataErrorView({ error, onRetry }: { error: DataError; onRetry: () => void }) {
  const { t } = useI18n();
  return (
    <div className="data-error" role="alert">
      <p className="data-error__title">
        <WarningIcon />
        <strong>{t('data.error.title')}</strong>
      </p>
      <p>{t(ERROR_MESSAGE[error.kind])}</p>
      <button type="button" className="button button--primary" onClick={onRetry}>
        {t('data.retry')}
      </button>
      <details className="data-error__details">
        <summary>{t('data.error.details')}</summary>
        <ul>
          <li>
            <code>{error.resource}</code>
          </li>
          {error.issues.map((issue) => (
            <li key={issue}>
              <code>{issue}</code>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}

interface DataSourcesProps {
  state: CommuneState;
  onRetry: () => void;
}

/** Shows which data the app is using, where it comes from, and whether it is official. */
export function DataSources({ state, onRetry }: DataSourcesProps) {
  const { t } = useI18n();
  return (
    <section className="card" aria-labelledby="data-title" aria-busy={state.status === 'loading'}>
      <h2 id="data-title">{t('data.title')}</h2>
      {state.status === 'loading' && <p role="status">{t('data.loading')}</p>}
      {state.status === 'error' && <DataErrorView error={state.error} onRetry={onRetry} />}
      {state.status === 'ready' && (
        <>
          <p className="pilot">
            {t('data.sector', {
              sector: state.data.manifest.sector.name,
              commune: state.data.manifest.name,
              region: state.data.manifest.region,
            })}
          </p>
          <p className="muted">{t('data.serviceAreaExplainer')}</p>
          <ul className="layer-list" aria-label={t('data.layers')}>
            {state.data.layers.map((layer) => (
              <LayerItem key={layer.entry.id} layer={layer} />
            ))}
          </ul>
          <p className="muted small">{t('data.verifiedExplainer')}</p>
        </>
      )}
    </section>
  );
}
