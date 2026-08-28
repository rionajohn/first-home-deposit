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
 * THREE OF THE FOUR CONTROLS SET ONE KEY. "Journey stage" sets a key AND the
 * session state that stage means: a stage is a set-up, so it writes what the
 * deposit calculator would have written rather than leaving a flag for screens
 * to re-interpret. The patch is built in src/stage.js, from a fresh
 * defaultState() and through the model, so a stage change is idempotent in both
 * directions and no derived figure is written by hand. See DECISIONS.md D45,
 * and D38 as amended for why this is not a second skip-ahead control.
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
 * confirmed absent from every visible nav element."
 *
 * AMENDED 28 August 2026 (DECISIONS.md D54). A long-press gesture now exists,
 * and the paragraph below it replaces was wrong on its own terms. It read:
 * "adding one would mean touching every other screen's app bar." Re-costed
 * against the code, all 17 screens that render `appBarHTML` already call the
 * shared `bindAppBarLeading`, so one edit would have covered them - but it
 * would still have missed frame 01, which renders `.app-bar` inline, and the
 * three calculator steps, which draw a step header instead.
 *
 * The gesture that was built is NOT on the app bar. It is a ~700ms long press
 * on the DISABLED Profile tab (`src/facilitator-gesture.js`), which reaches 20
 * routes to the app bar's 19 - including those three calculator steps - and
 * carries no risk of colliding with the back control. The Figma annotation's
 * intent is met; its target is not, and D54 records why.
 *
 * No regulatory anchor applies (SPEC.md's anchor map has no row naming this
 * screen) and no Section 6 figure is shown, so no provenance caption
 * applies either — this screen sets test scenario state, it does not read
 * or derive a deposit-journey figure.
 */
import { appBarHTML, bindAppBarLeading, pillSegmentsHTML, rerenderInPlace } from '../components/ui.js';
import { BUILD_VERSION, SHELL_CACHE_PREFIX } from '../cache-version.js';
import { applyScenarioClasses } from '../router.js';
import { stagePatch } from '../stage.js';
import { chevronRight } from '../icons.js';

export const anchors = [];

function fill(template, values) {
  return Object.entries(values).reduce((s, [k, v]) => s.replace(`{${k}}`, v), template);
}

/**
 * EVERY shell version currently in Cache Storage, not one of them.
 *
 * This used to be `readLiveCacheVersion()`, which took `names.find((name) =>
 * name.startsWith('yfh-shell-'))` and returned whichever key `caches.keys()`
 * happened to list first. Two keys coexist for exactly the window that matters
 * - between a new worker caching its shell and its `activate` deleting the old
 * one - so the one moment the caption had something useful to say was the one
 * moment it picked arbitrarily between two right answers.
 *
 * Returning the whole set removes the choice rather than making it better.
 * NOTHING HERE RANKS THEM: 'v9' and 'v10' do not compare correctly as strings
 * and parsing them into numbers would be a second place that knows how sw.js
 * names a build. The caller only asks which of these is NOT the running
 * version, which needs equality and nothing else. `sort()` is for a stable
 * reading order when more than one is waiting, not to choose a winner.
 */
async function readCachedVersions() {
  if (!('caches' in window)) return [];
  try {
    const names = await caches.keys();
    return names
      .filter((name) => name.startsWith(SHELL_CACHE_PREFIX))
      .map((name) => name.slice(SHELL_CACHE_PREFIX.length))
      .sort();
  } catch {
    return [];
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

      <div class="settings-footer" data-role="settings-footer">
        <p class="settings-footer__text" data-role="build-caption">${fill(c.buildCaptionTemplate, { version: BUILD_VERSION })}</p>
      </div>
    </main>
  `;

  // The back chevron, not the close X. Frame 33 sits outside the participant
  // journey entirely, so the X's exit-to-`journeyEntryPoint` followed a value
  // no facilitator ever set. The chevron returns to whatever was on screen
  // before, which is also what a later hidden gesture in from the profile
  // screen will want, with no special case for it. See D32.
  bindAppBarLeading(container);

  // `patchFor` is what makes one of these four controls do more than record
  // which pill is lit. Three of them are read at render time by whatever screen
  // cares (theme and textSize by `applyScenarioClasses`, resultOutcome by
  // frame 19b), so setting the key IS the whole effect. Journey stage is not
  // read by any screen and never will be: it describes a session's SET-UP, and
  // a set-up is a thing you write once, not a flag every screen re-interprets.
  // So it writes the state the deposit calculator would have written - see
  // src/stage.js, and DECISIONS.md D45.
  function bindGroup(action, stateKey, patchFor = () => ({})) {
    container.querySelectorAll(`[data-action="${action}"]`).forEach((btn) => {
      btn.addEventListener('click', () => {
        const value = btn.dataset.value;
        const next = setState({ [stateKey]: value, ...patchFor(value) });
        rerenderInPlace(container, render, { ...ctx, state: next });
      });
    });
  }

  bindGroup('set-theme', 'theme');
  bindGroup('set-text-size', 'textSize');
  bindGroup('set-stage', 'stage', stagePatch);
  bindGroup('set-outcome', 'resultOutcome');

  // router.js's own '#/reset' route calls resetState() and navigates to
  // /home — the same reset() DECISIONS.md/state.js describes as "wired to
  // frame 33's 'Clear all progress and start again' action", reused here
  // rather than duplicated.
  container.querySelector('[data-action="reset-progress"]').addEventListener('click', () => {
    window.location.hash = '#/reset';
  });

  // THE BUILD CAPTION ABOVE IS NEVER TOUCHED FROM HERE (DECISIONS.md D49). It
  // is rendered from `BUILD_VERSION`, which is compiled into these very
  // modules and therefore cannot disagree with the code reading it. What
  // follows only ever ADDS a second, labelled line.
  //
  // A cached version that is not the running one means a newer build is
  // downloaded and will take over on the next document load - the one fact the
  // old caption was reaching for and got backwards by reporting it as though
  // it were already running.
  readCachedVersions().then((versions) => {
    const waiting = versions.filter((version) => version !== BUILD_VERSION);
    if (waiting.length === 0) return;
    const footer = container.querySelector('[data-role="settings-footer"]');
    if (!footer) return;
    const line = document.createElement('p');
    line.className = 'settings-footer__text';
    line.dataset.role = 'cached-caption';
    line.textContent = fill(c.cachedBuildTemplate, { versions: waiting.join(', ') });
    footer.append(line);
  });
}
