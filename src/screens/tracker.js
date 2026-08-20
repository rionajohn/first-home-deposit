/**
 * Frames 15 / 16 — Deposit tracker, below checkpoint and checkpoint
 * reached. Figma nodes 97:869 / 97:1000. Reference: reference/frames/15
 * Deposit tracker - below checkpoint.png, 16 Deposit tracker - checkpoint
 * reached.png. One route ('/tracker'), branching on saved-toward-deposit
 * against checkpoint-amount and deposit-target (build-spec.md section 2's
 * own naming) rather than a query string — the same pattern
 * '/calculator/saving' already establishes for its own two variants.
 *
 * Three variants:
 *   - below-checkpoint (frame 15): saved-toward-deposit < checkpoint-amount
 *   - checkpoint-reached (frame 16): checkpoint-amount <= saved < deposit-target
 *   - goal-met: saved-toward-deposit >= deposit-target — build-spec.md
 *     section 2's own "15/16 Deposit tracker | goal met | Milestone tracker
 *     state = complete" row, one of DECISIONS.md D7's eleven no-wireframe
 *     fallbacks. Built from the same layout as checkpoint-reached (the
 *     milestone tracker and primary CTA are already correct for "you can
 *     check a Mortgage in Principle now"), with its own top-of-screen copy
 *     rather than inventing new visual design.
 *
 * Milestone 2's ("Accounts sorted") caption cites saved-toward-deposit's
 * current value — the reference PNGs show a smaller, separate number there
 * (a snapshot from when accounts were first assigned), but build-spec.md
 * section 6 defines no separate "historical" saved-toward-deposit figure to
 * read instead, so this build uses the one figure the model actually holds
 * rather than inventing a second one. Noted for the build summary.
 */
import {
  appBarHTML,
  bindAppBarBack,
  actionBarHTML,
  flagRowHTML,
  infoLinkHTML,
  progressBarHTML,
  milestoneTrackerHTML,
  rangeFigureHTML,
  riskWarningHTML,
  statRowHTML,
  rateBandRowHTML,
} from '../components/ui.js';
import { formatCurrency, formatPercent, formatMonthYearRange } from '../format.js';
import { gapToCheckpoint, onTrackFor, rateBandForDepositPct } from '../model/model.js';
import { RATES, CHART_DEPOSIT_PCTS, CHECKPOINT_FRACTION } from '../model/rates.js';
import { MOCK_POSITION } from '../model/accounts.js';

export const anchors = ['guidanceNotAdvice', 'mcob3aRepossessionWarning'];

function fill(template, values) {
  return Object.entries(values).reduce((s, [k, v]) => s.replace(`{${k}}`, v), template);
}

