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
 *
 * THIS SCREEN IS THE END OF THE FLOW, AND HAS NO ACTION BAR (DECISIONS.md D52,
 * applying D50's frame 20 treatment here). It used to carry two: "Update my
 * savings goal", which repeated the route its own first next-step row already
 * offered, and "See what changes this", which repeated the borrowing sheet the
 * "How we worked this out" card's nav row already opens. Both are gone with
 * their content keys. The screen is one of six with no bar at all - see
 * `mountActionBars` in action-bar.js, which clears the published height so
 * nothing carries in from the screen before.
 *
 * TWO OF THE THREE NEXT-STEP ROWS ARE NO LONGER CONTROLS. Rows 1 and 2 declare
 * no action, so `nextStepsCardHTML` draws them as plain rows - no chevron, no
 * focus stop. Row 3, "Talk to someone about it", keeps its action, its chevron
 * and its route to `/mip/adviser`: it is the MCOB 4.8A + Consumer Duty adviser
 * route (D10, SPEC.md's anchor map), and SPEC.md's verification step 4 requires
 * it reachable from here as well as from frame 20.
 *
 * THE EXITS ARE THE HEADER X AND THE TAB BAR, as on frame 20. build-spec.md
 * section 1's "21 -> Back to my deposit -> 15" row is served by the X, which
 * goes through `exitFlow()` to `journeyEntryPoint`; that row is marked
 * "Assumed", and D50 read frame 20's equivalent the same way.
 */
import {
  appBarHTML,
  bindAppBarLeading,
  resultPanelHTML,
  figureDisplayHTML,
  figureRowHTML,
  riskWarningHTML,
  nextStepsCardHTML,
  howThisWorksCardHTML,
  flagRowHTML,
  rerenderInPlace,
} from '../components/ui.js';
import { LISA_CAP_PROPERTY_VALUE } from '../model/rates.js';
import { formatCurrency, formatYear } from '../format.js';
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
          // ROWS 1 AND 2 DECLARE NO ACTION, so `nextStepsCardHTML` draws each as
          // a plain <div> with no chevron and no focus stop (DECISIONS.md D52).
          // Both are statements about what a different figure would do - save
          // this much more, aim at a property this size - not routes. No flag
          // and no second mechanism: the absence of `action` is the whole of it,
          // exactly as frame 20's first row already works (D50).
          {
            number: 1,
            title: fill(c.step1TitleTemplate, { amount: gapResult.error ? '—' : formatCurrency(gapResult.value) }),
            caption: fill(c.step1CaptionTemplate, { year: Number.isFinite(monthsToClose) ? formatYear(Math.ceil(monthsToClose), state.sessionAnchor) : '—' }),
          },
          {
            number: 2,
            title: fill(c.step2TitleTemplate, { amount: maxPropertyResult.error ? '—' : formatCurrency(maxPropertyResult.value) }),
            // G72: the title above carries `max-property`, which exceeds the
            // Lifetime ISA cap at the seeded values. Restated as a second
            // sentence on this step's own caption, only where it applies, so
            // it sits with the figure rather than as a banner of its own.
            caption: !maxPropertyResult.error && maxPropertyResult.value > LISA_CAP_PROPERTY_VALUE
              ? `${c.step2Caption} ${fill(c.lisaCapNoteTemplate, { cap: formatCurrency(LISA_CAP_PROPERTY_VALUE) })}`
              : c.step2Caption,
          },
          // ROW 3 KEEPS ITS ACTION, ITS CHEVRON AND ITS ROUTE. The adviser route
          // rests on MCOB 4.8A and the Consumer Duty consumer support outcome
          // (D10, SPEC.md's anchor map), and SPEC.md's verification step 4
          // requires it reachable from BOTH 20 and 21. Same row, same reason, on
          // both result screens.
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
  `;

  bindAppBarLeading(container);

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

  container.querySelectorAll('[data-action="talk-to-adviser"]').forEach((el) => {
    el.addEventListener('click', () => {
      setState({ returnFrame: '/mip/result/not-yet' });
      window.location.hash = '#/mip/adviser';
    });
  });
}
