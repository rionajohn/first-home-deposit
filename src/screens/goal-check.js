/**
 * Frame 08 — Ready for the calculator. Figma node 31:487. Reference:
 * reference/frames/08 Ready for the calculator.png.
 *
 * Single default variant (build-spec.md section 2: goal = house). No
 * figures are entered here — everything is read from state seeded earlier
 * on this page, plus the pinned savings rate from src/model/rates.js
 * (DECISIONS.md D3), so nothing on this screen is a hardcoded number.
 */
import { appBarHTML, bindAppBarBack, actionBarHTML, flagRowHTML, figureRowHTML, infoLinkHTML } from '../components/ui.js';
import { formatCurrency, formatPercent } from '../format.js';
import { RATES } from '../model/rates.js';

export const anchors = ['guidanceNotAdvice'];

export function render(container, ctx) {
  const { state, setState, content } = ctx;
  const c = content['/goal-check'];
  const reg = content.shared.regulatory;

  const savedTowardDeposit = state['saved-toward-deposit'].value;
  const leftOverValue = state['left-over'].value;

  container.innerHTML = `
    ${appBarHTML({ title: c.appBarTitle, left: 'close', appBarLabels: content.shared.appBar })}
    <main class="screen-content" role="main">
      <h2 class="screen-title">${c.headline}</h2>
      <p class="entry-card__body">${c.body}</p>

      <div class="card accounts-card">
        <p class="accounts-card__header-title">${c.alreadyKnowHeading}</p>
        <div class="accounts-card__spacer-lg"></div>
        ${figureRowHTML({ label: c.savedTowardDepositLabel, value: formatCurrency(savedTowardDeposit), caption: c.savedTowardDepositCaption })}
        ${figureRowHTML({ label: c.leftOverEachMonthLabel, value: formatCurrency(leftOverValue), caption: c.leftOverEachMonthCaption })}
        ${figureRowHTML({ label: c.savingsInterestLabel, trailing: `${formatPercent(RATES.bankRate)} ${c.savingsInterestSuffix}` })}
      </div>

      ${infoLinkHTML({ label: c.assumptionsLinkLabel, action: 'open-assumptions' })}

      <div class="card calculator-handoff-card">
        <h3 class="section-heading">${c.handoffHeading}</h3>
        ${figureRowHTML({ label: c.propertyRowLabel, caption: c.propertyRowCaption })}
        ${figureRowHTML({ label: c.depositRowLabel, caption: c.depositRowCaption })}
        ${figureRowHTML({ label: c.everythingElseLabel, caption: c.everythingElseCaption })}
        <button type="button" class="button button--primary" data-action="open-calculator">${c.openCalculatorCta}</button>
      </div>

      ${flagRowHTML(c.flagLabel)}
      <p class="legal-text">${reg.guidanceNotAdvice}</p>
    </main>
    ${actionBarHTML({ primaryLabel: c.primaryCta, primaryAction: 'track-goal' })}
  `;

  bindAppBarBack(container);

  // One link to frame 29, not two. The "How we worked these out" chevron row
  // inside the "What we already know" card opened exactly the same sheet as
  // the underlined link below the card.
  container.querySelector('[data-action="open-assumptions"]').addEventListener('click', () => {
    setState({ returnFrame: '/goal-check' });
    window.location.hash = '#/assumptions/saving';
  });

  container.querySelector('[data-action="open-calculator"]').addEventListener('click', () => {
    setState({ calculatorEntered: true });
    window.location.hash = '#/calculator/property';
  });

  container.querySelector('[data-action="track-goal"]').addEventListener('click', () => {
    window.location.hash = '#/tracker';
  });
}
