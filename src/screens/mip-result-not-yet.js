/**
 * Frame 21 — Result, not yet. Figma node 104:1376. Reference:
 * reference/frames/21 Result - not yet.png.
 *
 * needs-work-outcome variant (build-spec.md section 2). The headline gap
 * figure is model.js's gap() (build-spec.md section 4, confirmed by its own
 * worked example: deposit-target 19,000 less saved-toward-deposit 14,600 =
 * 4,400). "What you'd need to borrow" and "What a lender would typically
 * offer" are neededLoanAmount() and borrowRange().high (model.js) — computed
 * live rather than read from state, since build-spec.md section 1 commits
 * no section 6 figure on this branch of the 19b transition (only "gap",
 * which has no section 6 slot of its own).
 */
import {
  appBarHTML,
  bindAppBarLeading,
  actionBarHTML,
  resultPanelHTML,
  figureDisplayHTML,
  figureRowHTML,
  riskWarningHTML,
  nextStepsCardHTML,
  howThisWorksCardHTML,
  flagRowHTML,
  rerenderInPlace,
} from '../components/ui.js';
import { formatCurrency, formatMonthsDuration } from '../format.js';
import { gap, neededLoanAmount, borrowRange, maxProperty, monthsToReachAmount } from '../model/model.js';
import { arrowUp } from '../icons.js';

export const anchors = ['guidanceNotAdvice', 'adviserScope', 'mcob3aRepossessionWarning', 'estimateDisclosure'];

function fill(template, values) {
  return Object.entries(values).reduce((s, [k, v]) => s.replace(`{${k}}`, v), template);
}

export function render(container, ctx) {
  const { state, setState, content } = ctx;
  const c = content['/mip/result/not-yet'];
  const summaryContent = content['/position/summary'];
  const reg = content.shared.regulatory;
  const shared = content.shared;

  if (state['deposit-target'].value === null) {
    window.location.replace('#/mip');
    return;
  }

  const gapResult = gap(state);
  const neededResult = neededLoanAmount(state);
  const rangeResult = borrowRange(state);
  const maxPropertyResult = maxProperty(state);
  const essentialSpending = state['essential-spending'].value;
  const leftOverValue = state['left-over'].value;
  const savedTowardDeposit = state['saved-toward-deposit'].value;
  const savingsRate = state['savings-rate'].value;

  const monthsToClose = savingsRate
    ? monthsToReachAmount({ startingBalance: savedTowardDeposit, targetAmount: state['deposit-target'].value, monthlyAmount: savingsRate })
    : Infinity;

  container.innerHTML = `
    ${appBarHTML({ title: c.appBarTitle, left: 'close', appBarLabels: shared.appBar })}
    <main class="screen-content" role="main">
      ${resultPanelHTML({ icon: arrowUp, headline: c.resultHeadline, body: c.resultBody })}

      ${figureDisplayHTML({ value: gapResult.error ? '—' : formatCurrency(gapResult.value), caption: c.gapCaption })}
      <p class="provenance-caption provenance-caption--center">${c.gapProvenanceCaption}</p>
      <p class="legal-text">${reg.estimateDisclosure}</p>

      ${figureRowHTML({ label: c.needBorrowLabel, trailing: neededResult.error ? '—' : formatCurrency(neededResult.value), caption: c.needBorrowCaption })}
      ${figureRowHTML({ label: c.lenderOfferLabel, trailing: rangeResult.error ? '—' : fill(c.lenderOfferValueTemplate, { amount: formatCurrency(rangeResult.value.high) }), caption: c.lenderOfferCaption })}
      ${figureRowHTML({ label: c.basedOnLabel, trailing: c.basedOnValue })}

      ${riskWarningHTML(reg.mcob3aRepossessionWarning)}
      ${riskWarningHTML(shared.mipAgreementNotOffer)}

      ${nextStepsCardHTML({
        title: c.nextStepsTitle,
        steps: [
          {
            number: 1,
            title: fill(c.step1TitleTemplate, { amount: gapResult.error ? '—' : formatCurrency(gapResult.value) }),
            caption: fill(c.step1CaptionTemplate, { months: Number.isFinite(monthsToClose) ? formatMonthsDuration(monthsToClose) : '—' }),
            action: 'update-goal',
          },
          {
            number: 2,
            title: fill(c.step2TitleTemplate, { amount: maxPropertyResult.error ? '—' : formatCurrency(maxPropertyResult.value) }),
            caption: c.step2Caption,
            action: 'change-property-target',
          },
          { number: 3, title: c.step3Title, caption: c.step3Caption, action: 'talk-to-adviser' },
        ],
      })}
      <p class="legal-text">${reg.adviserScope}</p>

      ${howThisWorksCardHTML({
        id: 'mip-not-yet-how-we-worked',
        open: state.mipNotYetHowWeWorkedOpen,
        title: c.howWeWorkedTitle,
        intro: summaryContent.howWeWorkedIntro,
        rows: [
          summaryContent.whatWeRead,
          { ...summaryContent.whatWeWorkedOut, value: fill(summaryContent.whatWeWorkedOut.value, { essential: formatCurrency(essentialSpending), leftOver: formatCurrency(leftOverValue) }) },
          summaryContent.whatWeAssumed,
        ],
        navLabel: c.seeHowWeWorkedLabel,
        navAction: 'open-assumptions-borrowing',
        footnote: c.automatedNote,
      })}

      ${flagRowHTML(c.flagLabel)}
      <p class="legal-text">${reg.guidanceNotAdvice}</p>
    </main>
    ${actionBarHTML({
      primaryLabel: c.primaryCta,
      primaryAction: 'update-goal',
      secondaryLabel: c.secondaryCta,
      secondaryAction: 'see-what-changes',
      secondaryStyle: 'button',
    })}
  `;

  bindAppBarLeading(container);

  container.querySelectorAll('[data-action="update-goal"]').forEach((el) => {
    el.addEventListener('click', () => { window.location.hash = '#/tracker'; });
  });

  // The card is a disclosure now (D12). rerenderInPlace, not a bare render:
  // it restores the scroller's offset and refocuses the very button that was
  // pressed (found by its data-action + data-disclosure-id), so the card
  // opens under the participant's thumb rather than throwing the screen back
  // to the top and dropping focus to <body>.
  container.querySelectorAll('[data-action="toggle-disclosure"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const next = setState({ mipNotYetHowWeWorkedOpen: !state.mipNotYetHowWeWorkedOpen });
      rerenderInPlace(container, render, { ...ctx, state: next });
    });
  });

  // The card's own nav row. It rendered from the day this screen was built
  // and nothing ever bound it, so "See how we worked this out" was a dead
  // control: frame 20 binds the identical row, and the only working route
  // from here into the borrowing sheet was the action bar's secondary
  // button. Same target, same returnFrame as that button.
  container.querySelector('[data-action="open-assumptions-borrowing"]').addEventListener('click', () => {
    setState({ returnFrame: '/mip/result/not-yet' });
    window.location.hash = '#/assumptions/borrowing';
  });

  container.querySelector('[data-action="change-property-target"]').addEventListener('click', () => {
    window.location.hash = '#/calculator/property';
  });

  container.querySelectorAll('[data-action="talk-to-adviser"]').forEach((el) => {
    el.addEventListener('click', () => {
      setState({ returnFrame: '/mip/result/not-yet' });
      window.location.hash = '#/mip/adviser';
    });
  });

  container.querySelector('[data-action="see-what-changes"]').addEventListener('click', () => {
    setState({ returnFrame: '/mip/result/not-yet' });
    window.location.hash = '#/assumptions/borrowing';
  });
}
