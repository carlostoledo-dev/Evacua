import { useI18n } from '../../i18n/I18nContext.ts';
import { RefreshIcon } from './icons.tsx';

interface UpdatePromptProps {
  onApply: () => void;
  onDismiss: () => void;
}

/** Offers a new version without ever reloading on its own. */
export function UpdatePrompt({ onApply, onDismiss }: UpdatePromptProps) {
  const { t } = useI18n();
  return (
    <div className="update-prompt" role="status">
      <RefreshIcon />
      <p>{t('update.available')}</p>
      <div className="update-prompt__actions">
        <button type="button" className="button button--primary" onClick={onApply}>
          {t('update.apply')}
        </button>
        <button type="button" className="button" onClick={onDismiss}>
          {t('update.dismiss')}
        </button>
      </div>
    </div>
  );
}
