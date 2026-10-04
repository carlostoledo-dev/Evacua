import { useEffect, useId, useRef, useState } from 'react';
import type { ProfileId } from '../../domain/profiles.ts';
import { useI18n } from '../../i18n/I18nContext.ts';
import type { MessageKey } from '../../i18n/translate.ts';
import {
  createUserProfile,
  NAME_MAX_LENGTH,
  type UserProfile,
} from '../../platform/userProfile.ts';
import { Disclaimer } from '../components/Disclaimer.tsx';
import {
  CheckIcon,
  InstallIcon,
  LockIcon,
  OfflineIcon,
  ShieldCheckIcon,
} from '../components/icons.tsx';
import { ProfilePicker } from '../components/ProfilePicker.tsx';
import { WelcomeArt } from '../components/WelcomeArt.tsx';
import { useInstall, type InstallState } from '../hooks/useInstall.ts';

const STEPS = ['welcome', 'install', 'profile', 'ready'] as const;
type Step = (typeof STEPS)[number];

const INSTALL_MESSAGE: Record<Exclude<InstallState, 'prompt'>, MessageKey> = {
  installed: 'onboarding.install.done',
  ios: 'onboarding.install.ios',
  manual: 'onboarding.install.other',
};

interface OnboardingProps {
  onDone: (profile: UserProfile) => void;
}

/** First run: welcome → install → profile → ready. Nothing typed here leaves the phone. */
export function Onboarding({ onDone }: OnboardingProps) {
  const { t } = useI18n();
  const install = useInstall();
  const [step, setStep] = useState<Step>('welcome');
  const [name, setName] = useState('');
  const [profile, setProfile] = useState<ProfileId | null>(null);
  const nameId = useId();
  const hintId = useId();
  const titleRef = useRef<HTMLHeadingElement>(null);
  const index = STEPS.indexOf(step);

  // Announce each new step by moving focus to its title.
  useEffect(() => {
    if (index > 0) titleRef.current?.focus();
  }, [index]);

  const go = (next: Step) => {
    setStep(next);
  };

  return (
    <div className="onboarding">
      <main className="onboarding__main">
        <div className="glass-card onboarding__card" data-testid={`onboarding-${step}`}>
          <p className="onboarding__progress">
            {t('onboarding.step', { current: index + 1, total: STEPS.length })}
          </p>

          {step === 'welcome' && (
            <>
              <WelcomeArt />
              <h1 ref={titleRef} tabIndex={-1}>
                {t('onboarding.welcome.title')}
              </h1>
              <p>{t('onboarding.welcome.body')}</p>
              <ul className="feature-list">
                <li>
                  <ShieldCheckIcon />
                  <span>{t('onboarding.welcome.official')}</span>
                </li>
                <li>
                  <OfflineIcon />
                  <span>{t('onboarding.welcome.offline')}</span>
                </li>
                <li>
                  <LockIcon />
                  <span>{t('onboarding.welcome.private')}</span>
                </li>
              </ul>
              <button
                type="button"
                className="button button--primary button--block"
                onClick={() => {
                  go('install');
                }}
              >
                {t('onboarding.start')}
              </button>
            </>
          )}

          {step === 'install' && (
            <>
              <span className="onboarding__icon">
                <InstallIcon className="icon" />
              </span>
              <h1 ref={titleRef} tabIndex={-1}>
                {t('onboarding.install.title')}
              </h1>
              <p>{t('onboarding.install.body')}</p>
              {install.state === 'prompt' ? (
                <button
                  type="button"
                  className="button button--primary button--block"
                  onClick={() => {
                    void install.install().then(() => {
                      go('profile');
                    });
                  }}
                >
                  {t('onboarding.install.button')}
                </button>
              ) : (
                <p className={install.state === 'installed' ? 'plan plan--safe' : 'install-hint'}>
                  {install.state === 'installed' && <CheckIcon />}
                  <span>{t(INSTALL_MESSAGE[install.state])}</span>
                </p>
              )}
              <div className="onboarding__actions">
                <button
                  type="button"
                  className="button"
                  onClick={() => {
                    go('welcome');
                  }}
                >
                  {t('onboarding.back')}
                </button>
                <button
                  type="button"
                  className="button button--primary"
                  onClick={() => {
                    go('profile');
                  }}
                >
                  {install.state === 'prompt' ? t('onboarding.install.skip') : t('onboarding.next')}
                </button>
              </div>
            </>
          )}

          {step === 'profile' && (
            <>
              <h1 ref={titleRef} tabIndex={-1}>
                {t('onboarding.profile.title')}
              </h1>
              <p>{t('onboarding.profile.body')}</p>
              <div className="field">
                <label htmlFor={nameId}>{t('onboarding.profile.name')}</label>
                <input
                  id={nameId}
                  type="text"
                  value={name}
                  maxLength={NAME_MAX_LENGTH}
                  autoComplete="given-name"
                  aria-describedby={hintId}
                  onChange={(event) => {
                    setName(event.target.value);
                  }}
                />
                <p id={hintId} className="muted small">
                  {t('onboarding.profile.nameHint')}
                </p>
              </div>
              <ProfilePicker
                value={profile}
                onChange={setProfile}
                legend={t('onboarding.profile.who')}
              />
              <div className="onboarding__actions">
                <button
                  type="button"
                  className="button"
                  onClick={() => {
                    go('install');
                  }}
                >
                  {t('onboarding.back')}
                </button>
                <button
                  type="button"
                  className="button button--primary"
                  disabled={profile === null}
                  onClick={() => {
                    go('ready');
                  }}
                >
                  {t('onboarding.next')}
                </button>
              </div>
            </>
          )}

          {step === 'ready' && (
            <>
              <span className="onboarding__icon onboarding__icon--ok">
                <CheckIcon className="icon" />
              </span>
              <h1 ref={titleRef} tabIndex={-1}>
                {name.trim()
                  ? t('onboarding.ready.titleNamed', { name: name.trim() })
                  : t('onboarding.ready.title')}
              </h1>
              <p>{t('onboarding.ready.body')}</p>
              <button
                type="button"
                className="button button--primary button--block"
                onClick={() => {
                  onDone(createUserProfile(name, profile ?? 'adult'));
                }}
              >
                {t('onboarding.ready.button')}
              </button>
            </>
          )}
        </div>
      </main>
      <footer className="app-footer">
        <Disclaimer />
      </footer>
    </div>
  );
}
