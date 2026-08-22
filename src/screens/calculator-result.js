/**
 * Frame 12 — Your deposit range. Figma node 66:887. Reference:
 * reference/frames/12 Deposit calculator - your deposit range.png.
 *
 * Variants built (build-spec.md section 2):
 *   - within the chart window: months-to-target <= 60 — the normal case
 *   - beyond the chart window: months-to-target > 60 — no wireframe drawn
 *     (DECISIONS.md D7 fallback); the chart still plots to 5 years
 *     (build-spec.md's own rule) with a note that it may take longer
 *   - unreachable: savings-rate (here, both monthly-low and monthly-high)
 *     = 0 — no wireframe drawn (D7 fallback); the growth chart and timing
 *     rows are replaced with the shared empty-state-card pattern
 *
 * The deposit range, chart thresholds and timing rows all plot against
 * CHART_DEPOSIT_PCTS (5/10/15%) rather than the participant's own chosen
 * deposit-pct (build-spec.md section 2's own instruction: "thresholds at 5,
 * 10, 15%") — the range figure's position marker is where their actual
 * committed deposit-target sits within that fixed band.
 *
 * Two "how did we work this out" links are wired to their build-spec.md
 * section 1 destinations: the one directly under the range figure goes to
 * frame 30 (deposit and rates); the one inside the How-this-works card
 * (which repeats frame 06's own money-in/essential-spending card verbatim)
 * goes to frame 29 (saving amount), matching how position-summary.js wires
 * the same card.
 */
import {
  appBarHTML,
  bindAppBarBack,
  infoBannerHTML,
  flagRowHTML,
  rangeFigureHTML,
  growthChartHTML,
  infoLinkHTML,
  howThisWorksCardHTML,
  emptyStateCardHTML,
  rerenderInPlace,
} from '../components/ui.js';
import { formatCurrency, formatPercent, formatMonthsDuration } from '../format.js';
import { balanceAtMonth, monthsToReachAmount, checkpointAmount, monthsToTarget } from '../model/model.js';
import { RATES, CHART_DEPOSIT_PCTS, CHART_WINDOW_MONTHS } from '../model/rates.js';

export const anchors = ['guidanceNotAdvice', 'estimateDisclosure'];

function fill(template, values) {
  return Object.entries(values).reduce((s, [k, v]) => s.replace(`{${k}}`, v), template);
}

