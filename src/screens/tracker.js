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
 *
 * THE FOURTH, GENERAL-MODE VARIANT IS GONE (was DECISIONS.md D26, removed by
 * D28). It existed for a session that had never linked an account and so had
 * no saved-toward-deposit to track. Accounts are connected from session start
 * (src/state.js), so there is always a balance to track and the three
 * variants above are the whole set again.
 */
import {
  appBarHTML,
  bindAppBarLeading,
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
import { chevronRight } from '../icons.js';

export const anchors = ['guidanceNotAdvice', 'mcob3aRepossessionWarning'];

function fill(template, values) {
  return Object.entries(values).reduce((s, [k, v]) => s.replace(`{${k}}`, v), template);
}

export function render(container, ctx) {
  const { state, setState, content } = ctx;
  const c = content['/tracker'];
  const reg = content.shared.regulatory;

  if (state['checkpoint-amount'].value === null || state['deposit-target'].value === null) {
    window.location.replace('#/calculator/result');
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

  // checkpoint-amount less saved-toward-deposit.
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
  const milestoneStates = unlocked
    ? ['done', 'done', 'done', 'current']
    : ['done', 'done', 'current', 'locked'];

  const checkpointPctLabel = formatPercent(CHECKPOINT_FRACTION, 0);

  const milestones = [
    {
      title: c.accountsLinkedTitle,
      body: c.accountsLinkedBody,
      state: milestoneStates[0],
    },
    {
      title: c.accountsSortedTitle,
      body: fill(c.accountsSortedBodyTemplate, { amount: formatCurrency(savedTowardDeposit) }),
      state: milestoneStates[1],
    },
    {
      title: c.goalSetTitle,
      // Property value and deposit % are both entered, in either mode.
      body: fill(c.goalSetBodyTemplate, { target: formatCurrency(depositTargetValue), pct: formatPercent(depositPct, 0), property: formatCurrency(propertyValue) }),
      state: milestoneStates[2],
    },
    // NEITHER STATE OF THIS ROW IS A CONTROL. The milestone tracker reports
    // where the participant has got to; the way into the Mortgage in
    // Principle flow is the action bar's primary below, on the unlocked
    // variants only. reference/frames/16 draws exactly this split, and one
    // entry per flow per screen is the reason to keep it.
    //
    // The locked row used to carry `action: 'locked-row-noop'`, which made
    // `milestoneTrackerHTML` render it as a <button> — `cursor: pointer`
    // (components.css `button.milestone-row`), keyboard-focusable, and doing
    // nothing when pressed. build-spec.md section 1's "Tap the locked row ->
    // 15 (in place) ... explanatory only" is satisfied better by a row that
    // does not offer the tap at all, and a focusable control with no action
    // is a dead end for a keyboard or screen-reader participant rather than
    // an accessibility gain. Both states are plain rows now.
    unlocked
      ? { title: c.mipTitle, body: c.mipUnlockedBody, state: milestoneStates[3] }
      : {
        title: c.mipTitle,
        body: fill(c.mipLockedBodyTemplate, { checkpoint: formatCurrency(checkpointAmountValue), gap: formatCurrency(gap.value) }),
        state: milestoneStates[3],
      },
  ];

  const bodyText = variant === 'below-checkpoint'
    ? fill(c.belowCheckpointBodyTemplate, { gap: formatCurrency(gap.value) })
    : variant === 'checkpoint-reached'
      ? fill(c.checkpointReachedBodyTemplate, { pct: checkpointPctLabel })
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

      <p class="provenance-caption">${unlocked
        ? c.readyToCheckLabel
        : fill(c.unlocksAtTemplate, { checkpoint: formatCurrency(checkpointAmountValue) })}</p>

      <div class="card rates-card">
        <p class="rates-card__heading">${c.ratesCardHeading}</p>
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
        <p class="provenance-caption">${c.rateBandProvenanceCaption}</p>
      </div>

      ${unlocked ? infoLinkHTML({ label: c.ltvInfoLinkLabel, action: 'open-ltv-info' }) : ''}
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
          ${chevronRight({ size: 'body', className: 'list-row__chevron' })}
        </button>
      </div>

      ${flagRowHTML(c.flagLabel)}
      <p class="legal-text">${reg.guidanceNotAdvice}</p>
    </main>
    ${actionBarHTML({
      primaryLabel: unlocked ? c.checkpointReachedCta : c.belowCheckpointCta,
      primaryAction: unlocked ? 'check-mip' : 'learn-ltv',
      secondaryLabel: unlocked ? undefined : c.belowCheckpointSecondaryCta,
      secondaryAction: 'adjust-goal',
    })}
  `;

  bindAppBarLeading(container);

  // Frame 13 is comprehension content, so it stays reachable from here — but
  // through a link of its own, not through the rates card's heading. A heading
  // that is also a button says the rate figures under it are tappable, which
  // is the one thing they must not say now that no rate on this screen is
  // adjustable.
  //
  // Only in the unlocked variants. Below the checkpoint the primary CTA
  // ("What a bigger deposit changes", D25) already opens frame 13 under this
  // very label, and two controls carrying identical wording on one screen is
  // what goal-check.js's "one link to frame 29, not two" already ruled out.
  const ltvInfoBtn = container.querySelector('[data-action="open-ltv-info"]');
  if (ltvInfoBtn) {
    ltvInfoBtn.addEventListener('click', () => {
      setState({ returnFrame: '/tracker' });
      window.location.hash = '#/learn/ltv';
    });
  }

  container.querySelector('[data-action="open-assumptions-deposit"]').addEventListener('click', () => {
    setState({ returnFrame: '/tracker' });
    window.location.hash = '#/assumptions/deposit';
  });

  container.querySelector('[data-action="open-provenance-key"]').addEventListener('click', () => {
    setState({ returnFrame: '/tracker' });
    window.location.hash = '#/assumptions/saving';
  });

  // No handler for the locked milestone row any more: it is not a button.
  // See the milestone array above.

  if (unlocked) {
    container.querySelector('[data-action="check-mip"]').addEventListener('click', () => {
      // THE ONE WAY INTO THE MORTGAGE IN PRINCIPLE FLOW. Nothing else in the
      // app routes to /mip: not the tab bar, not /goals, not frame 01. The
      // milestone row above reports the state, this opens it.
      //
      // `journeyEntryPoint` is set to /tracker here so the close X on 17, 18,
      // 19b, 20 and 21 comes back here rather than to frame 01. Those five
      // screens exit through `exitFlow()` (DECISIONS.md D30/D32), which goes
      // back by `history.length` minus the length recorded at entry — so the
      // pair has to be written on the same click, exactly as home.js and
      // goals.js write it when the journey itself is entered. Without it a
      // participant who reached the tracker from the Insights tab would have
      // a null entry point and be dropped on /home by the fallback.
      setState({
        mipUnlocked: true,
        journeyEntryPoint: '/tracker',
        flowEntryHistoryLength: window.history.length,
      });
      window.location.hash = '#/mip';
    });
  } else {
    // The below-checkpoint variant's forward action (DECISIONS.md D25).
    // Frame 13 is the only onward destination that is honest from here: the
    // Mortgage in Principle route genuinely is not open yet, and frame 11 —
    // the old primary — is a step backwards into the calculator. Frame 13
    // explains what a bigger deposit does to the rate bands the card above
    // is already showing, and returns here rather than continuing anywhere,
    // so nothing on screen implies progress that has not happened. It is
    // guidance, not a recommendation to save more.
    container.querySelector('[data-action="learn-ltv"]').addEventListener('click', () => {
      setState({ returnFrame: '/tracker' });
      window.location.hash = '#/learn/ltv';
    });
    // Kept, demoted: adjusting the goal is a real thing to want to do here,
    // it just isn't the way forward.
    container.querySelector('[data-action="adjust-goal"]').addEventListener('click', () => {
      window.location.hash = '#/calculator/review';
    });
  }
}
