export type BootstrapTelemetryLevel =
  | 'debug'
  | 'info'
  | 'warning'
  | 'error';

export interface BootstrapTelemetryEvent {
  readonly id: string;
  readonly name: string;
  readonly level: BootstrapTelemetryLevel;
  readonly timestamp: number;
  readonly durationMilliseconds: number | null;
  readonly attributes:
    Readonly<Record<string, string | number | boolean>>;
}

export interface BootstrapTelemetrySink {
  publish(
    event: BootstrapTelemetryEvent,
  ): void | Promise<void>;
}

type BootstrapTelemetryListener = (
  event: BootstrapTelemetryEvent,
) => void;

function createId(): string {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID();
  }

  return `qcq-bootstrap-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

export class BootstrapTelemetry {
  readonly #events:
    BootstrapTelemetryEvent[] = [];
  readonly #listeners =
    new Set<BootstrapTelemetryListener>();
  readonly #maximumEvents: number;
  #sink: BootstrapTelemetrySink | null;

  public constructor(
    maximumEvents = 256,
    sink: BootstrapTelemetrySink | null = null,
  ) {
    if (
      !Number.isSafeInteger(maximumEvents) ||
      maximumEvents < 16
    ) {
      throw new Error(
        'Bootstrap telemetry capacity must be an integer >= 16.',
      );
    }
    this.#maximumEvents = maximumEvents;
    this.#sink = sink;
  }

  public setSink(
    sink: BootstrapTelemetrySink | null,
  ): void {
    this.#sink = sink;
  }

  public subscribe(
    listener: BootstrapTelemetryListener,
  ): () => void {
    this.#listeners.add(listener);
    return () => {
      this.#listeners.delete(listener);
    };
  }

  public record(
    input: Omit<
      BootstrapTelemetryEvent,
      'id' | 'timestamp'
    > & {
      readonly timestamp?: number;
    },
  ): BootstrapTelemetryEvent {
    const event =
      Object.freeze({
        id: createId(),
        name: input.name,
        level: input.level,
        timestamp:
          input.timestamp ?? Date.now(),
        durationMilliseconds:
          input.durationMilliseconds,
        attributes: Object.freeze({
          ...input.attributes,
        }),
      });

    this.#events.push(event);
    if (
      this.#events.length >
      this.#maximumEvents
    ) {
      this.#events.splice(
        0,
        this.#events.length -
          this.#maximumEvents,
      );
    }

    for (
      const listener of this.#listeners
    ) {
      listener(event);
    }

    if (this.#sink !== null) {
      void Promise.resolve(
        this.#sink.publish(event),
      ).catch(() => {
        // Telemetry cannot destabilize application bootstrap.
      });
    }

    return event;
  }

  public list():
    readonly BootstrapTelemetryEvent[] {
    return Object.freeze([
      ...this.#events,
    ]);
  }
}
