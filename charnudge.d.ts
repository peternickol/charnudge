export const version: string;
export const STYLE_ID: string;

/** `ok` is under the nudge. `warn` is near the limit. `over` is past it. */
export type CharNudgeState = 'ok' | 'warn' | 'over';

export interface CharNudgeOptions {
  /** Character limit. A maxlength on the field caps it. Defaults to maxlength, then 100. */
  max?: number;
  /** Fraction of the limit where the badge nudges. `0` waits until the field is over. */
  warn?: number;
  /** Called after each count, including the first one. */
  onChange?: (detail: CharNudgeDetail) => void;
}

export interface CharNudgeDetail {
  length: number;
  max: number;
  state: CharNudgeState;
}

export class CharNudge {
  constructor(element?: Element | null, options?: CharNudgeOptions);
  readonly ready: boolean;
  readonly element: HTMLInputElement | HTMLTextAreaElement | null;
  readonly el: HTMLElement | null;
  readonly max: number;
  readonly length: number;
  readonly state: CharNudgeState | '';
  /** Read the field again. Use this after a script sets the value. */
  refresh(): this;
  destroy(): void;
}

/** Count one text field. A later call updates that field's limit. */
export function charnudge(element: Element, options?: CharNudgeOptions): CharNudge;

/** Bind every `[data-charnudge]` text field. One bad limit or nudge is reported and skipped. */
export function start(root?: ParentNode): void;

export default CharNudge;
