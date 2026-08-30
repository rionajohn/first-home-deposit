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
 * The earliest month and year the goal is reachable at the ceiling, as a
 * label. `monthsToReachAmount` is `monthlyAmountFromDate`'s inverse over the
 * same annuity-due equation, so asking it for the months at `left-over` gives
 * exactly the date at which the solved amount stops exceeding the ceiling.
 *
 * THE GOAL IS DERIVED, NOT READ, and that is deliberate.
 * `monthlyAmountFromDate` already derives `combinedGoal(state)` live, so the
 * date in the error and the amount the error is about come from ONE source and
 * cannot disagree. Reading the stored `combined-goal` here while the amount
 * beside it was derived is precisely the live-versus-stored split CLAUDE.md's
 * state rules and D38's third amendment name.
 *
 * ROUNDED UP to a whole month, D2's own rule for a month figure shown to a
 * participant: a date earlier than the maths gives is a date that does not
 * work.
 *
 * Returns null only for states this screen cannot render. `goal.error` is
 * already excluded by the caller - the same `combinedGoal` failure would have
 * made `previewAmount` an error first - and a non-finite month count needs a
 * ceiling at or below zero, which `left-over` cannot be: frame 05 refuses to
 * commit one, and the slider path above already divides by it.
 */
function earliestWorkableDateLabel(state, savingCeiling) {
  const goal = combinedGoal(state);
  if (goal.error) return null;
  const months = monthsToReachAmount({
    startingBalance: state['saved-toward-deposit'].value ?? 0,
    targetAmount: goal.value,
    monthlyAmount: savingCeiling,
  });
  if (!Number.isFinite(months)) return null;
  const now = new Date();
  const reached = new Date(now.getFullYear(), now.getMonth() + Math.ceil(months), 1);
  return `${MONTH_NAMES[reached.getMonth()]} ${reached.getFullYear()}`;
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
      // THE CEILING, ON THE PATH THAT CAN PRODUCE A FIGURE PAST IT (D80,
      // GAPS.md G64). One comparison, the same one the slider path makes,
      // against the same `savingCeiling` - so the two variants of this screen
      // accept and refuse the same figures rather than one of them having its
      // own rules.
      //
      // RAISED HERE AND NOT ON THE SEGMENT SWITCH, and that is option C rather
      // than the two declined with it: nothing is clamped, nothing is reset,
      // the date and the figure both stand, and the participant is told why it
      // cannot go forward. Continue is disabled by `errorText` below, so this
      // path writes NOTHING - no `savings-rate`, no `monthly-low`, no
      // `monthly-high`. D46 is satisfied because there is nothing to make
      // visible: no value the participant set has been replaced.
      //
      // Guarded on `previewAmount.error` first. A failed solve carries a null
      // value and `null > 640` is false, so the comparison would pass silently
      // rather than raise - the state rule again: no figure is shown for a key
      // the guard did not test.
      if (!previewAmount.error && previewAmount.value > savingCeiling) {
        errorText = fill(c.errorDateNeedsMoreThanLeftOver, {
          amount: formatCurrency(previewAmount.value),
          max: formatCurrency(savingCeiling),
          earliest: earliestWorkableDateLabel(state, savingCeiling),
        });
      }
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
      // participant is simply part-way through typing.
      primaryDisabled: !!errorText || yearCleared,
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
      let m = targetMonth + 1, y = targetYear;
      if (m > 12) { m = 1; y += 1; }
      stepMonth(m, y);
    });
    container.querySelector('[data-action="step-month-down"]').addEventListener('click', () => {
      let m = targetMonth - 1, y = targetYear;
      if (m < 1) { m = 12; y -= 1; }
      stepMonth(m, y);
    });
    // Both year chevrons resolve the draft as well as moving the year: they
    // put a value back in the field, so the field is no longer empty. They stay
    // unbounded in both directions, exactly as they were - the typed field
    // introduces no bound the stepper does not have, so the two routes to a
    // year cannot accept different values. GAPS.md G73.
    container.querySelector('[data-action="step-year-up"]').addEventListener('click', () => {
      const next = setState({ targetYear: targetYear + 1, targetYearCleared: false });
      rerenderInPlace(container, render, { ...ctx, state: next });
    });
    container.querySelector('[data-action="step-year-down"]').addEventListener('click', () => {
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
