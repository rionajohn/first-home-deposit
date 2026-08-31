/**
 * Frames 10 / 10b — How you'll save. Figma nodes 66:638 / 93:434. Reference:
 * reference/frames/10 Deposit calculator - how you'll save.png, 10b Deposit
 * calculator - date stepper variant.png.
 *
 * One route ('/calculator/saving') for both, branching on state.solveFor
 * (build-spec.md section 2's own naming) rather than a query string —
 * solveFor = 'date' shows the 10 slider variant (pick a monthly range, solve
 * the date); solveFor = 'amount' shows the 10b date-stepper variant (pick a
 * target date, solve the monthly amount).
 *
 * Resolved ambiguity (documented for the build summary): frame 10's Input /
 * Value slider is drawn as a two-handle range ("£200 to £310"), and frame
 * 11's own review row for it is captioned "The range you set" — so
 * monthly-low/monthly-high are ENTERED directly here (provenance 'entered'),
 * with savings-rate committed as their midpoint. On the 10b path the
 * relationship runs the other way, matching DECISIONS.md D2 exactly:
 * savings-rate is solved from the chosen date, and monthly-low/monthly-high
 * are DERIVED from it at 0.9x/1.1x (rangeFromCentral).
 *
 * THE DATE IS TWO DROPDOWNS, FLOORED AT THE EARLIEST REACHABLE DATE
 * (DECISIONS.md D83, superseding D82's bounded steppers, which superseded
 * D80's banner). The floor is the LIST'S FIRST ENTRY rather than a control
 * that stops responding: an impossible date cannot be picked because it is not
 * offered. That is what removed D82's two open questions - there is no
 * disabled chevron needing an explanation, and no stepping into an invalid
 * month, so no boundary case and no D46 question about a dragged value.
 *
 * AND A CAP AT THE OTHER END (DECISIONS.md D85, GAPS.md G98). Past the month
 * at which the existing balance compounded at the Bank Rate reaches the goal,
 * `monthlyAmountFromDate` returns a NEGATIVE payment - the correct answer to a
 * question that has stopped applying, since the goal is reachable with no
 * contribution at all. That figure did not stay on screen: Continue committed
 * it, `rangeFromCentral` inverted on it so `monthly-low` came out ABOVE
 * `monthly-high`, and both of `monthsToTarget`'s guards missed it. The list
 * stops there.
 *
 * ONE RULE, BOTH ENDS. The floor declines dates that do not work; the cap
 * declines dates where the question does not apply. Neither is derived from
 * the other and they cannot be: the floor moves with `left-over` and the cap
 * does not move with it at all (see the two functions' own notes).
 *
 * FLOOR ONLY, NOT DEFAULT. The list starts at the earliest date; the SELECTION
 * stays the seeded one. At the earliest date the solved amount is by
 * definition the entire left-over, so opening there would put the most
 * aggressive figure the model permits in front of the participant before they
 * had done anything - an anchor against RQ2 and an implied recommendation
 * against MCOB 4.8A. The seeded date is facilitator-controlled, which is what
 * a research instrument needs.
 *
 * WHAT THE FLOOR IS AND WHERE IT LIVES. `earliestWorkableMonths()` below, one
 * number, recomputed on EVERY render - which is every entry to this screen,
 * every selection, every segment switch and every back-navigation onto it. It
 * has to be, because everything that moves it is committed on another screen
 * (see that function's own note), so a value cached on entry would be stale the
 * moment the participant edited a figure on frame 11 and came back.
 *
 * ONE SOURCE, AND NOW ONLY ONE CONSUMER. The option lists are built from that
 * number and nothing else reads it - no disable flag, no handler guard, no
 * Continue guard. A list cannot offer what it was not given, so there is
 * nothing left for a second check to disagree with. That is the whole reason a
 * `<select>` was chosen over a custom control: D82 needed three readers of one
 * number, all able to drift apart.
 *
 * THE ONE CASE A FLOOR CANNOT PREVENT (D83). The participant picks a date, then
 * makes an upstream edit - essentials up, money in down, property value up,
 * deposit percentage up, saved total down - that moves the floor past their
 * selection. They never touched the dropdown. Their date is MOVED to the new
 * floor and the move is DISCLOSED (`dateMovedToEarliest`), which is D46's own
 * rule: a value the participant set may be replaced only if the replacement is
 * visible to them. Blocking the upstream edit was rejected - it would make a
 * figure about their actual finances unchangeable because of a target set
 * afterwards - and so was keeping the date and raising D80's banner, which
 * routes the one unpreventable case straight into the state G96 records as cut
 * off below the fold.
 *
 * THE CEILING APPLIES TO BOTH PATHS (DECISIONS.md D80, closing GAPS.md G64
 * and G65). It used to apply to one. The slider path measured every input
 * against `savingCeiling` and raised `errorExceedsLeftOver`; the date path
 * solved a monthly amount from the chosen date - which `monthlyAmountFromDate`
 * leaves unbounded by construction - and committed it, so step 2 let a
 * participant leave with a figure the app already knew was impossible and step
 * 3 refused it. The date path now compares the figure it solves against the
 * same ceiling, names the earliest date that does work, and RENDERS the solved
 * amount, which it previously computed and never showed (G65). Nothing the
 * participant set is discarded on either path.
 *
 * THE SLIDER'S CEILING (GAPS.md G50, DECISIONS.md D24, amended by D28)
 * `savingCeiling` is what the monthly-saving slider measures against, and it
 * is `left-over` - what is left each month once essentials are covered. That
 * used to need a fallback, because a session that had not linked an account
 * had no `left-over` and this screen looped back to step 1. Accounts are now
 * connected from session start (src/state.js), so `left-over` is always
 * present and the fallback is gone with the path that needed it. The name
 * stays: it is what the figure DOES here, and the caption reads from it.
 */
