/**
 * Frame 13 — Loan-to-Value. Figma node 99:1066. Reference:
 * reference/frames/13 Deposit calculator - Loan-to-Value.png.
 *
 * Reached as a push (not a sheet — SPEC.md's transition rules list 03b, 10c,
 * 13b, 29, 30, 31, 32 as the sheets; 13 isn't one of them) from every
 * "What rates are like at this Loan-to-Value" row on frames 12, 15 and 16,
 * and from frame 13b's dismissal. Its close icon and "Got it" primary button
 * both return to `returnFrame`, the same pattern frame 13b itself uses.
 *
 * The comparison table and the deposit/mortgage proportion rows all plot
 * against CHART_DEPOSIT_PCTS (5/10/15%) rather than the participant's own
 * chosen deposit-pct — the same fixed-band precedent frame 12's growth
 * chart and frames 15/16's rates-card list rows already establish. The
 * table's middle column is bordered to mark "the row matching the
 * participant's own Loan-to-Value band" (build-spec.md section 2) when
 * their actual deposit-pct is an exact match; frame 12b/09's chip row only
 * ever offers DEPOSIT_PCT_OPTIONS values, three of which (5/10/15%) are
 * exact matches and two (20/25%) fall outside this fixed 3-column table, in
 * which case no column is highlighted.
 */
import {
  appBarHTML,
  bindAppBarBack,
  actionBarHTML,
  flagRowHTML,
  infoLinkHTML,
  proportionRowsHTML,
  riskWarningHTML,
  howThisWorksCardHTML,
  infoBannerHTML,
} from '../components/ui.js';
import { formatCurrency, formatPercent } from '../format.js';
import {
  depositTarget,
  loanAmount,
  rateBandForDepositPct,
  monthlyMortgagePayment,
  totalMortgageInterest,
} from '../model/model.js';
import { CHART_DEPOSIT_PCTS, MORTGAGE_TERM_YEARS } from '../model/rates.js';
import { chartBarCircle, chevronRight, playCircle } from '../icons.js';

export const anchors = ['guidanceNotAdvice', 'mcob3aRepossessionWarning'];

function fill(template, values) {
  return Object.entries(values).reduce((s, [k, v]) => s.replace(`{${k}}`, v), template);
}

