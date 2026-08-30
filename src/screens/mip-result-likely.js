/**
 * Frame 20 — Result, likely to be considered. Figma node 104:1278.
 * Reference: reference/frames/20 Result - likely to be considered.png.
 *
 * positive-outcome variant (build-spec.md section 2). borrow-low,
 * borrow-high and max-property are read straight from state — committed by
 * mip-running.js on the 19b -> 20 transition (build-spec.md section 1).
 * Loan-to-Value here is mipEstimatedLtv (model.js), not state['ltv'] — see
 * that function's own comment for why the two aren't the same figure.
 *
 * THIS SCREEN IS THE END OF THE FLOW, AND HAS NO ACTION BAR (DECISIONS.md
 * D50). It used to carry two: "Start my Mortgage in Principle", which had no
 * destination anywhere in build-spec.md or DECISIONS.md because it begins the
 * full MIP application (frames 22-28, out of scope and not built, D8) and so
 * exited to bank home; and "Keep saving for now", which repeated the tracker
 * route the first next-step row already offered. Both are gone. The screen is
 * one of five with no bar at all - see `mountActionBars` in action-bar.js,
 * which clears the published height so nothing carries in from the screen
 * before.
 *
 * ONE NEXT-STEP ROW IS STILL A CONTROL AND ONE IS NOT. "Talk to someone about
 * it" keeps its action, its chevron and its route to `/mip/adviser`: it is the
 * MCOB 4.8A + Consumer Duty adviser route (D10, SPEC.md's anchor map), and
 * SPEC.md's verification step 4 requires it reachable from here. "Keep saving
 * to lower your Loan-to-Value" declares no action, so `nextStepsCardHTML`
 * draws it as a plain row - no chevron, no focus stop.
 */
import {
  appBarHTML,
  bindAppBarLeading,
  resultPanelHTML,
  rangeFigureHTML,
  figureRowHTML,
  riskWarningHTML,
  nextStepsCardHTML,
  howThisWorksCardHTML,
  flagRowHTML,
  rerenderInPlace,
} from '../components/ui.js';
import { LISA_CAP_PROPERTY_VALUE } from '../model/rates.js';
import { formatCurrency, formatPercent } from '../format.js';
import { mipEstimatedLtv } from '../model/model.js';
import { checkmarkCircle } from '../icons.js';

export const anchors = ['guidanceNotAdvice', 'adviserScope', 'mcob3aRepossessionWarning', 'estimateDisclosure'];

function fill(template, values) {
  return Object.entries(values).reduce((s, [k, v]) => s.replace(`{${k}}`, v), template);
}

export function render(container, ctx) {
  const { state, setState, content } = ctx;
  const c = content['/mip/result/likely'];
  const summaryContent = content['/position/summary'];
  const reg = content.shared.regulatory;
  const shared = content.shared;

  if (state['borrow-high'].value === null) {
    window.location.replace('#/mip');
    return;
  }

  const borrowLow = state['borrow-low'].value;
  const borrowHigh = state['borrow-high'].value;
  const maxPropertyValue = state['max-property'].value;
  const savedTowardDeposit = state['saved-toward-deposit'].value;
  const essentialSpending = state['essential-spending'].value;
  const leftOverValue = state['left-over'].value;
  const ltvResult = mipEstimatedLtv(state);

  container.innerHTML = `
    ${appBarHTML({ title: c.appBarTitle, left: 'close', appBarLabels: shared.appBar })}
    <main class="screen-content" role="main">
      ${resultPanelHTML({ icon: checkmarkCircle, headline: c.resultHeadline, body: c.resultBody })}

      ${rangeFigureHTML({
        lowText: formatCurrency(borrowLow),
        highText: formatCurrency(borrowHigh),
        caption: c.rangeCaption,
        markerPct: 50,
        trackLabel: c.rangeTrackLabel,
      })}
      <p class="legal-text">${reg.estimateDisclosure}</p>

      ${figureRowHTML({ label: fill(c.propertyUpToLabelTemplate, { deposit: formatCurrency(savedTowardDeposit) }), trailing: formatCurrency(maxPropertyValue), caption: c.propertyUpToCaption })}
      <!-- G72: the figure above can exceed the Lifetime ISA cap, and did on
           every seeded session. Restated here only where it does. -->
      ${maxPropertyValue > LISA_CAP_PROPERTY_VALUE
        ? `<p class="provenance-caption">${fill(c.lisaCapNoteTemplate, { cap: formatCurrency(LISA_CAP_PROPERTY_VALUE) })}</p>`
        : ''}
      ${figureRowHTML({ label: c.ltvLabel, trailing: ltvResult.error ? '—' : fill(c.ltvValueTemplate, { ltv: formatPercent(ltvResult.value, 0) }), caption: c.ltvCaption })}
      ${figureRowHTML({ label: c.basedOnLabel, trailing: c.basedOnValue })}

      ${riskWarningHTML(reg.mcob3aRepossessionWarning)}
      ${riskWarningHTML(shared.mipAgreementNotOffer)}

      ${nextStepsCardHTML({
        title: c.nextStepsTitle,
        steps: [
          // No action, so no chevron and no focus stop: this row is a
          // statement about what saving more would do, not a route (D50).
          { number: 1, title: c.step1Title, caption: c.step1Caption },
          { number: 2, title: c.step2Title, caption: c.step2Caption, action: 'talk-to-adviser' },
        ],
      })}
      <p class="legal-text">${reg.adviserScope}</p>

      ${howThisWorksCardHTML({
        id: 'mip-likely-how-we-worked',
        open: state.mipLikelyHowWeWorkedOpen,
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

  container.querySelector('[data-action="open-assumptions-borrowing"]').addEventListener('click', () => {
    setState({ returnFrame: '/mip/result/likely' });
    window.location.hash = '#/assumptions/borrowing';
  });

  // The card is a disclosure now (D12). rerenderInPlace, not a bare render:
  // it restores the scroller's offset and refocuses the very button that was
  // pressed (found by its data-action + data-disclosure-id), so the card
  // opens under the participant's thumb rather than throwing the screen back
  // to the top and dropping focus to <body>.
  container.querySelectorAll('[data-action="toggle-disclosure"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const next = setState({ mipLikelyHowWeWorkedOpen: !state.mipLikelyHowWeWorkedOpen });
      rerenderInPlace(container, render, { ...ctx, state: next });
    });
  });

  container.querySelectorAll('[data-action="talk-to-adviser"]').forEach((el) => {
    el.addEventListener('click', () => {
      setState({ returnFrame: '/mip/result/likely' });
      window.location.hash = '#/mip/adviser';
    });
  });
}
