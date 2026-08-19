/**
 * Frame 30 — How we worked out your deposit and rates. Figma node 114:1264.
 * Reference: reference/frames/30 How we worked out your deposit and
 * rates.png.
 *
 * A sheet (SPEC.md transition rules), opened from the deposit/rates
 * provenance link on frames 12, 13, 15, 16 (build-spec.md section 1) —
 * dismissed by scrim tap or Close, back to state.returnFrame. All of this
 * screen's callers are reached after the deposit calculator, so
 * property-value/deposit-pct are always set here, unlike 29's saving sheet.
 * Falls back to '/home' if opened with no returnFrame set.
 *
 * anchors below includes mcob3aRepossessionWarning even though SPEC.md's
 * regulatory anchor map table doesn't list frame 30 for that anchor — the
 * reference PNG (and the Figma design context pulled directly from node
 * 114:1264) both show the exact MCOB 3A repossession-warning card on this
 * screen, alongside a second, screen-specific rate-variability warning in
 * the same visual wrapper. Treated as a correction to the map, the same way
 * GAPS.md's G25/G26/G28 corrected other rows found not to match the
 * reference PNGs during direct verification, rather than an omission here.
 *
 * The reference PNG's "4.1% AER" is replaced by RATES.bankRate throughout
 * (DECISIONS.md D3).
 */
import { sheetHeaderHTML, figureRowHTML, infoBannerHTML, riskWarningHTML } from '../components/ui.js';
import { formatPercent, formatFullDate } from '../format.js';
import { RATES } from '../model/rates.js';

export const anchors = ['guidanceNotAdvice', 'mcob3aRepossessionWarning'];

function fill(template, values) {
  return Object.entries(values).reduce((s, [k, v]) => s.replace(`{${k}}`, v), template);
}

export function render(container, ctx) {
  const { state, content } = ctx;
  const c = content['/assumptions/deposit'];
  const reg = content.shared.regulatory;

  const returnHash = `#${state.returnFrame || '/home'}`;

  const assumptionsRows = [
    ...c.assumptionsRowsBeforeInterest,
    fill(c.interestAssumptionTemplate, { rate: formatPercent(RATES.bankRate), source: RATES.source }),
  ];

  container.innerHTML = `
    <div class="sheet-overlay">
      <div class="sheet-scrim" data-action="dismiss"></div>
      <div class="bottom-sheet sheet">
        ${sheetHeaderHTML({ closeLabel: content.shared.appBar.closeLabel })}
        <div class="bottom-sheet__content">
          <p class="screen-title">${c.heading}</p>
          <p class="body-text-lg">${c.intro}</p>

          <p class="section-heading">${c.assumptionsHeading}</p>
          <div class="assumptions-list">
            ${assumptionsRows.map((row) => figureRowHTML({ label: row })).join('')}
          </div>

          <p class="section-heading">${c.exclusionsHeading}</p>
          <div class="assumptions-list">
            ${c.exclusionsRows.map((row) => figureRowHTML({ label: row })).join('')}
          </div>

          ${infoBannerHTML(c.costsBannerText)}
          ${riskWarningHTML(reg.mcob3aRepossessionWarning)}
          ${riskWarningHTML(c.rateVariabilityWarning)}

          <p class="legal-text">${fill(c.metadataTemplate, { date: formatFullDate(RATES.asAt) })}</p>
          <p class="legal-text">${reg.guidanceNotAdvice}</p>
        </div>
        <div class="action-bar">
          <button type="button" class="button button--primary" data-action="dismiss">${c.primaryCta}</button>
        </div>
      </div>
    </div>
  `;

  container.querySelectorAll('[data-action="dismiss"]').forEach((el) => {
    el.addEventListener('click', () => {
      window.location.hash = returnHash;
    });
  });
}