export function render(container, ctx) {
  const { state, setState, content } = ctx;
  const c = content['/learn/ltv'];
  const summaryContent = content['/position/summary'];
  const reg = content.shared.regulatory;

  if (state['property-value'].value === null || state['deposit-pct'].value === null) {
    window.location.hash = '#/calculator/result';
    return;
  }

  const returnFrame = state.returnFrame ?? '/tracker';
  const propertyValue = state['property-value'].value;
  const depositPct = state['deposit-pct'].value;
  const target = depositTarget(state);
  const loan = loanAmount(state);
  const essentialSpending = state['essential-spending'].value;
  const leftOverValue = state['left-over'].value;

  const columns = CHART_DEPOSIT_PCTS.map((pct) => {
    const depositAmt = propertyValue * pct;
    const loanAmt = propertyValue - depositAmt;
    const band = rateBandForDepositPct(pct);
    const centralRate = (band.low + band.high) / 2;
    const monthly = monthlyMortgagePayment({ loanAmount: loanAmt, annualRate: centralRate, termYears: MORTGAGE_TERM_YEARS });
    const interest = totalMortgageInterest({ loanAmount: loanAmt, monthlyPayment: monthly, termYears: MORTGAGE_TERM_YEARS });
    return {
      pct,
      ltv: 1 - pct,
      depositAmt,
      rateLabel: `${formatPercent(band.low, 1)}–${formatPercent(band.high, 1)}`,
      monthly,
      interest,
      highlighted: pct === depositPct,
    };
  });

  const monthlyDiff = columns[0].monthly - columns[columns.length - 1].monthly;
  const interestDiff = columns[0].interest - columns[columns.length - 1].interest;

  container.innerHTML = `
    ${appBarHTML({ title: c.appBarTitle, left: 'close', appBarLabels: content.shared.appBar })}
    <main class="screen-content" role="main">
      <h2 class="screen-title">${c.headline}</h2>
      ${infoLinkHTML({ label: c.assumptionsLinkLabel, action: 'open-assumptions-deposit' })}
      <p class="body-text-lg-primary">${c.body}</p>

      ${proportionRowsHTML([
        {
          label: c.depositPartLabel,
          valueText: formatCurrency(target.value),
          pct: depositPct * 100,
          pctText: fill(c.depositPartCaptionTemplate, { pct: formatPercent(depositPct, 0) }),
        },
        {
          label: c.mortgagePartLabel,
          valueText: formatCurrency(loan.value),
          pct: (1 - depositPct) * 100,
          pctText: fill(c.mortgagePartCaptionTemplate, { pct: formatPercent(1 - depositPct, 0) }),
        },
      ])}

      <h3 class="section-heading">${c.comparisonHeading}</h3>
      <div class="ltv-comparison-table-wrap">
        <table class="ltv-comparison-table">
          <thead>
            <tr>
              <th></th>
              ${columns.map((col) => `<th class="${col.highlighted ? 'ltv-comparison-table__highlight' : ''}">${formatPercent(col.pct, 0)}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">${c.tableDepositRowLabel}</th>
              ${columns.map((col) => `<td class="${col.highlighted ? 'ltv-comparison-table__highlight' : ''}">${formatCurrency(col.depositAmt)}</td>`).join('')}
            </tr>
            <tr>
              <th scope="row">${c.tableLtvRowLabel}</th>
              ${columns.map((col) => `<td class="${col.highlighted ? 'ltv-comparison-table__highlight' : ''}">${formatPercent(col.ltv, 0)}</td>`).join('')}
            </tr>
            <tr>
              <th scope="row">${c.tableRateRowLabel}</th>
              ${columns.map((col) => `<td class="${col.highlighted ? 'ltv-comparison-table__highlight' : ''}">${col.rateLabel}</td>`).join('')}
            </tr>
            <tr>
              <th scope="row">${c.tableMonthlyRowLabel}</th>
              ${columns.map((col) => `<td class="${col.highlighted ? 'ltv-comparison-table__highlight' : ''}">${formatCurrency(col.monthly)}</td>`).join('')}
            </tr>
            <tr>
              <th scope="row">${fill(c.tableInterestRowLabelTemplate, { years: MORTGAGE_TERM_YEARS })}</th>
              ${columns.map((col) => `<td class="${col.highlighted ? 'ltv-comparison-table__highlight' : ''}">${formatCurrency(col.interest)}</td>`).join('')}
            </tr>
          </tbody>
        </table>
      </div>

      ${infoBannerHTML(fill(c.bannerTextTemplate, { monthlyDiff: formatCurrency(monthlyDiff), interestDiff: formatCurrency(interestDiff), years: MORTGAGE_TERM_YEARS }))}

      <p class="body-text-lg-primary">${c.balancingParagraph}</p>
      <p class="provenance-caption">${fill(c.comparisonCaptionTemplate, { years: MORTGAGE_TERM_YEARS })}</p>

      ${riskWarningHTML(c.rateCautionText)}
      ${riskWarningHTML(reg.mcob3aRepossessionWarning)}

      <div class="card explainer-library-card">
        <p class="filled-in-details-card__title">${c.explainerHeading}</p>
        <hr class="divider" />
        <button type="button" class="explainer-row" data-action="open-video">
          ${playCircle({ size: 'large', className: 'explainer-row__icon' })}
          <div class="explainer-row__content">
            <p class="explainer-row__title">${c.explainerVideoTitle}</p>
            <p class="explainer-row__duration">${c.explainerVideoDuration}${state.ltvVideoSeen ? ` · ${c.explainerWatchedLabel}` : ''}</p>
          </div>
          ${chevronRight({ size: 'body', className: 'list-row__chevron' })}
        </button>
        <hr class="divider" />
        <button type="button" class="explainer-row" data-action="open-diagram">
          ${chartBarCircle({ size: 'large', className: 'explainer-row__icon' })}
          <div class="explainer-row__content">
            <p class="explainer-row__title">${c.explainerDiagramTitle}</p>
            <p class="explainer-row__duration">${fill(c.explainerDiagramDurationTemplate, { property: formatCurrency(propertyValue) })}</p>
          </div>
          ${chevronRight({ size: 'body', className: 'list-row__chevron' })}
        </button>
      </div>

      ${howThisWorksCardHTML({
        title: c.howWeWorkedTitle,
        intro: c.howWeWorkedIntro,
        rows: [
          summaryContent.whatWeRead,
          { ...summaryContent.whatWeWorkedOut, value: fill(summaryContent.whatWeWorkedOut.value, { essential: formatCurrency(essentialSpending), leftOver: formatCurrency(leftOverValue) }) },
          summaryContent.whatWeAssumed,
        ],
        navLabel: c.seeHowWeWorkedLabel,
        navAction: 'open-assumptions-saving',
      })}

      ${flagRowHTML(c.flagLabel)}
      <p class="legal-text">${reg.guidanceNotAdvice}</p>
    </main>
    ${actionBarHTML({ primaryLabel: c.primaryCta, primaryAction: 'done' })}
  `;

  bindAppBarBack(container, () => {
    window.location.hash = `#${returnFrame}`;
  });

  container.querySelector('[data-action="done"]').addEventListener('click', () => {
    window.location.hash = `#${returnFrame}`;
  });

  container.querySelector('[data-action="open-assumptions-deposit"]').addEventListener('click', () => {
    setState({ returnFrame: '/learn/ltv' });
    window.location.hash = '#/assumptions/deposit';
  });

  container.querySelector('[data-action="open-assumptions-saving"]').addEventListener('click', () => {
    setState({ returnFrame: '/learn/ltv' });
    window.location.hash = '#/assumptions/saving';
  });

  ['open-video', 'open-diagram'].forEach((action) => {
    container.querySelector(`[data-action="${action}"]`).addEventListener('click', () => {
      setState({ returnFrame: '/learn/ltv' });
      window.location.hash = '#/learn/ltv/video';
    });
  });
}
