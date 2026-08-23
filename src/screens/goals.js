/**
 * /goals — the bank's own goals area.
 *
 * NOT PART OF "YOUR FIRST HOME", AND THE SCREEN SAYS SO BY WHAT IT OMITS.
 * It carries the bank's app-bar title ("Goals", not `config.name`), no
 * journey framing, no provenance captions, no flag row, no assumptions link
 * and no regulatory line. It is where the journey's "Not right now - save
 * for something else" branch lands: a real destination that belongs to the
 * surrounding bank app rather than a bounce back to frame 01. See
 * DECISIONS.md D21.
 *
 * The design system is the same one — same tokens, same `.card`, same tab
 * bar — because a bank does not change its design language between two of
 * its own screens. What marks it as outside the feature is the absence of
 * the feature's own furniture, not a different look.
 *
 * WHERE THE FIGURES COME FROM
 * `goalsByHorizon(effectiveAccounts(...))` — the same account list frames 03,
 * 03b, 05 and 06 read, through the same `effectiveAccounts` override pass, so
 * a 03b move is reflected here without this screen knowing frame 03b exists.
 * Each row shows that pot's own `balance` through `formatAccountBalance`.
 * A participant who saw "Holiday pot £420" on frame 03 sees £420 here because
 * it is the same field, not a second copy of the number.
 *
 * NO FIGURE ON THIS SCREEN IS COMPUTED. No targets, no progress bars, no
 * "on track for" — this screen presents no result, which is also why it
 * carries no regulatory anchor (see `anchors` below).
 */

import content from '../content.js';
import { appBarHTML, bindAppBarLeading, rerenderInPlace } from '../components/ui.js';
import { formatAccountBalance } from '../format.js';
import { effectiveAccounts, goalsByHorizon } from '../model/accounts.js';
import { chevronRight } from '../icons.js';
import { canSkipAhead, isSkippedAhead, skipAheadPatch, skipBackPatch } from '../skip-ahead.js';

/**
 * No regulatory anchor, deliberately.
 *
 * SPEC.md's anchor map puts the guidance-not-advice line on every screen that
 * presents a worked figure, and confirms it ABSENT from frame 01 — the bank's
 * home screen, which draws the feature's entry card and still carries no
 * guidance line, because an entry point is not guidance. /goals is the same
 * shape of screen: the bank's own area, listing balances it already holds,
 * with one card that leads into the feature. Nothing here is worked out, so
 * there is nothing to disclaim.
 *
 * The DUAA triad does not apply either: no automated decision is presented,
 * so there is nothing to push back on and no source to make visible beyond
 * the balances themselves.
 *
 * The guidance line begins at frame 08, on the far side of that card — which
 * is where the first computed figure a participant sees also begins.
 */
export const anchors = [];

// NO PER-ROW ICON. The only icon that fits a savings goal generically is the
// target glyph, which is also the Goals tab's own icon sitting a few hundred
// pixels below — four identical circles on one screen, carrying no
// information, since every row is the same kind of thing. The name and the
// amount are the row.
function goalRowHTML(account, savedLabel) {
  return `
    <div class="goals-item">
      <div class="goals-item__content">
        <p class="goals-item__name">${account.name}</p>
        <p class="goals-item__label">${savedLabel}</p>
      </div>
      <p class="goals-item__amount">${formatAccountBalance(account.balance)}</p>
    </div>
  `;
}

/**
 * The section's card-with-a-forward-action. TWO CALLERS, ONE FUNCTION, and
 * that is the point: the deposit calculator entry and the deposit tracker
 * entry are two things you can do with the same long-term goal, so they have
 * to read as siblings rather than as a card and a near-copy of it. Written
 * once so a change to the treatment cannot land on one and miss the other.
 */
function ctaCardHTML({ title, body, cta, action }) {
  return `
    <div class="card goals-cta-card">
      <h4 class="goals-cta-card__title">${title}</h4>
      <p class="goals-cta-card__body">${body}</p>
      <button type="button" class="goals-cta-card__action" data-action="${action}">
        <span class="goals-cta-card__action-label">${cta}</span>
        ${chevronRight({ size: 'body', className: 'list-row__chevron' })}
      </button>
    </div>
  `;
}

