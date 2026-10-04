import { useCallback, useEffect, useRef, useState } from 'react';
import { useI18n } from '../../i18n/I18nContext.ts';
import type { MessageKey } from '../../i18n/translate.ts';

/** Each step highlights the element marked with data-tour="<target>". */
const STEPS: readonly { target: string; title: MessageKey; body: MessageKey }[] = [
  { target: 'hazard', title: 'tour.hazard.title', body: 'tour.hazard.body' },
  { target: 'map', title: 'tour.map.title', body: 'tour.map.body' },
  { target: 'route', title: 'tour.route.title', body: 'tour.route.body' },
  { target: 'tabs', title: 'tour.tabs.title', body: 'tour.tabs.body' },
  { target: 'disclaimer', title: 'tour.disclaimer.title', body: 'tour.disclaimer.body' },
];

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

function targetRect(target: string): Rect | null {
  const element = document.querySelector(`[data-tour="${target}"]`);
  if (!element) return null;
  const r = element.getBoundingClientRect();
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

/** Guided tour shown after onboarding (and on demand from Settings). */
export function Tour({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const step = STEPS[index] ?? STEPS[0];
  const last = index === STEPS.length - 1;

  const measure = useCallback(() => {
    if (step) setRect(targetRect(step.target));
  }, [step]);

  // Measure after the frame is painted, so freshly rendered targets exist and have a size.
  useEffect(() => {
    let frame = window.requestAnimationFrame(measure);
    const onResize = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(measure);
    };
    window.addEventListener('resize', onResize);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', onResize);
    };
  }, [measure]);

  useEffect(() => {
    cardRef.current?.focus();
  }, [index]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  if (!step) return null;
  const pad = 8;
  const margin = 16;
  const minCard = 220;
  // Put the card on the side of the highlight with more room; if neither side fits it, pin it
  // to the bottom over the highlight. It never leaves the screen (scrolls inside if needed).
  let cardStyle: { top?: number; bottom?: number; maxHeight: number };
  if (rect) {
    const above = rect.top - pad - margin;
    const below = window.innerHeight - (rect.top + rect.height) - pad - margin;
    if (Math.max(above, below) >= minCard) {
      cardStyle =
        below >= above
          ? { top: rect.top + rect.height + pad + margin / 2, maxHeight: below }
          : { bottom: window.innerHeight - rect.top + pad + margin / 2, maxHeight: above };
    } else {
      cardStyle = { bottom: margin, maxHeight: window.innerHeight * 0.5 };
    }
  } else {
    cardStyle = { bottom: margin, maxHeight: window.innerHeight * 0.5 };
  }

  return (
    <div className="tour" role="dialog" aria-modal="true" aria-labelledby="tour-title">
      {rect && (
        <div
          className="tour__spotlight"
          style={{
            top: rect.top - pad,
            left: rect.left - pad,
            width: rect.width + pad * 2,
            height: rect.height + pad * 2,
          }}
        />
      )}
      <div className="glass-card tour__card" style={cardStyle} ref={cardRef} tabIndex={-1}>
        <p className="tour__progress">
          {t('tour.progress', { current: index + 1, total: STEPS.length })}
        </p>
        <h2 id="tour-title">{t(step.title)}</h2>
        <p>{t(step.body)}</p>
        <div className="tour__actions">
          <span className="tour__nav">
            {index > 0 && (
              <button
                type="button"
                className="button"
                onClick={() => {
                  setIndex(index - 1);
                }}
              >
                {t('tour.previous')}
              </button>
            )}
            <button
              type="button"
              className="button button--primary"
              onClick={() => {
                if (last) onClose();
                else setIndex(index + 1);
              }}
            >
              {last ? t('tour.finish') : t('tour.next')}
            </button>
          </span>
          {!last && (
            <button type="button" className="button button--ghost" onClick={onClose}>
              {t('tour.skip')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
