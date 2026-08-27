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
import { appBarHTML, bindAppBarLeading } from '../components/ui.js';
import { formatAccountBalance } from '../format.js';
import { effectiveAccounts, goalsByHorizon } from '../model/accounts.js';
import { chevronRight } from '../icons.js';
import { isRootEntry } from '../router.js';

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

  // --- WHICH BRIDGE IS OFFERED, AND THE ONE RULE THAT DECIDES IT ----------
  //
  // THE RULE IS "DO NOT ADVERTISE A DOOR THAT REDIRECTS" (DECISIONS.md D44).
  // It is not "alternate the cards", and reading it that way is what would
  // make the third state below look like an inconsistency later. A card is
  // offered when the screen it leads to will actually render for this session,
  // and withheld when that screen would bounce the participant somewhere else.
  //
  //   no goal set            calculator only. `/tracker` guards on
  //                          `checkpoint-amount` and `deposit-target` and
  //                          `replace()`s into the calculator, so the tracker
  //                          card would be a door onto a redirect.
  //   goal set               tracker only, at any savings position. The
  //                          calculator would open on a goal the participant
  //                          has already set.
  //
  // TWO STATES, NOT THREE, AND THE THIRD WAS NOT WRONG. Until D44's fifth
  // amendment a session at or above the checkpoint drew BOTH cards, and under
  // the rule above that was correct: both destinations render there, so both
  // could honestly be offered. It was removed for consistency - one card in
  // every state - at a cost recorded and accepted in that amendment. The rule
  // itself has not changed; what changed is that consistency now outranks
  // offering a second honest door.
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
  // STILL NO GUARD OF ITS OWN, and withholding the card is not one. `/tracker`
  // keeps the only copy of the rule, and the Insights tab still has none - tap
  // it with no goal and it redirects into the calculator exactly as it always
  // did. What changed is only whether this screen ADVERTISES the door, not how
  // the door behaves when it is used. The two routes are still the same door;
  // one of them just stops pointing at it while it would redirect.
  const trackerCardHTML = ctaCardHTML({
    title: c.trackerCardTitle,
    body: c.trackerCardBody,
    cta: c.trackerCardCta,
    action: 'open-deposit-tracker',
  });

  // ONE PREDICATE, AND ONE CARD IN EVERY STATE. `hasGoal` is `/tracker`'s own
  // guard verbatim (`tracker.js`, the `replace()` at the top of `render`), so
  // this screen and that one cannot drift apart about which state a session is
  // in.
  //
  // THERE USED TO BE A SECOND PREDICATE, `unlocked`, and a third state that
  // drew BOTH cards once the checkpoint was passed. It was correct under this
  // entry's own rule - both destinations render there, so both could honestly
  // be offered - and it was removed for consistency at a known and accepted
  // cost: `tracker.js` draws its "Adjust my goal" secondary on the
  // below-checkpoint variant and no other, so a participant at or above the
  // checkpoint now has NO NEARBY ROUTE TO THE CALCULATOR. The Insights tab
  // still reaches the tracker from anywhere; the calculator is reachable only
  // by typing its URL or by falling back below the checkpoint. That trade was
  // made deliberately - see DECISIONS.md D44's fifth amendment, which keeps the
  // superseded reasoning rather than deleting it.
  const hasGoal = state['checkpoint-amount'].value !== null
               && state['deposit-target'].value !== null;

  const bridgeCardsHTML = hasGoal ? trackerCardHTML : houseCardHTML;

  // --- THE BACK CHEVRON, AND WHY IT IS CONDITIONAL HERE (DECISIONS.md D41) ---
  //
  // A screen draws the chevron only when there is a preceding screen inside
  // its own flow. This screen has two natures and the chevron follows
  // whichever one the participant is in:
  //
  //   via the Goals tab      a tab ROOT. Nothing behind it inside the flow,
  //                          so no chevron.
  //   via frame 06's "save   a DESCENT. Frame 06 is behind it, so the chevron
  //   for something else"    is drawn and pops back to it.
  //
  // `isRootEntry()` and nothing else. The two arrivals share a route, so no
  // route test can tell them apart - only the history entry knows how it was
  // created (D40). Computing root-ness a second way here is exactly what that
  // predicate exists to prevent.
  //
  // Absent, not inert: `appBarHTML` renders a plain 44px `<div>` in the
  // leading cell when `left` is null, so the slot still holds the title
  // centred and there is no button in the tab order or the accessibility
  // tree to land on.
  const leading = isRootEntry() ? null : 'back';

  container.innerHTML = `
    ${appBarHTML({ title: c.appBarTitle, left: leading, appBarLabels: content.shared.appBar })}
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
        extraHTML: bridgeCardsHTML,
      })}

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
  // BOUND ONLY IF DRAWN. Both of these used to be unconditional
  // `querySelector(...).addEventListener(...)`, which was safe only while both
  // cards always rendered; either one would now throw on `null` in the state
  // that withholds it, and the throw would take the rest of this function with
  // it - including the second card's own handler. Optional chaining rather
  // than an `if` on the same predicate as the markup, so the binding cannot
  // disagree with what was rendered even if the predicate above changes.
  container.querySelector('[data-action="open-deposit-calculator"]')?.addEventListener('click', () => {
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
  // Bound only if drawn, for the reason above the calculator handler.
  container.querySelector('[data-action="open-deposit-tracker"]')?.addEventListener('click', () => {
    window.location.hash = '#/tracker';
  });
}
