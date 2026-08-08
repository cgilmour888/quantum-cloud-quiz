import {
  createContext,
  useContext,
} from 'react';

import type {
  AppRuntimeContextValue,
} from './AppProviders';

export const AppRuntimeContext =
  createContext<AppRuntimeContextValue | null>(
    null,
  );

export function useAppRuntime():
  AppRuntimeContextValue {
  const context =
    useContext(AppRuntimeContext);

  if (context === null) {
    throw new Error(
      'useAppRuntime must be used inside AppProviders.',
    );
  }

  return context;
}
