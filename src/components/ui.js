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
import { formatDigits } from '../format.js';

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
 * Navigation / Form step header (frames 09, 09a, 09b, 10, 10b, 11 — the
 * deposit calculator's own step-by-step header, distinct from appBarHTML's
 * single-row app bar used everywhere else). A back button, a centred title,
 * a close button, and a "Step n of 3" row underneath. Introduced here
 * because 6 screens on this page share it exactly.
 */
export function formStepHeaderHTML({ title, step, appBarLabels }) {
  return `
    <div class="form-step-header">
      <div class="form-step-header__title-bar">
        <button type="button" class="form-step-header__cell form-step-header__cell--action" data-action="form-step-back" aria-label="${appBarLabels?.backLabel}">
          <img class="app-bar__icon" src="assets/icons/back.svg" alt="" width="24" height="24" />
        </button>
        <p class="form-step-header__title">${title}</p>
        <button type="button" class="form-step-header__cell form-step-header__cell--action" data-action="form-step-close" aria-label="${appBarLabels?.closeLabel}">
          <img class="app-bar__icon" src="assets/icons/close.svg" alt="" width="20" height="20" />
        </button>
      </div>
      <div class="form-step-header__step-row">
        <p class="form-step-header__step">${step}</p>
      </div>
    </div>
  `;
}

/** Wires the form step header's back and close buttons. */
export function bindFormStepHeader(container, { onBack, onClose }) {
  container.querySelector('[data-action="form-step-back"]').addEventListener('click', onBack);
  container.querySelector('[data-action="form-step-close"]').addEventListener('click', onClose);
}

/**
 * Inputs / Currency input (frames 09, 09a, 09b): a secondary label, a
 * bordered £-prefixed field, and a hint line beneath. `value` is the raw
 * number or null (09a's empty state, rendered as an empty field with a
 * placeholder-style hint rather than "£0").
 */
export function currencyInputHTML({ id, label, value, hint, ariaLabel }) {
  const digits = value === null || value === undefined || Number.isNaN(value) ? '' : formatDigits(value);
  return `
    <div class="currency-input">
      <p class="currency-input__label">${label}</p>
      <div class="currency-input__field">
        <div class="currency-input__gutter">£</div>
        <input class="currency-input__value" type="text" inputmode="numeric" data-role="${id}" value="${digits}" aria-label="${ariaLabel}" />
      </div>
      <p class="currency-input__hint">${hint}</p>
    </div>
  `;
}

/**
 * Inputs / Chip row (frames 09, 09a, 09b): a row of pill-shaped percentage
 * choices, one selected. `chips` is `[{ value, label }]`; `selected` is the
 * currently-chosen value or null (09a, before any selection).
 */
export function chipRowHTML({ chips, selected, action }) {
  return `
    <div class="chip-row">
      ${chips.map((chip) => `
        <button type="button" class="chip${chip.value === selected ? ' chip--selected' : ''}" data-action="${action}" data-value="${chip.value}" aria-pressed="${chip.value === selected}">${chip.label}</button>
      `).join('')}
    </div>
  `;
}

/**
 * Content / Option comparison card (frames 09, 09b): "What each one means"
 * — a header and up to 3 option-rows (amount, sub-label, technical figure),
 * plus the shared inline info link at the bottom.
 */
export function optionComparisonCardHTML({ headerText, rows, infoLinkLabel, infoLinkAction }) {
  return `
    <div class="card option-comparison-card">
      <p class="section-heading">${headerText}</p>
      ${rows.map((row) => `
        <div class="option-comparison-card__row">
          <div class="option-comparison-card__left">
            <p class="option-comparison-card__amount">${row.amount}</p>
            <p class="option-comparison-card__sublabel">${row.sublabel}</p>
          </div>
          <p class="option-comparison-card__technical">${row.technical}</p>
        </div>
      `).join('')}
      ${infoLinkHTML({ label: infoLinkLabel, action: infoLinkAction })}
    </div>
  `;
}

/**
 * Inputs / Review row (frames 10, 10b, 11): a label, a value, a provenance
 * caption, and a "Change" link. Reused both inside the small "filled-in
 * details" card (10, 10b) and the full-width review list (11) — same shape
 * in both places, just a different container around it.
 */
