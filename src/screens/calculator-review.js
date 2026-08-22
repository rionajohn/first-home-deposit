/**
 * Frame 11 — Check your figures. Figma node 66:790. Reference:
 * reference/frames/11 Deposit calculator - check your figures.png.
 *
 * Single variant (build-spec.md section 2 lists only "read-only rows" /
 * "edited rows" — a captioning difference the reviewRowHTML calls below
 * already handle via each figure's own provenance, not a separate screen
 * state). Computes months-to-target, on-track-for and checkpoint-amount
 * when "Work it out" is pressed (build-spec.md section 1's own note that
 * these are committed here, not on frame 10).
 */
import {
  formStepHeaderHTML,
  bindFormStepHeader,
  actionBarHTML,
  infoBannerHTML,
  flagRowHTML,
  reviewRowHTML,
} from '../components/ui.js';
import { formatCurrency, formatPercent } from '../format.js';
import { monthsToTarget, onTrackFor, checkpointAmount } from '../model/model.js';
import { RATES } from '../model/rates.js';
import { chevronRight } from '../icons.js';

export const anchors = ['guidanceNotAdvice'];

export function render(container, ctx) {
  const { state, setState, content } = ctx;
  const c = content['/calculator/review'];
  const reg = content.shared.regulatory;

  if (state['savings-rate'].value === null || state['deposit-target'].value === null) {
    window.location.hash = '#/calculator/saving';
    return;
  }

  const propertyValue = state['property-value'];
  const depositPct = state['deposit-pct'];
  const savedTowardDeposit = state['saved-toward-deposit'];
  const monthlyLow = state['monthly-low'];
  const monthlyHigh = state['monthly-high'];

  // A session that never linked an account has no saved-toward-deposit and no
  // left-over, and the two read-only system rows below were never read from
  // anything of the participant's either. Each says so rather than claiming a
  // source it hasn't got (GAPS.md G50, DECISIONS.md D24). The em dash is this
  // build's existing glyph for a figure that genuinely isn't known — see
  // assumptions-sources.js, which already null-guards the same three figures.
  const fromAccounts = state['left-over'].value !== null;
  const savedKnown = savedTowardDeposit.value !== null;

  container.innerHTML = `
    ${formStepHeaderHTML({ title: c.appBarTitle, step: c.stepLabel, appBarLabels: content.shared.appBar })}
    <main class="screen-content" role="main">
      <h2 class="screen-title">${c.headline}</h2>
      <div class="review-rows-stack">
        ${reviewRowHTML({
          label: c.propertyValueLabel,
          value: formatCurrency(propertyValue.value),
          caption: c.enteredCaption,
          changeLabel: c.changeLabel,
          changeAction: 'change-property',
        })}
        ${reviewRowHTML({
          label: c.depositPctLabel,
          value: formatPercent(depositPct.value, 0),
          caption: c.enteredCaption,
          changeLabel: c.changeLabel,
          changeAction: 'change-property',
        })}
        ${reviewRowHTML({
          label: c.savedSoFarLabel,
          value: savedKnown ? formatCurrency(savedTowardDeposit.value) : '—',
          caption: savedKnown ? c.savedSoFarCaption : c.savedSoFarCaptionGeneral,
          // No Change link when there is nothing behind it: the screen it
          // opens (frame 06) guards on left-over and would bounce this
          // session three hops back to consent.
          changeLabel: savedKnown ? c.changeLabel : null,
          changeAction: 'change-saved',
        })}
        ${reviewRowHTML({
          label: c.monthlySavingLabel,
          value: `${formatCurrency(monthlyLow.value)} to ${formatCurrency(monthlyHigh.value)}`,
          caption: c.monthlySavingCaption,
          changeLabel: c.changeLabel,
          changeAction: 'change-saving',
        })}
        ${reviewRowHTML({
          label: c.savingsInterestLabel,
          value: `${formatPercent(RATES.bankRate)} AER`,
          caption: fromAccounts ? c.savingsInterestCaption : c.savingsInterestCaptionGeneral,
          changeLabel: c.changeLabel,
          changeAction: 'change-rate',
        })}
        ${reviewRowHTML({
          label: c.taxRateLabel,
          value: c.taxRateValue,
          caption: fromAccounts ? c.taxRateCaption : c.taxRateCaptionGeneral,
          changeLabel: c.changeLabel,
          changeAction: 'change-rate',
        })}
        <button type="button" class="list-row" data-action="open-provenance-key">
          <span class="list-row__label">${c.provenanceKeyLabel}</span>
          ${chevronRight({ size: 'body', className: 'list-row__chevron' })}
        </button>
      </div>

      ${infoBannerHTML(c.noteBannerText)}
      ${flagRowHTML(c.flagLabel)}
      <p class="legal-text">${reg.guidanceNotAdvice}</p>
    </main>
    ${actionBarHTML({
      primaryLabel: c.primaryCta,
      primaryAction: 'work-it-out',
      secondaryLabel: c.secondaryCta,
      secondaryAction: 'exit',
    })}
  `;

  bindFormStepHeader(container, {
    onBack: () => { window.location.hash = '#/calculator/saving'; },
    onClose: () => { setState({ returnFrame: '/calculator/review' }); window.location.hash = '#/calculator/exit'; },
  });

  container.querySelectorAll('[data-action="change-property"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      setState({ returnFrame: '/calculator/review' });
      window.location.hash = '#/calculator/property';
    });
  });
  // Absent when saved-toward-deposit isn't known — see the row above.
  const changeSavedBtn = container.querySelector('[data-action="change-saved"]');
  if (changeSavedBtn) {
    changeSavedBtn.addEventListener('click', () => {
      setState({ returnFrame: '/calculator/review' });
      window.location.hash = '#/position/summary';
    });
  }
  container.querySelector('[data-action="change-saving"]').addEventListener('click', () => {
    setState({ returnFrame: '/calculator/review' });
    window.location.hash = '#/calculator/saving';
  });
  container.querySelectorAll('[data-action="change-rate"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      setState({ returnFrame: '/calculator/review' });
      window.location.hash = '#/assumptions/sources';
    });
  });

  container.querySelector('[data-action="open-provenance-key"]').addEventListener('click', () => {
    setState({ returnFrame: '/calculator/review' });
    window.location.hash = '#/assumptions/saving';
  });

  container.querySelector('[data-action="exit"]').addEventListener('click', () => {
    setState({ returnFrame: '/calculator/review' });
    window.location.hash = '#/calculator/exit';
  });

  container.querySelector('[data-action="work-it-out"]').addEventListener('click', () => {
    const months = monthsToTarget(state);
    const onTrack = onTrackFor(state);
    const checkpoint = checkpointAmount(state);
    setState({
      'months-to-target': { value: months.value, provenance: months.provenance },
      'on-track-for': { value: onTrack.value, provenance: onTrack.provenance },
      'checkpoint-amount': { value: checkpoint.value, provenance: checkpoint.provenance },
    });
    window.location.hash = '#/calculator/result';
  });
}
