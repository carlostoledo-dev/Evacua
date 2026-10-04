import { useId, useState } from 'react';
import type { ProfileId } from '../../domain/profiles.ts';
import { useI18n } from '../../i18n/I18nContext.ts';
import { NAME_MAX_LENGTH, type UserProfile } from '../../platform/userProfile.ts';
import { ProfilePicker } from './ProfilePicker.tsx';

interface ProfileSettingsProps {
  user: UserProfile;
  onSave: (user: UserProfile) => void;
  onReplayTour: () => void;
  onDeleteAll: () => void;
}

export function ProfileSettings({ user, onSave, onReplayTour, onDeleteAll }: ProfileSettingsProps) {
  const { t } = useI18n();
  const [name, setName] = useState(user.name);
  const [profile, setProfile] = useState<ProfileId>(user.profile);
  const [saved, setSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const nameId = useId();
  const dirty = name.trim() !== user.name || profile !== user.profile;

  return (
    <section className="glass-card settings-card" aria-labelledby="profile-settings-title">
      <h2 id="profile-settings-title">{t('settings.profile')}</h2>
      <p className="muted small">{t('settings.profileHint')}</p>
      <div className="field">
        <label htmlFor={nameId}>{t('onboarding.profile.name')}</label>
        <input
          id={nameId}
          type="text"
          value={name}
          maxLength={NAME_MAX_LENGTH}
          autoComplete="given-name"
          onChange={(event) => {
            setName(event.target.value);
            setSaved(false);
          }}
        />
      </div>
      <ProfilePicker
        value={profile}
        onChange={(next) => {
          setProfile(next);
          setSaved(false);
        }}
        legend={t('onboarding.profile.who')}
      />
      <button
        type="button"
        className="button button--primary button--block"
        disabled={!dirty}
        onClick={() => {
          onSave({ ...user, name: name.trim().slice(0, NAME_MAX_LENGTH), profile });
          setSaved(true);
        }}
      >
        {t('settings.save')}
      </button>
      {saved && (
        <p role="status" className="muted small">
          {t('settings.saved')}
        </p>
      )}
      <button type="button" className="button button--block" onClick={onReplayTour}>
        {t('settings.tour')}
      </button>
      <button
        type="button"
        className={confirmDelete ? 'button button--danger button--block' : 'button button--block'}
        onClick={() => {
          if (confirmDelete) onDeleteAll();
          else setConfirmDelete(true);
        }}
      >
        {confirmDelete ? t('settings.deleteConfirm') : t('settings.delete')}
      </button>
      <p className="muted small">{t('settings.privacy')}</p>
    </section>
  );
}
