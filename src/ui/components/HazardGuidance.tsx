import type { HazardId } from '../../domain/hazards.ts';
import { useI18n } from '../../i18n/I18nContext.ts';
import type { MessageKey } from '../../i18n/translate.ts';

// Official SENAPRED wording (see DATA_SOURCES.md, "Official guidance texts"). Spanish is quoted
// verbatim; English is a translation and says so.
const GUIDANCE: Record<HazardId, { steps: MessageKey[]; sourceUrl: string } | null> = {
  tsunami: {
    steps: ['guidance.tsunami.1', 'guidance.tsunami.2', 'guidance.tsunami.3'],
    sourceUrl: 'https://www.senapred.cl/tsunami/',
  },
  earthquake: {
    steps: [
      'guidance.earthquake.1',
      'guidance.earthquake.2',
      'guidance.earthquake.3',
      'guidance.earthquake.4',
    ],
    sourceUrl: 'https://www.senapred.cl/sismos/',
  },
  wildfire: null, // out of the pilot (docs/PLAN.md, D2 = C)
};

export function HazardGuidance({ hazard }: { hazard: HazardId }) {
  const { t } = useI18n();
  const guidance = GUIDANCE[hazard];
  if (!guidance) return null;
  return (
    <section className="guidance" aria-labelledby="guidance-title" data-testid="guidance">
      <h2 id="guidance-title">{t('guidance.title')}</h2>
      <ol>
        {guidance.steps.map((key) => (
          <li key={key}>{t(key)}</li>
        ))}
      </ol>
      <p className="muted small">
        {t('guidance.source')}{' '}
        <a href={guidance.sourceUrl} target="_blank" rel="noopener noreferrer">
          {t('guidance.sourceLink')}
        </a>
      </p>
    </section>
  );
}
