import { useEffect, useRef, useState, type ComponentType, type ReactNode } from 'react';
import type { ProfileId } from '../../domain/profiles.ts';
import { useI18n } from '../../i18n/I18nContext.ts';
import type { MessageKey } from '../../i18n/translate.ts';
import { createUserProfile, type UserProfile } from '../../platform/userProfile.ts';
import { Disclaimer } from '../components/Disclaimer.tsx';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  InstallIcon,
  LockIcon,
  NoSignalIcon,
  ShareIcon,
  ShieldCheckIcon,
} from '../components/icons.tsx';
import { PhoneArt } from '../components/illustrations.tsx';
import { ProfilePicker } from '../components/ProfilePicker.tsx';
import { useInstall, type InstallState } from '../hooks/useInstall.ts';

const STEPS = ['welcome', 'install', 'profile', 'ready'] as const;
type Step = (typeof STEPS)[number];

type IconComponent = ComponentType<{ className?: string }>;

const INSTALL_HINT: Record<InstallState, { icon: IconComponent; message: MessageKey | null }> = {
  prompt: { icon: InstallIcon, message: null },
  installed: { icon: CheckIcon, message: 'onboarding.install.done' },
  ios: { icon: ShareIcon, message: 'onboarding.install.ios' },
  manual: { icon: InstallIcon, message: 'onboarding.install.other' },
};

const FEATURES: readonly {
  icon: IconComponent;
  tone: string;
  title: MessageKey;
  body: MessageKey;
}[] = [
  {
    icon: ShieldCheckIcon,
    tone: 'green',
    title: 'onboarding.welcome.official',
    body: 'onboarding.welcome.officialBody',
  },
  {
    icon: NoSignalIcon,
    tone: 'blue',
    title: 'onboarding.welcome.offline',
    body: 'onboarding.welcome.offlineBody',
  },
  {
    icon: LockIcon,
    tone: 'purple',
    title: 'onboarding.welcome.private',
    body: 'onboarding.welcome.privateBody',
  },
];

/** Progress dots: done steps show a check, the current one its number. Decorative; the text says it. */
function Stepper({ index }: { index: number }) {
  return (
    <ol className="stepper" aria-hidden="true">
      {STEPS.map((step, i) => (
        <li
          key={step}
          className="stepper__dot"
          data-state={i < index ? 'done' : i === index ? 'current' : 'todo'}
        >
          {i < index ? <CheckMark /> : i === index ? String(i + 1) : null}
        </li>
      ))}
    </ol>
  );
}

function CheckMark() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" focusable="false">
      <path
        d="m6 12.5 4 4 8-9"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface NavProps {
  onBack: () => void;
  onNext: () => void;
  nextLabel: string;
  nextDisabled?: boolean;
}

function StepNav({ onBack, onNext, nextLabel, nextDisabled = false }: NavProps) {
  const { t } = useI18n();
  return (
    <div className="onboarding__actions">
      <button type="button" className="button button--outline button--lg" onClick={onBack}>
        <ArrowLeftIcon />
        <span>{t('onboarding.back')}</span>
      </button>
      <button
        type="button"
        className="button button--primary button--lg"
        disabled={nextDisabled}
        onClick={onNext}
      >
        <span>{nextLabel}</span>
        <ArrowRightIcon />
      </button>
    </div>
  );
}

interface OnboardingProps {
  onDone: (profile: UserProfile) => void;
}

