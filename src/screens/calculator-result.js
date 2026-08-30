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
 * THE CHART'S THRESHOLD LINES ARE GONE (D73) and its range is a control. It
 * plotted 5/10/15% of the property value as fixed lines, which forced the
 * y-axis up to £70,875 and left the savings curve at 44% of the plot at five
 * years and 16% at six months. The axis now follows the curve and the chips
 * choose the window; deposit context is the comparison card's job, which does
 * it with amounts and timeframes rather than three unlabelled rules.
 *
 * `CHART_DEPOSIT_PCTS` still supplies the "Why a bigger deposit helps" card's
 * low and mid figures, which is why it is still imported.
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
  bindAppBarLeading,
  infoBannerHTML,
  flagRowHTML,
  growthChartHTML,
  chipRowHTML,
  rateBandRowHTML,
  figureRowHTML,
  infoLinkHTML,
  howThisWorksCardHTML,
  emptyStateCardHTML,
  rerenderInPlace,
} from '../components/ui.js';
import { formatCurrency, formatPercent, formatMonthsDuration } from '../format.js';
import { balanceAtMonth, monthsToReachAmount, checkpointAmount, monthsToTarget, stampDuty, combinedGoal } from '../model/model.js';
import { RATES, CHART_DEPOSIT_PCTS, CHART_WINDOW_MONTHS, neighbourPcts } from '../model/rates.js';

export const anchors = ['guidanceNotAdvice', 'estimateDisclosure'];

function fill(template, values) {
  return Object.entries(values).reduce((s, [k, v]) => s.replace(`{${k}}`, v), template);
}