import {
  formStepHeaderHTML,
  bindFormStepHeader,
  actionBarHTML,
  infoBannerHTML,
  flagRowHTML,
  segmentedControlHTML,
  dateSelectHTML,
  bindDateSelect,
  figureDisplayHTML,
  reviewRowHTML,
  warningBannerHTML,
  rerenderInPlace,
} from '../components/ui.js';
import { formatCurrency, formatPercent } from '../format.js';
import { monthlyAmountFromDate, rangeFromCentral, monthsToReachAmount, monthsToGoalUnaided, combinedGoal } from '../model/model.js';
import { RATES } from '../model/rates.js';
import { MOCK_POSITION } from '../model/accounts.js';
import { chevronRight } from '../icons.js';

export const anchors = ['guidanceNotAdvice'];

function fill(template, values) {
  return Object.entries(values).reduce((s, [k, v]) => s.replace(`{${k}}`, v), template);
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/**
 * HOW MANY YEARS THE YEAR LIST OFFERS PAST THE FLOOR.
 *
 * A stepper needed no horizon; a list does, and `build-spec.md` gives none - so
 * this is this build's own figure and is recorded as one (GAPS.md G97). Twenty
 * years is well past anything the model reports in detail (`monthsToTarget`
 * stops projecting at 60 months) and past any deposit horizon a participant in
 * this study is likely to name, without being so long that the list becomes a
 * scroll. It is deliberately NOT `MORTGAGE_TERM_YEARS`: a mortgage term is not
 * a saving horizon, and borrowing one figure for the other is how two unrelated
 * things end up moving together.
 */
const YEAR_LIST_SPAN = 20;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function monthsFromNow(targetMonth, targetYear) {
  const now = new Date();
  return (targetYear - now.getFullYear()) * 12 + (targetMonth - 1 - now.getMonth());
}

/**
 * THE BOUND: whole months from today to the earliest date the goal is
 * reachable at the ceiling. `monthsToReachAmount` is `monthlyAmountFromDate`'s
 * inverse over the same annuity-due equation, so the month it returns is
 * exactly where the solved amount stops exceeding `left-over`.
 *
 * THE GOAL IS DERIVED, NOT READ, and that is deliberate.
 * `monthlyAmountFromDate` already derives `combinedGoal(state)` live, so the
 * bound and the amount the bound is about come from ONE source and cannot
 * disagree. Reading the stored `combined-goal` here while the amount beside it
 * was derived is precisely the live-versus-stored split CLAUDE.md's state
 * rules and D38's third amendment name.
 *
 * ROUNDED UP to a whole month, D2's own rule for a month figure shown to a
 * participant: a date earlier than the maths gives is a date that does not
 * work.
 *
 * RECOMPUTED ON EVERY RENDER, NEVER CACHED (D82). Nothing this screen can edit
 * moves it - every input does live somewhere else: `money-in` and
 * `essential-spending` (and an entered override) on frame 05 through
 * `left-over`; `property-value` and `deposit-pct` on frames 09 and 11 through
 * `combinedGoal`; `saved-toward-deposit` on frames 03/06 and frame 11. So the
 * bound cannot move WHILE the participant is on this screen, and it can differ
 * between two visits to it. A value read once on entering date mode would be
 * the stale one on the second visit, which is the case this is written to
 * avoid rather than the one it looks like it is for.
 *
 * Returns null only for states this screen cannot render: `goal.error`, or a
 * non-finite month count, which needs a ceiling at or below zero - and
 * `left-over` cannot be, because frame 05 refuses to commit one and the slider
 * path above already divides by it. A null bound bounds nothing, which is the
 * safe direction: the screen behaves as it did before D82 rather than locking
 * a control it cannot justify locking.
 */
function earliestWorkableMonths(state, savingCeiling) {
  const goal = combinedGoal(state);
  if (goal.error) return null;
  const months = monthsToReachAmount({
    startingBalance: state['saved-toward-deposit'].value ?? 0,
    targetAmount: goal.value,
    monthlyAmount: savingCeiling,
  });
  if (!Number.isFinite(months)) return null;
  return Math.max(0, Math.ceil(months));
}

/**
 * `monthsFromNow`'s inverse: the month and year a date `n` months from today
 * lands on. Back since D83, and now load-bearing rather than decorative - the
 * floor's own month and year are what the two option lists are built from, and
 * what `dateMovedToEarliest` names when the floor moves past a chosen date.
 * (It was deleted under D82, when nothing rendered the earliest date.)
 */
function dateAtMonths(n) {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() + n, 1);
  return { month: d.getMonth() + 1, year: d.getFullYear() };
}

