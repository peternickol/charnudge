import { requireWarn } from './count.js';

function callback(options, base, key) {
  if (typeof options[key] === 'function') return options[key];
  if (options[key] === undefined && typeof base[key] === 'function') return base[key];
  if (options[key] === undefined) return base[key] || null;
  return null;
}

/** Merge a partial options object over the previous settings. */
export function settings(options = {}, base = {}) {
  return {
    max: options.max === undefined ? base.max : options.max,
    warn: requireWarn(options.warn === undefined ? base.warn : options.warn),
    onChange: callback(options, base, 'onChange'),
  };
}
