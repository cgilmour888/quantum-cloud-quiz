import {
  cleanup,
  fireEvent,
  render,
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
        unlock:
          audioMocks.unlock,
      }),
  }),
);

vi.mock(
  '../useAmbientAudio',
  () => ({
    useAmbientAudio:
      () => ({
        start:
          audioMocks.start,
        stop:
          audioMocks.stop,
      }),
  }),
);

import {
  AmbientSoundtrack,
} from '../AmbientSoundtrack';

afterEach(
  () => {
    cleanup();
    vi.clearAllMocks();
  },
);

describe(
  'QCQ AmbientSoundtrack activation',
  () => {
    it(
      'does not unlock or start audio merely because the component mounted',
      () => {
        render(
          <AmbientSoundtrack />,
        );

        expect(
          audioMocks.unlock,
        ).not.toHaveBeenCalled();

        expect(
          audioMocks.start,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'starts only after a primary pointer activation and does not duplicate playback after success',
      async () => {
        render(
          <AmbientSoundtrack />,
        );

        fireEvent.pointerDown(
          document,
          {
            button:
              0,
          },
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

        fireEvent.pointerDown(
          document,
          {
            button:
              0,
          },
        );

        expect(
          audioMocks.start,
        ).toHaveBeenCalledTimes(
          1,
        );
      },
    );

    it(
      'treats keyboard Enter as an explicit user activation',
      async () => {
        render(
          <AmbientSoundtrack />,
        );

        fireEvent.keyDown(
          document,
          {
            key:
              'Enter',
          },
        );

        await waitFor(
          () => {
            expect(
              audioMocks.unlock,
            ).toHaveBeenCalledTimes(
              1,
            );

            expect(
              audioMocks.start,
            ).toHaveBeenCalledTimes(
              1,
            );
          },
        );
      },
    );
  },
);
