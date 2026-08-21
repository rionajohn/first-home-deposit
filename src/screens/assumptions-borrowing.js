/**
 * Frame 31 — How we worked out your borrowing estimate. Figma node
 * 114:1326. Reference: reference/frames/31 How we worked out your
 * borrowing estimate.png.
 *
 * A sheet (SPEC.md transition rules), opened only from 20 and 21's
 * "How we worked out your borrowing estimate" / assumptions links
 * (build-spec.md section 1) — dismissed by scrim tap or Close, back to
 * state.returnFrame. Falls back to '/home' if opened with no returnFrame
 * set.
 *
 * The salary and student-loan figures are the same MOCK_MIP_DATA constants
 * frame 19 (mip-pre-check.js) already reads for its own "We've already got"
 * card, so this screen's numbers can never disagree with what 19 showed
 * earlier in the same journey. Essential spending and saved-toward-deposit
 * come straight from state, guarded with an em dash for the deep-linked
 * edge case where this sheet is reached without them set (mirroring every
 * other screen's `.error ? '—' : formatCurrency(...)` convention) — in the
 * built navigation graph this can't actually happen (both 20 and 21 require
 * mip-pre-check's own held-figures gate first), but nothing here assumes
 * that gate was passed.
 *
 * anchors below includes mcob3aRepossessionWarning even though SPEC.md's
 * regulatory anchor map table doesn't list frame 31 for that anchor — see
 * assumptions-deposit.js's comment for the same correction, verified the
 * same way against this screen's own reference PNG and Figma design
 * context.
 */
import { sheetHeaderHTML, figureRowHTML, riskWarningHTML, actionBarDockHTML } from '../components/ui.js';
import { formatCurrency, formatFullDate } from '../format.js';
import { RATES } from '../model/rates.js';
import { MOCK_MIP_DATA } from '../model/accounts.js';

export const anchors = ['guidanceNotAdvice', 'mcob3aRepossessionWarning'];

function fill(template, values) {
  return Object.entries(values).reduce((s, [k, v]) => s.replace(`{${k}}`, v), template);
}

export function render(container, ctx) {
  const { state, content } = ctx;
  const c = content['/assumptions/borrowing'];
  const reg = content.shared.regulatory;

  const returnHash = `#${state.returnFrame || '/home'}`;

  const essentialSpendingValue = state['essential-spending'].value;
  const savedTowardDepositValue = state['saved-toward-deposit'].value;

  const assumptionsRows = [
    fill(c.salaryAssumptionTemplate, { amount: formatCurrency(MOCK_MIP_DATA.annualSalaryBeforeTax) }),
    fill(c.outgoingsAssumptionTemplate, { amount: essentialSpendingValue === null ? '—' : formatCurrency(essentialSpendingValue) }),
    fill(c.studentLoanAssumptionTemplate, { amount: formatCurrency(MOCK_MIP_DATA.creditCommitmentsMonthly) }),
    ...c.assumptionsRowsMiddle,
    fill(c.depositAssumptionTemplate, { amount: savedTowardDepositValue === null ? '—' : formatCurrency(savedTowardDepositValue) }),
  ];

  container.innerHTML = `
    <div class="sheet-overlay">
      <div class="sheet-scrim" data-action="dismiss"></div>
      <div class="bottom-sheet sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-heading">
        ${sheetHeaderHTML({ heading: c.heading, closeLabel: content.shared.appBar.closeLabel })}
        <div class="bottom-sheet__content">
          <p class="body-text-lg">${c.intro}</p>

          <h3 class="section-heading">${c.assumptionsHeading}</h3>
          <div class="assumptions-list">
            ${assumptionsRows.map((row) => figureRowHTML({ label: row })).join('')}
          </div>

          <h3 class="section-heading">${c.exclusionsHeading}</h3>
          <div class="assumptions-list">
            ${c.exclusionsRows.map((row) => figureRowHTML({ label: row })).join('')}
          </div>

          ${riskWarningHTML(reg.mcob3aRepossessionWarning)}
          ${riskWarningHTML(c.borrowingEstimateWarning)}

          <p class="legal-text">${fill(c.metadataTemplate, { date: formatFullDate(RATES.asAt), searchDate: formatFullDate(RATES.asAt) })}</p>
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
