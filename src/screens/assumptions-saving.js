/**
 * Frame 29 — How we worked out your saving amount. Figma node 114:1220.
 * Reference: reference/frames/29 How we worked out your saving amount.png.
 *
 * A sheet (SPEC.md transition rules), opened from the savings-figure
 * provenance link on many different screens (build-spec.md section 1: 04,
 * 05/05b, 06, 08, 11, 12, 13, 15, 16 all set returnFrame then navigate here)
 * — dismissed by scrim tap or Close, always back to state.returnFrame.
 * Falls back to '/home' if opened with no returnFrame set (a direct deep
 * link), since there is no single "primary" caller to default to.
 *
 * The reference PNG's "Interest is paid at 4.1% AER" and "£19,000" figures
 * are both replaced with live model figures here — DECISIONS.md D3 explicitly
 * requires the 4.1% AER wireframe figure to be replaced by RATES.bankRate
 * (3.75%, pinned), and SPEC.md's "no number hardcoded in a screen" rule
 * applies equally to the £19,000 inflation example, which is
 * deposit-target — itself unset on several of this screen's entry points
 * (e.g. 04, 05, 06, 08, all reached before the deposit calculator), so a
 * text fallback stands in for the figure when it isn't yet known.
 */
import { sheetHeaderHTML, figureRowHTML, actionBarDockHTML } from '../components/ui.js';
import { formatCurrency, formatPercent, formatFullDate } from '../format.js';
import { depositTarget } from '../model/model.js';
import { RATES } from '../model/rates.js';

export const anchors = ['guidanceNotAdvice'];

function fill(template, values) {
  return Object.entries(values).reduce((s, [k, v]) => s.replace(`{${k}}`, v), template);
}

export function render(container, ctx) {
  const { state, content } = ctx;
  const c = content['/assumptions/saving'];
  const reg = content.shared.regulatory;

  const returnHash = `#${state.returnFrame || '/home'}`;

  const targetResult = depositTarget(state);
  const inflationAmount = targetResult.error ? c.inflationExclusionFallbackAmount : formatCurrency(targetResult.value);

  const assumptionsRows = [
    ...c.assumptionsRowsBeforeInterest,
    fill(c.interestAssumptionTemplate, { rate: formatPercent(RATES.bankRate), source: RATES.source }),
    ...c.assumptionsRowsAfterInterest,
  ];

  const exclusionsRows = [
    fill(c.inflationExclusionTemplate, { amount: inflationAmount }),
    ...c.exclusionsRowsAfterInflation,
  ];

  container.innerHTML = `
    <div class="sheet-overlay">
      <div class="sheet-scrim" data-action="dismiss"></div>
      <div class="bottom-sheet sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-heading">
        ${sheetHeaderHTML({ closeLabel: content.shared.appBar.closeLabel })}
        <div class="bottom-sheet__content">
          <h2 class="screen-title" id="sheet-heading">${c.heading}</h2>
          <p class="body-text-lg">${c.intro}</p>

          <h3 class="section-heading">${c.assumptionsHeading}</h3>
          <div class="assumptions-list">
            ${assumptionsRows.map((row) => figureRowHTML({ label: row })).join('')}
          </div>

          <h3 class="section-heading">${c.exclusionsHeading}</h3>
          <div class="assumptions-list">
            ${exclusionsRows.map((row) => figureRowHTML({ label: row })).join('')}
          </div>

          <p class="legal-text">${fill(c.metadataTemplate, { date: formatFullDate(RATES.asAt) })}</p>
          <p class="legal-text">${reg.guidanceNotAdvice}</p>
        </div>
        ${actionBarDockHTML(`
          <button type="button" class="button button--primary" data-action="dismiss">${c.primaryCta}</button>
        `)}
      </div>
    </div>
  `;

  container.querySelectorAll('[data-action="dismiss"]').forEach((el) => {
    el.addEventListener('click', () => {
      window.location.hash = returnHash;
    });
  });
}
