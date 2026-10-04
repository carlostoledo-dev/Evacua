import { useEffect, useState } from 'react';
import { useI18n } from '../../i18n/I18nContext.ts';
import { CheckIcon, TimerIcon } from './icons.tsx';

type Drill =
  { kind: 'idle' } | { kind: 'running'; startedAt: number } | { kind: 'done'; seconds: number };

/** Game-like practice for children: walk to the meeting point with an adult and beat your time. */
export function DrillMode() {
  const { t } = useI18n();
  const [drill, setDrill] = useState<Drill>({ kind: 'idle' });
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (drill.kind !== 'running') return;
    // One tick per second, only while running (battery).
    const id = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => {
      window.clearInterval(id);
    };
  }, [drill.kind]);

  const elapsed =
    drill.kind === 'running' ? Math.max(0, Math.round((now - drill.startedAt) / 1000)) : 0;

  return (
    <section className="drill" aria-labelledby="drill-title" data-testid="drill">
      <h3 id="drill-title">
        <TimerIcon /> {t('drill.title')}
      </h3>
      {drill.kind === 'idle' && (
        <>
          <p>{t('drill.body')}</p>
          <button
            type="button"
            className="button button--primary button--block"
            onClick={() => {
              const start = Date.now();
              setNow(start);
              setDrill({ kind: 'running', startedAt: start });
            }}
          >
            {t('drill.start')}
          </button>
        </>
      )}
      {drill.kind === 'running' && (
        <>
          <p className="drill__clock" role="timer" aria-live="off">
            {t('drill.running', { seconds: elapsed })}
          </p>
          <button
            type="button"
            className="button button--primary button--block"
            onClick={() => {
              setDrill({ kind: 'done', seconds: elapsed });
            }}
          >
            {t('drill.arrived')}
          </button>
        </>
      )}
      {drill.kind === 'done' && (
        <>
          <p className="plan plan--safe" role="status">
            <CheckIcon />
            <span>
              {t('drill.result', {
                minutes: Math.floor(drill.seconds / 60),
                seconds: drill.seconds % 60,
              })}
            </span>
          </p>
          <button
            type="button"
            className="button button--block"
            onClick={() => {
              setDrill({ kind: 'idle' });
            }}
          >
            {t('drill.again')}
          </button>
        </>
      )}
    </section>
  );
}
