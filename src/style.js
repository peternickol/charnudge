export const STYLE_ID = 'charnudge-style';

export const CSS = `
.charnudge {
  --charnudge-badge: #ece7df;
  --charnudge-ink: #3c4048;
  --charnudge-warn: #ff5a45;
  --charnudge-on-warn: #101113;
  --charnudge-over: #9f1d16;
  --charnudge-on-over: #ffffff;
  position: relative;
  display: block;
  min-width: 0;
}
html[data-theme="dark"] .charnudge {
  --charnudge-badge: #2c3036;
  --charnudge-ink: #f3f1ed;
}
.charnudge-count {
  position: absolute;
  z-index: 1;
  right: 22px;
  bottom: 10px;
  min-width: 4.6rem;
  margin: 0;
  padding: 6px 10px;
  border-radius: 14px;
  background: var(--charnudge-badge);
  color: var(--charnudge-ink);
  font: 700 15px/1.1 inherit;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.03em;
  text-align: center;
  white-space: nowrap;
  pointer-events: none;
  user-select: none;
  box-shadow: 0 8px 18px rgba(40, 24, 16, 0.16);
}
.charnudge:has(> input) .charnudge-count {
  top: 50%;
  right: 8px;
  bottom: auto;
  transform: translateY(-50%);
}
.charnudge.is-warn .charnudge-count {
  background: var(--charnudge-warn);
  color: var(--charnudge-on-warn);
}
.charnudge.is-over .charnudge-count {
  background: var(--charnudge-over);
  color: var(--charnudge-on-over);
}
.charnudge > textarea.charnudge-field { padding-bottom: 2.6rem; }
.charnudge > input.charnudge-field { padding-right: var(--charnudge-pad, 6.2rem); }
.charnudge-status {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
`;
