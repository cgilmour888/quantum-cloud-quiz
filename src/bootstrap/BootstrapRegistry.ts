import {
  BOOTSTRAP_MANIFEST,
  type BootstrapPhase,
  type BootstrapStepDescriptor,
} from './BootstrapManifest';

export type BootstrapStepStatus =
  | 'passed'
  | 'failed'
  | 'skipped';

export interface BootstrapStepResult {
  readonly id: string;
  readonly status: BootstrapStepStatus;
  readonly startedAt: number;
  readonly completedAt: number;
  readonly durationMilliseconds: number;
  readonly message: string;
}

export interface BootstrapExecutionContext {
  readonly signal: AbortSignal;
  readonly now: () => number;
}

export type BootstrapStepExecutor = (
  context: BootstrapExecutionContext,
) => void | Promise<void>;

interface RegisteredBootstrapStep {
  readonly descriptor: BootstrapStepDescriptor;
  readonly execute: BootstrapStepExecutor;
}

export class BootstrapRegistry {
  readonly #steps =
    new Map<string, RegisteredBootstrapStep>();
  #sealed = false;

  public register(
    descriptor: BootstrapStepDescriptor,
    execute: BootstrapStepExecutor,
  ): this {
    if (this.#sealed) {
      throw new Error(
        'BootstrapRegistry is sealed.',
      );
    }
    if (
      this.#steps.size >=
      BOOTSTRAP_MANIFEST.maximumSteps
    ) {
      throw new Error(
        'BootstrapRegistry capacity exceeded.',
      );
    }
    if (this.#steps.has(descriptor.id)) {
      throw new Error(
        `Bootstrap step "${descriptor.id}" is already registered.`,
      );
    }
    if (
      descriptor.timeoutMilliseconds <= 0 ||
      !Number.isFinite(
        descriptor.timeoutMilliseconds,
      )
    ) {
      throw new Error(
        `Bootstrap step "${descriptor.id}" has an invalid timeout.`,
      );
    }

    this.#steps.set(
      descriptor.id,
      Object.freeze({
        descriptor: Object.freeze({
          ...descriptor,
          dependencies: Object.freeze([
            ...descriptor.dependencies,
          ]),
        }),
        execute,
      }),
    );
    return this;
  }

  public list(
    phase?: BootstrapPhase,
  ): readonly BootstrapStepDescriptor[] {
    const descriptors = [
      ...this.#steps.values(),
    ].map((entry) => entry.descriptor);

    return Object.freeze(
      phase === undefined
        ? descriptors
        : descriptors.filter(
            (descriptor) =>
              descriptor.phase === phase,
          ),
    );
  }

  public seal(): this {
    this.#sealed = true;
    return this;
  }

  public async executeAll(
    now: () => number = () => performance.now(),
  ): Promise<readonly BootstrapStepResult[]> {
    this.#sealed = true;

    const results =
      new Map<string, BootstrapStepResult>();

    for (
      const phase of BOOTSTRAP_MANIFEST.phases
    ) {
      for (
        const entry of this.#steps.values()
      ) {
        const { descriptor } = entry;
        if (descriptor.phase !== phase) {
          continue;
        }

        const failedDependency =
          descriptor.dependencies.find(
            (dependency) =>
              results.get(dependency)?.status !==
              'passed',
          );

        if (failedDependency !== undefined) {
          const timestamp = now();
          results.set(
            descriptor.id,
            Object.freeze({
              id: descriptor.id,
              status: 'skipped',
              startedAt: timestamp,
              completedAt: timestamp,
              durationMilliseconds: 0,
              message:
                `Dependency "${failedDependency}" did not pass.`,
            }),
          );
          continue;
        }

        const startedAt = now();
        const controller =
          new AbortController();
        let timeoutId:
          ReturnType<typeof setTimeout> | null =
          null;

        try {
          await Promise.race([
            Promise.resolve(
              entry.execute({
                signal: controller.signal,
                now,
              }),
            ),
            new Promise<never>(
              (_, reject) => {
                timeoutId = setTimeout(
                  () => {
                    controller.abort();
                    reject(
                      new Error(
                        `Bootstrap step "${descriptor.id}" exceeded ${descriptor.timeoutMilliseconds}ms.`,
                      ),
                    );
                  },
                  descriptor.timeoutMilliseconds,
                );
              },
            ),
          ]);

          const completedAt = now();
          results.set(
            descriptor.id,
            Object.freeze({
              id: descriptor.id,
              status: 'passed',
              startedAt,
              completedAt,
              durationMilliseconds:
                completedAt - startedAt,
              message: 'Bootstrap step passed.',
            }),
          );
        } catch (error) {
          const completedAt = now();
          results.set(
            descriptor.id,
            Object.freeze({
              id: descriptor.id,
              status: 'failed',
              startedAt,
              completedAt,
              durationMilliseconds:
                completedAt - startedAt,
              message:
                error instanceof Error
                  ? error.message
                  : 'Unknown bootstrap failure.',
            }),
          );

          if (
            descriptor.criticality ===
            'required'
          ) {
            return Object.freeze(
              [...results.values()],
            );
          }
        } finally {
          if (timeoutId !== null) {
            clearTimeout(timeoutId);
          }
        }
      }
    }

    return Object.freeze(
      [...results.values()],
    );
  }
}
