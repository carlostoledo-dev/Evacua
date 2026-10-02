import type { ComponentType } from 'react';
import { useI18n } from '../../i18n/I18nContext.ts';
import type { MessageKey } from '../../i18n/translate.ts';
import { THEME_PREFERENCES, type ThemePreference } from '../theme.ts';
import { AutoIcon, MoonIcon, SunIcon } from './icons.tsx';

const LABEL: Record<ThemePreference, MessageKey> = {
  system: 'theme.system',
  light: 'theme.light',
  dark: 'theme.dark',
};

const ICON: Record<ThemePreference, ComponentType<{ className?: string }>> = {
  system: AutoIcon,
  light: SunIcon,
  dark: MoonIcon,
};

interface ThemeSwitcherProps {
  value: ThemePreference;
  onChange: (preference: ThemePreference) => void;
}

export function ThemeSwitcher({ value, onChange }: ThemeSwitcherProps) {
  const { t } = useI18n();
  return (
    <fieldset className="choice-list">
      <legend>{t('settings.theme')}</legend>
      {THEME_PREFERENCES.map((preference) => {
        const Icon = ICON[preference];
        return (
          <label key={preference} className="choice">
            <input
              type="radio"
              name="theme"
              value={preference}
              checked={value === preference}
              onChange={() => {
                onChange(preference);
              }}
            />
            <Icon className="icon" />
            <span>{t(LABEL[preference])}</span>
          </label>
        );
      })}
      <p className="muted small">{t('theme.hint')}</p>
    </fieldset>
  );
}
