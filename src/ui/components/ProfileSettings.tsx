import { useState } from 'react';
import type { ProfileId } from '../../domain/profiles.ts';
import { useI18n } from '../../i18n/I18nContext.ts';
import type { UserProfile } from '../../platform/userProfile.ts';
import { ProfilePicker } from './ProfilePicker.tsx';

interface ProfileSettingsProps {
  user: UserProfile;
  onSave: (user: UserProfile) => void;
  onReplayTour: () => void;
  onDeleteAll: () => void;
}

export function ProfileSettings({ user, onSave, onReplayTour, onDeleteAll }: ProfileSettingsProps) {
  const { t } = useI18n();
  const [profile, setProfile] = useState<ProfileId>(user.profile);
  const [saved, setSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const dirty = profile !== user.profile;

  return (
    <section className="glass-card settings-card" aria-labelledby="profile-settings-title">
      <h2 id="profile-settings-title">{t('settings.profile')}</h2>
      <p className="muted small">{t('settings.profileHint')}</p>
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
          onSave({ ...user, profile });
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
