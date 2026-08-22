/**
 * Frame 33 — Prototype settings. Figma node 266:2775 (page "07 Prototype
 * controls"). Reference: reference/frames/33 Prototype settings.png.
 *
 * build-spec.md section 7's scenario controls, each backed directly by a
 * state.js field of the same name: theme, textSize, stage ("Journey stage")
 * and resultOutcome ("Mortgage in Principle outcome"). Section 7's fifth,
 * "Data", is gone: its three options were personalised, estimate and
 * general, and the last two went with the account-linking choice
 * (DECISIONS.md D28), leaving a control with one option that changed
 * nothing. This
 * screen is a live mirror of that state, not a form with its own defaults —
 * whichever option is highlighted is whatever the app's actual current
 * state already holds; nothing here forces a fallback selection.
 *
 * build-spec.md section 1's only navigation row for this frame: "Any toggle
 * -> Re-renders the current frame -> theme, textSize, mode, stage,
 * resultOutcome set globally." Every toggle below re-renders in place
 * (position.js's own toggle-disclosure pattern), it never pushes a new
 * route.
 *
 * The Figma node carries a designer annotation — "Facilitator only, not
 * part of the journey. Reached by a long press on the app bar." — but
 * SPEC.md's own end-to-end verification step (closed after GAPS.md, the
 * more recent and authoritative source per DECISIONS.md's own precedence
 * rule) instead specifies "`/settings` reachable only by typing the URL —
 * confirmed absent from every visible nav element." No long-press gesture
 * is wired here; adding one would mean touching every other screen's app
 * bar, which is outside this session's brief.
 *
 * No regulatory anchor applies (SPEC.md's anchor map has no row naming this
 * screen) and no Section 6 figure is shown, so no provenance caption
 * applies either — this screen sets test scenario state, it does not read
 * or derive a deposit-journey figure.
 */
import { appBarHTML, bindAppBarLeading, pillSegmentsHTML, rerenderInPlace } from '../components/ui.js';
import { CACHE_VERSION_FALLBACK } from '../cache-version.js';
import { applyScenarioClasses } from '../router.js';
import { chevronRight } from '../icons.js';

export const anchors = [];

function fill(template, values) {
  return Object.entries(values).reduce((s, [k, v]) => s.replace(`{${k}}`, v), template);
}

async function readLiveCacheVersion() {
  if (!('caches' in window)) return null;
  try {
    const names = await caches.keys();
    const shellCache = names.find((name) => name.startsWith('yfh-shell-'));
    return shellCache ? shellCache.slice('yfh-shell-'.length) : null;
  } catch {
    return null;
  }
}

function controlHTML({ label, options, selected, action }) {
  return `
    <div class="settings-control">
      <p class="settings-control__label">${label}</p>
      ${pillSegmentsHTML({ options, selected, action })}
    </div>
  `;
}

export function render(container, ctx) {
  const { state, setState, content } = ctx;
  const c = content['/settings'];

  // Frame 33 inverts the app's usual page/card contrast: a white page (the
  // rest of the app's cards sit on a grey page, --color-bg) with three grey
  // grouping cards (--color-bg reused as the muted card fill — see
  // .card--muted and .settings-screen in components.css). router.js resets
  // this class on every hash-driven navigation so it never leaks onto
  // another route.
  container.classList.add('settings-screen');
  // router.js applies this on every hash-driven navigation; a text-size
  // toggle here re-renders in place (bypassing router.js), so this screen
  // has to reapply it itself for the change to show immediately rather
  // than on the next navigation.
  applyScenarioClasses(container, state);

  container.innerHTML = `
    ${appBarHTML({ title: c.appBarTitle, left: 'back', appBarLabels: content.shared.appBar })}
    <main class="screen-content" role="main">
      <h2 class="screen-title">${c.headline}</h2>
      <p class="entry-card__body">${c.body}</p>

      <div class="card card--muted settings-card">
        <p class="settings-card__header">${c.appearanceHeader}</p>
        ${controlHTML({ label: c.themeLabel, options: c.themeOptions, selected: state.theme, action: 'set-theme' })}
        ${controlHTML({ label: c.textSizeLabel, options: c.textSizeOptions, selected: state.textSize, action: 'set-text-size' })}
      </div>

      <div class="card card--muted settings-card">
        <p class="settings-card__header">${c.participantHeader}</p>
        ${controlHTML({ label: c.journeyLabel, options: c.journeyOptions, selected: state.stage, action: 'set-stage' })}
        ${controlHTML({ label: c.outcomeLabel, options: c.outcomeOptions, selected: state.resultOutcome, action: 'set-outcome' })}
      </div>

      <div class="card card--muted settings-card">
        <p class="settings-card__header">${c.dataSourceHeader}</p>
        <p class="settings-control__label">${content.shared.dataSource}</p>
      </div>

      <div class="card card--muted settings-card">
        <p class="settings-card__header">${c.resetHeader}</p>
        <button type="button" class="list-row list-row--plain" data-action="reset-progress">
          <span class="list-row__label">${c.resetRowLabel}</span>
          ${chevronRight({ size: 'body', className: 'list-row__chevron' })}
        </button>
      </div>

      <div class="settings-footer">
        <p class="settings-footer__text" data-role="build-caption">${fill(c.buildCaptionTemplate, { version: CACHE_VERSION_FALLBACK })}</p>
      </div>
    </main>
  `;

  // The back chevron, not the close X. Frame 33 sits outside the participant
  // journey entirely, so the X's exit-to-`journeyEntryPoint` followed a value
  // no facilitator ever set. The chevron returns to whatever was on screen
  // before, which is also what a later hidden gesture in from the profile
  // screen will want, with no special case for it. See D32.
  bindAppBarLeading(container);

  function bindGroup(action, stateKey) {
    container.querySelectorAll(`[data-action="${action}"]`).forEach((btn) => {
      btn.addEventListener('click', () => {
        const next = setState({ [stateKey]: btn.dataset.value });
        rerenderInPlace(container, render, { ...ctx, state: next });
      });
    });
  }

  bindGroup('set-theme', 'theme');
  bindGroup('set-text-size', 'textSize');
  bindGroup('set-stage', 'stage');
  bindGroup('set-outcome', 'resultOutcome');

  // router.js's own '#/reset' route calls resetState() and navigates to
  // /home — the same reset() DECISIONS.md/state.js describes as "wired to
  // frame 33's 'Clear all progress and start again' action", reused here
  // rather than duplicated.
  container.querySelector('[data-action="reset-progress"]').addEventListener('click', () => {
    window.location.hash = '#/reset';
  });

  readLiveCacheVersion().then((version) => {
    if (!version) return;
    const el = container.querySelector('[data-role="build-caption"]');
    if (el) el.textContent = fill(c.buildCaptionTemplate, { version });
  });
}
