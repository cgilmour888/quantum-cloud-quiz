/**
 * Artifact ID: QCQ-TBL-053
 * Artifact Name: InteractionManifest
 * Artifact Purpose: Interaction governance manifest for keyboard, pointer, stylus, focus, selection, hover expansion, and answer submission.
 * Artifact Layer: QCQ-TBL — GOV
 * Artifact Dependencies: None
 * Artifact Dependents: QCQ-TBL-054, QCQ-TBL-055, QCQ-TBL-056, QCQ-TBL-010
 * Dependency Graph: InteractionManifest -> registry/policies/capabilities -> QuestionTablet
 * Repository Path: QCQ/frontend/src/tablet/interaction
 * Source File: InteractionManifest.ts
 */

export type InteractionActionId =
  | 'answer.select'
  | 'answer.submit'
  | 'question.expand'
  | 'answer.expand'
  | 'focus.next'
  | 'focus.previous';

export interface InteractionDescriptor {
  readonly id: InteractionActionId;
  readonly label: string;
  readonly required: boolean;
  readonly keyboard: readonly string[];
  readonly pointer: boolean;
  readonly stylus: boolean;
}

export const INTERACTION_MANIFEST = Object.freeze({
  artifactId: 'QCQ-TBL-053',
  schemaVersion: '1.0.0',
  registryCapacity: 500_000,
  actions: Object.freeze([
    Object.freeze({
      id: 'answer.select',
      label: 'Select answer',
      required: true,
      keyboard: Object.freeze(['Space', 'Enter']),
      pointer: true,
      stylus: true,
    }),
    Object.freeze({
      id: 'answer.submit',
      label: 'Submit answer',
      required: true,
      keyboard: Object.freeze(['Enter']),
      pointer: true,
      stylus: true,
    }),
    Object.freeze({
      id: 'question.expand',
      label: 'Expand question text',
      required: true,
      keyboard: Object.freeze(['Focus']),
      pointer: false,
      stylus: true,
    }),
    Object.freeze({
      id: 'answer.expand',
      label: 'Expand answer text',
      required: true,
      keyboard: Object.freeze(['Focus']),
      pointer: false,
      stylus: true,
    }),
    Object.freeze({
      id: 'focus.next',
      label: 'Move to next control',
      required: true,
      keyboard: Object.freeze(['Tab']),
      pointer: false,
      stylus: false,
    }),
    Object.freeze({
      id: 'focus.previous',
      label: 'Move to previous control',
      required: true,
      keyboard: Object.freeze(['Shift+Tab']),
      pointer: false,
      stylus: false,
    }),
  ] satisfies readonly InteractionDescriptor[]),
  invariants: Object.freeze([
    'No essential action is hover-only.',
    'Hover expansion is mirrored by keyboard focus expansion.',
    'Selection and submission remain separate operations.',
    'Disabled answers are not focusable.',
    'Interaction logic receives question state through explicit contracts.',
  ]),
});