export function reviewRowHTML({ label, value, caption, changeLabel, changeAction }) {
  return `
    <div class="review-row">
      <div class="review-row__content">
        <p class="review-row__label">${label}</p>
        <p class="review-row__value">${value}</p>
        ${caption ? `<p class="review-row__caption">${caption}</p>` : ''}
      </div>
      ${changeLabel ? `<button type="button" class="review-row__change" data-action="${changeAction}">${changeLabel}</button>` : ''}
    </div>
  `;
}

/**
 * Inputs / Segmented control (frames 10, 10b): two-option toggle switching
 * `solveFor` between 'date' (set a monthly amount, solve the date) and
 * 'amount' (set a target date, solve the monthly amount) — build-spec.md
 * section 2's own naming for the state variable.
 */
export function segmentedControlHTML({ options, selected, action }) {
  return `
    <div class="segmented-control">
      ${options.map((opt) => `
        <button type="button" class="segmented-control__segment${opt.value === selected ? ' segmented-control__segment--selected' : ''}" data-action="${action}" data-value="${opt.value}" aria-pressed="${opt.value === selected}">${opt.label}</button>
      `).join('')}
    </div>
  `;
}

/**
 * Input / Date stepper (frame 10b): a month control and a year control,
 * each with an up/down pair, plus a hint line beneath.
 */
export function dateStepperHTML({ monthLabel, yearLabel, hint, monthAction, yearAction, monthAriaLabel, yearAriaLabel, increaseLabel, decreaseLabel }) {
  function control({ value, upAction, downAction, ariaLabel }) {
    return `
      <div class="date-stepper__control">
        <button type="button" class="date-stepper__step" data-action="${upAction}" aria-label="${increaseLabel} ${ariaLabel}">
          <img src="assets/icons/chevron-up.svg" alt="" width="12" height="12" />
        </button>
        <p class="date-stepper__value">${value}</p>
        <button type="button" class="date-stepper__step date-stepper__step--down" data-action="${downAction}" aria-label="${decreaseLabel} ${ariaLabel}">
          <img src="assets/icons/chevron-up.svg" alt="" width="12" height="12" />
        </button>
      </div>
    `;
  }
  return `
    <div class="date-stepper">
      <div class="date-stepper__row">
        ${control({ value: monthLabel, upAction: `${monthAction}-up`, downAction: `${monthAction}-down`, ariaLabel: monthAriaLabel })}
        ${control({ value: yearLabel, upAction: `${yearAction}-up`, downAction: `${yearAction}-down`, ariaLabel: yearAriaLabel })}
      </div>
      <p class="date-stepper__hint">${hint}</p>
    </div>
  `;
}

/**
 * Content / Range figure (frame 12): a static low-to-high readout, a
 * caption, a track with a position marker (where the goal sits within the
 * range), and a label under the track. Not interactive — Figma's own
 * component description: "For interactive range selection, use Input /
 * Value slider."
 */
export function rangeFigureHTML({ lowText, highText, caption, markerPct, trackLabel }) {
  const clampedPct = Math.max(0, Math.min(100, markerPct));
  return `
    <div class="range-figure">
      <div class="range-figure__readout">
        <p class="range-figure__value">${lowText}</p>
        <p class="range-figure__to">-</p>
        <p class="range-figure__value">${highText}</p>
      </div>
      <p class="range-figure__caption">${caption}</p>
      <div class="range-figure__track">
        <div class="range-figure__fill" style="width:${clampedPct}%"></div>
        <div class="range-figure__marker" style="left:${clampedPct}%"></div>
      </div>
      <p class="value-slider__caption">${trackLabel}</p>
    </div>
  `;
}

/**
 * Data viz / Growth chart (frame 12): a bar chart projecting saved balance
 * over the next 5 years at two contribution rates (monthly-low/high),
 * against three horizontal threshold lines (one per deposit-pct option).
 * `thresholds` is `[{ label, pct }]` (0-100, position from the top);
 * `points` is `[{ label, lowPct, highPct }]` (0-100 bar heights, one point
 * per x-axis tick) — all percentages computed by the caller from model
 * figures, this function only renders.
 */
