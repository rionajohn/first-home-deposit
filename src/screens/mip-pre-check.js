/**
 * Frame 19 — Before you run the check. Figma node 104:1132. Reference:
 * reference/frames/19 Before you run the check.png.
 *
 * Two variants (build-spec.md section 2):
 *   - complete (the frame as drawn): all five held figures available
 *   - incomplete: any held figure missing - no wireframe drawn
 *     (DECISIONS.md D7 fallback). Each of income, outgoings and deposit
 *     saved falls back to its own '!' row when the figure it reads is null.
 *     Salary has no null state of its own: MOCK_MIP_DATA always holds one.
 *     The general-mode trigger that used to put salary into the incomplete
 *     row went with general mode (DECISIONS.md D28).
 *
 * The three "What you'll..." sections are Content / Disclosure accordions,
 * closed on load (state.mipAskedOpen / mipBenefitsOpen / mipAwareOpen, see
 * COLLAPSIBLE_DEFAULTS in state.js and DECISIONS.md D12 — the reference PNG
 * draws them open, this build deliberately does not),
 * the same toggle pattern position.js's breakdown disclosure uses.
 *
 * THIS SCREEN IS THE BOUNDARY OF THE PROTOTYPE, AND SAYS SO. No check runs
 * in this build. The primary action opens the bank's existing Mortgage in
 * Principle tool, and the screen after it (19b) is the wait for the result
 * that tool sends back, not a check being performed here. `handoffNote`
 * states that above the action bar, and the button says what it opens rather
 * than "Start the check", which claimed the work happened on this side of
 * the handoff.
 *
 * `checkRunAt` and `softSearchRecorded` are still set on that tap, unchanged:
 * build-spec.md section 1's "Run the check -> checkRunAt set; soft search
 * recorded" row records that the participant reached the handoff, which is
 * the fact 19b and the result screens read. Renaming the button does not
 * change what happened.
 */
import {
  appBarHTML,
  bindAppBarLeading,
  actionBarHTML,
  checklistRowHTML,
  figureRowHTML,
  riskWarningHTML,
  disclosureHTML,
  rerenderInPlace,
} from '../components/ui.js';
import { formatCurrency } from '../format.js';
import { MOCK_MIP_DATA } from '../model/accounts.js';

export const anchors = ['guidanceNotAdvice', 'mcob3aRepossessionWarning'];

// checklistRowHTML carries no border of its own (unlike figureRowHTML,
// which already draws its own border-bottom) — Figma draws an explicit
// divider before each checklist row, including the first, the same
// convention tracker.js's this-month-card uses for statRowHTML.
function withDividers(rows) {
  return rows.map((row) => `<hr class="divider" />${row}`).join('');
}

function askedRowsHTML(rows) {
  return withDividers(rows.map((text) => checklistRowHTML({ state: 'pending', label: text })));
}

function plainRowsHTML(rows) {
  return rows.map((text) => figureRowHTML({ label: text })).join('');
}

export function render(container, ctx) {
  const { state, setState, content } = ctx;
  const c = content['/mip/pre-check'];
  const reg = content.shared.regulatory;

  if (state['deposit-target'].value === null) {
    window.location.replace('#/tracker');
    return;
  }

  const salaryRow = checklistRowHTML({ state: 'checked', label: c.salaryLabel, value: formatCurrency(MOCK_MIP_DATA.annualSalaryBeforeTax), caption: c.salaryCaption });

  const incomeValue = state['money-in'].value;
  const incomeRow = incomeValue === null
    ? checklistRowHTML({ glyph: '!', label: c.incomeLabel, value: c.incompleteValue, caption: c.incompleteCaption })
    : checklistRowHTML({ state: 'checked', label: c.incomeLabel, value: formatCurrency(incomeValue), caption: c.incomeCaption });

  const outgoingsValue = state['essential-spending'].value;
  const outgoingsRow = outgoingsValue === null
    ? checklistRowHTML({ glyph: '!', label: c.outgoingsLabel, value: c.incompleteValue, caption: c.incompleteCaption })
    : checklistRowHTML({ state: 'checked', label: c.outgoingsLabel, value: formatCurrency(outgoingsValue), caption: c.outgoingsCaption });

  const creditRow = checklistRowHTML({
    state: 'checked',
    label: c.creditLabel,
    value: c.creditCaptionTemplate.replace('{amount}', formatCurrency(MOCK_MIP_DATA.creditCommitmentsMonthly)),
    caption: c.creditNote,
  });

  const depositValue = state['saved-toward-deposit'].value;
  const depositRow = depositValue === null
    ? checklistRowHTML({ glyph: '!', label: c.depositLabel, value: c.incompleteValue, caption: c.incompleteCaption })
    : checklistRowHTML({ state: 'checked', label: c.depositLabel, value: formatCurrency(depositValue), caption: c.depositCaption });

  const expectRowsHtml = c.expectRows.map((row) => figureRowHTML({ label: row.label, trailing: row.value })).join('');

  container.innerHTML = `
    ${appBarHTML({ title: c.appBarTitle, left: 'back', appBarLabels: content.shared.appBar })}
    <main class="screen-content" role="main">
      <h2 class="screen-title">${c.headline}</h2>

      <div class="card mip-precheck-card">
        <p class="mip-heading-s">${c.alreadyGotHeading}</p>
        ${withDividers([salaryRow, incomeRow, outgoingsRow, creditRow, depositRow])}
      </div>

      <div class="card mip-precheck-card">
        <p class="mip-heading-s">${c.expectHeading}</p>
        ${expectRowsHtml}
      </div>

      ${riskWarningHTML(c.softSearchWarning)}

      ${disclosureHTML({ id: 'asked', title: c.askedHeading, open: state.mipAskedOpen, contentHtml: askedRowsHTML(c.askedRows) })}
      ${disclosureHTML({ id: 'benefits', title: c.benefitsHeading, open: state.mipBenefitsOpen, contentHtml: plainRowsHTML(c.benefitsRows) })}
      ${disclosureHTML({ id: 'aware', title: c.awareHeading, open: state.mipAwareOpen, contentHtml: plainRowsHTML(c.awareRows) })}

      <p class="body-text">${c.handoffNote}</p>

      ${riskWarningHTML(reg.mcob3aRepossessionWarning)}
      <p class="legal-text">${reg.guidanceNotAdvice}</p>
    </main>
    ${actionBarHTML({
      primaryLabel: c.primaryCta,
      primaryAction: 'start-check',
      secondaryLabel: c.secondaryCta,
      secondaryAction: 'not-right-now',
    })}
  `;

  bindAppBarLeading(container);

  const disclosureKeys = { asked: 'mipAskedOpen', benefits: 'mipBenefitsOpen', aware: 'mipAwareOpen' };
  container.querySelectorAll('[data-action="toggle-disclosure"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = disclosureKeys[btn.dataset.disclosureId];
      const next = setState({ [key]: !state[key] });
      rerenderInPlace(container, render, { ...ctx, state: next });
    });
  });

  container.querySelector('[data-action="start-check"]').addEventListener('click', () => {
    setState({ checkRunAt: Date.now(), softSearchRecorded: true });
    window.location.hash = '#/mip/running';
  });

  container.querySelector('[data-action="not-right-now"]').addEventListener('click', () => {
    window.location.hash = '#/mip';
  });
}