export function render(container, ctx) {
  const { state, setState, content } = ctx;
  const c = content['/calculator/result'];
  const summaryContent = content['/position/summary'];
  const reg = content.shared.regulatory;

  // `combined-goal` AND `stamp-duty` JOIN THE GUARD because this screen now
  // displays both (D72). Same rule as /tracker's: a screen may only show a
  // figure derived from a key its own guard tested.
  if (
    state['deposit-target'].value === null
    || state['combined-goal'].value === null
    || state['stamp-duty'].value === null
    || state['months-to-target'].provenance === null
  ) {
    window.location.replace('#/calculator/review');
    return;
  }

  const propertyValue = state['property-value'].value;
  const savedTowardDeposit = state['saved-toward-deposit'].value;
  const monthlyLow = state['monthly-low'].value;
  const monthlyHigh = state['monthly-high'].value;
  const depositTargetValue = state['deposit-target'].value;
  const essentialSpending = state['essential-spending'].value;
  const leftOverValue = state['left-over'].value;

  // ONLY THE BENEFIT CARD READS THESE NOW (D73). They fed the chart's
  // threshold lines and its axis; both are gone. `rangeLowAmount` and
  // `rangeHighAmount` went with them - the first had already been dead since
  // D72 deleted the range figure.
  const [lowPctValue, midPctValue] = CHART_DEPOSIT_PCTS;


  // The participant's own choice, which this screen leads with now (D72).
  const depositPctValue = state['deposit-pct'].value;
  const stampDutyValue = state['stamp-duty'].value;
  const combinedGoalValue = state['combined-goal'].value;

  const monthsResult = monthsToTarget(state);
  const unreachable = monthsResult.error === 'unreachable';
  const beyondWindow = monthsResult.error === 'beyond-window';
  // The chart's window, in months. A view setting (D73): it changes what the
  // chart draws and never what the model projects.
  //
  // NULL IS THE "Max" CHIP, and it resolves to the participant's own
  // projection rather than to a constant. `monthsToTarget` carries a months
  // figure even when it reports `beyond-window` (D68), which is exactly the
  // case that matters here - the seeded goal runs to 126.1 months - so the
  // value is taken from `.value` rather than gated on `.error`. It falls back
  // to the five-year window only when the projection has no figure at all,
  // which is the unreachable case the chart is not drawn in anyway.
  const rangeMonths = state.chartRangeMonths
    ?? (monthsResult.value ? Math.ceil(monthsResult.value) : CHART_WINDOW_MONTHS);

  container.innerHTML = `
    ${appBarHTML({ title: c.appBarTitle, left: 'back', appBarLabels: content.shared.appBar })}
    <main class="screen-content" role="main">
      <h2 class="screen-title">${fill(c.headlineTemplate, { amount: formatCurrency(depositTargetValue) })}</h2>
      <p class="provenance-caption">${fill(c.depositBasisCaptionTemplate, { pct: formatPercent(depositPctValue, 0), property: formatCurrency(propertyValue) })}</p>
      ${infoLinkHTML({ label: c.assumptionsLinkLabel, action: 'open-assumptions-deposit' })}

      <!-- WHAT THEY WOULD SAVE TOWARD, and the answer to GAPS.md G85 (D72).
           The deposit and the goal are different figures and this screen shows
           both, so they are shown as an addition rather than as two headline
           numbers a participant has to reconcile. The total is the same figure
           /tracker states, from the same key. -->
      <h3 class="section-heading">${c.goalHeading}</h3>
      <div class="assumptions-list">
        ${figureRowHTML({ label: c.goalDepositLabel, trailing: formatCurrency(depositTargetValue) })}
        ${figureRowHTML({ label: c.goalStampDutyLabel, trailing: formatCurrency(stampDutyValue), caption: c.goalStampDutyCaption })}
        ${figureRowHTML({ label: c.goalTotalLabel, trailing: formatCurrency(combinedGoalValue) })}
      </div>

      <!-- THREE ROWS, WINDOWED ON THE SELECTION (D72's amendment): the chosen
           percentage, one step below and one step above. It showed all five,
           which made the participant's own choice one of a list rather than the
           subject of the screen, and put the two furthest options - the ones
           they had implicitly rejected by choosing - in the same visual weight
           as their neighbours.

           "neighbourPcts" is frame 09's own windowing rule, moved into rates.js
           so the two screens cannot disagree about what a step is. At the ends
           of the set it extends rather than shrinking, so the count never
           changes and the selected row is simply not always the middle one. -->
      <h3 class="section-heading">${c.compareHeading}</h3>
      <div class="card comparison-card">
        ${(() => { const shown = neighbourPcts(depositPctValue); return shown.map((pct, i) => {
          const amount = propertyValue * pct;
          const goalAtPct = amount + stampDutyValue;
          const selected = pct === depositPctValue;
          const pctLabel = formatPercent(pct, 0);
          const sublabel = fill(
            selected ? c.compareRowSelectedSublabelTemplate : c.compareRowSublabelTemplate,
            { pct: pctLabel },
          );
          // The SLOWER end, deliberately: one figure rather than a two-sided
          // range in a narrow value column, and the conservative end is the
          // one that cannot disappoint. `monthly-low` can be dragged to zero,
          // which is the non-finite case.
          const monthsLater = monthsToReachAmount({ startingBalance: savedTowardDeposit, targetAmount: goalAtPct, monthlyAmount: monthlyLow });
          const value = savedTowardDeposit >= goalAtPct
            ? c.compareAlreadyLabel
            : Number.isFinite(monthsLater)
              ? fill(c.compareWithinTemplate, { months: formatMonthsDuration(Math.ceil(monthsLater), { abbreviated: true }) })
              : '—';
          return `
            ${rateBandRowHTML({ label: formatCurrency(amount), sublabel, value, highlighted: selected })}
            ${i < shown.length - 1 ? '<hr class="divider" />' : ''}
          `;
        }).join(''); })()}
      </div>
      <p class="provenance-caption">${c.compareProvenanceCaption}</p>

      <!-- THE 5/10/15 TIMING ROWS ARE GONE (D72). They stated a timeframe for
           three fixed percentages, two of which the participant may not have
           chosen and two of frame 09's chips they never covered. The comparison
           above does the same job for all five, with the participant's own
           choice marked. "timingWithinTemplate", "timingRangeTemplate" and
           "timingAlreadyTemplate" went with them.

           The unreachable empty state stays: at a zero savings rate there is no
           timeframe for any percentage, and the card says so once rather than
           the comparison saying it five times. -->
      ${unreachable ? emptyStateCardHTML({ title: c.unreachableHeadline, body: c.unreachableBody, ctaLabel: c.unreachableCta, ctaAction: 'set-amount' }) : ''}

      <p class="legal-text">${reg.estimateDisclosure}</p>

      ${unreachable ? '' : `
        <h3 class="section-heading">${c.chartHeading}</h3>
        ${(() => {
          // TWELVE TICKS ACROSS WHATEVER RANGE IS SHOWN, so the bar count and
          // spacing never change - only the months each bar stands for.
          const points = [];
          for (let i = 1; i <= 12; i += 1) {
            const months = Math.round((i * rangeMonths) / 12);
            points.push({ months, low: balanceAtMonth({ startingBalance: savedTowardDeposit, monthlyAmount: monthlyLow, months }), high: balanceAtMonth({ startingBalance: savedTowardDeposit, monthlyAmount: monthlyHigh, months }) });
          }
          // THE AXIS FOLLOWS THE CURVE (D73). It used to be forced up to the
          // 15% threshold line, which put the curve at 44% of the plot at five
          // years and 16% at six months. With the lines gone it tracks the
          // highest bar plus 5% headroom, so every range fills the plot.
          const maxScale = Math.max(...points.map((p) => p.high)) * 1.05;
          const chartPoints = points.map((p) => ({
            label: formatMonthsDuration(p.months),
            lowPct: (p.low / maxScale) * 100,
            highPct: (p.high / maxScale) * 100,
          }));
          const xAxisLabels = [c.xAxisNow, formatMonthsDuration(rangeMonths / 3, { abbreviated: true }), formatMonthsDuration((rangeMonths / 3) * 2, { abbreviated: true }), formatMonthsDuration(rangeMonths, { abbreviated: true })];
          return growthChartHTML({
            points: chartPoints,
            xAxisLabels,
            // `shade` pairs each row with the segment it names. The order is
            // high then low, matching the stack read top down.
            legend: [
              { label: fill(c.legendTemplate, { amount: formatCurrency(monthlyHigh) }), shade: 'high' },
              { label: fill(c.legendTemplate, { amount: formatCurrency(monthlyLow) }), shade: 'low' },
            ],
            yTop: formatCurrency(maxScale),
            yBottom: c.yAxisFloor,
          });
        })()}
        <!-- BELOW THE CHART, NOT ABOVE IT (D73's amendment). A control reads
             as belonging to the thing it follows, and above the chart it
             separated the heading from what the heading names. -->
        <p class="visually-hidden" id="chart-range-legend">${c.chartRangeLegend}</p>
        <div role="group" aria-labelledby="chart-range-legend">
          ${chipRowHTML({
            chips: c.chartRangeLabels.map((r) => ({ value: r.months, label: r.label, ariaLabel: r.ariaLabel })),
            // `selected` compares against the STORED value, so the "Max"
            // chip (null) is pressed exactly when nothing has been chosen.
            selected: state.chartRangeMonths,
            action: 'select-chart-range',
          })}
        </div>
        <p class="provenance-caption">${c.chartRangeNoteText}</p>
        <p class="visually-hidden" role="status" aria-live="polite">${fill(c.chartRangeAnnouncementTemplate, {
          range: formatMonthsDuration(rangeMonths),
          amount: formatCurrency(balanceAtMonth({ startingBalance: savedTowardDeposit, monthlyAmount: monthlyHigh, months: rangeMonths })),
        })}</p>
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
  `;

  bindAppBarLeading(container);

  // The card is a disclosure now (D12). rerenderInPlace, not a bare render:
  // it restores the scroller's offset and refocuses the very button that was
  // pressed (found by its data-action + data-disclosure-id), so the card
  // opens under the participant's thumb rather than throwing the screen back
  // to the top and dropping focus to <body>.
  // THE RANGE CHIPS (D73). `rerenderInPlace`, not a bare render: it holds the
  // scroller's offset and refocuses the chip that was pressed, so the chart
  // redraws under the participant's thumb rather than throwing them to the top
  // of a screen the chart is already well down.
  container.querySelectorAll('[data-action="select-chart-range"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      // `data-value` is the string "null" for the "Max" chip, since that
      // is what the template interpolates. Anything non-numeric resolves to
      // null, which is the stored form of "use my own projection".
      const raw = btn.dataset.value;
      const next = setState({ chartRangeMonths: raw === 'null' ? null : Number(raw) });
      rerenderInPlace(container, render, { ...ctx, state: next });
    });
  });

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
