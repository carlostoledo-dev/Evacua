import { HAZARD_CHOICE, type HazardId } from '../../domain/hazards.ts';
import { useI18n } from '../../i18n/I18nContext.ts';
import { HazardGuidance } from '../components/HazardGuidance.tsx';
import { HazardSelector } from '../components/HazardSelector.tsx';
import { KitChecklist } from '../components/KitChecklist.tsx';

interface GuideScreenProps {
  hazard: HazardId;
  onHazardChange: (hazard: HazardId) => void;
  /** Names of the pilot area, from the commune's data (null while it loads). */
  pilot: { sector: string; commune: string } | null;
}

export function GuideScreen({ hazard, onHazardChange, pilot }: GuideScreenProps) {
  const { t } = useI18n();
  return (
    <section className="screen screen--panel" aria-labelledby="view-title-guide">
      <h1 id="view-title-guide" tabIndex={-1}>
        {t('home.title')}
      </h1>
      {pilot && <p className="pilot">{t('app.pilotSector', pilot)}</p>}
      <p>{t('home.intro')}</p>
      {HAZARD_CHOICE && <HazardSelector value={hazard} onChange={onHazardChange} />}
      <HazardGuidance hazard={hazard} />
      <KitChecklist />
    </section>
  );
}
