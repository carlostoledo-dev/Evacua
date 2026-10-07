import { createPortal } from 'react-dom';
import { PUBLIC_URL } from '../../app/publicUrl.ts';
import { useI18n } from '../../i18n/I18nContext.ts';

const DISPLAY_URL = PUBLIC_URL.replace(/^https:\/\//, '').replace(/\/$/, '');

/**
 * On a computer the app is shown inside a phone frame; this panel sits beside it with a QR code
 * that opens the demo on a real phone. It lives outside #root (the phone screen), and CSS shows
 * it only next to the frame: on phones and in the installed app it is never displayed.
 */
export function DesktopShowcase() {
  const { t } = useI18n();
  return createPortal(
    <aside className="showcase" aria-label={t('showcase.label')}>
      <p className="showcase__brand">
        <img src="/pwa-192x192.png" alt="" width={48} height={48} />
        <span>{t('app.name')}</span>
      </p>
      <h2 className="showcase__title">{t('showcase.title')}</h2>
      <p className="showcase__body">{t('showcase.body')}</p>
      <figure className="showcase__qr">
        <img
          src="/qr-demo.svg"
          alt={t('showcase.qrAlt', { url: DISPLAY_URL })}
          width={176}
          height={176}
        />
        <figcaption>{DISPLAY_URL}</figcaption>
      </figure>
      <p className="showcase__here">{t('showcase.here')}</p>
    </aside>,
    document.body,
  );
}