export function growthChartHTML({ thresholds, points, xAxisLabels, legend, yTop, yBottom }) {
  return `
    <div class="growth-chart">
      <div class="growth-chart__plot">
        <div class="growth-chart__baseline"></div>
        ${thresholds.map((t) => `
          <div class="growth-chart__threshold-line" style="bottom:${t.pct}%"></div>
          <p class="growth-chart__threshold-label" style="bottom:${t.pct}%">${t.label}</p>
        `).join('')}
        <p class="growth-chart__y-label growth-chart__y-label--top">${yTop}</p>
        <p class="growth-chart__y-label growth-chart__y-label--bottom">${yBottom}</p>
        <div class="growth-chart__bars">
          ${points.map((p) => `
            <div class="growth-chart__bar-group" aria-label="${p.label}">
              <div class="growth-chart__bar growth-chart__bar--high" style="height:${p.highPct - p.lowPct}%"></div>
              <div class="growth-chart__bar growth-chart__bar--low" style="height:${p.lowPct}%"></div>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="growth-chart__x-axis">
        ${xAxisLabels.map((l) => `<p>${l}</p>`).join('')}
      </div>
      <div class="growth-chart__legend">
        ${legend.map((l) => `
          <div class="growth-chart__legend-row">
            <span class="growth-chart__swatch"></span>
            <p>${l}</p>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

/**
 * Regulatory / Risk warning (frames 13, 15, 16): a bordered card with a
 * warning-triangle icon and body text. Distinct from `.warning-banner`
 * (DECISIONS.md D7's red error-state banner) — this is a neutral, always-on
 * regulatory/informational box (both the MCOB 3A repossession warning and
 * frame 13's "these are typical market ranges, not rates we're offering
 * you" note use this exact same visual wrapper in the reference PNGs).
 */
export function riskWarningHTML(text) {
  return `
    <div class="risk-warning-card">
      <img class="risk-warning-card__icon" src="assets/icons/warning.svg" alt="" width="20" height="20" />
      <p class="risk-warning-card__text">${text}</p>
    </div>
  `;
}

/**
 * Content / Progress bar (frames 15, 16): a filled track toward
 * deposit-target, with a fixed marker at the checkpoint position and a label
 * naming what the marker is.
 */
export function progressBarHTML({ fillPct, markerPct, label }) {
  const clampedFill = Math.max(0, Math.min(100, fillPct));
  const clampedMarker = Math.max(0, Math.min(100, markerPct));
  return `
    <div class="progress-bar">
      <div class="progress-bar__track">
        <div class="progress-bar__fill" style="width:${clampedFill}%"></div>
        <div class="progress-bar__marker" style="left:${clampedMarker}%"></div>
      </div>
      <p class="progress-bar__label">${label}</p>
    </div>
  `;
}

/**
 * Content / Milestone tracker (frames 15, 16): a vertical stack of
 * milestones, each either 'complete' (filled star) or 'locked' (greyed
 * circle). `milestones` is `[{ title, body, state }]`.
 */
export function milestoneTrackerHTML(milestones) {
  return `
    <div class="milestone-tracker">
      ${milestones.map((m, i) => `
        ${i > 0 ? '<div class="milestone-row__divider"></div>' : ''}
        ${m.action ? `<button type="button" class="milestone-row milestone-row--${m.state}" data-action="${m.action}">` : `<div class="milestone-row milestone-row--${m.state}">`}
          <img class="milestone-row__icon" src="assets/icons/${m.state === 'complete' ? 'goal-star.svg' : 'goal-star-locked.svg'}" alt="" width="32" height="32" />
          <div class="milestone-row__content">
            <p class="milestone-row__title">${m.title}</p>
            <p class="milestone-row__body">${m.body}</p>
          </div>
        ${m.action ? '</button>' : '</div>'}
      `).join('')}
    </div>
  `;
}

/**
 * Content / Stat row (frames 15, 16's "This month" card): a label + value on
 * one line, a provenance caption on the next. Distinct from
 * `figureRowHTML`'s `trailing` mode, which has no caption line.
 */
export function statRowHTML({ label, value, caption }) {
  return `
    <div class="stat-row">
      <div class="stat-row__line">
        <p class="stat-row__label">${label}</p>
        <p class="stat-row__value">${value}</p>
      </div>
      <p class="stat-row__caption">${caption}</p>
    </div>
  `;
}

/**
 * Content / Rate band row (frames 15, 16's rates-card): a two-line label
 * (amount + "n% deposit") on the left, a rate range on the right, with an
 * optional highlight border for the row matching the participant's own
 * chosen deposit %.
 */
export function rateBandRowHTML({ label, sublabel, value, highlighted }) {
  return `
    <div class="rate-band-row${highlighted ? ' rate-band-row--highlighted' : ''}">
      <div class="rate-band-row__content">
        <p class="rate-band-row__label">${label}</p>
        <p class="rate-band-row__sublabel">${sublabel}</p>
      </div>
      <p class="rate-band-row__value">${value}</p>
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
