/**
 * Frame 12 — Your deposit range. Figma node 66:887. Reference:
 * reference/frames/12 Deposit calculator - your deposit range.png.
 *
 * Variants built (build-spec.md section 2):
 *   - the ordinary case: a projection with length, chart drawn
 *   - attained: `goalAttained(state)` — no chart, no chips, no series control,
 *     no readout, no table; the comparison card stays (D46). D99
 *   - unreachable: savings-rate (here, both monthly-low and monthly-high)
 *     = 0 — no wireframe drawn (D7 fallback); the growth chart and timing
 *     rows are replaced with the shared empty-state-card pattern
 *
 * THE CHART IS A LINE WITH AN INTERACTIVE POINT (DECISIONS.md D100), rebuilt
 * from bars after the 31 August 2026 pilot. The participant liked it on sight
 * and could not extract a single number from it: "I don't have a y-axis to
 * know what the value is. I can't hover and see what the values are either"
 * (21:42), and "I still don't know whether I would choose to have it at 200
 * pounds a month or 400 quid" (23:28). The chart existed to support choosing a
 * contribution and did not support that choice.
 *
 * What answers it, in the order the requirements are numbered in the plan:
 *   1. a readout naming the exact amount, always visible, reporting the active
 *      point — the primary fix, and it must never become interaction-only
 *   2. a labelled y-axis, so the chart is readable without interacting
 *   3. an endpoint line naming the goal and the year it is reached
 *   4. an x-axis that is a SCALE, closing pilot finding P10
 *   5. a projection bounded at goal attainment, never overshooting
 *   6. a table view of the same points array
 *   7. nothing carried by colour alone
 *
 * EVERY DATE THIS SCREEN CLAIMS IS A YEAR (D102). The projection is not
 * accurate to the month and stating it to the month invites a participant to
 * read it as a commitment. The two exceptions report a COORDINATE on a plotted
 * curve rather than an arrival — the readout under the chart and the table's
 * own column — and they are named exceptions rather than oversights. The
 * boundary: nothing that says a goal WOULD BE REACHED names a month.
 *
 * ALL DATES DERIVE FROM `state.sessionAnchor` (D97), stamped once at session
 * start and discarded whole on a month mismatch, never from a render-time
 * `new Date()`. A stale anchor would produce wrong years with nothing on
 * screen to reveal it.
 *
 * `CHART_DEPOSIT_PCTS` still supplies the "Why a bigger deposit helps" card's
 * low and mid figures, which is why it is still imported.
 *
 * Two "how did we work this out" links are wired to their build-spec.md
 * section 1 destinations: the one directly under the range figure goes to
 * frame 30 (deposit and rates); the one inside the How-this-works card
 * (which repeats frame 06's own money-in/essential-spending card verbatim)
 * goes to frame 29 (saving amount), matching how position-summary.js wires
 * the same card. A THIRD now sits under the endpoint line — see below.
 */
import {
  appBarHTML,
  bindAppBarLeading,
  infoBannerHTML,
  flagRowHTML,
  growthChartHTML,
  chartTableHTML,
  bindGrowthChart,
  segmentedControlHTML,
  rateBandRowHTML,
  figureRowHTML,
  infoLinkHTML,
  howThisWorksCardHTML,
  emptyStateCardHTML,
  rerenderInPlace,
} from '../components/ui.js';
import { formatCurrency, formatPercent, formatYear, axisScale } from '../format.js';
import { balanceAtMonth, monthsToReachAmount, checkpointAmount, goalMonths, goalAttained, stampDuty, combinedGoal } from '../model/model.js';
import { RATES, CHART_DEPOSIT_PCTS, CHART_WINDOW_MONTHS, CHART_MIN_RANGE_MONTHS } from '../model/rates.js';

export const anchors = ['guidanceNotAdvice', 'estimateDisclosure'];

/** ONE POINT PER YEAR (D105, reversing the plan's 10.6 exception). Monthly
 *  points forced the readout to name a month, because twelve of them shared one
 *  year - on the "1 yr" chip, one caption for the whole window. Plotting yearly
 *  removes that ambiguity at source rather than working around it, so every date
 *  on this screen is a year again and the exception is gone. */
