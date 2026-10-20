<p align="center">
  <img src="docs/logo.png" alt="CharNudge" width="250">
</p>

<h1 align="center">CharNudge</h1>

<p align="center">
  Dependency-free character counter for the browser.<br>
  MIT licensed. No build step. No runtime dependencies.
</p>

<p align="center">
  <a href="https://peternickol.github.io/charnudge/">Live demo</a>
  &nbsp;·&nbsp;
  <a href="#install">Install</a>
  &nbsp;·&nbsp;
  <a href="#quick-start">Quick start</a>
  &nbsp;·&nbsp;
  <a href="#count">Count</a>
  &nbsp;·&nbsp;
  <a href="#options">Options</a>
  &nbsp;·&nbsp;
  <a href="#license">License</a>
</p>

CharNudge shows how many characters a text field has used against its limit. The badge stays quiet, then turns coral as the limit gets close. It does not stop typing. A `maxlength` attribute still does, because that belongs to the field.

Mark a field with `data-charnudge` and call `start()`. Types ship in `charnudge.d.ts`.

## Install

The package entry is `src/index.js`. Install from a checkout of this repository:

```bash
npm install /path/to/charnudge
```

```js
import { charnudge } from 'charnudge';
```

A page can import the module directly. Serve the page over HTTP. Module imports do not run from a `file://` address.

```html
<label>
  Note
  <textarea data-charnudge data-charnudge-max="1024"></textarea>
</label>
<script type="module">
  import { start } from './src/index.js';

  start();
</script>
```

The demo is in this repository at [`demo/index.html`](demo/index.html).

```bash
npm run demo
```

Then open `http://127.0.0.1:4176/demo/`.

## Quick start

`charnudge()` counts one field and returns the controller. `start()` does that for every `[data-charnudge]` text field. A later call on the same field changes the limit. It does not add a second badge.

```js
import { charnudge, start } from 'charnudge';

const note = document.querySelector('#note');
const counter = charnudge(note, { max: 1024 });

counter.refresh();
start();
```

`new CharNudge(element, options)` is the same controller. In the browser that constructor is also `window.CharNudge`.

```js
import { CharNudge } from 'charnudge';

const counter = new CharNudge(document.querySelector('#note'), { max: 100 });
counter.destroy();
```

`start()` skips anything that is not a textarea or a text-like input. `charnudge()` throws on those. Checkboxes, file inputs, and buttons are not counted. A bad limit or nudge on one marked field is reported and skipped. The other fields still count.

## Count

The badge reads `42/100`: characters used, then the limit. The length is the JavaScript string length, which is the same unit the `maxlength` attribute uses. An emoji can count as more than one.

| Length | Badge | Stage |
| --- | --- | --- |
| Under the nudge | Quiet | `ok` |
| At the nudge, through the limit | Coral | `warn` |
| Past the limit | Strong | `over` |

The nudge starts at 90% of the limit, rounded up. `warn: 0` stays quiet until the field is past the limit. `warn: 1` waits until the limit itself.

The badge uses `max` when that option is set. If the field also has `maxlength`, the badge uses the smaller of the two, because the field cannot hold more than its `maxlength`. A field with neither uses 100. `data-charnudge-max` is the same option for `start()`.

Typing, paste, cut, and a form reset all update the badge. Setting `element.value` from script does not, so call `refresh()` after that.

The field's accessible description is the exact count, such as `90 of 100 characters`. A second hidden note says `Near the character limit` or `Over the character limit` only when the stage changes, so a screen reader is not reading every key.

## Options

| Option | Default | What it does |
| --- | --- | --- |
| `max` | The field's `maxlength`, or `100` | Character limit. A positive whole number. A `maxlength` on the field caps it |
| `warn` | `0.9` | Fraction of the limit where the badge nudges. `0` waits until the field is over |
| `onChange` | | Called with `{ length, max, state }` after each count, including the first |

`data-charnudge-warn` is the `warn` option for `start()`.

Colors and type come from the page. Set these on `.charnudge` or on a parent: `--charnudge-badge`, `--charnudge-ink`, `--charnudge-warn`, `--charnudge-on-warn`, `--charnudge-over`, and `--charnudge-on-over`. `html[data-theme="dark"]` switches the quiet badge to the dark palette. The coral nudge stays. The injected stylesheet is `#charnudge-style`, and it is removed when the last counter is destroyed.

The badge sits in the bottom-right corner of a textarea, clear of the resize handle. On a one-line input it sits inside the right edge. The input's padding follows the badge width, so a longer count still clears the text. The coral nudge uses dark text.

## Remove

`destroy()` puts the field back where it was and drops the stylesheet when no counter remains.

| Name | What it does |
| --- | --- |
| `destroy()` | Remove the badge and the wrapper |
| `refresh()` | Read the field again |
| `length` | Characters currently in the field |
| `max` | The limit in use |
| `state` | `ok`, `warn`, or `over` |
| `ready` | False before the controller can use a document |
| `element` | The text field |
| `el` | The wrapper, or null after `destroy()` |

## Develop

```bash
npm test
```

Tests cover the limit, the nudge, and the option merge. `test/browser.test.js` loads the demo in a browser and types, passes the limit, and clears a field.

## License

CharNudge is [MIT licensed](LICENSE). Copyright (c) 2026 CharNudge contributors.

You can use it in a commercial product, modify it, and distribute it. The MIT grant includes sale. Copies and substantial portions keep the copyright notice and the permission notice from [LICENSE](LICENSE).

This repository is an original implementation. Those MIT terms are the license that applies to it.
