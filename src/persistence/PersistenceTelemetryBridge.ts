/**
 * Artifact ID: QCQ-PER-028
 * Artifact Name: PersistenceTelemetryBridge
 * Repository Path: QCQ/frontend/src/persistence/PersistenceTelemetryBridge.ts
 */

import type { ConsentState, JsonValue } from './PersistenceTypes';

export interface PersistenceTelemetryEvent {
  readonly eventId: string;
  readonly type: string;
  readonly occurredAt: string;
  readonly properties: Readonly<Record<string, JsonValue>>;
}

export interface PersistenceTelemetrySink {
  publish(event: PersistenceTelemetryEvent): Promise<void>;
}

export class PersistenceTelemetryBridge {
  public constructor(
    private readonly sink: PersistenceTelemetrySink,
    private readonly consent: () => ConsentState,
  ) {}

  public async publish(event: PersistenceTelemetryEvent): Promise<boolean> {
    if (this.consent() !== 'granted') return false;
    if (event.eventId.trim().length === 0 || event.type.trim().length === 0) {
      throw new Error('Persistence telemetry event identity and type are required.');
    }
    await this.sink.publish(
      Object.freeze({ ...event, properties: Object.freeze({ ...event.properties }) }),
    );
    return true;
  }
}
