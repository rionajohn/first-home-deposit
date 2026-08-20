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
 * "Start my Mortgage in Principle" has no destination anywhere in
 * build-spec.md or DECISIONS.md: it is the start of the full MIP
 * application (frames 22-28), confirmed out of scope and not built
 * (DECISIONS.md D8). Treated the same way frame 06's other out-of-scope
 * branch is (position-summary.js's "goal-no" handler): exits to bank home
 * rather than being a dead link.
 */
import {
  appBarHTML,
  bindAppBarBack,
  actionBarHTML,
  resultPanelHTML,
  rangeFigureHTML,
  figureRowHTML,
  riskWarningHTML,
  nextStepsCardHTML,
  howThisWorksCardHTML,
  flagRowHTML,
} from '../components/ui.js';
import { formatCurrency, formatPercent } from '../format.js';
import { mipEstimatedLtv } from '../model/model.js';

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
    window.location.hash = '#/mip';
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
      ${resultPanelHTML({ icon: 'assets/icons/status-check.svg', headline: c.resultHeadline, body: c.resultBody })}

      ${rangeFigureHTML({
        lowText: formatCurrency(borrowLow),
        highText: formatCurrency(borrowHigh),
        caption: c.rangeCaption,
        markerPct: 50,
        trackLabel: c.rangeTrackLabel,
      })}
      <p class="legal-text">${reg.estimateDisclosure}</p>

      ${figureRowHTML({ label: fill(c.propertyUpToLabelTemplate, { deposit: formatCurrency(savedTowardDeposit) }), trailing: formatCurrency(maxPropertyValue) })}
      ${figureRowHTML({ label: c.ltvLabel, trailing: ltvResult.error ? '—' : fill(c.ltvValueTemplate, { ltv: formatPercent(ltvResult.value, 0) }) })}
      ${figureRowHTML({ label: c.basedOnLabel, trailing: c.basedOnValue })}

      ${riskWarningHTML(reg.mcob3aRepossessionWarning)}
      ${riskWarningHTML(shared.mipAgreementNotOffer)}

      ${nextStepsCardHTML({
        title: c.nextStepsTitle,
        steps: [
          { number: 1, title: c.step1Title, caption: c.step1Caption, action: 'keep-saving' },
          { number: 2, title: c.step2Title, caption: c.step2Caption, action: 'talk-to-adviser' },
        ],
      })}
      <p class="legal-text">${reg.adviserScope}</p>

      ${howThisWorksCardHTML({
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
      primaryAction: 'start-mip',
      secondaryLabel: c.secondaryCta,
      secondaryAction: 'keep-saving-for-now',
      secondaryStyle: 'button',
    })}
  `;

  bindAppBarBack(container, () => { window.location.hash = '#/tracker'; });

  container.querySelector('[data-action="open-assumptions-borrowing"]').addEventListener('click', () => {
    setState({ returnFrame: '/mip/result/likely' });
    window.location.hash = '#/assumptions/borrowing';
  });

  container.querySelector('[data-action="keep-saving"]').addEventListener('click', () => {
    window.location.hash = '#/tracker';
  });

  container.querySelectorAll('[data-action="talk-to-adviser"]').forEach((el) => {
    el.addEventListener('click', () => {
      setState({ returnFrame: '/mip/result/likely' });
      window.location.hash = '#/mip/adviser';
    });
  });

  container.querySelector('[data-action="start-mip"]').addEventListener('click', () => {
    window.location.hash = '#/home';
  });

  container.querySelector('[data-action="keep-saving-for-now"]').addEventListener('click', () => {
    window.location.hash = '#/tracker';
  });
}
