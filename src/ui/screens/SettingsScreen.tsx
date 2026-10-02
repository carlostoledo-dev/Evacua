import { useI18n } from '../../i18n/I18nContext.ts';
import { AppStatus } from '../components/AppStatus.tsx';
import { LanguageSwitcher } from '../components/LanguageSwitcher.tsx';
import { ThemeSwitcher } from '../components/ThemeSwitcher.tsx';
import type { OfflineReadiness } from '../hooks/useServiceWorker.ts';
import type { ThemePreference } from '../theme.ts';

interface SettingsScreenProps {
  offline: OfflineReadiness;
  online: boolean;
  themePreference: ThemePreference;
  onThemeChange: (preference: ThemePreference) => void;
}

export function SettingsScreen({
  offline,
  online,
  themePreference,
  onThemeChange,
}: SettingsScreenProps) {
  const { t } = useI18n();
  return (
    <section className="screen screen--panel" aria-labelledby="view-title-settings">
      <h1 id="view-title-settings" tabIndex={-1}>
        {t('settings.title')}
      </h1>
      <h2>{t('settings.status')}</h2>
      <AppStatus offline={offline} online={online} />
      <LanguageSwitcher />
      <ThemeSwitcher value={themePreference} onChange={onThemeChange} />
      <p className="muted small">{t('footer.version', { version: __APP_VERSION__ })}</p>
    </section>
  );
}
