/**
 * Artifact ID: QCQ-AUD-018
 * Artifact Name: InteractionAudioCoordinator
 * Repository Path: QCQ/frontend/src/audio/InteractionAudioCoordinator.ts
 */

import type {
  AudioPlaybackResult,
} from './AudioEngine';
import type {
  AudioEventName,
} from './AudioEvents';

export interface InteractionAudioSink {
  readonly playEvent:
    (
      event:
        AudioEventName,
    ) => Promise<AudioPlaybackResult>;
}

export class InteractionAudioCoordinator {
  public constructor(
    private readonly sink:
      InteractionAudioSink,
  ) {}

  public buttonHover():
    Promise<AudioPlaybackResult> {
    return this.play(
      'buttonHover',
    );
  }

  public buttonSelect():
    Promise<AudioPlaybackResult> {
    return this.play(
      'buttonSelect',
    );
  }

  public panelOpen():
    Promise<AudioPlaybackResult> {
    return this.play(
      'panelOpen',
    );
  }

  public panelClose():
    Promise<AudioPlaybackResult> {
    return this.play(
      'panelClose',
    );
  }

  public answerLock():
    Promise<AudioPlaybackResult> {
    return this.play(
      'answerLock',
    );
  }

  public answerResolved(
    correct: boolean,
  ): Promise<AudioPlaybackResult> {
    return this.play(
      correct
        ? 'answerCorrect'
        : 'answerIncorrect',
    );
  }

  public questionAdvance():
    Promise<AudioPlaybackResult> {
    return this.play(
      'questionAdvance',
    );
  }

  public timerWarning():
    Promise<AudioPlaybackResult> {
    return this.play(
      'timerWarning',
    );
  }

  public xpGain():
    Promise<AudioPlaybackResult> {
    return this.play(
      'xpGain',
    );
  }

  public levelUp():
    Promise<AudioPlaybackResult> {
    return this.play(
      'levelUp',
    );
  }

  public achievementUnlock():
    Promise<AudioPlaybackResult> {
    return this.play(
      'achievementUnlock',
    );
  }

  private play(
    event:
      AudioEventName,
  ): Promise<AudioPlaybackResult> {
    return this.sink.playEvent(
      event,
    );
  }
}