/**
 * THE SKIP-AHEAD CONTROL (src/skip-ahead.js, DECISIONS.md D38). A research
 * affordance, drawn here and on no other screen.
 *
 * WHY IT IS A RADIOGROUP AND NOT A SWITCH OR A BUTTON. It selects between two
 * named positions rather than turning a thing on, and both names are visible
 * at once, so a participant can read what they are moving between before they
 * move. A switch would announce "Further along, on", which says an action was
 * performed; two radios announce "Now, selected" / "Further along, selected",
 * which says where the session is. Reversible in one gesture either way, which
 * is the requirement the control exists to meet.
 *
 * IT IS FULLY IN THE ACCESSIBILITY TREE, unlike the facilitator gesture on
 * frame 10, because it is visible. A visible control that a keyboard or
 * screen-reader participant cannot reach or cannot hear the state of is a
 * different prototype for them than for everyone else, which would be a defect
 * in the instrument rather than a finding about the design.
 *
 * ROVING TABINDEX, per the ARIA radiogroup pattern: the group is one tab stop,
 * the selected option is the one that takes it, and the arrow keys move within
 * it. The alternative - two tab stops - would put a control the bank does not
 * have in the middle of the participant's tab order twice.
 *
 * THE UNAVAILABLE CASE stays rendered and stays focusable. Before a deposit
 * goal exists there is no checkpoint to skip to, so "Further along" carries
 * `aria-disabled` rather than `disabled`: a control that vanishes between two
 * visits to the same screen is harder to account for mid-session than one that
 * is present and says why it will not move.
 */
function skipAheadHTML({ c, position, available }) {
  const option = ({ value, label, selected, disabled }) => `
    <button
      type="button"
      class="skip-ahead__option${selected ? ' skip-ahead__option--selected' : ''}"
      role="radio"
      aria-checked="${selected}"
      ${disabled ? 'aria-disabled="true"' : ''}
      tabindex="${selected ? '0' : '-1'}"
      data-action="set-skip-ahead"
      data-value="${value}"
    >${label}</button>
  `;

  return `
    <section class="skip-ahead">
      <p class="skip-ahead__label" id="skip-ahead-label">${c.skipAheadLabel}</p>
      <div class="skip-ahead__options" role="radiogroup" aria-labelledby="skip-ahead-label" aria-describedby="skip-ahead-note">
        ${option({ value: 'now', label: c.skipAheadNowOption, selected: position === 'now', disabled: false })}
        ${option({ value: 'ahead', label: c.skipAheadAheadOption, selected: position === 'ahead', disabled: !available })}
      </div>
      <p class="skip-ahead__note" id="skip-ahead-note">${available ? c.skipAheadNote : c.skipAheadUnavailableNote}</p>
    </section>
  `;
}

function sectionHTML({ heading, caption, accounts, savedLabel, emptyBody, extraHTML = '' }) {
  const rows = accounts.length
    ? accounts.map((a) => goalRowHTML(a, savedLabel)).join('')
    : `<p class="goals-section__empty">${emptyBody}</p>`;

  return `
    <section class="goals-section">
      <div class="goals-section__header">
        <h3 class="section-heading">${heading}</h3>
        <p class="goals-section__caption">${caption}</p>
      </div>
      <div class="card goals-section__list">${rows}</div>
      ${extraHTML}
    </section>
  `;
}

