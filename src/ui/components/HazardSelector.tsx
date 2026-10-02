import { useId } from 'react';
import { AVAILABLE_HAZARDS, type HazardId } from '../../domain/hazards.ts';
import { useI18n } from '../../i18n/I18nContext.ts';
import { HAZARD_LABEL } from '../labels.ts';
import { CheckIcon, HAZARD_ICONS } from './icons.tsx';

interface HazardSelectorProps {
  value: HazardId;
  onChange: (hazard: HazardId) => void;
  /** Single-row segmented control (map bar); the legend stays for screen readers. */
  compact?: boolean;
}

/** Native radio group: keyboard and screen-reader behavior come for free. */
export function HazardSelector({ value, onChange, compact = false }: HazardSelectorProps) {
  const { t } = useI18n();
  // Unique per instance: the map and guide screens each render a selector, and radios that
  // share a name form one group across the whole document.
  const groupId = useId();
  return (
    <fieldset className={compact ? 'hazard-selector hazard-selector--compact' : 'hazard-selector'}>
      <legend className={compact ? 'visually-hidden' : undefined}>{t('hazard.choose')}</legend>
      <div className="hazard-selector__options">
        {AVAILABLE_HAZARDS.map((hazard) => {
          const Icon = HAZARD_ICONS[hazard];
          return (
            <label key={hazard} className="hazard-option">
              <input
                type="radio"
                name={groupId}
                value={hazard}
                checked={value === hazard}
                onChange={() => {
                  onChange(hazard);
                }}
              />
              {value === hazard ? (
                <CheckIcon className="icon icon--large" />
              ) : (
                <Icon className="icon icon--large" />
              )}
              <span>{t(HAZARD_LABEL[hazard])}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
