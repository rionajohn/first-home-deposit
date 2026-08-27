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

function fill(template, values) {
  return Object.entries(values).reduce((s, [k, v]) => s.replace(`{${k}}`, v), template);
}

export function render(container, ctx) {
  const { state, setState, content } = ctx;
  const c = content['/calculator/review'];
  const reg = content.shared.regulatory;

  if (state['savings-rate'].value === null || state['deposit-target'].value === null) {
    window.location.replace('#/calculator/saving');
    return;
  }

  const propertyValue = state['property-value'];
  const depositPct = state['deposit-pct'];
  const savedTowardDeposit = state['saved-toward-deposit'];
  const monthlyLow = state['monthly-low'];
  const monthlyHigh = state['monthly-high'];
  // Either end being 'entered' means the participant moved a handle, which is
  // the same rule calculator-saving.js applies when it commits the midpoint's
  // own provenance. Written the same way so the two cannot disagree about what
  // counts as having set the range.
  const monthlySavingProvenance = monthlyLow.provenance === 'entered' || monthlyHigh.provenance === 'entered'
    ? 'entered'
    : monthlyLow.provenance;

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
          value: formatCurrency(savedTowardDeposit.value),
          caption: c.savedSoFarCaption,
          changeLabel: c.changeLabel,
          changeAction: 'change-saved',
        })}
        ${reviewRowHTML({
          label: c.monthlySavingLabel,
          value: `${formatCurrency(monthlyLow.value)} to ${formatCurrency(monthlyHigh.value)}`,
          // "The range you set" only where a range was actually set. Frame 10
          // seeds this pair from MOCK_POSITION and commits it on Continue with
          // provenance 'read' when neither handle was touched, so the row used
          // to tell a participant who did nothing that they had chosen it.
          // Same shape as position.js's own provenance-aware caption on frame
          // 05. See DECISIONS.md D47.
          //
          // The 10b date path lands on 'entered' and so reads "The range you
          // set" too, where a DATE is what was set. Loose rather than false -
          // the participant did make the input this derives from - and recorded
          // as a known limitation in D47 rather than fixed with a third string.
          caption: monthlySavingProvenance === 'entered' ? c.monthlySavingCaption : c.monthlySavingReadCaption,
          changeLabel: c.changeLabel,
          changeAction: 'change-saving',
        })}
        ${reviewRowHTML({
          label: c.savingsInterestLabel,
          value: `${formatPercent(RATES.bankRate)} AER`,
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
  // The savings interest rate and the tax rate carry no "Change" link: neither
  // is adjustable, and a row is either editable or explanatory, never both.
  // Their provenance captions still say where each figure came from, and the
  // "How we worked these out" row below still reaches frame 32.
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
