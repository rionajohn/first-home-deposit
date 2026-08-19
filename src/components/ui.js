/**
 * Shared building blocks used by 2+ screens (SPEC.md file structure rule —
 * introduced here rather than speculatively, because the app bar, action
 * bar, info banner, flag row and provenance caption all appear on every
 * screen built this session and are already specified as recurring
 * components in build-spec.md's frame descriptions).
 *
 * Every function here returns an HTML string. None of them binds an event
 * listener — the screen module that renders the string queries for its
 * `data-action` after inserting it into the DOM and wires the listener
 * itself, the same pattern src/screens/home.js already established.
 */

/**
 * App bar: a left icon (back arrow, close/X, or none), a centred title, and
 * an empty right cell to keep the title visually centred. `left` is null on
 * frame 01 (bottom-nav root screen, no app bar back per build-spec.md's
 * "Assumed" row), 'back' or 'close' everywhere else depending on which icon
 * the reference PNG for that frame actually draws.
 *
 * The hit target is widened to the 48px minimum via padding on the button
 * itself; the icon glyph stays visually centred at the same position the
 * Figma 44px-wide cell draws it at, so this is a touch-target compliance
 * change, not a visual one.
 */
export function appBarHTML({ title, left = null, appBarLabels }) {
  const iconMarkup = left === 'back'
    ? '<img class="app-bar__icon" src="assets/icons/back.svg" alt="" width="24" height="24" />'
    : left === 'close'
      ? '<img class="app-bar__icon" src="assets/icons/close.svg" alt="" width="20" height="20" />'
      : '';
  const label = left === 'close' ? appBarLabels?.closeLabel : appBarLabels?.backLabel;

  const leftCell = left
    ? `<button type="button" class="app-bar__cell app-bar__cell--action" data-action="app-bar-back" aria-label="${label}">${iconMarkup}</button>`
    : '<div class="app-bar__cell"></div>';

  return `
    <div class="app-bar">
      ${leftCell}
      <p class="app-bar__title">${title}</p>
      <div class="app-bar__cell"></div>
    </div>
  `;
}

/** Wires the app bar's left button, if the screen rendered one. No-op if this screen's app bar has no back control. */
export function bindAppBarBack(container, onBack) {
  const btn = container.querySelector('[data-action="app-bar-back"]');
  if (btn) btn.addEventListener('click', onBack);
}

/**
 * Bottom action bar: a primary button, and an optional secondary action
 * that's either a bordered button (frame 04) or a plain text link (frames
 * 02, 03). `secondary` is omitted entirely on screens with only one action.
 */
export function actionBarHTML({ primaryLabel, primaryAction, secondaryLabel, secondaryAction, secondaryStyle = 'text', primaryDisabled = false }) {
  const secondaryMarkup = secondaryLabel
    ? secondaryStyle === 'button'
      ? `<button type="button" class="button button--secondary" data-action="${secondaryAction}">${secondaryLabel}</button>`
      : `<button type="button" class="text-action" data-action="${secondaryAction}">${secondaryLabel}</button>`
    : '';

  return `
    <div class="action-bar">
      <button type="button" class="button button--primary" data-action="${primaryAction}" ${primaryDisabled ? 'disabled' : ''}>${primaryLabel}</button>
      ${secondaryMarkup}
    </div>
  `;
}

export function infoBannerHTML(text) {
  return `
    <div class="info-banner">
      <img class="info-banner__icon" src="assets/icons/info.svg" alt="" width="20" height="20" />
      <p class="info-banner__text">${text}</p>
    </div>
  `;
}

/**
 * DUAA 2025 automated-decision pushback control (SPEC.md's regulatory
 * anchor map). Opens the Feedback / Report sheet — out of scope to build in
 * full this session (no destination screen yet), so it's wired as a no-op
 * data-action a later stage can pick up rather than a dead link.
 */
export function flagRowHTML(label) {
  return `
    <button type="button" class="flag-row" data-action="report-issue">
      <img class="flag-row__icon" src="assets/icons/flag.svg" alt="" width="20" height="20" />
      <span class="flag-row__label">${label}</span>
      <img class="flag-row__chevron" src="assets/icons/chevron-right.svg" alt="" width="20" height="20" />
    </button>
  `;
}

/** DECISIONS.md D5: every figure's provenance caption, in its own row under the figure. */
export function provenanceCaptionHTML(text) {
  return `<p class="provenance-caption">${text}</p>`;
}
