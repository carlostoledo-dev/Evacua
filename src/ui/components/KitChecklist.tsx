import { useId, useState } from 'react';
import { useI18n } from '../../i18n/I18nContext.ts';
import type { MessageKey } from '../../i18n/translate.ts';
import { browserStore, STORAGE_KEYS } from '../../platform/storage.ts';

// SENAPRED's official emergency-kit list (11 items, see DATA_SOURCES.md).
const ITEMS: readonly MessageKey[] = [
  'kit.item.1',
  'kit.item.2',
  'kit.item.3',
  'kit.item.4',
  'kit.item.5',
  'kit.item.6',
  'kit.item.7',
  'kit.item.8',
  'kit.item.9',
  'kit.item.10',
  'kit.item.11',
];

function readChecked(): Set<number> {
  try {
    const parsed: unknown = JSON.parse(browserStore.read(STORAGE_KEYS.kit) ?? '[]');
    if (!Array.isArray(parsed)) return new Set();
    return new Set(
      parsed.filter((n): n is number => Number.isInteger(n) && n >= 0 && n < ITEMS.length),
    );
  } catch {
    return new Set();
  }
}

/** Emergency backpack checklist; ticks are kept only on this phone. */
export function KitChecklist() {
  const { t } = useI18n();
  const [checked, setChecked] = useState<Set<number>>(readChecked);
  const progressId = useId();

  const update = (next: Set<number>) => {
    setChecked(next);
    browserStore.write(STORAGE_KEYS.kit, JSON.stringify([...next]));
  };

  return (
    <section className="glass-card kit" aria-labelledby="kit-title" data-testid="kit">
      <h2 id="kit-title">{t('kit.title')}</h2>
      <p id={progressId} className="kit__progress" aria-live="polite">
        {t('kit.progress', { done: checked.size, total: ITEMS.length })}
      </p>
      <ul className="kit__list" aria-describedby={progressId}>
        {ITEMS.map((key, index) => (
          <li key={key}>
            <label className="kit__item">
              <input
                type="checkbox"
                checked={checked.has(index)}
                onChange={(event) => {
                  const next = new Set(checked);
                  if (event.target.checked) next.add(index);
                  else next.delete(index);
                  update(next);
                }}
              />
              <span>{t(key)}</span>
            </label>
          </li>
        ))}
      </ul>
      <p className="muted small">{t('kit.note')}</p>
      <p className="muted small">
        {t('kit.source')}{' '}
        <a href="https://senapred.cl/kit-de-emergencia/" target="_blank" rel="noopener noreferrer">
          {t('kit.sourceLink')}
        </a>
      </p>
      {checked.size > 0 && (
        <button
          type="button"
          className="button button--ghost"
          onClick={() => {
            update(new Set());
          }}
        >
          {t('kit.reset')}
        </button>
      )}
    </section>
  );
}
