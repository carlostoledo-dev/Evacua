import { useI18n } from '../../i18n/I18nContext.ts';
import { CloseIcon, RefreshIcon } from './icons.tsx';

interface UpdatePromptProps {
  onApply: () => void;
  onDismiss: () => void;
}

/** Offers a new version in one slim row, without ever reloading on its own. */
export function UpdatePrompt({ onApply, onDismiss }: UpdatePromptProps) {
  const { t } = useI18n();
  return (
    <div className="update-prompt" role="status">
      <RefreshIcon />
      <p>{t('update.available')}</p>
      <button type="button" className="button button--primary" onClick={onApply}>
        {t('update.apply')}
      </button>
      <button
        type="button"
        className="update-prompt__dismiss"
        aria-label={t('update.dismiss')}
        onClick={onDismiss}
      >
        <CloseIcon />
      </button>
    </div>
  );
}
