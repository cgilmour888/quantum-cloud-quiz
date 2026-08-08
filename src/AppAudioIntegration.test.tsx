import type {
  PropsWithChildren,
} from 'react';
import {
  render,
  screen,
} from '@testing-library/react';
import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';

vi.mock(
  './app/AppProviders',
  () => ({
    AppProviders({
      children,
    }: PropsWithChildren) {
      return (
        <div data-testid="app-providers">
          {children}
        </div>
      );
    },
  }),
);

vi.mock(
  './app/AppRouter',
  () => ({
    AppRouter() {
      return (
        <div data-testid="app-router" />
      );
    },
  }),
);

vi.mock(
  './audio/AudioProvider',
  () => ({
    AudioProvider({
      children,
    }: PropsWithChildren) {
      return (
        <div data-testid="audio-provider">
          {children}
        </div>
      );
    },
  }),
);

vi.mock(
  './audio/AudioLifecycle',
  () => ({
    AudioLifecycle() {
      return (
        <div data-testid="audio-lifecycle" />
      );
    },
  }),
);

vi.mock(
  './audio/AmbientSoundtrack',
  () => ({
    AmbientSoundtrack() {
      return (
        <div data-testid="ambient-soundtrack" />
      );
    },
  }),
);

import {
  App,
} from './App';

describe(
  'QCQ application audio integration',
  () => {
    it(
      'mounts one audio provider inside the canonical application provider root',
      () => {
        render(
          <App />,
        );

        const appProviders =
          screen.getByTestId(
            'app-providers',
          );

        const audioProvider =
          screen.getByTestId(
            'audio-provider',
          );

        const router =
          screen.getByTestId(
            'app-router',
          );

        expect(
          appProviders.contains(
            audioProvider,
          ),
        ).toBe(
          true,
        );

        expect(
          audioProvider.contains(
            router,
          ),
        ).toBe(
          true,
        );
      },
    );

    it(
      'mounts lifecycle and ambient authorities alongside routing without nesting them in the router',
      () => {
        render(
          <App />,
        );

        const audioProvider =
          screen.getByTestId(
            'audio-provider',
          );

        const children =
          Array.from(
            audioProvider.children,
          );

        expect(
          children,
        ).toHaveLength(
          3,
        );

        expect(
          children[0],
        ).toHaveAttribute(
          'data-testid',
          'audio-lifecycle',
        );

        expect(
          children[1],
        ).toHaveAttribute(
          'data-testid',
          'ambient-soundtrack',
        );

        expect(
          children[2],
        ).toHaveAttribute(
          'data-testid',
          'app-router',
        );
      },
    );
  },
);
