/**
 * Frame 11 — Check your figures. Figma node 66:790. Reference:
 * reference/frames/11 Deposit calculator - check your figures.png.
 *
 * Single variant (build-spec.md section 2 lists only "read-only rows" /
 * "edited rows" — a captioning difference the reviewRowHTML calls below
 * already handle via each figure's own provenance, not a separate screen
 * state). Computes months-to-target, on-track-for and checkpoint-amount
 * when "Work it out" is pressed (build-spec.md section 1's own note that
 * these are committed here, not on frame 10).
 *
 * THE FOUR EDITABLE ROWS ARE FIELDS, ALL THE TIME (DECISIONS.md D62). Each one
 * used to carry a "Change" link that navigated to the screen owning its figure
 * — 09 for the property value and the deposit %, 06 for the saved total, 10 for
 * the monthly range. In a moderated think-aloud session that navigation cost
 * the participant their train of thought over what is, every time, a correction
 * to one number. There is no link now and no reveal: the figures a participant
 * may change are simply fields, which is frame 05's arrangement exactly.
 *
 * WHICH ROWS KEEP A PROVENANCE CAPTION (D5, as refined by D62). "Saved so far"
 * does, because it is the one figure here the participant did not type; the
 * property value and the monthly range do not, because a caption saying they
 * set the figure restates what the field already shows. Provenance is still
 * tracked on all of them - D5's decision is about what a figure CARRIES, and
 * that is unchanged.
 *
 * WHAT AN EDIT WRITES, AND WHEN. Frame 09's split exactly: the `change`
 * handler commits the BASE figure, and the derived figures are recomputed
 * beside it. Frame 09 can leave its recompute to Continue because Continue is
 * the only way off that screen; this screen has a back button to frame 10, so
 * a `property-value` committed here without its `deposit-target` would leave
 * frame 10 measuring against a target the participant had already replaced.
 * The recompute is therefore in the commit, guarded on the row being valid —
 * see `derivedFrom` below.
 *
 * A CLEARED FIELD IS A DRAFT, NEVER A FIGURE. `propertyValueCleared` (frame
 * 09's own key, reused rather than twinned) and the three keys beside it in
 * state.js. See D46 and GAPS.md G62: this screen is where a null figure was
 * rendered as £0 the first time.
 */
import {
  formStepHeaderHTML,
  bindFormStepHeader,
  actionBarHTML,
  infoBannerHTML,
  flagRowHTML,
  reviewRowHTML,
  warningBannerHTML,
  rerenderInPlace,
  keepPressAlive,
} from '../components/ui.js';
import { formatCurrency, formatPercent, formatDigits } from '../format.js';
import { monthsToTarget, onTrackFor, checkpointAmount, depositTarget, loanAmount, ltv, stampDuty, combinedGoal } from '../model/model.js';
import { RATES, DEPOSIT_PCT_OPTIONS, LISA_CAP_PROPERTY_VALUE } from '../model/rates.js';
import { chevronRight } from '../icons.js';

export const anchors = ['guidanceNotAdvice'];

