/**
 * Frames 09 / 09a / 09b — Property and deposit. Figma nodes 66:476 / 73:902
 * / 66:557. Reference: reference/frames/09 Deposit calculator - property and
 * deposit.png, 09a Deposit calculator - before a value is entered.png, 09b
 * Deposit calculator - above the Lifetime ISA cap.png.
 *
 * One route ('/calculator/property') for all three — build-spec.md section
 * 3's own rule: frames sharing a route are variants of one screen. Which
 * variant renders is read from state, not a query param:
 *   - empty (09a): state['property-value'].value === null — Continue disabled
 *   - error: a committed property-value depositTarget() rejects — no
 *     wireframe drawn (DECISIONS.md D7 fallback: warning banner, Continue
 *     disabled)
 *   - above the Lifetime ISA cap (09b): property-value > LISA_CAP_PROPERTY_VALUE
 *     (DECISIONS.md D6, confirmed — not the nav table's "past the chip
 *     limit" reading)
 *   - filled (09): everything else
 *
 * The deposit-pct chip row and its Option comparison card show three
 * neighbouring DEPOSIT_PCT_OPTIONS around whichever chip is selected,
 * matching both 09's and 09b's reference PNGs (10% selected -> 5/10/15%
 * shown) — the chip row itself offers the full 5-25% set (09a's reference
 * PNG draws five chips; 09/09b draw three only because 10% neighbours 5%
 * and 15%, not because the option set actually narrows).
 */
import {
  formStepHeaderHTML,
  bindFormStepHeader,
  actionBarHTML,
  infoBannerHTML,
  flagRowHTML,
  currencyInputHTML,
  chipRowHTML,
  optionComparisonCardHTML,
  warningBannerHTML,
  infoLinkHTML,
  rerenderInPlace,
} from '../components/ui.js';
import { formatCurrency, formatPercent } from '../format.js';
import { depositTarget, loanAmount, ltv } from '../model/model.js';
import { AREA_AVERAGE_PROPERTY_VALUE, DEPOSIT_PCT_OPTIONS, DEFAULT_DEPOSIT_PCT, LISA_CAP_PROPERTY_VALUE } from '../model/rates.js';

export const anchors = ['guidanceNotAdvice'];

function fill(template, values) {
  return Object.entries(values).reduce((s, [k, v]) => s.replace(`{${k}}`, v), template);
}

function neighbourPcts(selected) {
  const i = DEPOSIT_PCT_OPTIONS.indexOf(selected);
  const start = Math.max(0, Math.min(i - 1, DEPOSIT_PCT_OPTIONS.length - 3));
  return DEPOSIT_PCT_OPTIONS.slice(start, start + 3);
}

