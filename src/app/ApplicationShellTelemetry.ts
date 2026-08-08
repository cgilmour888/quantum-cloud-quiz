/**
 * Artifact ID: QCQ-APP-001-014
 * Artifact Name: ApplicationShellTelemetry
 * Artifact Purpose: Consent-governed, bounded, duplicate-resistant operational shell telemetry with an injected sink and no implicit network endpoint.
 * Artifact Layer: Phase 1 — Application Shell / TEL
 * Artifact Dependencies: QCQ-APP-001-005, QCQ-APP-001-006
 * Artifact Dependents: QCQ-APP-001-001, QCQ-APP-001-002, QCQ-APP-001-013, QCQ-APP-001-017
 * Dependency Graph: shell lifecycle events -> ApplicationShellTelemetry -> injected operational sink
 * Repository Path: QCQ/frontend/src/app
 * Source File: ApplicationShellTelemetry.ts
 */

import {
  APPLICATION_SHELL_REFERENCE,
} from './ApplicationShell.constants';
import type {
  ApplicationShellTelemetryEvent,
  ApplicationShellTelemetrySink,
  ApplicationShellTelemetrySnapshot,
} from './ApplicationShell.types';

export class ApplicationShellTelemetry {
  readonly #queue: ApplicationShellTelemetryEvent[] =
    [];

  readonly #eventIds = new Set<string>();

  #consentGranted: boolean;

  #droppedCount = 0;

  #deliveredCount = 0;

  #lastFlushedAt: string | null = null;

  public constructor(
    private readonly sink:
      | ApplicationShellTelemetrySink
      | null = null,
    options: {
      readonly consentGranted?: boolean | undefined;
      readonly maximumQueue?: number | undefined;
      readonly maximumBatch?: number | undefined;
    } = {},
  ) {
    this.#consentGranted =
      options.consentGranted ?? false;

    const maximumQueue =
      options.maximumQueue ??
      APPLICATION_SHELL_REFERENCE.maximumTelemetryQueue;
    const maximumBatch =
      options.maximumBatch ??
      APPLICATION_SHELL_REFERENCE.maximumTelemetryBatch;

    if (
      !Number.isInteger(maximumQueue) ||
      maximumQueue <= 0 ||
      maximumQueue >
        APPLICATION_SHELL_REFERENCE.maximumTelemetryQueue
    ) {
      throw new Error(
        'maximumQueue must be a positive bounded integer.',
      );
    }
    if (
      !Number.isInteger(maximumBatch) ||
      maximumBatch <= 0 ||
      maximumBatch > maximumQueue
    ) {
      throw new Error(
        'maximumBatch must be a positive integer no greater than maximumQueue.',
      );
    }

    this.maximumQueue = maximumQueue;
    this.maximumBatch = maximumBatch;
  }

  public readonly maximumQueue: number;

  public readonly maximumBatch: number;

  public setConsent(granted: boolean): void {
    this.#consentGranted = granted;
    if (!granted) {
      this.#queue.splice(0);
      this.#eventIds.clear();
    }
  }

  public record(
    event: ApplicationShellTelemetryEvent,
  ): boolean {
    if (!this.#consentGranted) return false;
    if (
      event.eventId.trim().length === 0 ||
      this.#eventIds.has(event.eventId)
    ) {
      return false;
    }
    if (this.#queue.length >= this.maximumQueue) {
      this.#droppedCount += 1;
      return false;
    }

    const frozen = Object.freeze({
      ...event,
      metadata: Object.freeze({
        ...event.metadata,
      }),
    });

    this.#queue.push(frozen);
    this.#eventIds.add(frozen.eventId);
    return true;
  }

  public async flush(): Promise<number> {
    if (
      !this.#consentGranted ||
      this.sink === null ||
      this.#queue.length === 0
    ) {
      return 0;
    }

    const batch = Object.freeze(
      this.#queue.slice(0, this.maximumBatch),
    );
    const deliveredIds = new Set(
      await this.sink.deliver(batch),
    );
    if (deliveredIds.size === 0) return 0;

    for (
      let index = this.#queue.length - 1;
      index >= 0;
      index -= 1
    ) {
      const event = this.#queue[index];
      if (
        event !== undefined &&
        deliveredIds.has(event.eventId)
      ) {
        this.#eventIds.delete(event.eventId);
        this.#queue.splice(index, 1);
      }
    }

    this.#deliveredCount += deliveredIds.size;
    this.#lastFlushedAt = new Date().toISOString();
    return deliveredIds.size;
  }

  public getSnapshot():
    ApplicationShellTelemetrySnapshot {
    return Object.freeze({
      consentGranted: this.#consentGranted,
      queueLength: this.#queue.length,
      droppedCount: this.#droppedCount,
      deliveredCount: this.#deliveredCount,
      lastFlushedAt: this.#lastFlushedAt,
    });
  }
}

let eventCounter = 0;

export function createApplicationShellTelemetryEvent(
  type: ApplicationShellTelemetryEvent['type'],
  options: {
    readonly severity?:
      | ApplicationShellTelemetryEvent['severity']
      | undefined;
    readonly correlationId?: string | undefined;
    readonly route?: string | null | undefined;
    readonly metadata?:
      | ApplicationShellTelemetryEvent['metadata']
      | undefined;
    readonly occurredAt?: string | undefined;
  } = {},
): ApplicationShellTelemetryEvent {
  eventCounter += 1;
  const occurredAt =
    options.occurredAt ?? new Date().toISOString();

  return Object.freeze({
    eventId:
      `shell:${occurredAt}:${eventCounter.toString(36)}`,
    type,
    occurredAt,
    severity: options.severity ?? 'information',
    correlationId:
      options.correlationId ?? 'application-shell',
    route: options.route ?? null,
    metadata: Object.freeze({
      ...(options.metadata ?? {}),
    }),
  });
}