function fill(template, values) {
  return Object.entries(values).reduce((s, [k, v]) => s.replace(`{${k}}`, v), template);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

// THE BOUNDS ARE THE CHIP SET'S OWN RANGE, STATED. Frame 09 offers
// DEPOSIT_PCT_OPTIONS and nothing else, so its ends are what a typed
// percentage may hold; reading them off the array rather than writing 5 and 25
// here is what stops the two controls disagreeing if the option set is ever
// changed. See DECISIONS.md D62.
const DEPOSIT_PCT_MIN_WHOLE = Math.round(Math.min(...DEPOSIT_PCT_OPTIONS) * 100);
const DEPOSIT_PCT_MAX_WHOLE = Math.round(Math.max(...DEPOSIT_PCT_OPTIONS) * 100);

export function render(container, ctx) {
  const { state, setState, content } = ctx;
  const c = content['/calculator/review'];
  // The two error strings this screen reuses belong to the screens that own
  // the fields they describe, and are read from there rather than copied: one
  // string, one place, whichever screen raises it.
  const cProperty = content['/calculator/property'];
  const cSaving = content['/calculator/saving'];
  const reg = content.shared.regulatory;

  if (state['savings-rate'].value === null || state['deposit-target'].value === null) {
    window.location.replace('#/calculator/saving');
    return;
  }

  const propertyValue = state['property-value'];
  const depositPct = state['deposit-pct'];
  const savedTowardDeposit = state['saved-toward-deposit'];
  const monthlyLow = state['monthly-low'];
  const monthlyHigh = state['monthly-high'];
  const savingCeiling = state['left-over'].value;

  const propertyCleared = state.propertyValueCleared;
  const pctCleared = state.depositPctCleared;
  const savedCleared = state.savedSoFarCleared;
  const lowCleared = state.monthlyLowCleared;
  const highCleared = state.monthlyHighCleared;

  // --- Per-row validation ---------------------------------------------------
  // Every bound here already existed: the property value's is the model's own
  // rejection, the deposit %'s is the chip set's range, and the monthly range's
  // is frame 10's savingCeiling. Nothing new is checked, and no row invents an
  // error the screen owning its field would not have raised.
  const propertyError = !propertyCleared
    && depositTarget({ 'property-value': propertyValue, 'deposit-pct': depositPct }).error
    ? cProperty.errorNonNumeric
    : null;
  const pctWhole = depositPct.value === null ? null : Math.round(depositPct.value * 100);
  const pctError = !pctCleared
    && (pctWhole === null || pctWhole < DEPOSIT_PCT_MIN_WHOLE || pctWhole > DEPOSIT_PCT_MAX_WHOLE)
    ? c.errorDepositPct
    : null;
  // ONE VALUE COMMITTED MEANS ONE INPUT (D136), the same rule frame 12 reads
  // for its series. Keyed on the two keys being equal, not on `solveFor`: what
  // matters is what was committed, not which branch committed it.
  const singleValue = monthlyLow.value !== null && monthlyLow.value === monthlyHigh.value;
  const monthlyError = !highCleared && monthlyHigh.value > savingCeiling
    ? cSaving.errorExceedsLeftOver
    : null;
  // Saved so far carries no bound. None exists anywhere in this build to reuse
  // — the figure is ordinarily a sum of account balances, which cannot be out
  // of range — so none is invented here. See GAPS.md G76.

  const anyDraft = propertyCleared || pctCleared || savedCleared || lowCleared || highCleared;
  const anyError = !!(propertyError || pctError || monthlyError);

  const digitsOr = (cleared, value) => (cleared || value === null ? '' : formatDigits(Math.round(value)));

  container.innerHTML = `
    ${formStepHeaderHTML({ title: c.appBarTitle, step: c.stepLabel, appBarLabels: content.shared.appBar })}
    <main class="screen-content" role="main">
      <h2 class="screen-title">${c.headline}</h2>
      <div class="review-rows-stack">
        ${reviewRowHTML({
          label: c.propertyValueLabel,
          // NO CAPTION. The value is in a field the participant typed into, so
          // "You entered this" restated the control. D5's rationale is that a
          // figure should say where it came from; this one says so by being
          // editable. See D62.
          fields: [{
            role: 'edit-property-value',
            prefix: '£',
            digits: digitsOr(propertyCleared, propertyValue.value),
            ariaLabel: c.propertyValueAriaLabel,
          }],
        })}
        ${propertyError ? warningBannerHTML(propertyError, { id: 'error-property-value' }) : ''}
        ${reviewRowHTML({
          label: c.depositPctLabel,
          fields: [{
            role: 'edit-deposit-pct',
            suffix: '%',
            digits: pctCleared || pctWhole === null ? '' : String(pctWhole),
            ariaLabel: c.depositPctAriaLabel,
          }],
        })}
        ${pctError ? warningBannerHTML(pctError, { id: 'error-deposit-pct' }) : ''}
        ${reviewRowHTML({
          label: c.savedSoFarLabel,
          // THE ONE ROW THAT KEEPS ITS CAPTION, and the reason the other two
          // could lose theirs. This is the only figure on the screen the
          // participant did not type, so it is the only one where provenance
          // carries information rather than restating the control - and the
          // only one where a typed figure and an account-derived one would
          // otherwise be indistinguishable.
          //
          // A typed edit switches it to "You entered this", so the change of
          // provenance stays visible. If the participant later changes which
          // accounts count, frames 03 and 06 recompute the total, return
          // provenance to 'read', and this caption comes back with it. Neither
          // string is new. See D62 and, for what "later" turns out to mean in
          // this build, GAPS.md G75.
          caption: savedTowardDeposit.provenance === 'entered' ? c.enteredCaption : c.savedSoFarCaption,
          fields: [{
            role: 'edit-saved-so-far',
            prefix: '£',
            digits: digitsOr(savedCleared, savedTowardDeposit.value),
            ariaLabel: c.savedSoFarAriaLabel,
          }],
        })}
        ${reviewRowHTML({
          label: c.monthlySavingLabel,
          // NO CAPTION, for the property value's reason, and D47's two-caption
          // problem goes with it: there is no longer a line that can tell a
          // participant who moved no handle that they set the range.
          // NO JOIN WITH ONE FIELD (D136). "to" is the word between two
          // figures; with one there is nothing for it to sit between, and
          // "GBP 633 to GBP 633" reads as a fault before the participant
          // reaches the results.
          join: singleValue ? undefined : c.monthlySavingJoin,
          // THE CEILING, FROM THE SAME VARIABLE THE ERROR IS COMPARED AGAINST
          // (D90). `savingCeiling` is read once at the top of this render and
          // `monthlyError` above tests `monthlyHigh.value > savingCeiling`
          // against it - so the number the participant is shown and the number
          // they are refused by are one value, not two derivations that could
          // drift.
          //
          // GUARDED ON A POSITIVE, FINITE CEILING. `formatCurrency(null)`
          // renders "£0", which is the silent-zero defect D46 and GAPS.md G62
          // were both written for; a label reading "Max: £0" would be worse
          // than no label. `left-over` is seeded at session start and frame 05
          // refuses to commit a non-positive override, so this only ever guards
          // a state the build does not produce.
          limit: Number.isFinite(savingCeiling) && savingCeiling > 0
            ? { id: 'monthly-saving-max', text: fill(c.monthlySavingMaxTemplate, { max: formatCurrency(savingCeiling) }) }
            : null,
          fields: singleValue
            ? [{
              role: 'edit-monthly-single',
              prefix: '£',
              digits: digitsOr(lowCleared || highCleared, monthlyLow.value),
              ariaLabel: c.monthlySingleAriaLabel,
            }]
            : [
              {
                role: 'edit-monthly-low',
                prefix: '£',
                digits: digitsOr(lowCleared, monthlyLow.value),
                ariaLabel: c.monthlyLowAriaLabel,
              },
              {
                role: 'edit-monthly-high',
                prefix: '£',
                digits: digitsOr(highCleared, monthlyHigh.value),
                ariaLabel: c.monthlyHighAriaLabel,
              },
            ],
        })}
        ${monthlyError ? warningBannerHTML(monthlyError, { id: 'error-monthly-range' }) : ''}
        ${reviewRowHTML({
          label: c.savingsInterestLabel,
          value: `${formatPercent(RATES.bankRate)} AER`,
          caption: fill(content.shared.bankRateCaptionTemplate, { source: RATES.source }),
        })}
        ${reviewRowHTML({
          label: c.taxRateLabel,
          value: c.taxRateValue,
          caption: c.taxRateCaption,
        })}
        <button type="button" class="list-row" data-action="open-provenance-key">
          <span class="list-row__label">${c.provenanceKeyLabel}</span>
          ${chevronRight({ size: 'body', className: 'list-row__chevron' })}
        </button>
      </div>

      ${infoBannerHTML(c.noteBannerText)}
      ${flagRowHTML(c.flagLabel)}
      <p class="legal-text">${reg.guidanceNotAdvice}</p>
    </main>
    ${actionBarHTML({
      primaryLabel: c.primaryCta,
      primaryAction: 'work-it-out',
      // A draft disables the button without raising an error, exactly as an
      // empty property value does on frame 09 and an empty year on 10b:
      // nothing is wrong yet, the participant is part-way through typing.
      // With every row a field, this is the screen's only guard against
      // `formatCurrency(null)` reaching frames 12, 15 and 16 as £0.
      primaryDisabled: anyError || anyDraft,
      // D78. THE ONLY SCREEN THAT CAN RAISE MORE THAN ONE AT ONCE, so it names
      // every banner it actually drew rather than the first. A row in draft
      // contributes nothing here: it disables the button without a banner.
      primaryDescribedBy: [
        propertyError ? 'error-property-value' : null,
        pctError ? 'error-deposit-pct' : null,
        monthlyError ? 'error-monthly-range' : null,
      ],
      secondaryLabel: c.secondaryCta,
      secondaryAction: 'exit',
    })}
  `;

  // D76: a press on any button must survive the field commit it triggers.
  keepPressAlive(container);

  bindFormStepHeader(container, {
    onClose: () => { setState({ returnFrame: '/calculator/review' }); window.location.hash = '#/calculator/exit'; },
  });

  // --- Committing an edit ---------------------------------------------------
  // One helper per field, all four built the same way and all four frame 05's
  // two lines: `focus` selects the whole value so a tap replaces it rather than
  // dropping a caret mid-number, and `change` - not `input` - is the commit, so
  // a half-typed "45" never reaches the store or re-renders the screen under
  // the participant's fingers.
  //
  // The strip is `[^0-9.]` rather than frame 09's `[^0-9.-]`: none of these
  // four fields can hold a negative. That is a FORMAT constraint and not a
  // bound - frame 10b's year field narrows the same strip for the same reason -
  // and it introduces no validation and no error string.
  function bindField(role, commit) {
    const input = container.querySelector(`[data-role="${role}"]`);
    if (!input) return;
    input.addEventListener('focus', () => input.select());
    input.addEventListener('change', () => {
      const typed = input.value.replace(/[^0-9.]/g, '');
      const parsed = Number(typed);
      const next = setState(typed === '' || !Number.isFinite(parsed)
        ? commit(null)
        : commit(parsed));
      rerenderInPlace(container, render, { ...ctx, state: next });
    });
  }

  // Frame 09's Continue writes these four beside `property-value`, and so does
  // every commit here, for the reason set out in this file's header. Guarded on
  // the pair being valid: an out-of-range percentage or a rejected property
  // value writes its own base figure and stops there, so nothing downstream can
  // read a target derived from a value this screen is showing an error for.
  function derivedFrom(pv, pct) {
    const pair = { 'property-value': pv, 'deposit-pct': pct };
    const target = depositTarget(pair);
    if (target.error) return {};
    const loan = loanAmount(pair);
    const value = ltv(pair);
    // D70: committed alongside the target, by every commit on this screen.
    const tax = stampDuty(pair);
    const goal = combinedGoal(pair);
    return {
      'deposit-target': { value: target.value, provenance: target.provenance },
      'stamp-duty': { value: tax.value, provenance: tax.provenance },
      'combined-goal': { value: goal.value, provenance: goal.provenance },
      'loan-amount': { value: loan.value, provenance: loan.provenance },
      ltv: { value: value.value, provenance: value.provenance },
      lisaCapBreached: pv.value > LISA_CAP_PROPERTY_VALUE,
    };
  }

  bindField('edit-property-value', (parsed) => {
    if (parsed === null) return { propertyValueCleared: true };
    const pv = { value: parsed, provenance: 'entered' };
    return { propertyValueCleared: false, 'property-value': pv, ...derivedFrom(pv, depositPct) };
  });

  bindField('edit-deposit-pct', (parsed) => {
    if (parsed === null) return { depositPctCleared: true };
    // Typed as whole percent, stored as the fraction every other reader of this
    // key expects (rates.js's DEPOSIT_PCT_OPTIONS are 0.05 to 0.25). An
    // out-of-range value is committed and flagged rather than refused, which is
    // frame 09's treatment of a property value its own model rejects.
    const pct = { value: Math.round(parsed) / 100, provenance: 'entered' };
    return { depositPctCleared: false, 'deposit-pct': pct, ...derivedFrom(propertyValue, pct) };
  });

  bindField('edit-saved-so-far', (parsed) => (parsed === null
    ? { savedSoFarCleared: true }
    : { savedSoFarCleared: false, 'saved-toward-deposit': { value: parsed, provenance: 'entered' } }));

  // THE RANGE CLAMPS RATHER THAN ERRORING, which is what frame 10's own figure
  // inputs do with the identical expressions (calculator-saving.js): a low
  // above the high snaps down to the high, a high below the low snaps up to it,
  // and a high above what is left over each month snaps to that ceiling. No new
  // error pattern, and no copy. See GAPS.md G74 for what it costs.
  function commitRange(low, high) {
    const rate = (low + high) / 2;
    return {
      'monthly-low': { value: low, provenance: 'entered' },
      'monthly-high': { value: high, provenance: 'entered' },
      // The midpoint, as frame 10's Continue commits it.
      'savings-rate': { value: rate, provenance: 'entered' },
      // Entering a monthly amount is what frame 10 calls solving FOR the date,
      // so an edit here puts the calculator in the same mode as typing an
      // amount on frame 10 would. `targetMonth` and `targetYear` are left
      // standing - frame 10's own segmented control does not clear them either.
      solveFor: 'date',
    };
  }

  bindField('edit-monthly-low', (parsed) => (parsed === null
    ? { monthlyLowCleared: true }
    : { monthlyLowCleared: false, ...commitRange(clamp(parsed, 0, monthlyHigh.value), monthlyHigh.value) }));

  // THE SINGLE FIELD WRITES BOTH KEYS, so one value stays one value: there is
  // no second input to type a second figure into, and an edit that moved only
  // one key would silently turn the row back into a range the participant
  // never asked for (D136).
  //
  // AND IT ERRORS RATHER THAN CLAMPING, which is the one place this diverges
  // from the pair below. The pair snaps a high above the ceiling down to it
  // (G74's recorded cost); doing that here would make the participant's typed
  // figure vanish into a bound with nothing to explain it, and the "Max" note
  // beside the field is precisely what makes the ceiling visible to someone
  // editing upward. Committing the typed value lets `monthlyError` fire and
  // Continue disable, so the figure they typed stays on screen with the reason
  // it is refused. The divergence is recorded as GAPS.md G130.
  bindField('edit-monthly-single', (parsed) => (parsed === null
    ? { monthlyLowCleared: true, monthlyHighCleared: true }
    : { monthlyLowCleared: false, monthlyHighCleared: false, ...commitRange(Math.max(parsed, 0), Math.max(parsed, 0)) }));

  bindField('edit-monthly-high', (parsed) => (parsed === null
    ? { monthlyHighCleared: true }
    : { monthlyHighCleared: false, ...commitRange(monthlyLow.value, clamp(parsed, monthlyLow.value, savingCeiling)) }));

  // The savings interest rate and the tax rate carry no "Edit" link: neither
  // is adjustable, and a row is either editable or explanatory, never both.
  // Their provenance captions still say where each figure came from, and the
  // "How we worked these out" row below still reaches frame 32.
  container.querySelector('[data-action="open-provenance-key"]').addEventListener('click', () => {
    setState({ returnFrame: '/calculator/review' });
    window.location.hash = '#/assumptions/saving';
  });

  container.querySelector('[data-action="exit"]').addEventListener('click', () => {
    setState({ returnFrame: '/calculator/review' });
    window.location.hash = '#/calculator/exit';
  });

  container.querySelector('[data-action="work-it-out"]').addEventListener('click', () => {
    if (anyError || anyDraft) return;
    const months = monthsToTarget(state);
    const onTrack = onTrackFor(state);
    const checkpoint = checkpointAmount(state);
    setState({
      'months-to-target': { value: months.value, provenance: months.provenance },
      'on-track-for': { value: onTrack.value, provenance: onTrack.provenance },
      'checkpoint-amount': { value: checkpoint.value, provenance: checkpoint.provenance },
    });
    window.location.hash = '#/calculator/result';
  });
}
