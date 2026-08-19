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

/**
 * Disclosure / accordion (Figma "Content / Disclosure"): a header row (title
 * + chevron) that expands a content slot below it. Introduced here because
 * frames 05, 05b and 06 all reuse this exact pattern for "how we worked
 * this out" style breakdowns. `open` reflects state the caller owns (e.g.
 * state.breakdownOpen) — this function is a pure render, it does not track
 * its own open/closed state.
 */
export function disclosureHTML({ id, title, open, contentHtml }) {
  return `
    <div class="disclosure${open ? '' : ' disclosure--closed'}">
      <button type="button" class="disclosure__header" data-action="toggle-disclosure" data-disclosure-id="${id}" aria-expanded="${open}">
        <span class="disclosure__title">${title}</span>
        <img class="disclosure__chevron" src="assets/icons/chevron-up.svg" alt="" width="20" height="20" />
      </button>
      <div class="disclosure__content">${contentHtml}</div>
    </div>
  `;
}

/**
 * Data viz / Proportion rows: a labelled horizontal bar per part, each with
 * a "n% of what comes in" caption. `parts` is `[{ label, valueText, pct,
 * pctText }]` — the caller computes `pct`/`pctText` from model figures
 * (SPEC.md: no number hardcoded in a screen), this function only renders.
 */
export function proportionRowsHTML(parts) {
  return `
    <div class="proportion-rows">
      ${parts.map((p) => `
        <div class="proportion-row">
          <div class="proportion-row__label-row">
            <p class="proportion-row__label">${p.label}</p>
            <p class="proportion-row__value">${p.valueText}</p>
          </div>
          <div class="proportion-row__track"><div class="proportion-row__fill" style="width:${p.pct}%"></div></div>
          <p class="proportion-row__caption">${p.pctText}</p>
        </div>
      `).join('')}
    </div>
  `;
}

/**
 * Content / List row — the figure-presenting variant: a label, an optional
 * bold value beneath it, and an optional provenance/hint caption beneath
 * that (DECISIONS.md D5). Distinct from the plain nav `.list-row` above,
 * which is label + chevron only. `trailing` renders the inline single-line
 * shape instead ("Held in" / "Emergency fund pot") when a value sits beside
 * the label rather than stacked under it.
 */
export function figureRowHTML({ label, value, caption, trailing }) {
  if (trailing !== undefined) {
    return `
      <div class="figure-row figure-row--inline">
        <p class="figure-row__label">${label}</p>
        <p class="figure-row__trailing">${trailing}</p>
      </div>
    `;
  }
  return `
    <div class="figure-row">
      <div class="figure-row__content">
        <p class="figure-row__label">${label}</p>
        ${value !== undefined && value !== null ? `<div class="figure-row__value-row"><p class="figure-row__value">${value}</p></div>` : ''}
        ${caption ? `<div class="figure-row__caption-row"><p class="figure-row__caption">${caption}</p></div>` : ''}
      </div>
    </div>
  `;
}

/**
 * Comprehension / Assumptions link — an inline info-icon + underlined link,
 * distinct from consent-declined.js's full-width `.assumptions-link` (which
 * has no icon and is its own primary-looking control on frame 04). Reused
 * by frames 06 and 08 for "How did we work this out?" style links.
 */
export function infoLinkHTML({ label, action }) {
  return `
    <button type="button" class="info-link" data-action="${action}">
      <img class="info-link__icon" src="assets/icons/info.svg" alt="" width="16" height="16" />
      <span class="info-link__label">${label}</span>
    </button>
  `;
}

/**
 * Warning banner (DECISIONS.md D7 fallback component): the same shape as
 * infoBannerHTML but in the warning colour, for the "No frame drawn" error
 * variants (e.g. frame 05/05b's left-over error state).
 */
export function warningBannerHTML(text) {
  return `
    <div class="warning-banner">
      <img class="warning-banner__icon" src="assets/icons/info.svg" alt="" width="20" height="20" />
      <p class="warning-banner__text">${text}</p>
    </div>
  `;
}

/**
 * Empty-state card (DECISIONS.md D7 fallback component): for "No frame
 * drawn" empty variants (e.g. frame 06's "no accounts assigned"), composed
 * from the same card look as everything else rather than inventing new
 * visual design.
 */
export function emptyStateCardHTML({ title, body, ctaLabel, ctaAction }) {
  return `
    <div class="card empty-state-card">
      <p class="empty-state-card__title">${title}</p>
      <p class="empty-state-card__body">${body}</p>
      ${ctaLabel ? `<button type="button" class="button button--secondary" data-action="${ctaAction}">${ctaLabel}</button>` : ''}
    </div>
  `;
}

/**
 * Input / Figure: the large editable currency headline (frames 05/05b's
 * left-over figure). A styled `<input type="text">` rather than
 * `type="number"` so a leading "£" can sit inside the same underline as the
 * digits, matching the Figma component; `inputmode="numeric"` still gives
 * mobile participants a numeric keypad.
 */
export function figureInputHTML({ id, value, caption, ariaLabel }) {
  const digits = String(Math.round(value ?? 0));
  return `
    <div class="figure-input">
      <div class="figure-input__field">
        <span class="figure-input__currency" aria-hidden="true">£</span>
        <input class="figure-input__value" type="text" inputmode="numeric" data-role="${id}" value="${digits}" style="width:${digits.length + 1}ch" aria-label="${ariaLabel}" />
      </div>
      <p class="figure-input__caption">${caption}</p>
    </div>
  `;
}

/** Static (non-editable) counterpart to figureInputHTML — frame 06's deposit-saved headline. */
export function figureDisplayHTML({ value, caption }) {
  return `
    <div class="figure-input">
      <p class="figure-display">${value}</p>
      <p class="figure-input__caption">${caption}</p>
    </div>
  `;
}

/**
 * Transparency / How this works card: a title, an intro line, a stack of
 * label/value/caption rows, and a nav row into the fuller assumptions
 * screen. Built for frame 06 but written generically (rows as data) since
 * the Figma component name marks it as a design-system piece likely reused
 * by the assumptions/results screens later.
 */
export function howThisWorksCardHTML({ title, intro, rows, navLabel, navAction }) {
  return `
    <div class="card how-this-works-card">
      <p class="how-this-works-card__title">${title}</p>
      <p class="how-this-works-card__intro">${intro}</p>
      <div class="how-this-works-card__rows">
        ${rows.map((row) => `
          <div class="how-this-works-card__row">
            <p class="how-this-works-card__row-label">${row.label}</p>
            <p class="how-this-works-card__row-value">${row.value}</p>
            <p class="how-this-works-card__row-caption">${row.caption}</p>
          </div>
        `).join('')}
      </div>
      <button type="button" class="how-this-works-card__nav" data-action="${navAction}">
        <img class="info-link__icon" src="assets/icons/info.svg" alt="" width="20" height="20" />
        <span class="how-this-works-card__nav-label">${navLabel}</span>
        <img class="list-row__chevron" src="assets/icons/chevron-right.svg" alt="" width="20" height="20" />
      </button>
    </div>
  `;
}
