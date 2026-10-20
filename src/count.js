/** JavaScript string length, the same units as the maxlength attribute. */
export function characterLength(value) {
  return String(value ?? '').length;
}

export function requireLimit(value) {
  const text = String(value ?? '').trim();
  if (!/^[1-9]\d*$/.test(text)) {
    throw new Error('CharNudge needs a positive whole-number limit');
  }
  return Number(text);
}

/**
 * Use the requested limit, the field's maxlength, or 100.
 * When both limits exist, the badge uses the smaller one. The field cannot hold more than maxlength.
 */
export function resolveMax(element, requested) {
  let limit = null;
  if (requested != null && String(requested).trim() !== '') limit = requireLimit(requested);
  const attr = element?.getAttribute?.('maxlength');
  let cap = null;
  if (attr != null && String(attr).trim() !== '') cap = requireLimit(attr);
  if (limit != null && cap != null) return Math.min(limit, cap);
  return limit ?? cap ?? 100;
}

/** `warn` is a fraction of the limit. `0` waits until the field is over. */
export function requireWarn(value) {
  if (value == null || value === '') return 0.9;
  const number = typeof value === 'number' ? value : Number(String(value).trim());
  if (!Number.isFinite(number) || number < 0 || number > 1) {
    throw new Error('CharNudge warn is a fraction from 0 to 1');
  }
  return number;
}

export function stageOf(length, max, warn) {
  if (length > max) return 'over';
  if (warn > 0 && length >= Math.ceil(max * warn)) return 'warn';
  return 'ok';
}

export function labelOf(length, max) {
  return `${length}/${max}`;
}

export function statusText(length, max) {
  const noun = max === 1 ? 'character' : 'characters';
  return `${length} of ${max} ${noun}`;
}

/** Spoken once when the field crosses into a stage. The exact count stays on the field. */
export function nudgeText(state) {
  if (state === 'over') return 'Over the character limit';
  if (state === 'warn') return 'Near the character limit';
  return '';
}
