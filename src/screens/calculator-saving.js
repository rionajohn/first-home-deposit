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
 * GENERAL MODE (GAPS.md G50, resolved in DECISIONS.md D24)
 * `left-over` is money-in less essential-spending, both read from account
 * activity, so a session that never linked an account does not have one and
 * cannot derive one. It stays null: writing a number into it would be
 * inventing a figure about the participant's income, which is precisely the
 * thing they declined to share.
 *
 * What this screen actually needs is not `left-over` itself but a CEILING for
 * the monthly-saving slider, and general mode already has a sourced one:
 * GENERAL_SAVINGS_RANGE.max, the top of the published range frame 04's own
 * slider runs to one screen earlier. So `savingCeiling` below resolves to
 * `left-over` when accounts were read and to that published maximum when they
 * were not, with its own caption naming the source either way. The seed
 * follows the same rule: generalMonthlyLow/High (what the participant set on
 * frame 04) rather than MOCK_POSITION's account-read figures.
 *
 * The condition tested is `left-over` being null rather than
 * `mode === 'general'`, because the calculator can also be entered from
 * `/goals` with no consent decision recorded at all (mode still null) —
 * G50's second route to the same state.
 */
import {
  formStepHeaderHTML,
  bindFormStepHeader,
  actionBarHTML,
  infoBannerHTML,
  flagRowHTML,
  segmentedControlHTML,
  dateStepperHTML,
  reviewRowHTML,
  warningBannerHTML,
  rerenderInPlace,
} from '../components/ui.js';
import { formatCurrency, formatPercent } from '../format.js';
import { monthlyAmountFromDate, rangeFromCentral } from '../model/model.js';
import { RATES, GENERAL_SAVINGS_RANGE } from '../model/rates.js';
import { MOCK_POSITION } from '../model/accounts.js';
import { chevronRight } from '../icons.js';
import { guidanceNotAdviceLine } from '../regulatory.js';

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

// Neither "Savings interest rate" nor "Tax rate" has an owning editable
// screen elsewhere in this build (build-spec.md section 1's generic rule —
// "the frame that owns that figure" — names 09/05 for the other rows, but
// is silent on these two read-only system figures). Routed to frame 32
// ("Where these figures come from") rather than left inert.
const READ_ONLY_FIGURE_ROUTE = '/assumptions/sources';

