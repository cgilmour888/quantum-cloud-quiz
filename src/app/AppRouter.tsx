/**
 * Artifact ID: QCQ-LCH-010
 * Artifact Name: AppRouter
 * Repository Path: QCQ/frontend/src/app/AppRouter.tsx
 */

import { useEffect, useState, type ReactNode } from 'react';

import { BorderFrameEngine } from '../frame/BorderFrameEngine';
import { StormLayer } from '../effects/StormLayer';
import { TabletApplicationShell } from '../tablet/TabletApplicationShell';
import LayoutEngine from './LayoutEngine';
import { useAppRuntime } from './AppRuntimeContext';

const normalizePath = (pathname: string): string => {
  const normalized = pathname.replace(/\/{2,}/gu, '/').replace(/\/+$/gu, '');
  return normalized || '/';
};

interface FoundationConsoleProps {
  readonly title: string;
  readonly children: ReactNode;
}

function FoundationConsole({ title, children }: FoundationConsoleProps) {
  return (
    <section className="qcq-instrument" aria-label={title}>
      <p className="qcq-instrument__label">{title}</p>
      {children}
    </section>
  );
}

function EnvironmentLayer({ cinematic }: { readonly cinematic: boolean }) {
  return (
    <>
      <StormLayer
        active={cinematic}
        quality={cinematic ? 'balanced' : 'performance'}
        motion="full"
        intensity={0.72}
        opacity={0.9}
      />
      <BorderFrameEngine
        active
        quality={cinematic ? 'ultra' : 'balanced'}
        intensity={0.94}
      />
    </>
  );
}

function FoundationHome() {
  const { config, lifecycle } = useAppRuntime();

  return (
    <LayoutEngine
      ariaLabel="Quantum Certification Quest application"
      quality={config.features.cinematicEffects ? 'ultra' : 'balanced'}
      motion="balanced"
      environment={
        <EnvironmentLayer cinematic={config.features.cinematicEffects} />
      }
      performance={
        <FoundationConsole title="Performance console">
          <nav aria-label="QCQ command navigation">
            <a aria-current="page" href="/">
              Application shell
            </a>
            <a href="#architecture">Architecture</a>
            <a href="#quality">Quality gates</a>
            <a href="#next">Next systems</a>
          </nav>
        </FoundationConsole>
      }
      tablet={
        <TabletApplicationShell
          applicationTitle={config.appName}
          applicationSubtitle="QCQ Version 1 · Executable branch"
          statusMessage={`Runtime ${lifecycle.phase}. Application macro layout is controlled by QCQ-APP-002.`}
          contentKey={lifecycle.phase}
        >
          <article className="qcq-tablet__surface" aria-labelledby="foundation-title">
            <p className="qcq-kicker">Mandatory architecture reconciliation</p>
            <h2 id="foundation-title">Application and tablet authorities aligned</h2>
            <p className="qcq-lede">
              QCQ-APP-002 now owns the environment, performance, tablet,
              metrics, and player-banner zones. The QCQ-TBL branch remains
              responsible for the reusable certification-tablet experience.
            </p>

            <div id="architecture" className="qcq-status-grid" aria-label="Architecture authorities">
              <article>
                <span>APP</span>
                <h3>Macro layout</h3>
                <p>One application viewport, one skip link, and one primary landmark.</p>
              </article>
              <article>
                <span>TBL</span>
                <h3>Tablet domain</h3>
                <p>Question, answer, gameplay, metrics, and tablet-local presentation.</p>
              </article>
              <article>
                <span>DAT</span>
                <h3>Validation</h3>
                <p>Authoritative dataset, session, answer, and progression engines.</p>
              </article>
              <article>
                <span>EFX</span>
                <h3>Environment</h3>
                <p>Pointer-transparent, optional, visibility-aware web-native effects.</p>
              </article>
            </div>

            <section id="quality" className="qcq-system-readout" aria-labelledby="quality-title">
              <div>
                <p id="quality-title" className="qcq-instrument__label">Build channel</p>
                <strong>{config.channel}</strong>
              </div>
              <div>
                <p className="qcq-instrument__label">Application version</p>
                <strong>{config.appVersion}</strong>
              </div>
              <div>
                <p className="qcq-instrument__label">Runtime phase</p>
                <strong>{lifecycle.phase}</strong>
              </div>
            </section>

            <div id="next" className="qcq-next-action">
              <div>
                <p className="qcq-instrument__label">Integration authority</p>
                <strong>QCQ-APP-002 LayoutEngine</strong>
              </div>
              <a className="qcq-primary-action" href="#architecture">
                Review ownership
              </a>
            </div>
          </article>
        </TabletApplicationShell>
      }
      metrics={
        <FoundationConsole title="System metrics">
          <dl>
            <div>
              <dt>Macro-layout engines</dt>
              <dd>1</dd>
            </div>
            <div>
              <dt>Primary landmarks</dt>
              <dd>1</dd>
            </div>
            <div>
              <dt>Raster overlays</dt>
              <dd>0</dd>
            </div>
            <div>
              <dt>Runtime phase</dt>
              <dd>{lifecycle.phase}</dd>
            </div>
          </dl>
        </FoundationConsole>
      }
      playerBanner={
        <div className="qcq-identity-rail">
          <span>{config.appName}</span>
          <span aria-hidden="true">◆</span>
          <span>{config.channel}</span>
        </div>
      }
    />
  );
}

function NotFound({ path }: { readonly path: string }) {
  const { config } = useAppRuntime();

  return (
    <LayoutEngine
      ariaLabel="Quantum Certification Quest route unavailable"
      motion="balanced"
      environment={<EnvironmentLayer cinematic={false} />}
      tablet={
        <TabletApplicationShell
          applicationTitle={config.appName}
          applicationSubtitle="Route unavailable"
          statusMessage={`No route is registered for ${path}.`}
          contentKey={path}
        >
          <section className="qcq-route-message" aria-labelledby="not-found-title">
            <p className="qcq-kicker">Route unavailable</p>
            <h2 id="not-found-title">Nothing is registered at this address.</h2>
            <p>
              Requested path: <code>{path}</code>
            </p>
            <a className="qcq-primary-action" href="/">
              Return to the QCQ foundation
            </a>
          </section>
        </TabletApplicationShell>
      }
    />
  );
}

export function AppRouter() {
  const [path, setPath] = useState(() => normalizePath(window.location.pathname));

  useEffect(() => {
    const handlePopState = () => {
      setPath(normalizePath(window.location.pathname));
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return path === '/' ? <FoundationHome /> : <NotFound path={path} />;
}
