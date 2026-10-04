import { useId, type ComponentType } from 'react';
import { PROFILE_IDS, type ProfileId } from '../../domain/profiles.ts';
import { useI18n } from '../../i18n/I18nContext.ts';
import type { MessageKey } from '../../i18n/translate.ts';
import { ChildIcon, PersonIcon, SeniorIcon } from './icons.tsx';

const LABEL: Record<ProfileId, MessageKey> = {
  adult: 'profile.adult',
  senior: 'profile.senior',
  child: 'profile.child',
};

const DESCRIPTION: Record<ProfileId, MessageKey> = {
  adult: 'profile.adult.description',
  senior: 'profile.senior.description',
  child: 'profile.child.description',
};

const ICON: Record<ProfileId, ComponentType<{ className?: string }>> = {
  adult: PersonIcon,
  senior: SeniorIcon,
  child: ChildIcon,
};

export const PROFILE_LABEL = LABEL;

interface ProfilePickerProps {
  value: ProfileId | null;
  onChange: (profile: ProfileId) => void;
  legend: string;
}

/** Large radio cards with an icon, a name and what changes for that profile. */
export function ProfilePicker({ value, onChange, legend }: ProfilePickerProps) {
  const { t } = useI18n();
  const groupId = useId();
  return (
    <fieldset className="profile-picker">
      <legend>{legend}</legend>
      {PROFILE_IDS.map((profile) => {
        const Icon = ICON[profile];
        return (
          <label key={profile} className="profile-card">
            <input
              type="radio"
              name={groupId}
              value={profile}
              checked={value === profile}
              onChange={() => {
                onChange(profile);
              }}
            />
            <span className="profile-card__icon">
              <Icon className="icon" />
            </span>
            <span className="profile-card__text">
              <strong>{t(LABEL[profile])}</strong>
              <span>{t(DESCRIPTION[profile])}</span>
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}