/** First run: welcome → install → profile → ready. Nothing chosen here leaves the phone. */
export function Onboarding({ onDone }: OnboardingProps) {
  const { t } = useI18n();
  const install = useInstall();
  const [step, setStep] = useState<Step>('welcome');
  const [profile, setProfile] = useState<ProfileId | null>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const index = STEPS.indexOf(step);

  // Announce each new step by moving focus to its title.
  useEffect(() => {
    if (index > 0) titleRef.current?.focus();
  }, [index]);

  const progress = (
    <p className="onboarding__progress">
      {t('onboarding.step', { current: index + 1, total: STEPS.length })}
    </p>
  );

  let content: ReactNode;
  if (step === 'welcome') {
    content = (
      <div className="welcome" data-testid="onboarding-welcome">
        <div className="welcome__hero">
          <div className="welcome__intro">
            <img className="welcome__logo" src="/logo.png" alt="" width="512" height="512" />
            <h1 ref={titleRef} tabIndex={-1} className="welcome__title">
              {t('app.name')}
            </h1>
            <p className="welcome__tagline">{t('onboarding.welcome.body')}</p>
          </div>
          <img
            className="welcome__art"
            src="/images/welcome-hero.webp"
            alt=""
            width="900"
            height="1125"
          />
        </div>
        <div className="welcome__sheet">
          {progress}
          <ul className="features">
            {FEATURES.map(({ icon: Icon, tone, title, body }) => (
              <li key={title} className="feature">
                <span className="feature__icon" data-tone={tone}>
                  <Icon className="icon" />
                </span>
                <strong>{t(title)}</strong>
                <span className="muted">{t(body)}</span>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="button button--primary button--lg button--block button--pill"
            onClick={() => {
              setStep('install');
            }}
          >
            <span>{t('onboarding.start')}</span>
            <ArrowRightIcon />
          </button>
          <Disclaimer card />
        </div>
      </div>
    );
  } else if (step === 'install') {
    const hint = INSTALL_HINT[install.state];
    const HintIcon = hint.icon;
    content = (
      <div className="onboarding__page" data-testid="onboarding-install">
        <Stepper index={index} />
        <div className="onboarding__split">
          <div>
            {progress}
            <h1 ref={titleRef} tabIndex={-1}>
              {t('onboarding.install.title')}
            </h1>
            <p className="onboarding__lead">{t('onboarding.install.body')}</p>
          </div>
          <PhoneArt />
        </div>
        <div className="hint-card" data-state={install.state}>
          <span className="hint-card__icon">
            <HintIcon className="icon" />
          </span>
          {hint.message ? (
            <p>{t(hint.message)}</p>
          ) : (
            <button
              type="button"
              className="button button--primary button--block"
              onClick={() => {
                void install.install().then(() => {
                  setStep('profile');
                });
              }}
            >
              {t('onboarding.install.button')}
            </button>
          )}
        </div>
        <StepNav
          onBack={() => {
            setStep('welcome');
          }}
          onNext={() => {
            setStep('profile');
          }}
          nextLabel={
            install.state === 'prompt' ? t('onboarding.install.skip') : t('onboarding.next')
          }
        />
        <Disclaimer card />
      </div>
    );
  } else if (step === 'profile') {
    content = (
      <div className="onboarding__page" data-testid="onboarding-profile">
        <Stepper index={index} />
        {progress}
        <h1 ref={titleRef} tabIndex={-1}>
          {t('onboarding.profile.title')}
        </h1>
        <p className="onboarding__lead">{t('onboarding.profile.body')}</p>
        <ProfilePicker value={profile} onChange={setProfile} legend={t('onboarding.profile.who')} />
        <p className="privacy-note">
          <LockIcon />
          <span>{t('onboarding.profile.privacy')}</span>
        </p>
        <StepNav
          onBack={() => {
            setStep('install');
          }}
          onNext={() => {
            setStep('ready');
          }}
          nextLabel={t('onboarding.next')}
          nextDisabled={profile === null}
        />
        <Disclaimer card />
      </div>
    );
  } else {
    content = (
      <div className="onboarding__page onboarding__page--center" data-testid="onboarding-ready">
        <Stepper index={index} />
        {progress}
        <span className="ready-badge">
          <CheckMark />
        </span>
        <h1 ref={titleRef} tabIndex={-1}>
          {t('onboarding.ready.title')}
        </h1>
        <p className="onboarding__lead">{t('onboarding.ready.body')}</p>
        <button
          type="button"
          className="button button--primary button--lg button--block button--pill"
          onClick={() => {
            onDone(createUserProfile(profile ?? 'adult'));
          }}
        >
          <span>{t('onboarding.ready.button')}</span>
          <ArrowRightIcon />
        </button>
        <Disclaimer card />
      </div>
    );
  }

  return (
    <div className="onboarding" data-step={step}>
      <main className="onboarding__main">{content}</main>
    </div>
  );
}
