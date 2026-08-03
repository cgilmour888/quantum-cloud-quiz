import { assetPath } from '../../utils/assetPath.js';
import { SceneEvents, dispatchSceneEvent } from '../scene/sceneEvents.js';
import { PROFILE_CARD } from './profileCardData.js';

function emit(targetRef, platform, configured) {
  const target = targetRef?.current ?? globalThis.document?.documentElement;
  dispatchSceneEvent(target, SceneEvents.SOCIAL_LINK_ACTIVATED, {
    platform,
    configured,
  });
}

export function ProfileCardSurface({ eventTargetRef, onClose }) {
  return (
    <section
      className="qcq-profile-card"
      aria-label="Carl Gilmour business card"
      data-preserves-quiz-state="true"
    >
      <button
        type="button"
        className="qcq-profile-card__close"
        onClick={onClose}
      >
        RETURN TO QUIZ
      </button>

      <div className="qcq-profile-card__body">
        <img
          className="qcq-profile-card__artwork"
          src={assetPath(PROFILE_CARD.artwork)}
          alt="Carl Gilmour, cgilmour@ymail.com"
          draggable={false}
        />

        <a
          className="qcq-profile-card__email"
          href={`mailto:${PROFILE_CARD.email}`}
          onClick={() => emit(eventTargetRef, 'email', true)}
        >
          EMAIL CARL GILMOUR
        </a>

        <div className="qcq-profile-card__socials" aria-label="Social profiles">
          {PROFILE_CARD.socials.map((social) => (
            social.href ? (
              <a
                key={social.id}
                className="qcq-profile-card__social"
                href={social.href}
                target="_blank"
                rel="noreferrer"
                aria-label={`Open ${social.label}`}
                onClick={() => emit(eventTargetRef, social.id, true)}
              >
                <img src={assetPath(social.icon)} alt="" draggable={false} />
              </a>
            ) : (
              <span
                key={social.id}
                className="qcq-profile-card__social qcq-profile-card__social--unconfigured"
                role="img"
                aria-label={`${social.label} profile link not configured`}
                title={`${social.label} profile link not configured`}
                onPointerDown={() => emit(eventTargetRef, social.id, false)}
              >
                <img src={assetPath(social.icon)} alt="" draggable={false} />
              </span>
            )
          ))}
        </div>
      </div>
    </section>
  );
}
