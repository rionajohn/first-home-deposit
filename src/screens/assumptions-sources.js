/**
 * Frame 32 — Where these figures come from. Figma node 114:1401. Reference:
 * reference/frames/32 Where these figures come from.png.
 *
 * A sheet (SPEC.md transition rules), opened from the "Where these figures
 * come from" provenance link on frame 05 and the read-only-figure "change"
 * links on frames 10/10b/11 (build-spec.md section 1) — dismissed by scrim
 * tap or Close, back to state.returnFrame. Some of these callers (frame 10
 * in general mode) can reach this screen with money-in/essential-spending/
 * saved-toward-deposit all unset, so every figure here is null-guarded to an
 * em dash, the same convention every other screen in this build uses.
 * Falls back to '/home' if opened with no returnFrame set.
 *
 * GAPS.md G25 / SPEC.md's own exemption list: the reference PNG's FSCS
 * protection note is deliberately NOT rendered here — build-spec.md section
 * 5 scopes that disclosure to "accounts held with the bank" shown
 * individually (frame 03 only); this screen shows an aggregated total that,
 * in estimate mode, can include balances the bank never held. Recorded as
 * an intentional deviation, not a missed anchor.
 *
 * DUAA 2025's "visible sources" and "a way to push back" commitments
 * (SPEC.md's regulatory anchor map lists this screen under that anchor) are
 * satisfied structurally here rather than by the flagRowHTML button every
 * other figure-presenting screen uses: this whole screen IS the visible-
 * sources destination, and its own "If something looks wrong" section is
 * the pushback mechanism (edit the figure where it appears). No flag row is
 * drawn in the reference PNG, so none is added.
 */
import { sheetHeaderHTML, figureRowHTML, actionBarDockHTML } from '../components/ui.js';
import { formatCurrency, formatPercent } from '../format.js';
import { RATES } from '../model/rates.js';
import { effectiveAccounts, countedTowardDeposit } from '../model/accounts.js';
import { arrowRight } from '../icons.js';
import { goBack } from '../router.js';

export const anchors = ['guidanceNotAdvice'];

function fill(template, values) {
  return Object.entries(values).reduce((s, [k, v]) => s.replace(`{${k}}`, v), template);
}

function dataSourceRowHTML({ label, value, caption }) {
  return `
    <div class="data-source-row">
      <p class="data-source-row__label">${label}</p>
      <p class="data-source-row__value">${value}</p>
      <p class="data-source-row__caption">${caption}</p>
    </div>
  `;
}

function openBankingRowHTML({ title, caption }) {
  return `
    <button type="button" class="open-banking-row" data-action="open-banking">
      <span class="open-banking-row__content">
        <span class="open-banking-row__title">${title}</span>
        <span class="open-banking-row__caption">${caption}</span>
      </span>
      ${arrowRight({ size: 'body', className: 'open-banking-row__arrow' })}
    </button>
  `;
}

