import { useI18n } from '../../i18n/I18nContext.ts';
import type { UserProfile } from '../../platform/userProfile.ts';
import { AppStatus } from '../components/AppStatus.tsx';
import { LanguageSwitcher } from '../components/LanguageSwitcher.tsx';
import { ProfileSettings } from '../components/ProfileSettings.tsx';
import { ThemeSwitcher } from '../components/ThemeSwitcher.tsx';
import type { OfflineReadiness } from '../hooks/useServiceWorker.ts';
import type { ThemePreference } from '../theme.ts';

interface SettingsScreenProps {
  offline: OfflineReadiness;
  online: boolean;
  themePreference: ThemePreference;
  onThemeChange: (preference: ThemePreference) => void;
  user: UserProfile;
  onSaveUser: (user: UserProfile) => void;
  onReplayTour: () => void;
  onDeleteAll: () => void;
}

export function SettingsScreen({
  offline,
  online,
  themePreference,
  onThemeChange,
  user,
  onSaveUser,
  onReplayTour,
  onDeleteAll,
}: SettingsScreenProps) {
  const { t } = useI18n();
  return (
    <section className="screen screen--panel" aria-labelledby="view-title-settings">
      <h1 id="view-title-settings" tabIndex={-1}>
        {t('settings.title')}
      </h1>
      <ProfileSettings
        key={`${user.profile}-${user.name}`}
        user={user}
        onSave={onSaveUser}
        onReplayTour={onReplayTour}
        onDeleteAll={onDeleteAll}
      />
      <section className="glass-card settings-card" aria-labelledby="status-title">
        <h2 id="status-title">{t('settings.status')}</h2>
        <AppStatus offline={offline} online={online} />
      </section>
      <div className="glass-card settings-card">
        <LanguageSwitcher />
      </div>
      <div className="glass-card settings-card">
        <ThemeSwitcher value={themePreference} onChange={onThemeChange} />
      </div>
      <p className="muted small">{t('footer.version', { version: __APP_VERSION__ })}</p>
    </section>
  );
}