// Neither "Savings interest rate" nor "Tax rate" has an owning editable
// screen elsewhere in this build, and neither is adjustable: both are fixed
// system figures. They used to carry a "Change" link routed to frame 32
// ("Where these figures come from") rather than be left inert. That link is
// gone — a row is either editable or explanatory, never both, and a
// "Change" affordance on a rate says it can be changed. Frame 32 is still
// reachable from frame 05's provenance link, and each row keeps the caption
// saying where its figure came from.

export function render(container, ctx) {
  const { state, setState, content } = ctx;
  const c = content['/calculator/saving'];
  const reg = content.shared.regulatory;

  // deposit-target is what step 1 commits and what every figure on this
  // screen is measured against, so its absence still means "you haven't
  // finished step 1". left-over's absence does not: see the general-mode
  // note in this file's header.
  if (state['deposit-target'].value === null) {
    window.location.replace('#/calculator/property');
    return;
  }

  const solveFor = state.solveFor ?? 'date';
  const savingCeiling = state['left-over'].value;

  if (state.targetMonth === null) {
    // Kept a multiple of 12 so this render's own fallback below (which reads
    // straight off today's date rather than the just-set state) computes the
    // exact same month/year the setState below persists.
    const seedMonths = 36;
    const now = new Date();
    const seeded = new Date(now.getFullYear(), now.getMonth() + seedMonths, 1);
    setState({ targetMonth: seeded.getMonth() + 1, targetYear: seeded.getFullYear() });
  }
  let targetMonth = state.targetMonth ?? new Date().getMonth() + 1;
  let targetYear = state.targetYear ?? new Date().getFullYear() + 3;

  // The seed is what the accounts show this session has been putting aside.
  const seedLow = MOCK_POSITION.recentMonthlySavingLow;
  const seedHigh = MOCK_POSITION.recentMonthlySavingHigh;
  const seedProvenance = 'read';

  let monthlyLow = state['monthly-low'];
  let monthlyHigh = state['monthly-high'];
  if (monthlyLow.value === null || monthlyHigh.value === null) {
    monthlyLow = { value: Math.min(seedLow, savingCeiling), provenance: seedProvenance };
    monthlyHigh = { value: Math.min(seedHigh, savingCeiling), provenance: seedProvenance };
  }

  // --- The floor (D83) and the cap (D85) -----------------------------------
  const boundMonths = earliestWorkableMonths(state, savingCeiling);
  const floor = boundMonths === null ? null : dateAtMonths(boundMonths);

  // ROUNDED DOWN, AND THE DIRECTION IS THE WHOLE POINT. The crossing sits
  // between two months - 93.77 on the shared seed - and the solve is +0.62 at
  // month 93 and -0.18 at month 94. Rounding UP would readmit the first month
  // whose answer is negative, which is the state this removes. D2 rounds a
  // month figure UP where the risk is promising a participant a date that is
  // too soon; here the risk runs the other way, so this rounds the other way,
  // and that is a difference in which direction is unsafe rather than a
  // departure from D2.
  //
  // `Infinity` when nothing is saved: nothing compounds from nothing, so there
  // is no crossing and no cap. `YEAR_LIST_SPAN` is the fallback for exactly
  // that session and for no other - see GAPS.md G97, which this demotes rather
  // than closes.
  const unaided = monthsToGoalUnaided(state);
  const capMonths = unaided.error || !Number.isFinite(unaided.value)
    ? null
    : Math.floor(unaided.value);
  const cap = capMonths === null ? null : dateAtMonths(capMonths);

  // THE GOAL IS ALREADY MET, so there is no date to offer at all. Not a bounds
  // problem with a bounds answer: a screen asking when they would like to have
  // it by has stopped making sense for someone who already has it. Reported and
  // built in D85; the copy is outstanding.
  const noWorkableDate = capMonths !== null && boundMonths !== null && capMonths < boundMonths;

  // A DATE ALREADY BELOW THE FLOOR IS NOT A SELECTION THE LIST OFFERED - it is
  // a floor that moved (see the header). The date is moved to the new floor and
  // the move is disclosed; the disclosure clears the moment the participant
  // picks a date themselves.
  //
  // WRITTEN DURING RENDER, which this screen already does for the seeded date
  // above and for the same reason: the correction has to be in the store before
  // anything downstream reads it, and the locals are reassigned to match so
  // this render and the store cannot disagree about which date is on screen.
  let movedToEarliest = state.dateMovedToEarliest === true;
  let movedToCap = state.dateMovedToCap === true;
  if (solveFor === 'amount' && floor !== null && monthsFromNow(targetMonth, targetYear) < boundMonths) {
    targetMonth = floor.month;
    targetYear = floor.year;
    movedToEarliest = true;
    movedToCap = false;
    setState({ targetMonth, targetYear, dateMovedToEarliest: true, dateMovedToCap: false });
  }

  // A SELECTION ABOVE THE CAP, which is the same shape at the other end: the
  // participant picks a date, raises their saved total or lowers their goal on
  // another screen, and comes back to find the crossing has moved behind their
  // date. It is moved down to the cap so the control cannot show a value its
  // own list does not contain - AND THE MOVE IS DISCLOSED (D86, closing GAPS.md
  // G102). D46 at both ends rather than one: a value the participant set may be
  // replaced only if the replacement is visible to them, and under D85 this
  // half was silent.
  //
  // THE TWO MOVES ARE MUTUALLY EXCLUSIVE, and this enforces it rather than
  // trusting it. A selection cannot be below the floor and above the cap at
  // once - the floor cannot exceed the cap while the goal is ahead (D85's
  // monotonicity assertion), and where the goal is met there is no list and
  // neither branch runs. Each patch therefore writes its own flag and clears
  // the other, so no sequence of renders can leave both set.
  if (solveFor === 'amount' && cap !== null && !noWorkableDate
      && monthsFromNow(targetMonth, targetYear) > capMonths) {
    targetMonth = cap.month;
    targetYear = cap.year;
    movedToCap = true;
    movedToEarliest = false;
    setState({ targetMonth, targetYear, dateMovedToCap: true, dateMovedToEarliest: false });
  }

  // THE LISTS, BOUNDED AS A PAIR AT BOTH ENDS (D83's rule, mirrored by D85).
  // The year list runs from the floor's year to the cap's. The month list
  // starts at the floor's MONTH in the floor year and at January in every later
  // one, and ends at the cap's MONTH in the cap year and at December in every
  // earlier one - so in a year holding BOTH bounds it is bounded twice. The
  // pair therefore cannot express a date outside the range, in any combination,
  // without a single comparison at selection time.
  //
  // THE LIST ENDS AT WHICHEVER OF THE CAP AND THE SPAN COMES FIRST (D87). Two
  // different jobs, and neither subsumes the other: the CAP is correctness -
  // past it the solve is negative - and the SPAN is proportion, because a
  // ninety-year list is absurd whatever the model says.
  //
  // The span was written as a fallback for the no-cap session (D85, G97) on the
  // assumption that the cap would be the tighter bound. Measured, it usually is
  // not: at the balance a real session reaches the calculator with, the crossing
  // is thirty years out and the span is what ends the list; the cap only wins
  // once a participant has saved a good deal. Both are load-bearing, so both
  // are applied.
  //
  // The selected year is always included even if it sits past both, so a
  // restored session holding a far-future date renders its own value rather
  // than silently showing a different one - and the move-to-cap above has
  // already brought any such date inside the cap, so this only ever widens the
  // list past the SPAN, never past the cap.
  const floorYear = floor === null ? targetYear : floor.year;
  const spanEnd = floorYear + YEAR_LIST_SPAN;
  const lastYear = Math.max(
    cap !== null ? Math.min(cap.year, spanEnd) : spanEnd,
    floorYear,
    targetYear,
  );
  const yearOptions = [];
  for (let y = floorYear; y <= lastYear; y += 1) yearOptions.push({ value: y, label: String(y) });
  const firstMonth = floor !== null && targetYear === floor.year ? floor.month : 1;
  const lastMonth = cap !== null && targetYear === cap.year ? cap.month : 12;
  const monthOptions = [];
  for (let m = firstMonth; m <= Math.max(firstMonth, lastMonth); m += 1) monthOptions.push({ value: m, label: MONTH_NAMES[m - 1] });

  let errorText = null;
  let previewAmount = null;

  if (solveFor === 'date') {
    if (monthlyHigh.value > savingCeiling) {
      errorText = c.errorExceedsLeftOver;
    }
  } else {
    // NO DRAFT GUARD ANY MORE. The year was a typed field under D82 and could
    // be empty mid-edit, which is what `targetYearCleared` existed for; a
    // `<select>` always holds one of its own options, so there is no half-made
    // state to keep out of the store. D83 removed the key with the field.
    const months = monthsFromNow(targetMonth, targetYear);
    if (noWorkableDate) {
      // NOTHING IS SOLVED AND NOTHING IS SHOWN. There is no date to solve for,
      // and a figure derived from one the list does not offer is exactly the
      // live-versus-stored split CLAUDE.md's state rules forbid. `previewAmount`
      // stays null, so the readout does not render either.
    } else if (months < 0) {
      errorText = c.errorPastDate;
    } else {
      previewAmount = monthlyAmountFromDate(state, months);
      // NO CEILING BANNER HERE ANY MORE (D80's option C, superseded by D82 and
      // then by D83). The comparison that used to raise it -
      // `previewAmount.value > savingCeiling` - is now the floor the option
      // lists are built from, so the screen cannot offer a date it would then
      // refuse. Nothing here can exceed the ceiling: the list does not contain
      // a date that would.
    }
  }

  const fillLeft = (monthlyLow.value / savingCeiling) * 100;
  const fillRight = (monthlyHigh.value / savingCeiling) * 100;

  container.innerHTML = `
    ${formStepHeaderHTML({ title: c.appBarTitle, step: c.stepLabel, appBarLabels: content.shared.appBar })}
    <main class="screen-content" role="main">
      <h2 class="screen-title">${c.headline}</h2>
      ${segmentedControlHTML({
        options: [
          { value: 'date', label: c.segmentMonthlyLabel },
          { value: 'amount', label: c.segmentDateLabel },
        ],
        selected: solveFor,
        action: 'select-solve-for',
      })}
      <p class="entry-card__body">${c.pickOneCaption}</p>

      ${solveFor === 'date' ? `
        <div class="value-slider">
          <div class="value-slider__readout">
            <span class="value-slider__figure-wrap">
              <span class="value-slider__currency" aria-hidden="true">£</span>
              <input class="value-slider__figure" type="number" inputmode="numeric" min="0" max="${savingCeiling}" value="${Math.round(monthlyLow.value)}" data-role="figure-low" aria-label="${c.sliderCaption}, ${c.sliderLowerAmountLabel}" />
            </span>
            <p class="value-slider__to">to</p>
            <span class="value-slider__figure-wrap">
              <span class="value-slider__currency" aria-hidden="true">£</span>
              <input class="value-slider__figure" type="number" inputmode="numeric" min="0" max="${savingCeiling}" value="${Math.round(monthlyHigh.value)}" data-role="figure-high" aria-label="${c.sliderCaption}, ${c.sliderUpperAmountLabel}" />
            </span>
          </div>
          <p class="value-slider__caption">${c.sliderCaption}</p>
          <div class="value-slider__track">
            <div class="value-slider__track-bg"></div>
            <div class="value-slider__track-fill" style="left:${fillLeft}%;width:${fillRight - fillLeft}%;"></div>
            <input class="value-slider__range" type="range" min="0" max="${savingCeiling}" step="1" value="${monthlyLow.value}" data-role="range-low" aria-label="${c.sliderCaption}, ${c.sliderLowerAmountLabel}" />
            <input class="value-slider__range" type="range" min="0" max="${savingCeiling}" step="1" value="${monthlyHigh.value}" data-role="range-high" aria-label="${c.sliderCaption}, ${c.sliderUpperAmountLabel}" />
          </div>
          <div class="value-slider__labels">
            <p class="value-slider__label">${formatCurrency(0)}</p>
            <p class="value-slider__label">${formatCurrency(savingCeiling)}</p>
          </div>
        </div>
        <p class="provenance-caption">${fill(
          c.sliderRangeCaptionTemplate,
          { max: formatCurrency(savingCeiling), suggested: formatCurrency(seedHigh) },
        )}</p>
        ${errorText ? warningBannerHTML(errorText, { id: 'error-saving' }) : ''}
      ` : `
        <!-- ABOVE THE DROPDOWNS, and the placement was measured rather than
             argued (D83). The disclosure explains a value the participant is
             about to read, so it belongs before it; putting it under the
             control would have them meet the changed date first and the reason
             second.

             MEASURED, because G96's finding is that this screen is tight below
             the fold. The readout ends up in the SAME place either way - the
             banner displaces it by its own height wherever it sits - so the
             choice costs the readout nothing. What it buys is distance from
             the fold: above, the banner sits 116px (default) / 122px (Large)
             higher than it would below the dropdowns. Both fit; above has the
             margin. See D83. -->
        ${movedToEarliest || movedToCap ? infoBannerHTML(
          // ONE BANNER, ONE ID, TWO STRINGS. The two moves cannot both have
          // happened (see the patches above), so this renders at most one - and
          // if a hand-edited session somehow arrives with both flags set, the
          // floor's wins, because reaching a date that does NOT work is the
          // more urgent of the two to explain.
          //
          // The slot is `{earliest}` for both, which is the floor's name for
          // the cap's date - see content.js, where it is flagged rather than
          // renamed.
          fill(movedToEarliest ? c.dateMovedToEarliest : c.dateMovedToCap,
            { earliest: `${MONTH_NAMES[targetMonth - 1]} ${targetYear}` }),
          { id: 'date-moved', live: true },
        ) : ''}
        <!-- NO DATE CONTROL AT ALL WHEN THERE IS NO DATE TO PICK (D85). An
             empty listbox is a control that asks a question with no answers;
             drawing one and letting the participant open it to find nothing is
             worse than not drawing it. The statement takes its place, and
             Continue is disabled, so nothing can be committed from a date that
             does not exist.

             THE SEGMENTED CONTROL IS DELIBERATELY LEFT ALONE. "Set a monthly
             amount" is still there and still switches - it is the way forward
             from here, and removing it would leave the participant on a screen
             with nothing at all. That path has its own defect in this state
             (GAPS.md G101) which this pass does not fix and does not hide. -->
        ${noWorkableDate ? infoBannerHTML(c.dateGoalAlreadyMet, { id: 'date-goal-met', live: true }) : dateSelectHTML({
          monthOptions,
          monthValue: targetMonth,
          yearOptions,
          yearValue: targetYear,
          hint: c.dateStepperHint,
          monthAction: 'open-month-list',
          yearAction: 'open-year-list',
          monthAriaLabel: c.dateStepperMonthAriaLabel,
          yearAriaLabel: c.dateStepperYearAriaLabel,
        })}
        <!-- THE FIGURE THE DATE IMPLIES (D80, closing GAPS.md G65). It was
             computed on every render of this branch and read in exactly one
             place - the Continue handler - so the screen asked for a date,
             solved a monthly amount, and showed the participant nothing until
             step 3. Reference PNG 10b draws no readout; rendering it is a
             recorded deviation, not an oversight in the build (D80).

             BELOW THE STEPPER, above the banner. The slider variant puts its
             figures ABOVE its track because the participant sets them there;
             this one puts the figure BELOW the stepper because the stepper
             produces it. Reading order matches causality on both, and in both
             the banner sits immediately under the figure it is about - which
             is what Continue's aria-describedby points at (D78).

             Drawn with figureDisplayHTML, not a new component: it is the
             static counterpart to frame 05's figure input and already renders
             a single large figure with a caption on frames 06 and 21.

             NO BACKTICKS ANYWHERE IN THIS COMMENT. It sits inside a template
             literal, where a backtick ends the string and the rest of the
             render function becomes a syntax error. -->
        ${previewAmount && !previewAmount.error ? figureDisplayHTML({
          value: formatCurrency(previewAmount.value),
          caption: c.sliderCaption,
          live: true,
        }) : ''}
        ${errorText ? warningBannerHTML(errorText, { id: 'error-saving' }) : ''}
      `}

      <div class="card filled-in-details-card">
        <p class="filled-in-details-card__title">${c.filledInHeading}</p>
        ${reviewRowHTML({
          label: c.savingsInterestLabel,
          value: `${formatPercent(RATES.bankRate)} ${c.savingsInterestSuffix}`,
          caption: fill(content.shared.bankRateCaptionTemplate, { source: RATES.source }),
        })}
        ${reviewRowHTML({
          label: c.taxRateLabel,
          value: c.taxRateValue,
          caption: c.taxRateCaption,
        })}
        <button type="button" class="list-row" data-action="open-provenance-key">
          <span class="list-row__label">${c.provenanceKeyLabel}</span>
          ${chevronRight({ size: 'body', className: 'list-row__chevron' })}
        </button>
      </div>

      ${infoBannerHTML(c.interestBannerText)}
      ${flagRowHTML(c.flagLabel)}
      <p class="legal-text">${reg.guidanceNotAdvice}</p>
    </main>
    ${actionBarHTML({
      primaryLabel: c.primaryCta,
      primaryAction: 'continue',
      // NO `belowBound` TERM ANY MORE (D83). Under D82 the date could sit below
      // the bound and Continue had to refuse it; the floor now moves it instead,
      // so by the time this renders the date is always one the ceiling can
      // reach. `errorPastDate` is the only thing left that disables Continue on
      // this path, and it too is reachable only from a stored date - the list
      // does not offer one.
      // `noWorkableDate` disables it the way an error would, without raising
      // one: nothing the participant did is wrong (D85).
      primaryDisabled: !!errorText || noWorkableDate,
      primaryDescribedBy: errorText ? 'error-saving' : null,
      secondaryLabel: c.secondaryCta,
      secondaryAction: 'exit',
    })}
  `;

  bindFormStepHeader(container, {
    onClose: () => { setState({ returnFrame: '/calculator/saving' }); window.location.hash = '#/calculator/exit'; },
  });

  container.querySelectorAll('[data-action="select-solve-for"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const next = setState({ solveFor: btn.dataset.value });
      rerenderInPlace(container, render, { ...ctx, state: next });
    });
  });

  if (solveFor === 'date') {
    const rangeLow = container.querySelector('[data-role="range-low"]');
    const rangeHigh = container.querySelector('[data-role="range-high"]');
    const figureLow = container.querySelector('[data-role="figure-low"]');
    const figureHigh = container.querySelector('[data-role="figure-high"]');
    const fillEl = container.querySelector('.value-slider__track-fill');

    function liveUpdate(low, high) {
      rangeLow.value = low;
      rangeHigh.value = high;
      figureLow.value = Math.round(low);
      figureHigh.value = Math.round(high);
      const left = (low / savingCeiling) * 100;
      const right = (high / savingCeiling) * 100;
      fillEl.style.left = `${left}%`;
      fillEl.style.width = `${right - left}%`;
    }

    rangeLow.addEventListener('input', () => {
      liveUpdate(clamp(Number(rangeLow.value), 0, Number(rangeHigh.value)), Number(rangeHigh.value));
    });
    rangeHigh.addEventListener('input', () => {
      liveUpdate(Number(rangeLow.value), clamp(Number(rangeHigh.value), Number(rangeLow.value), savingCeiling));
    });

    function commit(low, high) {
      const next = setState({
        'monthly-low': { value: low, provenance: 'entered' },
        'monthly-high': { value: high, provenance: 'entered' },
      });
      rerenderInPlace(container, render, { ...ctx, state: next });
    }

    rangeLow.addEventListener('change', () => {
      commit(clamp(Number(rangeLow.value), 0, Number(rangeHigh.value)), Number(rangeHigh.value));
    });
    rangeHigh.addEventListener('change', () => {
      commit(Number(rangeLow.value), clamp(Number(rangeHigh.value), Number(rangeLow.value), savingCeiling));
    });
    figureLow.addEventListener('change', () => {
      commit(clamp(Number(figureLow.value) || 0, 0, Number(figureHigh.value)), Number(figureHigh.value));
    });
    figureHigh.addEventListener('change', () => {
      commit(Number(figureLow.value), clamp(Number(figureHigh.value) || 0, Number(figureLow.value), savingCeiling));
    });
  } else {
    // TWO LISTBOXES, ONE COMMIT EACH, AND NO BOUND CHECKED HERE (D83, D84). The
    // lists were built to the floor above, so a pick can only carry a value the
    // floor allowed - there is nothing for a handler guard to re-check and
    // nothing that can disagree with the control.
    //
    // BOTH FLAGS CLEARED ON EVERY PICK. Either disclosure says the app moved
    // the date; the moment the participant picks one themselves neither is
    // describing anything, and neither must survive into a state it did not
    // cause.
    function commitDate(patch) {
      const next = setState({ ...patch, dateMovedToEarliest: false, dateMovedToCap: false });
      rerenderInPlace(container, render, { ...ctx, state: next });
    }

    // ONE BINDING FOR BOTH LISTS (D84). Open, close, arrow keys, Escape, focus
    // return and the outside tap all live in `bindDateSelect`; this decides only
    // what a pick MEANS, which is the same split the component's own note
    // describes. No bound is re-checked here: the lists were built to the floor
    // above, so a pick can only carry a value the floor allowed.
    // Nothing to bind when the control was not drawn. `bindDateSelect` returns
    // early on a missing root, but the guard is written here too so the reason
    // is visible at the call site rather than only in the component.
    if (!noWorkableDate) bindDateSelect(container, {
      onPick: (name, value) => {
        if (name === 'month') { commitDate({ targetMonth: value }); return; }
        // CHANGING THE YEAR RE-DERIVES THE MONTH LIST, and the two cases where
        // that costs the participant their month are handled here rather than
        // left to produce a value outside the list. Picking the floor's year
        // while holding an earlier month raises it to the floor's month;
        // picking the CAP's year while holding a later one lowers it to the
        // cap's (D86). Clamped at both ends, because the list is.
        //
        // THE CLAMP AT THE TOP IS WHAT KEEPS THE CAP DISCLOSURE HONEST. Without
        // it, picking the cap year while holding a later month left a date past
        // the cap, which the render then corrected - and announced, with a
        // banner saying the app had moved their date when in fact they had just
        // moved it themselves. The disclosure is for an UPSTREAM edit moving the
        // cap, not for the participant's own pick being tidied.
        //
        // THIS IS THE RESIDUE OF D82'S FIRST OPEN QUESTION, unchanged by D84 and
        // D86 and smaller than that question was: both values are in view, the
        // participant is working the date control, and the month list visibly no
        // longer contains the month they had. See D83.
        const lowest = floor !== null && value === floor.year ? floor.month : 1;
        const highest = cap !== null && value === cap.year ? cap.month : 12;
        commitDate({ targetYear: value, targetMonth: Math.min(Math.max(targetMonth, lowest), highest) });
      },
    });
  }

  container.querySelector('[data-action="open-provenance-key"]').addEventListener('click', () => {
    setState({ returnFrame: '/calculator/saving' });
    window.location.hash = '#/assumptions/saving';
  });

  container.querySelector('[data-action="exit"]').addEventListener('click', () => {
    setState({ returnFrame: '/calculator/saving' });
    window.location.hash = '#/calculator/exit';
  });

  container.querySelector('[data-action="continue"]').addEventListener('click', () => {
    if (errorText) return;
    if (solveFor === 'date') {
      const savingsRate = (monthlyLow.value + monthlyHigh.value) / 2;
      // The midpoint inherits the provenance of the pair it is the midpoint
      // of, rather than being stamped 'entered' unconditionally: a
      // participant who accepted the seeded range without touching a handle
      // has not entered anything.
      const rateProvenance = monthlyLow.provenance === 'entered' || monthlyHigh.provenance === 'entered'
        ? 'entered'
        : monthlyLow.provenance;
      setState({
        'monthly-low': monthlyLow,
        'monthly-high': monthlyHigh,
        'savings-rate': { value: savingsRate, provenance: rateProvenance },
      });
    } else {
      const rate = previewAmount;
      const range = rangeFromCentral(rate.value);
      setState({
        'savings-rate': { value: rate.value, provenance: rate.provenance },
        'monthly-low': { value: range.low, provenance: rate.provenance },
        'monthly-high': { value: range.high, provenance: rate.provenance },
      });
    }
    window.location.hash = '#/calculator/review';
  });
}