export function render(container, ctx) {
  const { state, content } = ctx;
  const c = content['/assumptions/sources'];
  const reg = content.shared.regulatory;
  const summaryContent = content['/position/summary'];

  const returnHash = `#${state.returnFrame || '/home'}`;

  const moneyInValue = state['money-in'].value;
  const essentialSpendingValue = state['essential-spending'].value;
  // D133. `left-over` is a section 6 figure, derived by the model from the two
  // figures directly above it, and it is the one row frame 12's disclosure
  // showed that this sheet did not. Null-guarded to an em dash like every
  // other figure here - the same callers that can reach this screen with
  // money-in unset can reach it with this unset.
  const leftOverValue = state['left-over'].value;
  const savedTowardDepositValue = state['saved-toward-deposit'].value;

  // A DIFFERENT MISS FROM FRAME 06'S, NOT A SECOND COPY OF IT.
  // This caption already honoured the checkbox; what it never tested was
  // `countsTowardDeposit`, the flag that says an account is the KIND that can
  // count at all. So a holiday pot filed under "Toward my deposit" on 03b was
  // named in the breakdown of a total that had never included it - the figure
  // directly above the caption disagreeing with the caption's own list.
  // `countedTowardDeposit` applies all three terms the total applies.
  const depositAccounts = countedTowardDeposit(
    effectiveAccounts(state.accountAssignments, state.accountIncluded),
  );
  const savedTowardDepositCaption = depositAccounts.length > 0
    ? fill(c.accountBreakdownTemplate, { breakdown: depositAccounts.map((a) => `${a.name} ${formatCurrency(a.balance)}`).join(', ') })
    : c.noAccountsAssignedCaption;

  const dataSourceRows = [
    dataSourceRowHTML({
      label: c.moneyInLabel,
      value: moneyInValue === null ? '—' : formatCurrency(moneyInValue),
      caption: c.moneyInCaption,
    }),
    dataSourceRowHTML({
      label: c.essentialSpendingLabel,
      value: essentialSpendingValue === null ? '—' : formatCurrency(essentialSpendingValue),
      caption: content.shared.essentialSpendingCaption,
    }),
    dataSourceRowHTML({
      label: summaryContent.leftOverEachMonthLabel,
      value: leftOverValue === null ? '—' : formatCurrency(leftOverValue),
      caption: content.shared.leftOverCaption,
    }),
    dataSourceRowHTML({
      label: summaryContent.savedTowardDepositLabel,
      value: savedTowardDepositValue === null ? '—' : formatCurrency(savedTowardDepositValue),
      caption: savedTowardDepositCaption,
    }),
    dataSourceRowHTML({
      label: c.savingsInterestLabel,
      value: `${formatPercent(RATES.bankRate)} ${c.savingsInterestSuffix}`,
      caption: fill(content.shared.bankRateCaptionTemplate, { source: RATES.source }),
    }),
  ];

  container.innerHTML = `
    <div class="sheet-overlay">
      <div class="sheet-scrim" data-action="dismiss"></div>
      <div class="bottom-sheet sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-heading">
        ${sheetHeaderHTML({ heading: c.heading, closeLabel: content.shared.appBar.closeLabel })}
        <div class="bottom-sheet__content">
          <p class="body-text-lg">${c.intro}</p>

          <h3 class="section-heading">${c.readHeading}</h3>
          <div class="assumptions-list">
            ${dataSourceRows.join('')}
          </div>

          <!-- WHAT WE ASSUMED (D133), the third of the three rows frame 12's
               disclosure carried. It qualifies the block above it and is read
               before the block below, so the sheet runs: what we read, what we
               assumed about it, what we cannot see. It carries NO heading of
               its own because its label is one - the same way the row read
               inside the disclosure, where the three rows had no sub-headings
               either. The strings are summaryContent's own, unchanged. -->
          <div class="assumptions-list">
            ${dataSourceRowHTML(summaryContent.whatWeAssumed)}
          </div>

          <h3 class="section-heading">${c.cantSeeHeading}</h3>
          <div class="assumptions-list">
            ${c.cantSeeRows.map((row) => figureRowHTML({ label: row })).join('')}
          </div>

          ${openBankingRowHTML({ title: c.openBankingTitle, caption: c.openBankingCaption })}

          <h3 class="section-heading">${c.wrongHeading}</h3>
          <p class="body-text">${c.wrongBody}</p>

          <p class="legal-text">${reg.guidanceNotAdvice}</p>
        </div>
        ${actionBarDockHTML(`
          <button type="button" class="button button--primary" data-action="dismiss">${c.primaryCta}</button>
        `)}
      </div>
    </div>
  `;

  container.querySelectorAll('[data-action="dismiss"]').forEach((el) => {
    el.addEventListener('click', goBack);
  });

  // Out of prototype scope (build-spec.md section 1) — the same dead-end
  // treatment mip-result-likely.js's "Start my Mortgage in Principle" and
  // position-summary.js's "not my goal" branch already give an out-of-scope
  // continuation: exit to bank home rather than a link that goes nowhere.
  container.querySelector('[data-action="open-banking"]').addEventListener('click', () => {
    window.location.hash = '#/home';
  });
}
