import { isField, CharNudge, STYLE_ID } from './view.js';

export { CharNudge, STYLE_ID };
export const version = '0.1.0';

function fail(message) {
  throw new Error(message);
}

function documentOrFail() {
  if (typeof document === 'undefined') fail('CharNudge runs in a browser document');
  return document;
}

/**
 * Count one text field and show used/limit.
 * A later call on the same field updates the limit. It does not add a second badge.
 */
export function charnudge(element, options = {}) {
  documentOrFail();
  if (!isField(element)) fail('CharNudge needs a text field');
  return new CharNudge(element, options);
}

/** Bind every `[data-charnudge]` text field. One bad limit or nudge is reported and skipped. */
export function start(root = globalThis.document) {
  if (!root?.querySelectorAll) fail('CharNudge runs in a browser document');
  root.querySelectorAll('[data-charnudge]').forEach((node) => {
    if (!isField(node)) return;
    const options = {};
    if (node.hasAttribute('data-charnudge-max')) options.max = node.getAttribute('data-charnudge-max');
    if (node.hasAttribute('data-charnudge-warn')) options.warn = node.getAttribute('data-charnudge-warn');
    try {
      charnudge(node, options);
    } catch (error) {
      globalThis.console?.error?.(error);
    }
  });
}

export default CharNudge;

if (typeof window !== 'undefined') window.CharNudge = CharNudge;
