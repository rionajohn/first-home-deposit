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

  container.innerHTML = `
    ${formStepHeaderHTML({ title: c.appBarTitle, step: c.stepLabel, appBarLabels: content.shared.appBar })}
    <div class="screen-content">
      <p class="screen-title">${c.headline}</p>
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
          value: formatCurrency(savedTowardDeposit.value),
          caption: c.savedSoFarCaption,
          changeLabel: c.changeLabel,
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
          caption: c.savingsInterestCaption,
          changeLabel: c.changeLabel,
          changeAction: 'change-rate',
        })}
        ${reviewRowHTML({
          label: c.taxRateLabel,
          value: c.taxRateValue,
          caption: c.taxRateCaption,
          changeLabel: c.changeLabel,
          changeAction: 'change-rate',
        })}
        <button type="button" class="list-row" data-action="open-provenance-key">
          <span class="list-row__label">${c.provenanceKeyLabel}</span>
          <img class="list-row__chevron" src="assets/icons/chevron-right.svg" alt="" width="20" height="20" />
        </button>
      </div>

      ${infoBannerHTML(c.noteBannerText)}
      ${flagRowHTML(c.flagLabel)}
      <p class="legal-text">${reg.guidanceNotAdvice}</p>
    </div>
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
  container.querySelector('[data-action="change-saved"]').addEventListener('click', () => {
    setState({ returnFrame: '/calculator/review' });
    window.location.hash = '#/position/summary';
  });
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