export function render(container, ctx) {
  const { state, setState, content } = ctx;
  const c = content['/calculator/saving'];

  // deposit-target is what step 1 commits and what every figure on this
  // screen is measured against, so its absence still means "you haven't
  // finished step 1". left-over's absence does not: see the general-mode
  // note in this file's header.
  if (state['deposit-target'].value === null) {
    window.location.hash = '#/calculator/property';
    return;
  }

  const solveFor = state.solveFor ?? 'date';
  const leftOver = state['left-over'].value;
  const fromAccounts = leftOver !== null;
  const savingCeiling = fromAccounts ? leftOver : GENERAL_SAVINGS_RANGE.max;

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

  // The seed comes from whichever monthly range this session actually has:
  // what the accounts show it has been putting aside, or — with no accounts
  // linked — the range the participant set for itself on frame 04.
  const seedLow = fromAccounts ? MOCK_POSITION.recentMonthlySavingLow : state.generalMonthlyLow.value ?? GENERAL_SAVINGS_RANGE.low;
  const seedHigh = fromAccounts ? MOCK_POSITION.recentMonthlySavingHigh : state.generalMonthlyHigh.value ?? GENERAL_SAVINGS_RANGE.high;
  const seedProvenance = fromAccounts ? 'read' : (state.generalMonthlyLow.provenance ?? 'estimated');

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
      errorText = fromAccounts ? c.errorExceedsLeftOver : c.errorExceedsPublishedRange;
    }
  } else {
    const months = monthsFromNow(targetMonth, targetYear);
    if (months < 0) {
      errorText = c.errorPastDate;
    } else {
      previewAmount = monthlyAmountFromDate(state, months);
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
          fromAccounts ? c.sliderRangeCaptionTemplate : c.sliderRangeCaptionGeneralTemplate,
          { max: formatCurrency(savingCeiling), suggested: formatCurrency(seedHigh) },
        )}</p>
        ${errorText ? warningBannerHTML(errorText) : ''}
      ` : `
        ${dateStepperHTML({
          monthLabel: MONTH_NAMES[targetMonth - 1],
          yearLabel: String(targetYear),
          hint: c.dateStepperHint,
          monthAction: 'step-month',
          yearAction: 'step-year',
          monthAriaLabel: c.dateStepperMonthAriaLabel,
          yearAriaLabel: c.dateStepperYearAriaLabel,
          increaseLabel: content.shared.stepper.increaseLabel,
          decreaseLabel: content.shared.stepper.decreaseLabel,
        })}
        ${errorText ? warningBannerHTML(errorText) : ''}
      `}

      <div class="card filled-in-details-card">
        <p class="filled-in-details-card__title">${fromAccounts ? c.filledInHeading : c.filledInHeadingGeneral}</p>
        ${reviewRowHTML({
          label: c.savingsInterestLabel,
          value: `${formatPercent(RATES.bankRate)} ${c.savingsInterestSuffix}`,
          caption: fromAccounts ? c.savingsInterestCaption : c.savingsInterestCaptionGeneral,
          changeLabel: c.changeLabel,
          changeAction: 'change-savings-interest',
        })}
        ${reviewRowHTML({
          label: c.taxRateLabel,
          value: c.taxRateValue,
          caption: fromAccounts ? c.taxRateCaption : c.taxRateCaptionGeneral,
          changeLabel: c.changeLabel,
          changeAction: 'change-tax-rate',
        })}
        <button type="button" class="list-row" data-action="open-provenance-key">
          <span class="list-row__label">${c.provenanceKeyLabel}</span>
          ${chevronRight({ size: 'body', className: 'list-row__chevron' })}
        </button>
      </div>

      ${infoBannerHTML(c.interestBannerText)}
      ${flagRowHTML(c.flagLabel)}
      <p class="legal-text">${guidanceNotAdviceLine(state, content)}</p>
    </main>
    ${actionBarHTML({
      primaryLabel: c.primaryCta,
      primaryAction: 'continue',
      primaryDisabled: !!errorText,
      secondaryLabel: c.secondaryCta,
      secondaryAction: 'exit',
    })}
  `;

  bindFormStepHeader(container, {
    onBack: () => { window.location.hash = '#/calculator/property'; },
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
    container.querySelector('[data-action="step-month-up"]').addEventListener('click', () => {
      let m = targetMonth + 1, y = targetYear;
      if (m > 12) { m = 1; y += 1; }
      const next = setState({ targetMonth: m, targetYear: y });
      rerenderInPlace(container, render, { ...ctx, state: next });
    });
    container.querySelector('[data-action="step-month-down"]').addEventListener('click', () => {
      let m = targetMonth - 1, y = targetYear;
      if (m < 1) { m = 12; y -= 1; }
      const next = setState({ targetMonth: m, targetYear: y });
      rerenderInPlace(container, render, { ...ctx, state: next });
    });
    container.querySelector('[data-action="step-year-up"]').addEventListener('click', () => {
      const next = setState({ targetYear: targetYear + 1 });
      rerenderInPlace(container, render, { ...ctx, state: next });
    });
    container.querySelector('[data-action="step-year-down"]').addEventListener('click', () => {
      const next = setState({ targetYear: targetYear - 1 });
      rerenderInPlace(container, render, { ...ctx, state: next });
    });
  }

  ['change-savings-interest', 'change-tax-rate'].forEach((action) => {
    container.querySelector(`[data-action="${action}"]`).addEventListener('click', () => {
      setState({ returnFrame: '/calculator/saving' });
      window.location.hash = `#${READ_ONLY_FIGURE_ROUTE}`;
    });
  });

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
      // has not entered anything. Same shape as generalAnnualRange().
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