export function render(container, ctx) {
  const { state, setState, content } = ctx;
  const c = content['/calculator/result'];
  const summaryContent = content['/position/summary'];
  const reg = content.shared.regulatory;

  if (state['deposit-target'].value === null || state['months-to-target'].provenance === null) {
    window.location.hash = '#/calculator/review';
    return;
  }

  const propertyValue = state['property-value'].value;
  // Null with no accounts linked: the chart and the timing rows then project
  // from a zero starting balance, matching monthsToTarget().
  const savedTowardDeposit = state['saved-toward-deposit'].value ?? 0;
  const monthlyLow = state['monthly-low'].value;
  const monthlyHigh = state['monthly-high'].value;
  const depositTargetValue = state['deposit-target'].value;
  const essentialSpending = state['essential-spending'].value;
  const leftOverValue = state['left-over'].value;

  // A session that never linked an account reaches this screen with
  // essential-spending, left-over and saved-toward-deposit all unset
  // (GAPS.md G50, DECISIONS.md D24). The projection itself is fine — it
  // starts from a zero balance, which is what the model already assumes in
  // general mode — but the How-this-works card must not repeat frame 06's
  // "what we read from your accounts" rows, because nothing was read.
  const fromAccounts = leftOverValue !== null;

  const [lowPctValue, midPctValue, highPctValue] = CHART_DEPOSIT_PCTS;
  const rangeLowAmount = propertyValue * lowPctValue;
  const rangeHighAmount = propertyValue * highPctValue;

  const monthsResult = monthsToTarget(state);
  const unreachable = monthsResult.error === 'unreachable';
  const beyondWindow = monthsResult.error === 'beyond-window';

  container.innerHTML = `
    ${appBarHTML({ title: c.appBarTitle, left: 'back', appBarLabels: content.shared.appBar })}
    <main class="screen-content" role="main">
      <h2 class="screen-title">${fill(c.headlineTemplate, { property: formatCurrency(propertyValue), low: formatCurrency(rangeLowAmount), high: formatCurrency(rangeHighAmount) })}</h2>

      ${rangeFigureHTML({
        lowText: formatCurrency(rangeLowAmount),
        highText: formatCurrency(rangeHighAmount),
        caption: fill(c.rangeCaptionTemplate, { lowPct: formatPercent(lowPctValue, 0), highPct: formatPercent(highPctValue, 0) }),
        markerPct: ((depositTargetValue - rangeLowAmount) / (rangeHighAmount - rangeLowAmount)) * 100,
        trackLabel: fill(c.goalTrackLabelTemplate, { target: formatCurrency(depositTargetValue) }),
      })}
      <p class="provenance-caption">${fromAccounts ? c.provenanceCaption : c.provenanceCaptionGeneral}</p>
      ${infoLinkHTML({ label: c.assumptionsLinkLabel, action: 'open-assumptions-deposit' })}

      ${unreachable ? emptyStateCardHTML({ title: c.unreachableHeadline, body: c.unreachableBody, ctaLabel: c.unreachableCta, ctaAction: 'set-amount' }) : `
        <div class="timing-figures">
          ${CHART_DEPOSIT_PCTS.map((pct) => {
            const targetAmount = propertyValue * pct;
            const monthsSoon = monthsToReachAmount({ startingBalance: savedTowardDeposit, targetAmount, monthlyAmount: monthlyHigh });
            const monthsLater = monthsToReachAmount({ startingBalance: savedTowardDeposit, targetAmount, monthlyAmount: monthlyLow });
            const pctLabel = formatPercent(pct, 0);
            if (savedTowardDeposit >= targetAmount) {
              return `<p>${fill(c.timingAlreadyTemplate, { pct: pctLabel })}</p>`;
            }
            const soonText = formatMonthsDuration(monthsSoon);
            // monthly-low can be dragged to £0 (monthly-high can't, while
            // unreachable's own guard above still lets savings-rate's
            // midpoint be positive) — Infinity months at that end isn't
            // shown as a range partner, just the achievable end.
            if (!Number.isFinite(monthsLater)) {
              return `<p>${fill(c.timingWithinTemplate, { pct: pctLabel, months: soonText })}</p>`;
            }
            const laterText = formatMonthsDuration(monthsLater);
            // Under a year, a two-sided range (e.g. "2 months to 3 months")
            // is fussier than it is informative — collapse to a single,
            // conservative "within" statement using the slower end. At a
            // year or more the gap between ends is worth showing in full.
            if (soonText === laterText || Math.ceil(monthsLater) < 12) {
              return `<p>${fill(c.timingWithinTemplate, { pct: pctLabel, months: laterText })}</p>`;
            }
            return `<p>${fill(c.timingRangeTemplate, { pct: pctLabel, low: soonText, high: laterText })}</p>`;
          }).join('')}
        </div>
        <p class="provenance-caption">${fromAccounts ? c.provenanceCaption : c.provenanceCaptionGeneral}</p>
      `}

      <p class="legal-text">${reg.estimateDisclosure}</p>

      ${unreachable ? '' : `
        <h3 class="section-heading">${c.chartHeading}</h3>
        ${(() => {
          const points = [];
          for (let i = 1; i <= 12; i += 1) {
            const months = Math.round((i * CHART_WINDOW_MONTHS) / 12);
            points.push({ months, low: balanceAtMonth({ startingBalance: savedTowardDeposit, monthlyAmount: monthlyLow, months }), high: balanceAtMonth({ startingBalance: savedTowardDeposit, monthlyAmount: monthlyHigh, months }) });
          }
          const maxScale = Math.max(rangeHighAmount, ...points.map((p) => p.high)) * 1.05;
          const thresholds = CHART_DEPOSIT_PCTS.map((pct) => ({
            label: fill(c.thresholdLabelTemplate, { pct: formatPercent(pct, 0), amount: formatCurrency(propertyValue * pct) }),
            pct: ((propertyValue * pct) / maxScale) * 100,
          }));
          const chartPoints = points.map((p) => ({
            label: formatMonthsDuration(p.months),
            lowPct: (p.low / maxScale) * 100,
            highPct: (p.high / maxScale) * 100,
          }));
          const xAxisLabels = [c.xAxisNow, formatMonthsDuration(CHART_WINDOW_MONTHS / 3, { abbreviated: true }), formatMonthsDuration((CHART_WINDOW_MONTHS / 3) * 2, { abbreviated: true }), formatMonthsDuration(CHART_WINDOW_MONTHS, { abbreviated: true })];
          return growthChartHTML({
            thresholds,
            points: chartPoints,
            xAxisLabels,
            legend: [fill(c.legendTemplate, { amount: formatCurrency(monthlyHigh) }), fill(c.legendTemplate, { amount: formatCurrency(monthlyLow) })],
            yTop: formatCurrency(maxScale),
            yBottom: c.yAxisFloor,
          });
        })()}
        <p class="legal-text">${fill(c.chartCaptionTemplate, { aer: formatPercent(RATES.bankRate) })}</p>
        ${beyondWindow ? infoBannerHTML(c.beyondWindowNote) : ''}
      `}

      <div class="card why-bigger-deposit-card">
        <h3 class="section-heading">${c.whyBiggerHeading}</h3>
        ${c.benefitRows.map((row) => `
          <div class="benefit-row">
            <p class="benefit-row__label">${row.label}</p>
            <p class="benefit-row__body">${row.bodyTemplate ? fill(row.bodyTemplate, { amount: formatCurrency(propertyValue * (midPctValue - lowPctValue)), highPct: formatPercent(midPctValue, 0), lowPct: formatPercent(lowPctValue, 0) }) : row.body}</p>
            <p class="benefit-row__caption">${row.caption}</p>
          </div>
        `).join('')}
        ${infoLinkHTML({ label: c.ltvInfoLinkLabel, action: 'open-ltv-info' })}
      </div>

      <button type="button" class="button button--primary" data-action="save-goal">${c.primaryCta}</button>

      ${infoBannerHTML(c.assumptionsBannerText)}

      ${howThisWorksCardHTML({
        id: 'result-how-we-worked',
        open: state.resultHowWeWorkedOpen,
        title: c.howWeWorkedTitle,
        intro: fromAccounts ? c.howWeWorkedIntro : c.howWeWorkedIntroGeneral,
        rows: fromAccounts
          ? [
            summaryContent.whatWeRead,
            { ...summaryContent.whatWeWorkedOut, value: fill(summaryContent.whatWeWorkedOut.value, { essential: formatCurrency(essentialSpending), leftOver: formatCurrency(leftOverValue) }) },
            summaryContent.whatWeAssumed,
          ]
          : [
            summaryContent.whatWeReadGeneral,
            summaryContent.whatWeWorkedOutGeneral,
            summaryContent.whatWeAssumedGeneral,
          ],
        navLabel: c.seeHowWeWorkedLabel,
        navAction: 'open-assumptions-saving',
      })}

      ${flagRowHTML(c.flagLabel)}
      <p class="legal-text">${reg.guidanceNotAdvice}</p>
    </main>
  `;

  bindAppBarBack(container, () => {
    window.location.hash = '#/calculator/review';
  });

  // The card is a disclosure now (D12). rerenderInPlace, not a bare render:
  // it restores the scroller's offset and refocuses the very button that was
  // pressed (found by its data-action + data-disclosure-id), so the card
  // opens under the participant's thumb rather than throwing the screen back
  // to the top and dropping focus to <body>.
  container.querySelectorAll('[data-action="toggle-disclosure"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const next = setState({ resultHowWeWorkedOpen: !state.resultHowWeWorkedOpen });
      rerenderInPlace(container, render, { ...ctx, state: next });
    });
  });

  container.querySelector('[data-action="open-assumptions-deposit"]').addEventListener('click', () => {
    setState({ returnFrame: '/calculator/result' });
    window.location.hash = '#/assumptions/deposit';
  });

  container.querySelector('[data-action="open-assumptions-saving"]').addEventListener('click', () => {
    setState({ returnFrame: '/calculator/result' });
    window.location.hash = '#/assumptions/saving';
  });

  container.querySelector('[data-action="open-ltv-info"]').addEventListener('click', () => {
    setState({ returnFrame: '/calculator/result' });
    window.location.hash = '#/learn/ltv';
  });

  const setAmountBtn = container.querySelector('[data-action="set-amount"]');
  if (setAmountBtn) {
    setAmountBtn.addEventListener('click', () => {
      window.location.hash = '#/calculator/saving';
    });
  }

  container.querySelector('[data-action="save-goal"]').addEventListener('click', () => {
    const checkpoint = checkpointAmount(state);
    setState({
      goalSaved: true,
      'checkpoint-amount': { value: checkpoint.value, provenance: checkpoint.provenance },
    });
    window.location.hash = '#/tracker';
  });
}
