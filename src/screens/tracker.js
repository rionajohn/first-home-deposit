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
  infoBannerHTML,
  infoLinkHTML,
  progressBarHTML,
  milestoneTrackerHTML,
  rangeFigureHTML,
  riskWarningHTML,
  statRowHTML,
  rateBandRowHTML,
} from '../components/ui.js';
import { formatCurrency, formatPercent, formatMonthYearRange } from '../format.js';
import { onTrackFor, rateBandForDepositPct } from '../model/model.js';
import { RATES, CHART_DEPOSIT_PCTS, CHECKPOINT_FRACTION } from '../model/rates.js';
import { MOCK_POSITION } from '../model/accounts.js';
import { chevronRight } from '../icons.js';
import { isRootEntry } from '../router.js';
import { canSkipAhead, isSkippedAhead, skipAheadHTML, bindSkipAhead } from '../skip-ahead.js';

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
  // Beyond-window is the one error state with a figure behind it, so it is the
  // one that renders a value rather than a dash. See DECISIONS.md D68.
  const beyondWindow = onTrack.error === 'beyond-window';

  // Four icon states, never a flat complete/locked split: every earlier
  // milestone is 'done' (dark filled star), the milestone just reached is
  // 'current' (light circle, solid border), a milestone that is reachable but
  // not yet done is 'available' (dashed circle, full-colour text), and one that
  // is not yet reachable is 'locked' (dashed circle, greyed text).
  //
  // `available`, not `current`, on the fourth row: the participant has NOT got
  // a Mortgage in Principle, they can go and get one. `current` is reserved for
  // the milestone most recently achieved, which is what it means on the
  // below-checkpoint variant's third row. See MILESTONE_ICON in
  // components/ui.js and DECISIONS.md D42.
  //
  // THE FOURTH ROW IS `available` ON BOTH VARIANTS NOW (DECISIONS.md D51). It
  // was 'locked' below the checkpoint, which was correct while the checkpoint
  // gated the route. It no longer does - the action bar offers the check at
  // either position - so the row is not blocked, and D42's own definitions make
  // that `available`: "not done, and not blocked". D42 needs no amendment for
  // this and anticipates it in terms: "If a later milestone is added that can be
  // reachable and not yet done, it takes this same treatment."
  //
  // THE TWO VARIANTS NOW DIFFER AT ROW 3, NOT ROW 4, and the checkpoint is no
  // longer legible on this list at all. That is a real loss and it is recorded
  // in D51 rather than worked around: the progress bar's marker still carries
  // the checkpoint, and the checkpoint still decides which result the flow
  // returns, but the milestone list stops reporting it.
  //
  // `locked` NOW HAS NO OCCUPANT ANYWHERE. Rows 1 to 3 can never take it - the
  // accounts are connected from session start (D28), so linked and sorted are
  // facts by the time any screen renders, and this screen's own guard above
  // requires `deposit-target`, so the goal is set before it draws. It is kept
  // rather than deleted, along with its icon entry and its CSS rule, so this
  // override stays reversible. See GAPS.md G68.
  const milestoneStates = unlocked
    ? ['done', 'done', 'done', 'available']
    : ['done', 'done', 'current', 'available'];

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
    //
    // ONE BODY, NOT TWO (DECISIONS.md D51). This was a ternary over
    // `mipUnlockedBodyTemplate` and `mipLockedBodyTemplate`, held parallel by
    // D42 so that passing the checkpoint read as one figure changing state.
    // Both rows render the same `available` state now, so there is no
    // transition for a parallel opening to make legible, and the clause the
    // pair shared - "Available from {checkpoint}" - was a claim that the
    // checkpoint gates the check, which it no longer does. One state, one
    // string, and no `fill()`: `mipBody` carries no placeholder.
    {
      title: c.mipTitle,
      body: c.mipBody,
      state: milestoneStates[3],
    },
  ];

  // `belowCheckpointBodyTemplate` carries no placeholder any more (D51), so it
  // is read directly rather than through `fill()`. It kept its `...Template`
  // name: `mipBody` was renamed on the same pass because it also changed slot
  // and meaning, but this key is the same string in the same place, and a
  // rename here would make a one-line copy change read as a structural one.
  const bodyText = variant === 'below-checkpoint'
    ? c.belowCheckpointBodyTemplate
    : variant === 'checkpoint-reached'
      ? fill(c.checkpointReachedBodyTemplate, { pct: checkpointPctLabel })
      : c.goalMetBody;

  // --- THE BACK CHEVRON, AND WHY IT IS CONDITIONAL HERE (DECISIONS.md D41) ---
  //
  // A screen draws the chevron only when there is a preceding screen inside
  // its own flow. This screen has two natures and the chevron follows
  // whichever one the participant is in:
  //
  //   via the Insights tab   a tab ROOT. Nothing behind it inside the flow,
  //                          so no chevron.
  //   via the goals card     a DESCENT. /goals is behind it, so the chevron
  //                          is drawn and pops back to it.
  //
  // `isRootEntry()` and nothing else. The two arrivals share a route, so no
  // route test can tell them apart - only the history entry knows how it was
  // created (D40). Computing root-ness a second way here is exactly what that
  // predicate exists to prevent.
  //
  // Absent, not inert: `appBarHTML` renders a plain 44px `<div>` in the
  // leading cell when `left` is null, so the slot still holds the title
  // centred and there is no button in the tab order or the accessibility
  // tree to land on.
  const leading = isRootEntry() ? null : 'back';

  container.innerHTML = `
    ${appBarHTML({ title: c.appBarTitle, left: leading, appBarLabels: content.shared.appBar })}
    <main class="screen-content" role="main">
      ${skipAheadHTML({ c, position: isSkippedAhead(state) ? 'ahead' : 'now', available: canSkipAhead(state) })}

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

      <!-- UNCONDITIONAL NOW (DECISIONS.md D51). This slot was a ternary: this
           caption above the checkpoint, "Unlocks at {checkpoint}" below it. The
           second was a gating claim the override falsified, and it is deleted
           rather than reworded. What is left is true at either position, so it
           is drawn at both - one element, one string, no variant branch and no
           empty flex item on the variant that used to take the other half. -->
      <p class="provenance-caption">${c.mipCaption}</p>

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

      ${infoLinkHTML({ label: c.ltvInfoLinkLabel, action: 'open-ltv-info' })}
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
          value: beyondWindow
            ? c.onTrackBeyondWindowValue
            : onTrack.error
              ? '—'
              : formatMonthYearRange(onTrack.value.low, onTrack.value.high, RATES.asAt),
          // No caption where no figure renders: the remaining dash states have
          // nothing for a provenance line to describe. Beyond-window DOES
          // render a figure, and "what you're putting aside" is what produced
          // it, so it keeps its caption.
          caption: onTrack.error && !beyondWindow ? null : c.onTrackCaption,
        })}
        ${beyondWindow ? infoBannerHTML(c.onTrackBeyondWindowNote) : ''}
        <button type="button" class="list-row" data-action="open-provenance-key">
          <span class="list-row__label">${c.provenanceKeyLabel}</span>
          ${chevronRight({ size: 'body', className: 'list-row__chevron' })}
        </button>
      </div>

      ${flagRowHTML(c.flagLabel)}
      <p class="legal-text">${reg.guidanceNotAdvice}</p>
    </main>
    ${actionBarHTML({
      // ONE PRIMARY, ONE LABEL, EITHER SIDE OF THE CHECKPOINT (DECISIONS.md
      // D51, overriding D25 and D35). The primary used to be D25's "What a
      // bigger deposit changes" below the checkpoint, because the Mortgage in
      // Principle route was genuinely not open there. It is open now, so the
      // same control carries the same string in the same slot at either
      // position - `checkpointReachedCta`, reused rather than duplicated.
      primaryLabel: c.checkpointReachedCta,
      primaryAction: 'check-mip',
      // "Adjust my goal" keeps the secondary slot below the checkpoint, exactly
      // as D25 left it. The displaced control is D25's old primary, which is now
      // the in-content Loan-to-Value info link above - see there.
      secondaryLabel: unlocked ? undefined : c.belowCheckpointSecondaryCta,
      secondaryAction: 'adjust-goal',
    })}
  `;

  bindAppBarLeading(container);

  // --- The skip-ahead control (src/skip-ahead.js, DECISIONS.md D38) ---------
  //
  // A RESEARCH AFFORDANCE, DRAWN HERE AND NOWHERE ELSE. It moved from the
  // bottom of /goals to the top of this screen: the figures it changes are all
  // on this screen, so the control and its effect are now read together rather
  // than two screens apart, and a facilitator does not have to leave the
  // tracker to move the position it is showing.
  //
  // THE TOP OF THE SCREEN IS A CHOSEN POSITION (D38). Sitting it lower, below
  // the checkpoint sentence, was built and reverted: it costs two of the four
  // milestone rows above the fold, and the positions that keep all four either
  // bury the control or put app content on both sides of it. Its single bottom
  // rule is correct only while it stays here.
  //
  // Both routes into the tracker get it, because they are the same screen -
  // the Insights tab root (D40) and the goals-page card (D38) render this same
  // module. The Mortgage in Principle flow and the deposit calculator do not
  // draw it at all: a participant part-way through a task must not be able to
  // change the position that task is measured against.
  //
  // `render` is passed so selection re-renders this screen in place rather than
  // navigating - scroll position and focus are both held.
  bindSkipAhead(container, ctx, render);

  // Frame 13 is comprehension content, so it stays reachable from here — but
  // through a link of its own, not through the rates card's heading. A heading
  // that is also a button says the rate figures under it are tappable, which
  // is the one thing they must not say now that no rate on this screen is
  // adjustable.
  //
  // DRAWN ON BOTH VARIANTS NOW, AND THE CONDITION THAT USED TO GATE IT IS SPENT
  // (DECISIONS.md D51). It was unlocked-only for one reason: below the
  // checkpoint the action bar's primary was D25's "What a bigger deposit
  // changes", which opens frame 13 under this very label, and two controls
  // carrying identical wording on one screen is what goal-check.js's "one link
  // to frame 29, not two" ruled out. `check-mip` holds the primary at both
  // positions now, so there is no second control with this label and no
  // duplication to prevent. The gate is removed rather than reworded: this is
  // the arrangement the unlocked variant already had, with an obsolete
  // condition taken off it.
  container.querySelector('[data-action="open-ltv-info"]').addEventListener('click', () => {
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

  // No handler for the locked milestone row any more: it is not a button.
  // See the milestone array above.

  // BOUND ON BOTH VARIANTS NOW (DECISIONS.md D51, overriding D25 and D35).
  // D35's "one door into the flow, and it is the action bar" still holds and is
  // the reason this is the only `check-mip` in the app; what changed is that the
  // door is no longer gated on the checkpoint.
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

  // The secondary is drawn below the checkpoint only, so its handler is bound
  // there only. Kept and still demoted (D25): adjusting the goal is a real
  // thing to want to do here, it just isn't the primary way forward.
  if (!unlocked) {
    container.querySelector('[data-action="adjust-goal"]').addEventListener('click', () => {
      window.location.hash = '#/calculator/review';
    });
  }
}
