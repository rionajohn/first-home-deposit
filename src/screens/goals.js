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
import { appBarHTML, bindAppBarBack } from '../components/ui.js';
import { formatAccountBalance } from '../format.js';
import { effectiveAccounts, goalsByHorizon } from '../model/accounts.js';
import { chevronRight } from '../icons.js';

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

  // The bridge into the feature. It sits under the long-term heading because
  // a house deposit is a long-term goal — the card is part of that section,
  // not a banner floating between two.
  const houseCardHTML = `
    <div class="card goals-cta-card">
      <h4 class="goals-cta-card__title">${c.houseCardTitle}</h4>
      <p class="goals-cta-card__body">${c.houseCardBody}</p>
      <button type="button" class="goals-cta-card__action" data-action="open-deposit-calculator">
        <span class="goals-cta-card__action-label">${c.houseCardCta}</span>
        ${chevronRight({ size: 'body', className: 'list-row__chevron' })}
      </button>
    </div>
  `;

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
        extraHTML: houseCardHTML,
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
  bindAppBarBack(container);

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
    ctx.setState({ goal: 'house', returnFrame: '/goals' });
    window.location.hash = '#/calculator/property';
  });
}
