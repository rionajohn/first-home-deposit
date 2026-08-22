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
 * GENERAL MODE — A FOURTH VARIANT (GAPS.md G51, resolved in DECISIONS.md D26)
 * A session that never linked an account arrives here with
 * saved-toward-deposit null, and there is no truthful substitute for it.
 * Zero is not one: frame 12 may legitimately PROJECT from a zero balance and
 * caption it as an assumption, but a headline "£0 saved" is a claim about
 * the participant, and they may hold savings elsewhere. MOCK_POSITION's
 * thisMonthSaved / thisMonthInterest are documented in accounts.js as
 * directly-read account figures. And no constant in rates.js measures what
 * anyone has saved — one would be a figure about somebody else, shown as
 * this participant's progress.
 *
 * So this variant shows NO balance and NO progress bar. What it shows
 * instead is the plan: the goal they set, the checkpoint that follows from
 * it, the monthly range they chose, and what that range implies. Every
 * figure on it traces either to something the participant entered or to an
 * existing dated constant, and carries a caption saying which.
 *
 * Frame 16 has no general-mode counterpart, and cannot have one: passing the
 * checkpoint is a statement about a balance nobody has measured. The variant
 * below is therefore always 'below-checkpoint', the Mortgage in Principle
 * milestone stays locked, and the MiP route is never offered — which is also
 * what mip-pre-check.js needs, since it reads money-in, essential-spending
 * and saved-toward-deposit, none of which exist here.
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
import { RATES, CHART_DEPOSIT_PCTS, CHECKPOINT_FRACTION, GENERAL_SAVINGS_RANGE } from '../model/rates.js';
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
    window.location.hash = '#/calculator/result';
    return;
  }

  const savedTowardDeposit = state['saved-toward-deposit'].value;
  const depositTargetValue = state['deposit-target'].value;
  const checkpointAmountValue = state['checkpoint-amount'].value;
  const depositPct = state['deposit-pct'].value;
  const propertyValue = state['property-value'].value;

  // The one test the whole screen branches on. saved-toward-deposit is what
  // this screen exists to track; without it there is nothing to track and
  // the general variant renders instead. Note this is NOT the same test as
  // 'general mode': estimate mode (savings held elsewhere) still assigns
  // accounts and still has a figure here, and correctly keeps the
  // consent-path rendering.
  const tracking = savedTowardDeposit !== null;

  const variant = !tracking
    // Not a claim that they are below it — a statement that nothing has been
    // measured against it. Written out rather than left to null's comparison
    // coercion, which reaches the same branch by accident.
    ? 'below-checkpoint'
    : savedTowardDeposit >= depositTargetValue
      ? 'goal-met'
      : savedTowardDeposit >= checkpointAmountValue
        ? 'checkpoint-reached'
        : 'below-checkpoint';
  const unlocked = variant !== 'below-checkpoint';

  // checkpoint-amount less saved-toward-deposit. Meaningless without the
  // second term, so it is only computed when there is one.
  const gap = tracking ? gapToCheckpoint(state) : null;

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

  // General mode's plan card. monthly-low/high are what the participant set
  // on frame 04 and confirmed on frame 10, so the caption is either "the
  // range you set" or, if they kept the seeded published range untouched,
  // that range's own named source — the savingCeiling pattern from D24.
  const monthlyLowValue = state['monthly-low'].value;
  const monthlyHighValue = state['monthly-high'].value;
  const monthlyProvenance = state['monthly-low'].provenance;

  // Three icon states, confirmed against the reference PNGs: every earlier
  // milestone is 'done' (dark filled star), the milestone just reached is
  // 'current' (light circle, solid border), and anything beyond that is
  // 'locked' (dashed circle) — never a flat complete/locked split. Frame 15
  // (below-checkpoint) puts "Deposit goal set" at 'current' and "Mortgage in
  // Principle" at 'locked'; frame 16 (checkpoint-reached) promotes "Deposit
  // goal set" to 'done' and "Mortgage in Principle" to 'current'.
  // General mode's own row: the first two milestones ARE the consent journey
  // and neither happened, so both sit at 'locked' — the dashed, not-started
  // icon, present and legible rather than hidden (they are the two things
  // this session is missing, which is worth being able to see). "Deposit
  // goal set" is genuinely 'current': they set one. The ladder is not linear
  // in this mode and does not pretend to be.
  const milestoneStates = !tracking
    ? ['locked', 'locked', 'current', 'locked']
    : unlocked ? ['done', 'done', 'done', 'current'] : ['done', 'done', 'current', 'locked'];

  const checkpointPctLabel = formatPercent(CHECKPOINT_FRACTION, 0);

  const milestones = [
    {
      title: c.accountsLinkedTitle,
      body: tracking ? c.accountsLinkedBody : c.accountsLinkedBodyGeneral,
      state: milestoneStates[0],
    },
    {
      title: c.accountsSortedTitle,
      // The consent-path caption cites what was counted. Nothing was.
      body: tracking
        ? fill(c.accountsSortedBodyTemplate, { amount: formatCurrency(savedTowardDeposit) })
        : c.accountsSortedBodyGeneral,
      state: milestoneStates[1],
    },
    {
      title: c.goalSetTitle,
      // Property value and deposit % are both entered, in either mode.
      body: fill(c.goalSetBodyTemplate, { target: formatCurrency(depositTargetValue), pct: formatPercent(depositPct, 0), property: formatCurrency(propertyValue) }),
      state: milestoneStates[2],
    },
    unlocked
      ? { title: c.mipTitle, body: c.mipUnlockedBody, state: milestoneStates[3] }
      : {
        title: c.mipTitle,
        // The consent-path body names a gap. A gap needs a starting point,
        // so general mode says plainly that it cannot tell them when they
        // reach the checkpoint; the caption below the tracker carries the
        // checkpoint figure itself.
        body: tracking
          ? fill(c.mipLockedBodyTemplate, { checkpoint: formatCurrency(checkpointAmountValue), gap: formatCurrency(gap.value) })
          : c.mipLockedBodyGeneral,
        state: milestoneStates[3],
        action: 'locked-row-noop',
      },
  ];

  const bodyText = !tracking
    ? c.generalBody
    : variant === 'below-checkpoint'
      ? fill(c.belowCheckpointBodyTemplate, { gap: formatCurrency(gap.value) })
      : variant === 'checkpoint-reached'
        ? fill(c.checkpointReachedBodyTemplate, { pct: checkpointPctLabel })
        : c.goalMetBody;

  container.innerHTML = `
    ${appBarHTML({ title: c.appBarTitle, left: 'back', appBarLabels: content.shared.appBar })}
    <main class="screen-content" role="main">
      ${tracking ? `
        <p class="figure-display">${formatCurrency(savedTowardDeposit)}</p>
        <p class="provenance-caption provenance-caption--center">${c.savedCaption}</p>
        <p class="provenance-caption provenance-caption--center">${fill(c.goalCaptionTemplate, { target: formatCurrency(depositTargetValue) })}</p>

        ${progressBarHTML({
          fillPct: (savedTowardDeposit / depositTargetValue) * 100,
          markerPct: CHECKPOINT_FRACTION * 100,
          label: c.checkpointProgressLabel,
        })}
      ` : `
        <p class="figure-display">${formatCurrency(depositTargetValue)}</p>
        <p class="provenance-caption provenance-caption--center">${c.generalFigureLabel}</p>
        <p class="provenance-caption provenance-caption--center">${fill(c.generalFigureProvenanceTemplate, { pct: formatPercent(depositPct, 0), property: formatCurrency(propertyValue) })}</p>
      `}

      <p class="body-text">${bodyText}</p>

      ${milestoneTrackerHTML(milestones)}

      <p class="provenance-caption">${unlocked
        ? c.readyToCheckLabel
        : tracking
          ? fill(c.unlocksAtTemplate, { checkpoint: formatCurrency(checkpointAmountValue) })
          // Names the fraction as well as the amount, so the figure is
          // traceable to CHECKPOINT_FRACTION and the goal they set rather
          // than appearing as a threshold from nowhere.
          : fill(c.unlocksAtGeneralTemplate, { checkpoint: formatCurrency(checkpointAmountValue), pct: checkpointPctLabel })}</p>

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
        <p class="filled-in-details-card__title">${tracking ? c.thisMonthHeading : c.planHeading}</p>
        <hr class="divider" />
        ${tracking ? `
          ${statRowHTML({ label: c.savedLabel, value: formatCurrency(MOCK_POSITION.thisMonthSaved), caption: c.savedRowCaption })}
          <hr class="divider" />
          ${statRowHTML({ label: c.interestLabel, value: formatCurrency(MOCK_POSITION.thisMonthInterest), caption: c.interestRowCaption })}
        ` : `
          ${statRowHTML({
            label: c.planMonthlyLabel,
            value: `${formatCurrency(monthlyLowValue)} to ${formatCurrency(monthlyHighValue)}`,
            caption: monthlyProvenance === 'entered'
              ? c.planMonthlyCaptionEntered
              : fill(c.planMonthlyCaptionEstimatedTemplate, { source: GENERAL_SAVINGS_RANGE.source }),
          })}
        `}
        <hr class="divider" />
        ${statRowHTML({
          label: c.onTrackLabel,
          value: onTrack.error ? '—' : formatMonthYearRange(onTrack.value.low, onTrack.value.high, RATES.asAt),
          caption: tracking ? c.onTrackCaption : c.onTrackCaptionGeneral,
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
