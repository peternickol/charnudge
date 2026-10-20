import assert from 'node:assert/strict';
import test from 'node:test';

import {
  characterLength,
  labelOf,
  nudgeText,
  requireLimit,
  requireWarn,
  resolveMax,
  stageOf,
  statusText,
} from '../src/count.js';
import { settings } from '../src/options.js';
import CharNudgeDefault, { CharNudge, STYLE_ID, charnudge, start, version } from '../src/index.js';

test('version and the public entry are stable', () => {
  assert.equal(version, '0.1.0');
  assert.equal(STYLE_ID, 'charnudge-style');
  assert.equal(typeof charnudge, 'function');
  assert.equal(typeof start, 'function');
  assert.equal(CharNudgeDefault, CharNudge);
  assert.equal(CharNudge.name, 'CharNudge');
});

test('charnudge refuses to run without a browser document', () => {
  assert.throws(() => charnudge(), /browser/);
  assert.throws(() => start(), /browser/);
  const offline = new CharNudge();
  assert.equal(offline.ready, false);
  assert.equal(offline.length, 0);
  assert.equal(offline.max, 0);
});

test('the count uses string length and prints used/limit', () => {
  assert.equal(characterLength(''), 0);
  assert.equal(characterLength('café'), 4);
  assert.equal(characterLength('👍'), 2);
  assert.equal(labelOf(42, 100), '42/100');
  assert.equal(statusText(0, 1), '0 of 1 character');
  assert.equal(statusText(42, 100), '42 of 100 characters');
  assert.equal(nudgeText('ok'), '');
  assert.equal(nudgeText('warn'), 'Near the character limit');
  assert.equal(nudgeText('over'), 'Over the character limit');
});

test('the badge nudges near the limit and names the overflow', () => {
  assert.equal(stageOf(89, 100, 0.9), 'ok');
  assert.equal(stageOf(90, 100, 0.9), 'warn');
  assert.equal(stageOf(100, 100, 0.9), 'warn');
  assert.equal(stageOf(101, 100, 0.9), 'over');
  assert.equal(stageOf(100, 100, 0), 'ok');
  assert.equal(stageOf(101, 100, 0), 'over');
  assert.equal(stageOf(99, 100, 1), 'ok');
  assert.equal(stageOf(100, 100, 1), 'warn');
  assert.equal(stageOf(0, 1, 0.9), 'ok');
  assert.equal(stageOf(1, 1, 0.9), 'warn');
});

test('the badge uses the smaller of the requested limit and maxlength', () => {
  const field = { getAttribute: () => '40' };
  assert.equal(resolveMax(field, 1024), 40);
  assert.equal(resolveMax(field, 20), 20);
  assert.equal(resolveMax(field, null), 40);
  assert.equal(resolveMax({ getAttribute: () => null }, 1024), 1024);
  assert.equal(resolveMax({ getAttribute: () => null }, undefined), 100);
  assert.equal(resolveMax({ getAttribute: () => '' }, ''), 100);
  assert.throws(() => resolveMax({ getAttribute: () => 'soon' }, 20), /positive/);
  assert.equal(requireLimit('1024'), 1024);
  assert.throws(() => requireLimit('0'), /positive/);
  assert.throws(() => requireLimit('10.5'), /positive/);
  assert.throws(() => requireLimit('-1'), /positive/);
  assert.equal(requireWarn(undefined), 0.9);
  assert.equal(requireWarn(0), 0);
  assert.equal(requireWarn('1'), 1);
  assert.throws(() => requireWarn(1.1), /fraction/);
  assert.throws(() => requireWarn(-0.1), /fraction/);
});

test('a later options object keeps the settings it does not replace', () => {
  const first = settings({ max: 1024, warn: 0.5, onChange: () => {} });
  const next = settings({ max: 40 }, first);
  assert.equal(next.max, 40);
  assert.equal(next.warn, 0.5);
  assert.equal(typeof next.onChange, 'function');
  const cleared = settings({ onChange: null }, next);
  assert.equal(cleared.onChange, null);
  assert.equal(cleared.max, 40);
});