export function render(container, ctx) {
  const { state, setState, content } = ctx;
  const c = content['/calculator/property'];
  const reg = content.shared.regulatory;

  const propertyValue = state['property-value'];
  const depositPct = state['deposit-pct'].value ?? DEFAULT_DEPOSIT_PCT;
  const isEmpty = propertyValue.value === null;

  let errorText = null;
  let comparisonRows = [];
  let isAboveLisaCap = false;

  if (!isEmpty) {
    const targetResult = depositTarget({ 'property-value': propertyValue, 'deposit-pct': { value: depositPct, provenance: 'entered' } });
    if (targetResult.error) {
      errorText = c.errorNonNumeric;
    } else {
      isAboveLisaCap = propertyValue.value > LISA_CAP_PROPERTY_VALUE;
      comparisonRows = neighbourPcts(depositPct).map((pct) => {
        const target = depositTarget({ 'property-value': propertyValue, 'deposit-pct': { value: pct, provenance: 'entered' } });
        const loan = loanAmount({ 'property-value': propertyValue, 'deposit-pct': { value: pct, provenance: 'entered' } });
        const value = ltv({ 'property-value': propertyValue, 'deposit-pct': { value: pct, provenance: 'entered' } });
        return {
          amount: formatCurrency(target.value),
          sublabel: fill(c.comparisonSublabelTemplate, { pct: formatPercent(pct, 0) }),
          technical: fill(c.comparisonTechnicalTemplate, { ltv: formatPercent(value.value, 0) }),
          // Compared against the same `depositPct` the chip row is given as
          // its `selected`, so the pill above and the outlined row below can
          // never disagree about which percentage is chosen. Exactly one of
          // the three rows matches: `neighbourPcts` always returns a window
          // containing the selected value.
          selected: pct === depositPct,
        };
      });
    }
  }

  container.innerHTML = `
    ${formStepHeaderHTML({ title: c.appBarTitle, step: c.stepLabel, appBarLabels: content.shared.appBar })}
    <main class="screen-content" role="main">
      <h2 class="screen-title">${c.headline}</h2>
      ${currencyInputHTML({
        id: 'property-value',
        label: c.propertyValueLabel,
        value: propertyValue.value,
        hint: isEmpty ? c.propertyValueHintEmpty : c.propertyValueHintFilled,
        ariaLabel: c.propertyValueAriaLabel,
      })}
      ${errorText ? warningBannerHTML(errorText) : ''}
      ${isAboveLisaCap ? infoBannerHTML(fill(c.lisaCapBannerText, { cap: formatCurrency(LISA_CAP_PROPERTY_VALUE) })) : ''}
      <p class="entry-card__body">${fill(c.areaAverageCaption, { amount: formatCurrency(AREA_AVERAGE_PROPERTY_VALUE.value) })}</p>
      <h3 class="section-heading">${c.depositQuestionHeading}</h3>
      ${chipRowHTML({ chips: DEPOSIT_PCT_OPTIONS.map((pct) => ({ value: pct, label: formatPercent(pct, 0) })), selected: isEmpty ? null : depositPct, action: 'select-deposit-pct' })}
      ${isEmpty
        ? `<div class="card empty-state-card empty-state-card--muted">
             <p class="empty-state-card__body">${c.emptyStateCaption}</p>
             ${infoLinkHTML({ label: c.ltvInfoLinkLabel, action: 'open-ltv-info' })}
           </div>`
        : errorText
          ? ''
          : optionComparisonCardHTML({ headerText: c.comparisonHeaderText, rows: comparisonRows, infoLinkLabel: c.ltvInfoLinkLabel, infoLinkAction: 'open-ltv-info', selectedLabel: c.comparisonSelectedLabel })}
      ${flagRowHTML(c.flagLabel)}
      <p class="legal-text">${reg.guidanceNotAdvice}</p>
    </main>
    ${actionBarHTML({
      primaryLabel: c.primaryCta,
      primaryAction: 'continue',
      primaryDisabled: isEmpty || !!errorText,
      secondaryLabel: c.secondaryCta,
      secondaryAction: 'exit',
    })}
  `;

  bindFormStepHeader(container, {
    onClose: () => { setState({ returnFrame: '/calculator/property' }); window.location.hash = '#/calculator/exit'; },
  });

  const input = container.querySelector('[data-role="property-value"]');
  input.addEventListener('focus', () => input.select());
  input.addEventListener('change', () => {
    const typed = input.value.replace(/[^0-9.-]/g, '');
    const parsed = typed === '' ? NaN : Number(typed);
    const next = setState({ 'property-value': { value: typed === '' ? null : parsed, provenance: 'entered' } });
    rerenderInPlace(container, render, { ...ctx, state: next });
  });

  container.querySelectorAll('[data-action="select-deposit-pct"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const next = setState({ 'deposit-pct': { value: Number(btn.dataset.value), provenance: 'entered' } });
      rerenderInPlace(container, render, { ...ctx, state: next });
    });
  });

  const ltvInfoBtn = container.querySelector('[data-action="open-ltv-info"]');
  if (ltvInfoBtn) {
    ltvInfoBtn.addEventListener('click', () => {
      setState({ returnFrame: '/calculator/property' });
      window.location.hash = '#/learn/ltv';
    });
  }

  container.querySelector('[data-action="exit"]').addEventListener('click', () => {
    setState({ returnFrame: '/calculator/property' });
    window.location.hash = '#/calculator/exit';
  });

  container.querySelector('[data-action="continue"]').addEventListener('click', () => {
    if (isEmpty || errorText) return;
    const finalPct = { value: depositPct, provenance: state['deposit-pct'].provenance ?? 'derived' };
    const target = depositTarget({ 'property-value': propertyValue, 'deposit-pct': finalPct });
    const loan = loanAmount({ 'property-value': propertyValue, 'deposit-pct': finalPct });
    const value = ltv({ 'property-value': propertyValue, 'deposit-pct': finalPct });
    setState({
      'deposit-pct': finalPct,
      'deposit-target': { value: target.value, provenance: target.provenance },
      'loan-amount': { value: loan.value, provenance: loan.provenance },
      ltv: { value: value.value, provenance: value.provenance },
      lisaCapBreached: isAboveLisaCap,
    });
    window.location.hash = '#/calculator/saving';
  });
}
