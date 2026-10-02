import type { HazardId } from '../../domain/hazards.ts';
import { useI18n } from '../../i18n/I18nContext.ts';
import { HazardGuidance } from '../components/HazardGuidance.tsx';
import { HazardSelector } from '../components/HazardSelector.tsx';

interface GuideScreenProps {
  hazard: HazardId;
  onHazardChange: (hazard: HazardId) => void;
}

export function GuideScreen({ hazard, onHazardChange }: GuideScreenProps) {
  const { t } = useI18n();
  return (
    <section className="screen screen--panel" aria-labelledby="view-title-guide">
      <h1 id="view-title-guide" tabIndex={-1}>
        {t('home.title')}
      </h1>
      <p className="pilot">{t('app.pilotSector')}</p>
      <p>{t('home.intro')}</p>
      <HazardSelector value={hazard} onChange={onHazardChange} />
      <HazardGuidance hazard={hazard} />
      <p className="muted small">{t('home.comingSoon')}</p>
    </section>
  );
}