export function render(container, ctx) {
  const { state, content: ctxContent } = ctx;
  const c = (ctxContent || content)['/goals'];

  const accounts = effectiveAccounts(state.accountAssignments, state.accountIncluded);
  const { short, long } = goalsByHorizon(accounts);

  // The two bridges into the feature. They sit under the long-term heading
  // because a house deposit is a long-term goal — the cards are part of that
  // section, not banners floating between two.
  //
  // ORDER. The calculator stays first because it is the one that has to have
  // happened: the tracker measures a goal against a target, and there is no
  // target until the calculator has produced one. Reading down, the section
  // asks "what would this take" and then "how is it going", which is the
  // order a participant meets them in anyway.
  const houseCardHTML = ctaCardHTML({
    title: c.houseCardTitle,
    body: c.houseCardBody,
    cta: c.houseCardCta,
    action: 'open-deposit-calculator',
  });

  // THE SECOND ROUTE TO `/tracker`, and deliberately not a different screen.
  // The Insights tab already resolves there (NAVIGABLE_TABS in
  // components/ui.js, DECISIONS.md D35); this is the goals area's own way in,
  // landing on the same route in the same state.
  //
  // It carries no guard of its own. `/tracker` guards on `checkpoint-amount`
  // and redirects a participant who has not set a goal into the calculator,
  // and that guard `replace()`s rather than pushes (D29), so the redirect
  // costs no back tap. Adding a second, earlier guard here would be a second
  // copy of one rule, and the Insights tab does not have one either — the two
  // routes must behave identically or they are not the same door.
  const trackerCardHTML = ctaCardHTML({
    title: c.trackerCardTitle,
    body: c.trackerCardBody,
    cta: c.trackerCardCta,
    action: 'open-deposit-tracker',
  });

  container.innerHTML = `
    ${appBarHTML({ title: c.appBarTitle, left: 'back', appBarLabels: content.shared.appBar })}
    <main class="screen-content goals-screen" role="main">
      <h2 class="screen-title">${c.headline}</h2>
      <p class="body-text-lg">${c.body}</p>

      ${sectionHTML({
        heading: c.shortTermHeading,
        caption: c.shortTermCaption,
        accounts: short,
        savedLabel: c.savedLabel,
        emptyBody: c.emptySectionBody,
      })}

      ${sectionHTML({
        heading: c.longTermHeading,
        caption: c.longTermCaption,
        accounts: long,
        savedLabel: c.savedLabel,
        emptyBody: c.emptySectionBody,
        extraHTML: houseCardHTML + trackerCardHTML,
      })}

      ${skipAheadHTML({ c, position: isSkippedAhead(state) ? 'ahead' : 'now', available: canSkipAhead(state) })}
    </main>
  `;

  // Back retraces the participant's own step, whatever it was — this screen
  // no longer names a destination, because none of them do (DECISIONS.md
  // D29). It used to send everyone to frame 01 on the reasoning that a
  // participant who chose "save for something else" had left the journey and
  // should not be dropped back on frame 06.
  //
  // That reasoning does not survive the move to the browser's own history.
  // Frame 06 is where a participant arriving that way genuinely was a moment
  // ago, so it is where swipe-back and the Android back button will take them
  // no matter what this line says; the only thing a written-down destination
  // could still change is whether the on-screen control DISAGREES with them.
  // The worry it was guarding against does not materialise either: going
  // back to frame 06 retraces a step, it does not undo a choice. `goal` stays
  // 'other' — nothing on frame 06 rewrites it without being asked.
  bindAppBarLeading(container);

  // --- The card goes to the calculator, and to nothing else ---
  //
  // ONE DESTINATION NOW: frame 09 / 09a (`/calculator/property`), whatever
  // state the participant is in. DECISIONS.md D21, as amended.
  //
  // It has routed to three different places across three passes — frame 08,
  // then frame 02 for a cold arrival, now the calculator itself — so the
  // reasoning for THIS one is worth stating plainly. The card's own words are
  // "Work out my deposit". The screen that works out a deposit is the
  // calculator. A card that says one thing and opens a preamble is asking the
  // participant to trust a label that did not hold, which is the opposite of
  // what a transparency prototype is for.
  //
  // The destination needs no guard check, which is why this is a single line
  // rather than a branch: `/calculator/property` reads `property-value` and
  // renders 09a when it is null (its own documented empty variant), so it
  // renders for everyone. There is no screen behind it that can redirect, so
  // D22's rule — write state only once the destination is settled — is
  // satisfied unconditionally rather than by testing two flags.
  //
  // NOTHING ABOUT THE SESSION'S SOURCING IS SET HERE ANY MORE. This used to
  // mark a cold arrival as general mode, because a participant who reached
  // the calculator this way had never passed the consent screen and the bank
  // had read nothing. Accounts are now connected from session start
  // (src/state.js), so a cold arrival has the same read figures as anyone
  // else and there is nothing to mark. See DECISIONS.md D28.
  container.querySelector('[data-action="open-deposit-calculator"]').addEventListener('click', () => {
    ctx.setState({ goal: 'house', returnFrame: '/goals', journeyEntryPoint: '/goals', flowEntryHistoryLength: window.history.length });
    window.location.hash = '#/calculator/property';
  });

  // --- The tracker card goes to the tracker, and writes nothing -------------
  //
  // NO STATE PATCH, WHICH IS THE WHOLE OF THE BACK BEHAVIOUR. Back from
  // `/tracker` is `history.back()` (DECISIONS.md D29), so it returns to
  // whichever screen actually pushed the entry below it — this one when a
  // participant arrived from here, `/home` or wherever they were when they
  // used the Insights tab. Naming a destination is what would break that, and
  // is exactly what D29 removed from every other screen.
  //
  // `journeyEntryPoint` and `flowEntryHistoryLength` are NOT written here,
  // unlike the calculator card above. They belong to the close X, which no
  // screen from here to the tracker draws; the tracker writes them itself, at
  // the one moment they mean something, when its action bar opens the
  // Mortgage in Principle flow (tracker.js, D30/D32). Writing them on this
  // click would record the goals area as the entry point of a flow the
  // participant has not entered.
  container.querySelector('[data-action="open-deposit-tracker"]').addEventListener('click', () => {
    window.location.hash = '#/tracker';
  });

  // --- The skip-ahead control ----------------------------------------------
  //
  // ONE TRIGGER, ON ONE SCREEN. There is deliberately no second way to move
  // the session between the two positions: not from the tracker, not from
  // inside the Mortgage in Principle flow, and not from frame 33. A
  // participant part-way through a task must not be able to change the
  // position the task is measured against, and a second control would also
  // mean two places to look when a session's figures are not where the
  // facilitator expected.
  //
  // Selection re-renders this screen in place rather than navigating, so the
  // participant stays where they were, keeps their scroll position and keeps
  // focus on the option they just chose (`rerenderInPlace` restores it by
  // `data-action` plus `data-value`).
  const skipOptions = Array.from(container.querySelectorAll('[data-action="set-skip-ahead"]'));

  function selectPosition(value) {
    const current = isSkippedAhead(state) ? 'ahead' : 'now';
    if (value === current) return;

    // `skipAheadPatch` returns null when there is no goal to be part-way
    // toward. The option is already marked `aria-disabled` in that state; this
    // is the same rule enforced where it actually applies, so a click, an
    // Enter and an arrow key cannot disagree about it.
    const patch = value === 'ahead' ? skipAheadPatch(state) : skipBackPatch(state);
    if (!patch) return;

    const next = ctx.setState(patch);
    rerenderInPlace(container, render, { ...ctx, state: next });
  }

  skipOptions.forEach((option, index) => {
    option.addEventListener('click', () => selectPosition(option.dataset.value));

    // ARROW KEYS MOVE AND SELECT, which is the radiogroup pattern's own
    // behaviour rather than a shortcut invented here: in a radio group, moving
    // the focus IS choosing. Home and End are the same move to the ends. Space
    // and Enter are left to the browser, which already fires `click` on a
    // <button> for both.
    option.addEventListener('keydown', (event) => {
      const back = event.key === 'ArrowLeft' || event.key === 'ArrowUp';
      const forward = event.key === 'ArrowRight' || event.key === 'ArrowDown';
      const first = event.key === 'Home';
      const last = event.key === 'End';
      if (!back && !forward && !first && !last) return;

      event.preventDefault();
      const target = first
        ? 0
        : last
          ? skipOptions.length - 1
          : (index + (forward ? 1 : -1) + skipOptions.length) % skipOptions.length;
      // Focus first so the move still happens when the target is unavailable
      // and `selectPosition` declines - the participant is not left with focus
      // on an option they have just navigated away from.
      skipOptions[target].focus();
      selectPosition(skipOptions[target].dataset.value);
    });
  });
}
