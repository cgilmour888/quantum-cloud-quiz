export type AccessibilityRequirementLevel =
  | 'required'
  | 'recommended';

export interface AccessibilityRequirement {
  readonly id: string;
  readonly name: string;
  readonly level: AccessibilityRequirementLevel;
  readonly wcagReference: string;
  readonly description: string;
}

export class AccessibilityRegistry {
  readonly #requirements =
    new Map<
      string,
      AccessibilityRequirement
    >();
  #sealed = false;

  public register(
    requirement: AccessibilityRequirement,
  ): this {
    if (this.#sealed) {
      throw new Error(
        'AccessibilityRegistry is sealed.',
      );
    }
    if (
      this.#requirements.has(requirement.id)
    ) {
      throw new Error(
        `Accessibility requirement "${requirement.id}" is already registered.`,
      );
    }

    this.#requirements.set(
      requirement.id,
      Object.freeze({
        ...requirement,
      }),
    );
    return this;
  }

  public list():
    readonly AccessibilityRequirement[] {
    return Object.freeze([
      ...this.#requirements.values(),
    ]);
  }

  public seal(): this {
    this.#sealed = true;
    return this;
  }

  public get size(): number {
    return this.#requirements.size;
  }
}

export function createFoundationAccessibilityRegistry():
  AccessibilityRegistry {
  return new AccessibilityRegistry()
    .register({
      id: 'document-language',
      name: 'Document language',
      level: 'required',
      wcagReference: '3.1.1',
      description:
        'The document root declares a non-empty language.',
    })
    .register({
      id: 'primary-main',
      name: 'Primary landmark',
      level: 'required',
      wcagReference: '1.3.1',
      description:
        'Exactly one primary main landmark is present on the active route.',
    })
    .register({
      id: 'skip-link',
      name: 'Skip navigation',
      level: 'required',
      wcagReference: '2.4.1',
      description:
        'A keyboard-accessible skip link targets the primary content.',
    })
    .register({
      id: 'visible-focus',
      name: 'Visible focus',
      level: 'required',
      wcagReference: '2.4.7',
      description:
        'Interactive controls preserve visible keyboard focus.',
    })
    .register({
      id: 'reduced-motion',
      name: 'Reduced motion',
      level: 'required',
      wcagReference: '2.3.3',
      description:
        'Decorative motion respects the user reduced-motion preference.',
    })
    .register({
      id: 'target-size',
      name: 'Target size',
      level: 'recommended',
      wcagReference: '2.5.8',
      description:
        'Foundation controls target at least 44 CSS pixels where practical.',
    })
    .seal();
}
