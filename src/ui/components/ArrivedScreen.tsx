import { useEffect, useId, useRef } from 'react';
import type { Destination } from '../../domain/routing.ts';
import { useI18n } from '../../i18n/I18nContext.ts';
import { shortCode } from '../describePlan.ts';
import { Disclaimer } from './Disclaimer.tsx';
import { CheckIcon, PinIcon } from './icons.tsx';

interface ArrivedScreenProps {
  destination: Destination;
  /** The walk was simulated: the DEMO label stays visible. */
  demo: boolean;
  onMoreInfo: () => void;
  onFinish: () => void;
}

/** Arrival, full screen and unmistakable: a big check, where you are, and what to do now. */
export function ArrivedScreen({ destination, demo, onMoreInfo, onFinish }: ArrivedScreenProps) {
  const { t } = useI18n();
  const titleId = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    headingRef.current?.focus();
  }, []);
  const meeting = destination.kind === 'meeting-point';
  return (
    <section className="arrived" aria-labelledby={titleId} data-testid="arrived">
      {demo && <p className="map-chip map-chip--demo">{t('location.demoBadge')}</p>}
      <span className="arrived__check">
        <CheckIcon className="icon" />
      </span>
      <h2 id={titleId} ref={headingRef} tabIndex={-1}>
        {t(meeting ? 'nav.arrivedTitleMeeting' : 'nav.arrivedTitleSafe')}
      </h2>
      <div className="arrived__card">
        <span className="arrived__pin">
          <PinIcon className="icon" />
        </span>
        <p>
          <span>{meeting ? t('route.meetingPointLabel') : t('route.item.safeArea')}</span>
          {meeting && <strong>{shortCode(destination.code)}</strong>}
          <span>{t('nav.arrivedStay')}</span>
        </p>
        {/* The full sentence once, for screen readers (the screen is new and focused). */}
        <p className="visually-hidden" role="status">
          {meeting
            ? t('nav.arrivedMeeting', { code: shortCode(destination.code) })
            : t('nav.arrivedSafe')}
        </p>
      </div>
      <button
        type="button"
        className="button button--lg button--block arrived__more"
        onClick={onMoreInfo}
      >
        {t('nav.moreInfo')}
      </button>
      <button
        type="button"
        className="button button--lg button--block arrived__finish"
        onClick={onFinish}
      >
        {t('nav.finish')}
      </button>
      <Disclaimer card landmark={false} />
    </section>
  );
}
