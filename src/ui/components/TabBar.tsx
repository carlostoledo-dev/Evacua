import type { ComponentType } from 'react';
import { useI18n } from '../../i18n/I18nContext.ts';
import type { MessageKey } from '../../i18n/translate.ts';
import { GearIcon, GuideIcon, LayersIcon, MapIcon } from './icons.tsx';

export const VIEWS = ['map', 'guide', 'data', 'settings'] as const;
export type View = (typeof VIEWS)[number];

export const VIEW_LABEL: Record<View, MessageKey> = {
  map: 'nav.map',
  guide: 'nav.guide',
  data: 'nav.data',
  settings: 'nav.settings',
};

const VIEW_ICON: Record<View, ComponentType<{ className?: string }>> = {
  map: MapIcon,
  guide: GuideIcon,
  data: LayersIcon,
  settings: GearIcon,
};

interface TabBarProps {
  value: View;
  onChange: (view: View) => void;
}

/** Bottom navigation within thumb reach; the current screen is marked with aria-current. */
export function TabBar({ value, onChange }: TabBarProps) {
  const { t } = useI18n();
  return (
    <nav className="tab-bar" aria-label={t('nav.label')}>
      {VIEWS.map((view) => {
        const Icon = VIEW_ICON[view];
        return (
          <button
            key={view}
            type="button"
            className="tab-bar__item"
            aria-current={value === view ? 'page' : undefined}
            onClick={() => {
              onChange(view);
            }}
          >
            <Icon className="icon tab-bar__icon" />
            <span>{t(VIEW_LABEL[view])}</span>
          </button>
        );
      })}
    </nav>
  );
}
