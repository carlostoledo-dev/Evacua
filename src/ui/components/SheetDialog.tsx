import { useEffect, useId, useRef, type ReactNode } from 'react';
import { useI18n } from '../../i18n/I18nContext.ts';
import { useSwipe } from '../hooks/useSwipe.ts';
import { CrossIcon } from './icons.tsx';

interface SheetDialogProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  /** Optional line under the title (e.g. the plan's distance and time). */
  subtitle?: ReactNode;
  /** Optional icon left of the title. */
  icon?: ReactNode;
  children: ReactNode;
  testId?: string;
}

/**
 * A modal bottom sheet, as on iOS: slides up over the map with a dimmed backdrop. Native
 * <dialog>: focus stays inside, and Escape or the ✕ close it.
 */
export function SheetDialog({
  open,
  onClose,
  title,
  subtitle,
  icon,
  children,
  testId,
}: SheetDialogProps) {
  const { t } = useI18n();
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  // Swipe down on the top of the sheet to close it, as on iOS.
  const swipe = useSwipe({ onSwipeDown: onClose, maxUp: 0 });

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="sheet-dialog"
      aria-labelledby={titleId}
      data-testid={testId}
      onClose={onClose}
    >
      <div className="sheet-dialog__body" style={swipe.style}>
        <div className="sheet-drag" {...swipe.handlers}>
          <div className="sheet-grabber" aria-hidden="true" />
        </div>
        <header className="sheet-dialog__head sheet-drag" {...swipe.handlers}>
          {icon}
          <div className="sheet-dialog__titles">
            <h2 id={titleId}>{title}</h2>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          <button
            type="button"
            className="sheet-dialog__close"
            aria-label={t('sheet.close')}
            onClick={onClose}
          >
            <CrossIcon className="icon" />
          </button>
        </header>
        {children}
      </div>
    </dialog>
  );
}
