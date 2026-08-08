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
  StormAudioCoordinator,
  type AudioScheduler,
  type StormAudioSink,
} from '../StormAudioCoordinator';

interface ScheduledTask {
  readonly task:
    () => void;
  readonly delayMs:
    number;
  readonly cancel:
    ReturnType<typeof vi.fn>;
}

function createSink() {
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

  const stopEvent =
    vi.fn(
      (
        event:
          AudioEventName,
      ) => {
        void event;
      },
    );

  const sink:
    StormAudioSink = {
      playEvent,
      stopEvent,
    };

  return {
    sink,
    playEvent,
    stopEvent,
  };
}

function createScheduler(
  tasks:
    ScheduledTask[],
): AudioScheduler {
  return {
    schedule(
      task,
      delayMs,
    ) {
      const cancel =
        vi.fn();

      tasks.push(
        {
          task,
          delayMs,
          cancel,
        },
      );

      return cancel;
    },
  };
}

describe(
  'QCQ StormAudioCoordinator',
  () => {
    it(
      'routes storm-rumble start and stop through semantic audio events',
      async () => {
        const {
          sink,
          playEvent,
          stopEvent,
        } = createSink();

        const coordinator =
          new StormAudioCoordinator(
            sink,
            createScheduler(
              [],
            ),
          );

        await coordinator.startStormRumble();

        coordinator.stopStormRumble();

        expect(
          playEvent,
        ).toHaveBeenCalledWith(
          'stormRumble',
        );

        expect(
          stopEvent,
        ).toHaveBeenCalledWith(
          'stormRumble',
        );
      },
    );

    it(
      'synchronizes an intense nearby strike with flicker and delayed close thunder',
      () => {
        const tasks:
          ScheduledTask[] = [];

        const {
          sink,
          playEvent,
        } = createSink();

        const coordinator =
          new StormAudioCoordinator(
            sink,
            createScheduler(
              tasks,
            ),
          );

        coordinator.triggerLightningStrike(
          {
            distance:
              0.2,
            intensity:
              0.8,
          },
        );

        expect(
          playEvent,
        ).toHaveBeenNthCalledWith(
          1,
          'lightningCrack',
        );

        expect(
          playEvent,
        ).toHaveBeenNthCalledWith(
          2,
          'cloudFlicker',
        );

        expect(
          tasks,
        ).toHaveLength(
          1,
        );

        expect(
          tasks[0]?.delayMs,
        ).toBe(
          460,
        );

        tasks[0]?.task();

        expect(
          playEvent,
        ).toHaveBeenLastCalledWith(
          'thunderClose',
        );
      },
    );

    it(
      'schedules distant thunder without unnecessary cloud flicker for a weak remote strike',
      () => {
        const tasks:
          ScheduledTask[] = [];

        const {
          sink,
          playEvent,
        } = createSink();

        const coordinator =
          new StormAudioCoordinator(
            sink,
            createScheduler(
              tasks,
            ),
          );

        coordinator.triggerLightningStrike(
          {
            distance:
              0.8,
            intensity:
              0.2,
          },
        );

        expect(
          playEvent,
        ).toHaveBeenCalledTimes(
          1,
        );

        expect(
          playEvent,
        ).toHaveBeenCalledWith(
          'lightningCrack',
        );

        expect(
          tasks,
        ).toHaveLength(
          1,
        );

        expect(
          tasks[0]?.delayMs,
        ).toBe(
          1480,
        );

        tasks[0]?.task();

        expect(
          playEvent,
        ).toHaveBeenLastCalledWith(
          'thunderDistant',
        );
      },
    );

    it(
      'cancels pending thunder and stops storm rumble during disposal',
      () => {
        const tasks:
          ScheduledTask[] = [];

        const {
          sink,
          stopEvent,
        } = createSink();

        const coordinator =
          new StormAudioCoordinator(
            sink,
            createScheduler(
              tasks,
            ),
          );

        coordinator.triggerLightningStrike(
          {
            distance:
              0.4,
            intensity:
              0.5,
          },
        );

        coordinator.triggerLightningStrike(
          {
            distance:
              0.7,
            intensity:
              0.3,
          },
        );

        expect(
          tasks,
        ).toHaveLength(
          2,
        );

        coordinator.dispose();

        expect(
          tasks[0]?.cancel,
        ).toHaveBeenCalledTimes(
          1,
        );

        expect(
          tasks[1]?.cancel,
        ).toHaveBeenCalledTimes(
          1,
        );

        expect(
          stopEvent,
        ).toHaveBeenCalledWith(
          'stormRumble',
        );
      },
    );
  },
);
