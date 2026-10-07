import { useId, useState, type ComponentType } from 'react';
import { useI18n } from '../../i18n/I18nContext.ts';
import { VIEW_LABEL, type View } from '../views.ts';
import { ChevronRightIcon, GearIcon, GuideIcon, LayersIcon, MenuIcon } from './icons.tsx';

const ITEMS: readonly {
  view: Exclude<View, 'map'>;
  icon: ComponentType<{ className?: string }>;
}[] = [
  { view: 'guide', icon: GuideIcon },
  { view: 'data', icon: LayersIcon },
  { view: 'settings', icon: GearIcon },
];

interface MainMenuProps {
  id: string;
  onOpen: (view: Exclude<View, 'map'>) => void;
}

/** The screens behind the map, as an iOS-style grouped list inside the route sheet. */
export function MainMenu({ id, onOpen }: MainMenuProps) {
  const { t } = useI18n();
  return (
    <nav id={id} className="main-menu" aria-label={t('nav.label')}>
      {ITEMS.map(({ view, icon: Icon }) => (
        <button
          key={view}
          type="button"
          className="main-menu__item"
          onClick={() => {
            onOpen(view);
          }}
        >
          <Icon className="icon main-menu__icon" />
          <span>{t(VIEW_LABEL[view])}</span>
          <ChevronRightIcon className="icon main-menu__chevron" />
        </button>
      ))}
    </nav>
  );
}

/**
 * While the sector data is loading or failed there is no route sheet; this small one keeps ≡
 * (and so "Datos" and "Ajustes") one tap away.
 */
export function MenuSheet({ onOpen }: { onOpen: MainMenuProps['onOpen'] }) {
  const { t } = useI18n();
  const id = useId();
  const [open, setOpen] = useState(false);
  return (
    <div className="route-panel glass-sheet menu-sheet">
      {open && (
        <MainMenu
          id={id}
          onOpen={(view) => {
            setOpen(false);
            onOpen(view);
          }}
        />
      )}
      <button
        type="button"
        className="menu-button"
        aria-label={t('nav.menu')}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => {
          setOpen((o) => !o);
        }}
      >
        <MenuIcon className="icon" />
      </button>
    </div>
  );
}
