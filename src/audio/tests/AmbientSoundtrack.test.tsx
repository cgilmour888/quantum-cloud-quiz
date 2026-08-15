import {
  cleanup,
  fireEvent,
  render,
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
      start:
        vi.fn(),
      stop:
        vi.fn(),
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
  AmbientSoundtrack,
} from '../AmbientSoundtrack';

afterEach(
  () => {
    cleanup();
    vi.clearAllMocks();
  },
);

describe(
  'QCQ AmbientSoundtrack lifecycle',
  () => {
    it(
      'does not start playback merely because the lifecycle component mounted',
      () => {
        render(
          <AmbientSoundtrack />,
        );

        expect(
          audioMocks.start,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'remains silent for generic document pointer and keyboard activation',
      () => {
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

        fireEvent.keyDown(
          document,
          {
            key:
              'Enter',
          },
        );

        expect(
          audioMocks.start,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'stops ambient playback when disabled and again when the authority unmounts',
      () => {
        const view =
          render(
            <AmbientSoundtrack />,
          );

        view.rerender(
          <AmbientSoundtrack
            enabled={false}
          />,
        );

        expect(
          audioMocks.stop,
        ).toHaveBeenCalledTimes(
          1,
        );

        view.unmount();

        expect(
          audioMocks.stop,
        ).toHaveBeenCalledTimes(
          2,
        );
      },
    );
  },
);
