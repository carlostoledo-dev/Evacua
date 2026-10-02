import { AVAILABLE_HAZARDS, type HazardId } from '../../domain/hazards.ts';
import { useI18n } from '../../i18n/I18nContext.ts';
import { HAZARD_LABEL } from '../labels.ts';
import { HAZARD_ICONS } from './icons.tsx';

interface HazardSelectorProps {
  value: HazardId;
  onChange: (hazard: HazardId) => void;
}

/** Native radio group: keyboard and screen-reader behavior come for free. */
export function HazardSelector({ value, onChange }: HazardSelectorProps) {
  const { t } = useI18n();
  return (
    <fieldset className="hazard-selector">
      <legend>{t('hazard.choose')}</legend>
      <div className="hazard-selector__options">
        {AVAILABLE_HAZARDS.map((hazard) => {
          const Icon = HAZARD_ICONS[hazard];
          return (
            <label key={hazard} className="hazard-option">
              <input
                type="radio"
                name="hazard"
                value={hazard}
                checked={value === hazard}
                onChange={() => {
                  onChange(hazard);
                }}
              />
              <Icon className="icon icon--large" />
              <span>{t(HAZARD_LABEL[hazard])}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
