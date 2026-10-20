import {
  characterLength,
  labelOf,
  nudgeText,
  resolveMax,
  stageOf,
  statusText,
} from './count.js';
import { settings } from './options.js';
import { CSS, STYLE_ID } from './style.js';

export { STYLE_ID };

const TEXT_TYPES = new Set(['', 'text', 'search', 'email', 'url', 'tel', 'password']);
const controllers = new WeakMap();
let sequence = 0;

export function isField(element) {
  if (!element || element.nodeType !== 1) return false;
  if (element.tagName === 'TEXTAREA') return true;
  if (element.tagName !== 'INPUT') return false;
  return TEXT_TYPES.has(String(element.type || '').toLowerCase());
}

function ensureStyle() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = CSS;
  document.head.appendChild(style);
}

function dropStyle() {
  if (document.querySelector('.charnudge')) return;
  document.getElementById(STYLE_ID)?.remove();
}

function callSafely(callback, detail) {
  if (typeof callback !== 'function') return;
  try {
    callback(detail);
  } catch (error) {
    globalThis.console?.error?.(error);
  }
}

export class CharNudge {
  constructor(element, options) {
    this.ready = false;
    this.element = null;
    this.el = null;
    this.countEl = null;
    this.statusEl = null;
    this.liveEl = null;
    this.max = 0;
    this.length = 0;
    this.state = '';
    this.options = settings();
    this.onInput = null;
    this.onReset = null;
    if (typeof document === 'undefined') return;
    if (!isField(element)) throw new Error('CharNudge needs a text field');
    const existing = controllers.get(element);
    if (existing?.ready) {
      existing.configure(options);
      return existing;
    }
    this.ready = true;
    this.element = element;
    this.configure(options);
    this.mount();
    controllers.set(element, this);
  }

  configure(options = {}) {
    this.options = settings(options, this.options);
    if (!this.element) return;
    this.max = resolveMax(this.element, this.options.max);
    if (this.el) this.refresh();
  }

  mount() {
    ensureStyle();
    const field = this.element;
    const wrap = document.createElement('div');
    wrap.className = 'charnudge';
    field.parentNode.insertBefore(wrap, field);
    wrap.append(field);
    field.classList.add('charnudge-field');

    const count = document.createElement('span');
    count.className = 'charnudge-count';
    count.setAttribute('aria-hidden', 'true');

    const status = document.createElement('span');
    status.className = 'charnudge-status';
    status.id = `charnudge-status-${++sequence}`;

    const live = document.createElement('span');
    live.className = 'charnudge-status';
    live.setAttribute('aria-live', 'polite');

    wrap.append(count, status, live);
    const described = field.getAttribute('aria-describedby');
    const ids = described ? described.split(/\s+/).filter(Boolean) : [];
    if (!ids.includes(status.id)) ids.push(status.id);
    field.setAttribute('aria-describedby', ids.join(' '));

    this.el = wrap;
    this.countEl = count;
    this.statusEl = status;
    this.liveEl = live;
    this.onInput = () => this.refresh();
    // Dispatch runs microtasks before the form actually clears.
    this.onReset = () => {
      window.setTimeout(() => {
        if (this.ready) this.refresh();
      }, 0);
    };
    field.addEventListener('input', this.onInput);
    field.form?.addEventListener('reset', this.onReset);
    this.refresh();
  }

  refresh() {
    if (!this.ready) return this;
    const length = characterLength(this.element.value);
    const state = stageOf(length, this.max, this.options.warn);
    this.length = length;
    this.countEl.textContent = labelOf(length, this.max);
    this.statusEl.textContent = statusText(length, this.max);
    this.el.classList.toggle('is-warn', state === 'warn');
    this.el.classList.toggle('is-over', state === 'over');
    if (state !== this.state) {
      this.state = state;
      this.liveEl.textContent = nudgeText(state);
    }
    this.fit();
    callSafely(this.options.onChange, { length, max: this.max, state });
    return this;
  }

  /** Keep the last characters clear of a one-line badge. */
  fit() {
    if (this.element.tagName !== 'INPUT') return;
    const width = this.countEl.getBoundingClientRect().width;
    if (width <= 0) return;
    this.el.style.setProperty('--charnudge-pad', `${Math.ceil(width) + 20}px`);
  }

  destroy() {
    if (!this.ready) return;
    const field = this.element;
    field.removeEventListener('input', this.onInput);
    field.form?.removeEventListener('reset', this.onReset);
    field.classList.remove('charnudge-field');
    const described = field.getAttribute('aria-describedby');
    if (described && this.statusEl) {
      const next = described.split(/\s+/).filter((id) => id && id !== this.statusEl.id);
      if (next.length) field.setAttribute('aria-describedby', next.join(' '));
      else field.removeAttribute('aria-describedby');
    }
    if (this.el?.parentNode) this.el.parentNode.insertBefore(field, this.el);
    this.el?.remove();
    this.el = null;
    this.countEl = null;
    this.statusEl = null;
    this.liveEl = null;
    this.ready = false;
    if (controllers.get(field) === this) controllers.delete(field);
    if (typeof document !== 'undefined') dropStyle();
  }
}
