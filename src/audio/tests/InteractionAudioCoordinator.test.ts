import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import type {
  AudioPlaybackResult,
} from '../AudioEngine';
import type {
  AudioEventName,
} from '../AudioEvents';
import {
  InteractionAudioCoordinator,
  type InteractionAudioSink,
} from '../InteractionAudioCoordinator';

function createCoordinator() {
  const playEvent =
    vi.fn(
      (
        event:
          AudioEventName,
      ): Promise<AudioPlaybackResult> =>
        Promise.resolve(
          {
            status:
              'started',
            assetId:
              event,
          },
        ),
    );

  const sink:
    InteractionAudioSink = {
      playEvent,
    };

  return {
    coordinator:
      new InteractionAudioCoordinator(
        sink,
      ),
    playEvent,
  };
}

describe(
  'QCQ InteractionAudioCoordinator',
  () => {
    it(
      'routes correct and incorrect answer resolution to distinct semantic events',
      async () => {
        const {
          coordinator,
          playEvent,
        } = createCoordinator();

        await coordinator.answerResolved(
          true,
        );

        await coordinator.answerResolved(
          false,
        );

        expect(
          playEvent,
        ).toHaveBeenNthCalledWith(
          1,
          'answerCorrect',
        );

        expect(
          playEvent,
        ).toHaveBeenNthCalledWith(
          2,
          'answerIncorrect',
        );
      },
    );

    it(
      'routes interface interaction semantics without exposing asset file paths',
      async () => {
        const {
          coordinator,
          playEvent,
        } = createCoordinator();

        await coordinator.buttonHover();
        await coordinator.buttonSelect();
        await coordinator.panelOpen();
        await coordinator.panelClose();

        expect(
          playEvent.mock.calls.map(
            ([event]) =>
              event,
          ),
        ).toEqual(
          [
            'buttonHover',
            'buttonSelect',
            'panelOpen',
            'panelClose',
          ],
        );
      },
    );

    it(
      'routes gameplay and achievement semantics through the governed event vocabulary',
      async () => {
        const {
          coordinator,
          playEvent,
        } = createCoordinator();

        await coordinator.answerLock();
        await coordinator.questionAdvance();
        await coordinator.timerWarning();
        await coordinator.xpGain();
        await coordinator.levelUp();
        await coordinator.achievementUnlock();

        expect(
          playEvent.mock.calls.map(
            ([event]) =>
              event,
          ),
        ).toEqual(
          [
            'answerLock',
            'questionAdvance',
            'timerWarning',
            'xpGain',
            'levelUp',
            'achievementUnlock',
          ],
        );
      },
    );
  },
);
