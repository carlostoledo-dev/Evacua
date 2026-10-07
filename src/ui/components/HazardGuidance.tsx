import { useId } from 'react';
import { useI18n } from '../../i18n/I18nContext.ts';
import type { MessageKey } from '../../i18n/translate.ts';

// Official SENAPRED wording (see DATA_SOURCES.md, "Official guidance texts"). Spanish is quoted
// verbatim; English is a translation and says so.
const STEPS: readonly MessageKey[] = [
  'guidance.tsunami.1',
  'guidance.tsunami.2',
  'guidance.tsunami.3',
];
const SOURCE_URL = 'https://www.senapred.cl/tsunami/';

/**
 * SENAPRED's tsunami guidance. `brief`: inside the route sheet (a smaller heading, and its own
 * ids, since the map stays mounted while the "Qué hacer" screen shows the full one).
 */
export function HazardGuidance({ brief = false }: { brief?: boolean }) {
  const { t } = useI18n();
  const titleId = useId();
  const Heading = brief ? 'h3' : 'h2';
  return (
    <section
      className={brief ? 'guidance guidance--brief' : 'guidance'}
      aria-labelledby={titleId}
      data-testid={brief ? 'guidance-brief' : 'guidance'}
    >
      <Heading id={titleId}>{t('guidance.title')}</Heading>
      <ol>
        {STEPS.map((key) => (
          <li key={key}>{t(key)}</li>
        ))}
      </ol>
      <p className="muted small">
        {t('guidance.source')}{' '}
        <a href={SOURCE_URL} target="_blank" rel="noopener noreferrer">
          {t('guidance.sourceLink')}
        </a>
      </p>
    </section>
  );
}