const MONTHS_PER_POINT = 12;

/** D100's headroom, moved from D73's 1.05. The date label sits ABOVE the
 *  active point and the active point at rest is the highest one, so at 1.05 the
 *  screen's DEFAULT state was the colliding state — measured, by 17.3px at
 *  default text and 20px at Large. This is the space that label occupies. */
const CHART_HEADROOM = 1.20;

function fill(template, values) {
  return Object.entries(values).reduce((s, [k, v]) => s.replace(`{${k}}`, v), template);
}

/** Months from the anchor to 1 January of each year the window spans, as a
 *  percentage of the window. The x-axis is a scale: a label at x% names the
 *  moment at x%, whether or not a point falls there. */
function yearLabelsFor(anchorDate, rangeMonths) {
  const base = new Date(anchorDate);
  const labels = [];
  for (let m = 1; m <= rangeMonths; m += 1) {
    const d = new Date(base.getFullYear(), base.getMonth() + m, 1);
    if (d.getMonth() !== 0) continue;
    labels.push({ label: String(d.getFullYear()), pct: (m / rangeMonths) * 100 });
  }
  return labels;
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

  const anchor = state.sessionAnchor;
  const propertyValue = state['property-value'].value;
  const savedTowardDeposit = state['saved-toward-deposit'].value;
  const monthlyLow = state['monthly-low'].value;
  const monthlyHigh = state['monthly-high'].value;
  const depositTargetValue = state['deposit-target'].value;
  const essentialSpending = state['essential-spending'].value;
  const leftOverValue = state['left-over'].value;

  // ONLY THE BENEFIT CARD READS THESE (D73).
  const [lowPctValue, midPctValue] = CHART_DEPOSIT_PCTS;

  const depositPctValue = state['deposit-pct'].value;
  const stampDutyValue = state['stamp-duty'].value;
  const combinedGoalValue = state['combined-goal'].value;

  // ONE PREDICATE, ONE PLACE (D99).
  const attained = goalAttained(state);
  const unreachable = monthlyLow <= 0 && monthlyHigh <= 0;

  // BOTH CONTRIBUTIONS, ALWAYS, WITH NO SELECTION (D116). The participant
  // should never have to switch between them to compare them, so both are
  // plotted, both are in the readout and both are in the goal block.
  //
  // EACH SERIES ENDS AT ITS OWN ATTAINMENT (D117). Requirement 5 - the
  // projection must not overshoot the goal - now has to hold for two lines at
  // once, and it cannot hold for both if they share an end. So the window runs
  // to the LATER attainment, the low contribution's, and the high
  // contribution's values are null past its own. The higher line visibly stops
  // earlier and further left, and that difference IS the comparison.
  const endLow = goalMonths(state, monthlyLow);
  const endHigh = goalMonths(state, monthlyHigh);
  const finite = (r) => (r.value !== null && Number.isFinite(r.value) && r.value > 0 ? r.value : null);
  const attainLow = attained ? null : finite(endLow);
  const attainHigh = attained ? null : finite(endHigh);

  const rangeMonths = attainLow ?? CHART_WINDOW_MONTHS;

  const monthsList = [];
  for (let m = rangeMonths; m >= MONTHS_PER_POINT; m -= MONTHS_PER_POINT) monthsList.push(m);
  if (monthsList.length === 0) monthsList.push(rangeMonths);
  monthsList.push(0);
  monthsList.reverse();

  const points = monthsList.map((months) => ({
    months,
    date: formatYear(months, anchor),
    low: balanceAtMonth({ startingBalance: savedTowardDeposit, monthlyAmount: monthlyLow, months }),
    // NULL, NOT CLAMPED. Past its attainment the higher series has no value to
    // plot - it stopped - and clamping to the goal would draw a flat run that
    // says it kept saving and stayed level.
    high: attainHigh !== null && months > attainHigh
      ? null
      : balanceAtMonth({ startingBalance: savedTowardDeposit, monthlyAmount: monthlyHigh, months }),
  }));
  const pointCount = points.length;

  const { top: maxScale, ticks } = axisScale(
    Math.max(...points.map((p) => Math.max(p.low, p.high ?? 0))),
    CHART_HEADROOM,
  );
  for (const p of points) {
    p.lowPct = (p.low / maxScale) * 100;
    p.highPct = p.high === null ? null : (p.high / maxScale) * 100;
  }

  const activeIndex = Math.max(0, Math.min(pointCount - 1, state.chartActiveIndex ?? pointCount - 1));

  // ONE ROW, THE PARTICIPANT'S OWN (D113). The card showed their deposit and
  // the two either side of it; the pilot objected to both of the others - "I'm
  // not sure why I'm comparing this to the other options that I didn't pick"
  // (24:48) and "I didn't really ask for the other ones" (25:27). The YEAR is
  // what they wanted and is why the row survives at all.
  //
  // STILL DERIVED ONCE, ABOVE THE TEMPLATE, and that is not left over from the
  // three-row version. The reason for the hoist was that a consumer which
  // recomputes its own inputs will eventually disagree with what it describes,
  // and that holds with one row exactly as it did with three - the row's year
  // and the caption beneath it read one derivation.
  const ownGoal = depositTargetValue + stampDutyValue;
  const ownAlreadySaved = savedTowardDeposit >= ownGoal;
  const ownMonths = ownAlreadySaved
    ? 0
    // `monthly-low` with no selection left to read. It is the conservative end
    // and it matches the goal block's FIRST row, so the card and the block
    // cannot state different years for the same goal.
    : monthsToReachAmount({ startingBalance: savedTowardDeposit, targetAmount: ownGoal, monthlyAmount: monthlyLow });
  const ownRow = {
    pctLabel: formatPercent(depositPctValue, 0),
    amount: depositTargetValue,
    alreadySaved: ownAlreadySaved,
    year: ownAlreadySaved || !Number.isFinite(ownMonths) ? null : formatYear(Math.ceil(ownMonths), anchor),
  };

  const chartVisible = !unreachable && !attained;
  const showTable = state.chartView === 'table';

  const yearLabels = yearLabelsFor(anchor, rangeMonths);

  container.innerHTML = `
    ${appBarHTML({ title: c.appBarTitle, left: 'back', appBarLabels: content.shared.appBar })}
    <main class="screen-content" role="main">
      <h2 class="screen-title">${fill(c.headlineTemplate, { amount: formatCurrency(depositTargetValue) })}</h2>
      <p class="provenance-caption">${fill(c.depositBasisCaptionTemplate, { pct: formatPercent(depositPctValue, 0), property: formatCurrency(propertyValue) })}</p>
      ${infoLinkHTML({ label: c.assumptionsLinkLabel, action: 'open-assumptions-deposit' })}

      <h3 class="section-heading">${c.goalHeading}</h3>
      <div class="assumptions-list">
        ${figureRowHTML({ label: c.goalDepositLabel, trailing: formatCurrency(depositTargetValue) })}
        ${figureRowHTML({ label: c.goalStampDutyLabel, trailing: formatCurrency(stampDutyValue), caption: c.goalStampDutyCaption })}
        ${figureRowHTML({ label: c.goalTotalLabel, trailing: formatCurrency(combinedGoalValue) })}
      </div>

      <!-- ONE STANDALONE BOX, NO SELECTION HIGHLIGHT (D113). There is nothing
           left to be selected AGAINST, so highlighted would mark a row as
           chosen from a set of one. The card is drawn in every state including
           the attained one, where the row reads compareAlreadyLabel instead
           of a year.

           aria-describedby KEEPS ITS BINDING even though the visible asterisk
           is gone: with one row the caption sits directly beneath the figure it
           describes and needs no marker to say which figure that is, but the
           relationship still has to be programmatic for anyone not reading by
           position. -->
      <h3 class="section-heading">${c.compareHeading}</h3>
      <div class="card comparison-card">
        ${rateBandRowHTML({
          label: ownRow.alreadySaved ? c.compareAlreadyLabel : ownRow.year === null ? '—' : ownRow.year,
          sublabel: fill(c.compareRowSublabelTemplate, { pct: ownRow.pctLabel }),
          value: formatCurrency(ownRow.amount),
          highlighted: false,
          describedBy: 'compare-provenance',
        })}
      </div>
      <p class="provenance-caption" id="compare-provenance">${c.compareProvenanceCaption}</p>

      ${unreachable ? emptyStateCardHTML({ title: c.unreachableHeadline, body: c.unreachableBody, ctaLabel: c.unreachableCta, ctaAction: 'set-amount' }) : ''}

      <p class="legal-text">${reg.estimateDisclosure}</p>

      ${attained ? `
        ${infoBannerHTML(`${c.goalAttainedHeadline} ${fill(c.goalAttainedBody, { saved: formatCurrency(savedTowardDeposit) })}`, { live: true })}
      ` : ''}

      ${chartVisible ? `
        <!-- THE GOAL BLOCK SITS ABOVE THE TOGGLE (D117), and the placement is
             the decision rather than a consequence of it. When you reach the
             goal is true whether you are looking at the chart or the table, so
             anything BELOW the toggle would read as belonging to the view that
             is showing. Above it, the block reads as a fact about the plan and
             the two views read as ways of examining it.

             It also leads with the answer to the question the pilot asked at
             26:20 and did not get: how long until I have that amount. -->
        <div class="goal-block">
          <h4 class="goal-block__heading">${fill(c.goalBlockHeadingTemplate, { amount: formatCurrency(combinedGoalValue) })}</h4>
          ${[[monthlyLow, attainLow], [monthlyHigh, attainHigh]].map(([rate, months]) => `
            <p class="goal-block__row">
              <span class="goal-block__rate" aria-describedby="projection-assumptions">${fill(c.goalBlockRowTemplate, {
                amount: formatCurrency(rate),
                year: months === null ? '—' : `${formatYear(Math.ceil(months), anchor)}${c.goalBlockMarker}`,
              })}</span>
            </p>
          `).join('')}
        </div>

        <!-- D103'S PLACEMENT RE-DERIVED, NOT ABANDONED. That entry fixed this
             line beneath the endpoint because a caveat must sit with the claim
             it qualifies. The claim moved, so the caveat moved with it - and
             the markers on both year figures carry the binding that adjacency
             alone cannot when TWO figures share ONE caveat. aria-describedby on
             each row does the same for a reader with no marker to follow. -->
        <p class="provenance-caption" id="projection-assumptions">${c.projectionAssumptions}</p>
        ${infoLinkHTML({ label: c.projectionAssumptionsLinkLabel, action: 'open-assumptions-saving-endpoint' })}


        <h3 class="section-heading">${c.chartHeading}</h3>

        <!-- THE VIEW TOGGLE IS A VISIBLE PEER OF THE CHART, not a hidden
             affordance (D102). Under year-only the table is the ONLY place on
             this screen carrying date resolution finer than a year at rest, so
             burying it would remove month resolution from the screen entirely
             for anyone who does not scrub. -->
        <p class="visually-hidden" id="chart-view-legend">${c.chartViewLegend}</p>
        <div role="group" aria-labelledby="chart-view-legend">
          ${segmentedControlHTML({
            options: [
              { value: 'chart', label: c.chartViewChartLabel },
              { value: 'table', label: c.chartViewTableLabel },
            ],
            selected: showTable ? 'table' : 'chart',
            action: 'select-chart-view',
          })}
        </div>

        ${showTable ? chartTableHTML({
          points,
          headers: {
            month: c.chartTableYearHeader,
            low: fill(c.chartTableSeriesHeaderTemplate, { amount: formatCurrency(monthlyLow) }),
            high: fill(c.chartTableSeriesHeaderTemplate, { amount: formatCurrency(monthlyHigh) }),
          },
          caption: c.chartTableCaption,
          valueFormatter: formatCurrency,
        }) : growthChartHTML({
          points,
          yTicks: ticks,
          goalPct: (combinedGoalValue / maxScale) * 100,
          yearLabels,
          nowLabel: c.xAxisNow,
          legend: [
            { label: fill(c.legendTemplate, { amount: formatCurrency(monthlyHigh) }), shade: 'high' },
            { label: fill(c.legendTemplate, { amount: formatCurrency(monthlyLow) }), shade: 'low' },
          ],
          activeIndex,
          plotLabel: c.chartPlotAriaLabel,
          // BOTH AMOUNTS in the accessible name, because there is no selected
          // series: what the block shows visually, this shows to a screen
          // reader.
          pointLabelTemplate: (p) => fill(c.chartPointAriaLabelTemplate, {
            date: p.date,
            low: formatCurrency(monthlyLow),
            amount: formatCurrency(p.low),
            high: formatCurrency(monthlyHigh),
            amountHigh: p.high === null ? '—' : formatCurrency(p.high),
          }),
          readout: [
            { shade: 'low', label: fill(c.legendTemplate, { amount: formatCurrency(monthlyLow) }), value: (pt) => formatCurrency(pt.low) },
            { shade: 'high', label: fill(c.legendTemplate, { amount: formatCurrency(monthlyHigh) }), value: (pt) => (pt.high === null ? '—' : formatCurrency(pt.high)) },
          ],
          valueFormatter: formatCurrency,
        })}

        <p class="legal-text">${fill(c.chartCaptionTemplate, { aer: formatPercent(RATES.bankRate) })}</p>
      ` : ''}

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

  const redraw = (patch) => {
    const next = setState(patch);
    rerenderInPlace(container, render, { ...ctx, state: next });
  };

  // THE ACTIVE INDEX IS THE CALLER'S, and `bindGrowthChart` only reports moves
  // — so the readout, the guide and the in-plot labels all render from ONE
  // number rather than from three listeners that could disagree.
  if (chartVisible && !showTable) {
    bindGrowthChart(container, {
      pointCount,
      // PERSISTED, NOT RE-RENDERED. The chart repaints itself in place, so the
      // element holding the pointer capture survives a drag and the whole
      // screen is not rebuilt on every `pointermove`. The write is still here
      // because the index has to outlive a view switch or a navigation.
      onActivate: (index) => setState({ chartActiveIndex: index }),
      // THE READOUT IS INSIDE THE PLOT NOW (D116) and moves with the selection
      // line, so it is repainted here from the same points array the chart drew
      // rather than from a second derivation. Both amounts change together,
      // which is the whole point of removing the selector.
      onPaint: ({ index }) => {
        const p = points[index];
        if (!p) return;
        const year = container.querySelector('[data-readout-year]');
        const low = container.querySelector('[data-readout-value="low"]');
        const high = container.querySelector('[data-readout-value="high"]');
        if (year) year.textContent = p.date;
        if (low) low.textContent = formatCurrency(p.low);
        if (high) high.textContent = p.high === null ? '—' : formatCurrency(p.high);
      },
    });
  }

  container.querySelectorAll('[data-action="select-chart-view"]').forEach((btn) => {
    btn.addEventListener('click', () => redraw({ chartView: btn.dataset.value }));
  });

  container.querySelectorAll('[data-action="toggle-disclosure"]').forEach((btn) => {
    btn.addEventListener('click', () => redraw({ resultHowWeWorkedOpen: !state.resultHowWeWorkedOpen }));
  });

  container.querySelector('[data-action="open-assumptions-deposit"]').addEventListener('click', () => {
    setState({ returnFrame: '/calculator/result' });
    window.location.hash = '#/assumptions/deposit';
  });

  container.querySelectorAll('[data-action="open-assumptions-saving"], [data-action="open-assumptions-saving-endpoint"]').forEach((el) => {
    el.addEventListener('click', () => {
      setState({ returnFrame: '/calculator/result' });
      window.location.hash = '#/assumptions/saving';
    });
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
