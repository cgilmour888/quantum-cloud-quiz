import {
  StrictMode,
} from 'react';
import {
  createRoot,
} from 'react-dom/client';

import {
  App,
} from './App';
import {
  AppErrorBoundary,
} from './app/AppErrorBoundary';
import './styles/reset.css';
import './styles/global.css';
import './styles/accessibility.css';

const mountNode =
  document.getElementById('root');

if (
  !(mountNode instanceof HTMLElement)
) {
  throw new Error(
    'QCQ bootstrap failed: #root mount element was not found.',
  );
}

mountNode.dataset.qcqBootstrap =
  'mounting';

const root = createRoot(
  mountNode,
  {
    onUncaughtError(
      error,
      errorInfo,
    ) {
      console.error(
        '[QCQ] uncaught React error',
        {
          error,
          errorInfo,
        },
      );
    },
    onCaughtError(
      error,
      errorInfo,
    ) {
      console.error(
        '[QCQ] caught React error',
        {
          error,
          errorInfo,
        },
      );
    },
    onRecoverableError(
      error,
      errorInfo,
    ) {
      console.warn(
        '[QCQ] recoverable React error',
        {
          error,
          errorInfo,
        },
      );
    },
  },
);

root.render(
  <StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </StrictMode>,
);

mountNode.dataset.qcqBootstrap =
  'mounted';
