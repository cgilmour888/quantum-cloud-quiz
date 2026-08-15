import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

const audioMocks =
  vi.hoisted(
    () => ({
      unlock:
        vi.fn(),
      setMuted:
        vi.fn(),
      setMasterGain:
        vi.fn(),
      start:
        vi.fn(
          () =>
            Promise.resolve({
              status:
                'started' as const,
              assetId:
                'music.ambient.quantum-cloud',
            }),
        ),
      stop:
        vi.fn(),
    }),
  );

vi.mock(
  '../useAudio',
  () => ({
    useAudio:
      () => ({
        unlocked:
          false,
        muted:
          false,
        masterGain:
          0.35,
        unlock:
          audioMocks.unlock,
        setMuted:
          audioMocks.setMuted,
        setMasterGain:
          audioMocks.setMasterGain,
      }),
  }),
);

vi.mock(
  '../useAmbientAudio',
  () => ({
    useAmbientAudio:
      () => ({
        unlocked:
          false,
        muted:
          false,
        start:
          audioMocks.start,
        stop:
          audioMocks.stop,
      }),
  }),
);

import {
  AudioMenuButton,
} from '../AudioMenuButton';

afterEach(
  () => {
    cleanup();
    vi.clearAllMocks();
  },
);

describe(
  'QCQ AudioMenuButton explicit activation contract',
  () => {
    it(
      'opens the audio menu without unlocking or starting playback',
      () => {
        render(
          <AudioMenuButton />,
        );

        fireEvent.click(
          screen.getByRole(
            'button',
            {
              name:
                'Audio options',
            },
          ),
        );

        expect(
          screen.getByRole(
            'dialog',
            {
              name:
                'Audio options',
            },
          ),
        ).toBeInTheDocument();

        expect(
          audioMocks.unlock,
        ).not.toHaveBeenCalled();

        expect(
          audioMocks.start,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'unlocks and starts the soundtrack only from the explicit enable control',
      async () => {
        render(
          <AudioMenuButton />,
        );

        fireEvent.click(
          screen.getByRole(
            'button',
            {
              name:
                'Audio options',
            },
          ),
        );

        fireEvent.click(
          screen.getByRole(
            'button',
            {
              name:
                'Enable soundtrack',
            },
          ),
        );

        await waitFor(
          () => {
            expect(
              audioMocks.start,
            ).toHaveBeenCalledTimes(
              1,
            );
          },
        );

        expect(
          audioMocks.unlock,
        ).toHaveBeenCalledTimes(
          1,
        );
      },
    );
  },
);