export function render(container, ctx) {
  const { state, setState, content } = ctx;
  const c = content['/tracker'];
  const reg = content.shared.regulatory;

  if (state['checkpoint-amount'].value === null || state['deposit-target'].value === null) {
    window.location.hash = '#/calculator/result';
    return;
  }

  const savedTowardDeposit = state['saved-toward-deposit'].value;
  const depositTargetValue = state['deposit-target'].value;
  const checkpointAmountValue = state['checkpoint-amount'].value;
  const depositPct = state['deposit-pct'].value;
  const propertyValue = state['property-value'].value;

  const variant = savedTowardDeposit >= depositTargetValue
    ? 'goal-met'
    : savedTowardDeposit >= checkpointAmountValue
      ? 'checkpoint-reached'
      : 'below-checkpoint';
  const unlocked = variant !== 'below-checkpoint';

  const gap = gapToCheckpoint(state);

  const band = rateBandForDepositPct(depositPct);
  const ltvPct = 1 - depositPct;

  const columns = CHART_DEPOSIT_PCTS.map((pct) => {
    const rowBand = rateBandForDepositPct(pct);
    return {
      pct,
      depositAmt: propertyValue * pct,
      rateLabel: `${formatPercent(rowBand.low, 1)}–${formatPercent(rowBand.high, 1)}`,
      highlighted: pct === depositPct,
    };
  });

  const onTrack = onTrackFor(state);

  // Three icon states, confirmed against the reference PNGs: every earlier
  // milestone is 'done' (dark filled star), the milestone just reached is
  // 'current' (light circle, solid border), and anything beyond that is
  // 'locked' (dashed circle) — never a flat complete/locked split. Frame 15
  // (below-checkpoint) puts "Deposit goal set" at 'current' and "Mortgage in
  // Principle" at 'locked'; frame 16 (checkpoint-reached) promotes "Deposit
  // goal set" to 'done' and "Mortgage in Principle" to 'current'.
  const milestoneStates = unlocked ? ['done', 'done', 'done', 'current'] : ['done', 'done', 'current', 'locked'];

  const milestones = [
    { title: c.accountsLinkedTitle, body: c.accountsLinkedBody, state: milestoneStates[0] },
    { title: c.accountsSortedTitle, body: fill(c.accountsSortedBodyTemplate, { amount: formatCurrency(savedTowardDeposit) }), state: milestoneStates[1] },
    { title: c.goalSetTitle, body: fill(c.goalSetBodyTemplate, { target: formatCurrency(depositTargetValue), pct: formatPercent(depositPct, 0), property: formatCurrency(propertyValue) }), state: milestoneStates[2] },
    unlocked
      ? { title: c.mipTitle, body: c.mipUnlockedBody, state: milestoneStates[3] }
      : { title: c.mipTitle, body: fill(c.mipLockedBodyTemplate, { checkpoint: formatCurrency(checkpointAmountValue), gap: formatCurrency(gap.value) }), state: milestoneStates[3], action: 'locked-row-noop' },
  ];

  const bodyText = variant === 'below-checkpoint'
    ? fill(c.belowCheckpointBodyTemplate, { gap: formatCurrency(gap.value) })
    : variant === 'checkpoint-reached'
      ? fill(c.checkpointReachedBodyTemplate, { pct: formatPercent(CHECKPOINT_FRACTION, 0) })
      : c.goalMetBody;

  container.innerHTML = `
    ${appBarHTML({ title: c.appBarTitle, left: 'back', appBarLabels: content.shared.appBar })}
    <main class="screen-content" role="main">
      <p class="figure-display">${formatCurrency(savedTowardDeposit)}</p>
      <p class="provenance-caption provenance-caption--center">${c.savedCaption}</p>
      <p class="provenance-caption provenance-caption--center">${fill(c.goalCaptionTemplate, { target: formatCurrency(depositTargetValue) })}</p>

      ${progressBarHTML({
        fillPct: (savedTowardDeposit / depositTargetValue) * 100,
        markerPct: CHECKPOINT_FRACTION * 100,
        label: c.checkpointProgressLabel,
      })}

      <p class="body-text">${bodyText}</p>

      ${milestoneTrackerHTML(milestones)}

      <p class="provenance-caption">${unlocked ? c.readyToCheckLabel : fill(c.unlocksAtTemplate, { checkpoint: formatCurrency(checkpointAmountValue) })}</p>

      <div class="card rates-card">
        <button type="button" class="rates-card__heading" data-action="open-ltv">${c.ratesCardHeading}</button>
        ${rangeFigureHTML({
          lowText: formatPercent(band.low, 1),
          highText: formatPercent(band.high, 1),
          caption: fill(c.ratesCaptionTemplate, { ltv: formatPercent(ltvPct, 0) }),
          markerPct: 50,
          trackLabel: '',
        })}
        <p class="body-text">${c.ratesDisclosureText}</p>
        <hr class="divider" />
        ${columns.map((col, i) => `
          ${rateBandRowHTML({
            label: formatCurrency(col.depositAmt),
            sublabel: fill(c.rateBandDepositCaptionTemplate, { pct: formatPercent(col.pct, 0) }),
            value: col.rateLabel,
            highlighted: col.highlighted,
          })}
          ${i < columns.length - 1 ? '<hr class="divider" />' : ''}
        `).join('')}
      </div>

      ${infoLinkHTML({ label: c.assumptionsLinkLabel, action: 'open-assumptions-deposit' })}

      ${riskWarningHTML(c.rateCautionText)}
      ${riskWarningHTML(reg.mcob3aRepossessionWarning)}

      <div class="card this-month-card">
        <p class="filled-in-details-card__title">${c.thisMonthHeading}</p>
        <hr class="divider" />
        ${statRowHTML({ label: c.savedLabel, value: formatCurrency(MOCK_POSITION.thisMonthSaved), caption: c.savedRowCaption })}
        <hr class="divider" />
        ${statRowHTML({ label: c.interestLabel, value: formatCurrency(MOCK_POSITION.thisMonthInterest), caption: c.interestRowCaption })}
        <hr class="divider" />
        ${statRowHTML({
          label: c.onTrackLabel,
          value: onTrack.error ? '—' : formatMonthYearRange(onTrack.value.low, onTrack.value.high, RATES.asAt),
          caption: c.onTrackCaption,
        })}
        <button type="button" class="list-row" data-action="open-provenance-key">
          <span class="list-row__label">${c.provenanceKeyLabel}</span>
          <img class="list-row__chevron" src="assets/icons/chevron-right.svg" alt="" width="20" height="20" />
        </button>
      </div>

      ${flagRowHTML(c.flagLabel)}
      <p class="legal-text">${reg.guidanceNotAdvice}</p>
    </main>
    ${actionBarHTML({
      primaryLabel: unlocked ? c.checkpointReachedCta : c.belowCheckpointCta,
      primaryAction: unlocked ? 'check-mip' : 'adjust-goal',
    })}
  `;

  bindAppBarBack(container, () => {
    window.location.hash = '#/home';
  });

  container.querySelector('[data-action="open-ltv"]').addEventListener('click', () => {
    setState({ returnFrame: '/tracker' });
    window.location.hash = '#/learn/ltv';
  });

  container.querySelector('[data-action="open-assumptions-deposit"]').addEventListener('click', () => {
    setState({ returnFrame: '/tracker' });
    window.location.hash = '#/assumptions/deposit';
  });

  container.querySelector('[data-action="open-provenance-key"]').addEventListener('click', () => {
    setState({ returnFrame: '/tracker' });
    window.location.hash = '#/assumptions/saving';
  });

  const lockedRow = container.querySelector('[data-action="locked-row-noop"]');
  if (lockedRow) {
    lockedRow.addEventListener('click', (e) => {
      // build-spec.md section 1: "Tap the locked row -> 15 (in place) ->
      // Milestone tracker state = locked, explanatory only" - no navigation,
      // no state change. The row exists as a button (not a div) purely so
      // it's keyboard-reachable, per this build's touch-target rule.
      e.preventDefault();
    });
  }

  if (unlocked) {
    container.querySelector('[data-action="check-mip"]').addEventListener('click', () => {
      setState({ mipUnlocked: true });
      window.location.hash = '#/mip';
    });
  } else {
    container.querySelector('[data-action="adjust-goal"]').addEventListener('click', () => {
      window.location.hash = '#/calculator/review';
    });
  }
}
