import { useId } from 'react';
import { PROFILE_IDS, type ProfileId } from '../../domain/profiles.ts';
import { useI18n } from '../../i18n/I18nContext.ts';
import type { MessageKey } from '../../i18n/translate.ts';
import { ProfileAvatar } from './illustrations.tsx';

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

export const PROFILE_LABEL = LABEL;

interface ProfilePickerProps {
  value: ProfileId | null;
  onChange: (profile: ProfileId) => void;
  legend: string;
}

/** Large radio cards with an avatar, a name and what changes for that profile. */
export function ProfilePicker({ value, onChange, legend }: ProfilePickerProps) {
  const { t } = useI18n();
  const groupId = useId();
  return (
    <fieldset className="profile-picker">
      <legend>{legend}</legend>
      {PROFILE_IDS.map((profile) => (
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
          <ProfileAvatar profile={profile} />
          <span className="profile-card__text">
            <strong>{t(LABEL[profile])}</strong>
            <span>{t(DESCRIPTION[profile])}</span>
          </span>
          {/* Visual radio: ring, plus a filled dot when selected (shape, not only color). */}
          <span className="profile-card__radio" aria-hidden="true" />
        </label>
      ))}
    </fieldset>
  );
}
