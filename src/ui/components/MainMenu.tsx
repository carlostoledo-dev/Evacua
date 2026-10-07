import type { ComponentType, ReactNode } from 'react';
import { useI18n } from '../../i18n/I18nContext.ts';
import { VIEW_LABEL, type View } from '../views.ts';
import { SheetDialog } from './SheetDialog.tsx';
import { ChevronRightIcon, GearIcon, GuideIcon, HelpIcon, LayersIcon, PinIcon } from './icons.tsx';

type Screen = Exclude<View, 'map'>;

const SCREENS: readonly { view: Screen; icon: ComponentType<{ className?: string }> }[] = [
  { view: 'guide', icon: GuideIcon },
  { view: 'data', icon: LayersIcon },
  { view: 'settings', icon: GearIcon },
];

function Row({
  icon: Icon,
  label,
  onClick,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}) {
  return (
    <button type="button" className="main-menu__item" onClick={onClick}>
      <Icon className="icon main-menu__icon" />
      <span>{label}</span>
      <ChevronRightIcon className="icon main-menu__chevron" />
    </button>
  );
}

interface MenuSheetProps {
  open: boolean;
  onClose: () => void;
  onOpen: (view: Screen) => void;
  /** The current plan, shown as the sheet's title ("PE029 · 1 km · ~20 min"). */
  summary: { title: string; subtitle: string } | null;
  /** Present when there is a location to change. */
  onChangeLocation: (() => void) | null;
  onReplayTour: () => void;
}

/** The quick menu, as an iOS sheet: the plan on top, then the screens behind the map. */
export function MenuSheet({
  open,
  onClose,
  onOpen,
  summary,
  onChangeLocation,
  onReplayTour,
}: MenuSheetProps) {
  const { t } = useI18n();
  const close = (then: () => void) => () => {
    onClose();
    then();
  };
  const icon: ReactNode = summary ? (
    <span className="sheet-dialog__icon">
      <PinIcon className="icon" />
    </span>
  ) : null;
  return (
    <SheetDialog
      open={open}
      onClose={onClose}
      title={summary?.title ?? t('menu.title')}
      subtitle={summary?.subtitle}
      icon={icon}
      testId="menu-sheet"
    >
      {onChangeLocation && (
        <div className="main-menu">
          <Row icon={PinIcon} label={t('location.change')} onClick={close(onChangeLocation)} />
        </div>
      )}
      <nav className="main-menu" aria-label={t('nav.label')}>
        {SCREENS.map(({ view, icon: Icon }) => (
          <Row
            key={view}
            icon={Icon}
            label={t(VIEW_LABEL[view])}
            onClick={close(() => {
              onOpen(view);
            })}
          />
        ))}
      </nav>
      <div className="main-menu">
        <Row icon={HelpIcon} label={t('settings.tour')} onClick={close(onReplayTour)} />
      </div>
      <button type="button" className="button button--tinted button--block" onClick={onClose}>
        {t('sheet.close')}
      </button>
    </SheetDialog>
  );
}
