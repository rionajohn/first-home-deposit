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
 * THE DATE STEPPER IS BOUNDED (DECISIONS.md D82, superseding D80's option C).
 * D80 let the participant set a date needing more than the ceiling and then
 * refused it with a banner. The stepper's down controls now stop at the
 * earliest date the goal is reachable by, so the impossible date cannot be
 * set, there is nothing to refuse, and `errorDateNeedsMoreThanLeftOver` is no
 * longer rendered by anything. D46 is satisfied more simply than it was: no
 * value is discarded because none is ever taken.
 *
 * WHAT THE BOUND IS AND WHERE IT LIVES. `earliestWorkableMonths()` below, one
 * number, recomputed on EVERY render - which is every entry to this screen,
 * every stepper press, every segment switch and every back-navigation onto it.
 * It has to be, because everything that moves it is committed on another
 * screen (see that function's own note), so a value cached on entry would be
 * stale the moment the participant edited a figure on frame 11 and came back.
 *
 * ONE SOURCE FOR THE BOUND AND THE DISABLE. `belowBound` and both down-control
 * disable flags are the same comparison against the same number, so the button
 * that refuses a press and the guard that refuses a commit cannot disagree.
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
  dateStepperHTML,
  figureDisplayHTML,
  reviewRowHTML,
  warningBannerHTML,
  rerenderInPlace,
} from '../components/ui.js';
import { formatCurrency, formatPercent } from '../format.js';
import { monthlyAmountFromDate, rangeFromCentral, monthsToReachAmount, combinedGoal } from '../model/model.js';
import { RATES } from '../model/rates.js';
import { MOCK_POSITION } from '../model/accounts.js';
import { chevronRight } from '../icons.js';

export const anchors = ['guidanceNotAdvice'];

function fill(template, values) {
  return Object.entries(values).reduce((s, [k, v]) => s.replace(`{${k}}`, v), template);
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

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

// `monthsFromNow`'s INVERSE IS NOT HERE ANY MORE, and its absence is the point.
// D80 needed it to name the earliest date inside the banner; nothing renders
// that date now, so the three lines that built the label went with the string
// that used them rather than sitting unused waiting to rot. Filling D82's
// second open question - where the bound's explanation sits - brings both back,
// and `earliestWorkableMonths` below is the half worth keeping either way.

/**
 * One month step in either direction, rolling the year. USED BOTH BY THE
 * DISABLE CALCULATION AND BY THE HANDLER, so the button that refuses a press
 * and the press it would have made are computed by the same two lines - the
 * failure mode being avoided is a control disabled for one date while the
 * handler moves to another.
 */
function monthStep(month, year, delta) {
  const i = (month - 1) + delta;
  return { month: ((i % 12) + 12) % 12 + 1, year: year + Math.floor(i / 12) };
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
  const targetMonth = state.targetMonth ?? new Date().getMonth() + 1;
  const targetYear = state.targetYear ?? new Date().getFullYear() + 3;
  // THE YEAR FIELD IS EMPTY WHILE THE PARTICIPANT RE-TYPES IT (state.js
  // `targetYearCleared`). Frame 09's `propertyValueCleared` pattern exactly:
  // the draft is the screen's own, `targetYear` above is left standing, and
  // Continue is disabled until the field holds a year again. DECISIONS.md D46,
  // GAPS.md G62.
  const yearCleared = state.targetYearCleared;

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

  // --- The bound (D82) -----------------------------------------------------
  // Computed before anything reads it, and read by three things that must
  // agree: whether Continue commits, whether each down control accepts a
  // press, and where the stepper may go.
  const boundMonths = earliestWorkableMonths(state, savingCeiling);
  const monthsChosen = monthsFromNow(targetMonth, targetYear);
  // A DATE ALREADY BELOW THE BOUND IS NOT A PRESS THE STEPPER LET THROUGH - it
  // is a bound that moved. The participant sets a date here, goes back to frame
  // 11, raises their property value, and returns: their date now needs more
  // than the ceiling and the stepper had nothing to do with it.
  //
  // NOTHING IS REWRITTEN. Their month and year stand exactly as they set them
  // (D46), the down controls are disabled so they cannot go further out of
  // range, the up controls are live so the bound is one press-run away, and
  // Continue is disabled so no impossible figure is committed - which is G64's
  // invariant, kept without the banner that used to carry it. It is UNEXPLAINED
  // on screen until the copy in D82's second open question lands; that is a
  // known cost of this commit and is recorded rather than worked around.
  const belowBound = boundMonths !== null && monthsChosen < boundMonths;
  const downOneMonth = monthStep(targetMonth, targetYear, -1);
  const monthDownDisabled = boundMonths !== null
    && monthsFromNow(downOneMonth.month, downOneMonth.year) < boundMonths;
  const yearDownDisabled = boundMonths !== null
    && monthsFromNow(targetMonth, targetYear - 1) < boundMonths;

  let errorText = null;
  let previewAmount = null;

  if (solveFor === 'date') {
    if (monthlyHigh.value > savingCeiling) {
      errorText = c.errorExceedsLeftOver;
    }
  } else if (!yearCleared) {
    // GUARDED ON THE DRAFT FIRST. While the year field is empty there is no
    // target date, so there is nothing to solve and nothing to say is wrong -
    // `previewAmount` stays null and Continue is disabled by `yearCleared`
    // below rather than by an error. This is the branch that keeps the state
    // rule: no figure is derived from a year the guard has not tested.
    const months = monthsFromNow(targetMonth, targetYear);
    if (months < 0) {
      errorText = c.errorPastDate;
    } else {
      previewAmount = monthlyAmountFromDate(state, months);
      // NO CEILING BANNER HERE ANY MORE (D82, superseding D80's option C). The
      // comparison that used to raise it - `previewAmount.value >
      // savingCeiling` - is now `belowBound` above, computed from the same
      // number the stepper's own bound uses, so the screen cannot refuse a
      // figure the control would have allowed or allow one it refused. What it
      // no longer does is raise a string: the date it would complain about
      // cannot be reached by any press.
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
        ${dateStepperHTML({
          monthLabel: MONTH_NAMES[targetMonth - 1],
          yearLabel: yearCleared ? '' : String(targetYear),
          yearRole: 'target-year',
          hint: c.dateStepperHint,
          monthAction: 'step-month',
          yearAction: 'step-year',
          monthAriaLabel: c.dateStepperMonthAriaLabel,
          yearAriaLabel: c.dateStepperYearAriaLabel,
          increaseLabel: content.shared.stepper.increaseLabel,
          decreaseLabel: content.shared.stepper.decreaseLabel,
          monthDownDisabled,
          yearDownDisabled,
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
      // An empty year disables Continue without raising an error, the same way
      // frame 09's empty property value does: nothing is wrong yet, the
      // participant is simply part-way through typing. `belowBound` disables it
      // the same way and for the same kind of reason (D82): the date on screen
      // is one the ceiling cannot reach, no press put it there, and nothing has
      // been replaced to make it valid.
      primaryDisabled: !!errorText || yearCleared || belowBound,
      // D78. Null while the year field is empty, for the reason on the line
      // above: a draft raises no banner, so there is nothing to point at.
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
    // A MONTH ROLL PAST EITHER END OF THE YEAR MOVES THE YEAR, and while the
    // year field is sitting empty that would move it where the participant
    // cannot see it. `stepMonth` resolves the draft on exactly the presses that
    // write a new year and leaves it alone on the other eleven, so the field is
    // never empty while holding a year the participant did not put there. The
    // month is stepped, never typed, so it has no draft of its own.
    function stepMonth(m, y) {
      const next = setState(y === targetYear
        ? { targetMonth: m }
        : { targetMonth: m, targetYear: y, targetYearCleared: false });
      rerenderInPlace(container, render, { ...ctx, state: next });
    }

    container.querySelector('[data-action="step-month-up"]').addEventListener('click', () => {
      // Never bounded: there is no ceiling on how far ahead a participant may
      // plan, only a floor on how soon.
      const { month, year } = monthStep(targetMonth, targetYear, 1);
      stepMonth(month, year);
    });
    container.querySelector('[data-action="step-month-down"]').addEventListener('click', () => {
      // GUARDED AS WELL AS DISABLED, the same belt-and-braces the Continue
      // handler carries: the attribute stops the press, and this stops a press
      // that reaches the handler anyway. Both read the same flag, and the step
      // itself is `monthStep`, which is what the flag was computed from.
      if (monthDownDisabled) return;
      const { month, year } = downOneMonth;
      stepMonth(month, year);
    });
    // Both year chevrons resolve the draft as well as moving the year: they put
    // a value back in the field, so the field is no longer empty.
    //
    // THE DOWN CHEVRON NOW STOPS AT THE BOUND AND THE TYPED FIELD DOES NOT, and
    // G73's note that "the two routes to a year cannot accept different values"
    // still holds where it matters. Neither route can COMMIT a date below the
    // bound: `belowBound` disables Continue whichever way the year got there.
    // What differs is the affordance - the chevron will not take you there, the
    // field will let you type it and then sit refusing to go forward. Clamping
    // the typed year to the bound would replace a number the participant just
    // typed, in the field they typed it in, which is G74 exactly. D82.
    container.querySelector('[data-action="step-year-up"]').addEventListener('click', () => {
      const next = setState({ targetYear: targetYear + 1, targetYearCleared: false });
      rerenderInPlace(container, render, { ...ctx, state: next });
    });
    container.querySelector('[data-action="step-year-down"]').addEventListener('click', () => {
      // THE YEAR REFUSES TO MOVE RATHER THAN DRAGGING THE MONTH UP WITH IT.
      // That is what "disable the control at the bound" produces and it is not
      // a choice made here: moving the year and pulling the month to the bound
      // would change a value the participant set on a control they did not
      // touch, which is G92's own pattern. See D82's first open question - the
      // trade is real and it is not this build's to settle.
      if (yearDownDisabled) return;
      const next = setState({ targetYear: targetYear - 1, targetYearCleared: false });
      rerenderInPlace(container, render, { ...ctx, state: next });
    });

    // THE TYPED YEAR. Frame 05's `figureInputHTML` handler and frame 09's
    // `currencyInputHTML` handler are the same two lines, and this is them:
    // `focus` selects the whole value so a tap replaces it rather than dropping
    // a caret mid-number, and `change` - not `input` - is the commit, so a
    // half-typed "2" never reaches the store or re-renders the screen under the
    // participant's fingers.
    const yearInput = container.querySelector('[data-role="target-year"]');
    yearInput.addEventListener('focus', () => yearInput.select());
    yearInput.addEventListener('change', () => {
      const typed = yearInput.value.replace(/[^0-9]/g, '');
      const parsed = Number(typed);
      // An empty field, or anything that does not parse to a finite number, is
      // a DRAFT and never a value - frame 09's rule, applied here for the same
      // reason. `targetYear` is left exactly as it is, so nothing downstream
      // can read a half-made edit, and the emptiness is recorded as this
      // screen's own state. Frame 09's `[^0-9.-]` strip is narrowed to `[^0-9]`
      // here because a year has no decimal point and no sign, so "-" and "."
      // are not characters this field can hold rather than characters it must
      // recover from.
      const next = typed === '' || !Number.isFinite(parsed)
        ? setState({ targetYearCleared: true })
        : setState({ targetYearCleared: false, targetYear: parsed });
      rerenderInPlace(container, render, { ...ctx, state: next });
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
    if (errorText || yearCleared) return;
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
        // The draft is resolved by the same click that commits the figures it
        // fed, so it cannot outlive the edit it describes - frame 09's Continue
        // writes its own flag false for the same reason. Continue is unreachable
        // while the field is empty, so this only ever clears a flag already
        // false.
        targetYearCleared: false,
        'savings-rate': { value: rate.value, provenance: rate.provenance },
        'monthly-low': { value: range.low, provenance: rate.provenance },
        'monthly-high': { value: range.high, provenance: rate.provenance },
      });
    }
    window.location.hash = '#/calculator/review';
  });
}
