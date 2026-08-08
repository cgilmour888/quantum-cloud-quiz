/**
 * Artifact ID: QCQ-LCH-008
 * Artifact Name: App
 * Repository Path: QCQ/frontend/src/App.tsx
 */

import { AppProviders } from './app/AppProviders';
import { AppRouter } from './app/AppRouter';
import { AmbientSoundtrack } from './audio/AmbientSoundtrack';
import { AudioLifecycle } from './audio/AudioLifecycle';
import { AudioProvider } from './audio/AudioProvider';

export function App() {
  return (
    <AppProviders>
      <AudioProvider>
        <AudioLifecycle />
        <AmbientSoundtrack />
        <AppRouter />
      </AudioProvider>
    </AppProviders>
  );
}
