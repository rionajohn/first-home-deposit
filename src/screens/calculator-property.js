/**
 * Frames 09 / 09a / 09b — Property and deposit. Figma nodes 66:476 / 73:902
 * / 66:557. Reference: reference/frames/09 Deposit calculator - property and
 * deposit.png, 09a Deposit calculator - before a value is entered.png, 09b
 * Deposit calculator - above the Lifetime ISA cap.png.
 *
 * One route ('/calculator/property') for all three — build-spec.md section
 * 3's own rule: frames sharing a route are variants of one screen. Which
 * variant renders is read from state, not a query param:
 *   - empty (09a): state['property-value'].value === null — Continue disabled
 *   - error: a committed property-value depositTarget() rejects — no
 *     wireframe drawn (DECISIONS.md D7 fallback: warning banner, Continue
 *     disabled)
 *   - above the Lifetime ISA cap (09b): property-value > LISA_CAP_PROPERTY_VALUE
 *     (DECISIONS.md D6, confirmed — not the nav table's "past the chip
 *     limit" reading)
 *   - filled (09): everything else
 *
 * The deposit-pct chip row and its Option comparison card show three
 * neighbouring DEPOSIT_PCT_OPTIONS around whichever chip is selected,
 * matching both 09's and 09b's reference PNGs (10% selected -> 5/10/15%
 * shown) — the chip row itself offers the full 5-25% set (09a's reference
 * PNG draws five chips; 09/09b draw three only because 10% neighbours 5%
 * and 15%, not because the option set actually narrows).
 */
import {
  formStepHeaderHTML,
  bindFormStepHeader,
  actionBarHTML,
  infoBannerHTML,
  infoIconButtonHTML,
  flagRowHTML,
  currencyInputHTML,
  chipRowHTML,
  optionComparisonCardHTML,
  warningBannerHTML,
  infoLinkHTML,
  provenanceCaptionHTML,
  rerenderInPlace,
  keepPressAlive,
} from '../components/ui.js';
import { formatCurrency, formatPercent } from '../format.js';
import { depositTarget, loanAmount, ltv, stampDuty, combinedGoal, ftbReliefLost } from '../model/model.js';
import { AREA_AVERAGE_PROPERTY_VALUE, DEPOSIT_PCT_OPTIONS, DEFAULT_DEPOSIT_PCT, LISA_CAP_PROPERTY_VALUE, neighbourPcts } from '../model/rates.js';

export const anchors = ['guidanceNotAdvice'];

function fill(template, values) {
  return Object.entries(values).reduce((s, [k, v]) => s.replace(`{${k}}`, v), template);
}

export function render(container, ctx) {
  const { state, setState, content } = ctx;
  const c = content['/calculator/property'];
  const reg = content.shared.regulatory;

  const propertyValue = state['property-value'];
  const depositPct = state['deposit-pct'].value ?? DEFAULT_DEPOSIT_PCT;
  // TWO WAYS TO BE EMPTY, AND THEY ARE DIFFERENT FACTS. `value === null` is a
  // session that has never entered a property value; `propertyValueCleared` is
  // a participant who is re-typing one they already committed. The screen draws
  // 09a for both, but only the first is a figure - the second is a draft, and
  // must not touch `property-value`. See DECISIONS.md D46.
  const isEmpty = state.propertyValueCleared || propertyValue.value === null;
  // D70. Derived live from the field's own committed value, exactly as
  // `isAboveLisaCap` below is - both banners appear as soon as the value
  // commits, and neither reads a stored flag.
  const reliefLost = ftbReliefLost({ 'property-value': propertyValue });

  let errorText = null;
  let comparisonRows = [];
  let isAboveLisaCap = false;

  if (!isEmpty) {
    const targetResult = depositTarget({ 'property-value': propertyValue, 'deposit-pct': { value: depositPct, provenance: 'entered' } });
    if (targetResult.error) {
      errorText = c.errorNonNumeric;
    } else {
      isAboveLisaCap = propertyValue.value > LISA_CAP_PROPERTY_VALUE;
      comparisonRows = neighbourPcts(depositPct).map((pct) => {
        const target = depositTarget({ 'property-value': propertyValue, 'deposit-pct': { value: pct, provenance: 'entered' } });
        const loan = loanAmount({ 'property-value': propertyValue, 'deposit-pct': { value: pct, provenance: 'entered' } });
        const value = ltv({ 'property-value': propertyValue, 'deposit-pct': { value: pct, provenance: 'entered' } });
        return {
          amount: formatCurrency(target.value),
          sublabel: fill(c.comparisonSublabelTemplate, { pct: formatPercent(pct, 0) }),
          technical: fill(c.comparisonTechnicalTemplate, { ltv: formatPercent(value.value, 0) }),
          // Compared against the same `depositPct` the chip row is given as
          // its `selected`, so the pill above and the outlined row below can
          // never disagree about which percentage is chosen. Exactly one of
          // the three rows matches: `neighbourPcts` always returns a window
          // containing the selected value.
          selected: pct === depositPct,
        };
      });
    }
  }

  container.innerHTML = `
    ${formStepHeaderHTML({ title: c.appBarTitle, step: c.stepLabel, appBarLabels: content.shared.appBar })}
    <main class="screen-content" role="main">
      <h2 class="screen-title">${c.headline}</h2>
      ${currencyInputHTML({
        id: 'property-value',
        label: c.propertyValueLabel,
        // The FIELD follows the draft; the STORE keeps what was committed. A
        // participant who cleared the field sees it empty while every screen
        // behind them still reads the goal they have not yet changed.
        value: isEmpty ? null : propertyValue.value,
        hint: isEmpty ? c.propertyValueHintEmpty : c.propertyValueHintFilled,
        ariaLabel: c.propertyValueAriaLabel,
      })}
      ${errorText ? warningBannerHTML(errorText) : ''}
      ${isAboveLisaCap ? infoBannerHTML(fill(c.lisaCapBannerText, { cap: formatCurrency(LISA_CAP_PROPERTY_VALUE) })) : ''}
      <!-- CAP FIRST, THEN TAX (DECISIONS.md D70), which is the order a
           participant typing upward crosses them: the Lifetime ISA cap at
           450,000, the stamp duty cliff at 500,000. Above 500,000 both are
           drawn and both are true. Between the two only the cap shows, which is
           correct - nothing about the tax changes there. -->
      ${reliefLost ? `
        <div class="note-with-info">
          <div class="note-with-info__text">${infoBannerHTML(c.stampDutyCliffBannerText)}</div>
          ${infoIconButtonHTML({ action: 'open-stamp-duty-info', ariaLabel: c.stampDutyInfoAriaLabel })}
        </div>
      ` : ''}
      <p class="entry-card__body">${fill(c.areaAverageCaption, {
        region: AREA_AVERAGE_PROPERTY_VALUE.region,
        amount: formatCurrency(AREA_AVERAGE_PROPERTY_VALUE.value),
        period: AREA_AVERAGE_PROPERTY_VALUE.asAtLabel,
      })}</p>
      ${provenanceCaptionHTML(fill(c.areaAverageSourceCaption, {
        source: AREA_AVERAGE_PROPERTY_VALUE.source,
        period: AREA_AVERAGE_PROPERTY_VALUE.asAtLabel,
      }))}
      <h3 class="section-heading">${c.depositQuestionHeading}</h3>
      ${chipRowHTML({ chips: DEPOSIT_PCT_OPTIONS.map((pct) => ({ value: pct, label: formatPercent(pct, 0) })), selected: isEmpty ? null : depositPct, action: 'select-deposit-pct' })}
      ${isEmpty
        ? `<div class="card empty-state-card empty-state-card--muted">
             <p class="empty-state-card__body">${c.emptyStateCaption}</p>
             ${infoLinkHTML({ label: c.ltvInfoLinkLabel, action: 'open-ltv-info' })}
           </div>`
        : errorText
          ? ''
          : optionComparisonCardHTML({ headerText: c.comparisonHeaderText, rows: comparisonRows, infoLinkLabel: c.ltvInfoLinkLabel, infoLinkAction: 'open-ltv-info', selectedLabel: c.comparisonSelectedLabel })}
      ${flagRowHTML(c.flagLabel)}
      <p class="legal-text">${reg.guidanceNotAdvice}</p>
    </main>
    ${actionBarHTML({
      primaryLabel: c.primaryCta,
      primaryAction: 'continue',
      primaryDisabled: isEmpty || !!errorText,
      secondaryLabel: c.secondaryCta,
      secondaryAction: 'exit',
    })}
  `;

  // D76: a press on any button must survive the field commit it triggers.
  keepPressAlive(container);

  bindFormStepHeader(container, {
    onClose: () => { setState({ returnFrame: '/calculator/property' }); window.location.hash = '#/calculator/exit'; },
  });

  const input = container.querySelector('[data-role="property-value"]');
  input.addEventListener('focus', () => input.select());
  input.addEventListener('change', () => {
    const typed = input.value.replace(/[^0-9.-]/g, '');
    // AN EMPTY FIELD IS A DRAFT, NOT A FIGURE, and this is the whole of G62's
    // fix. Writing `property-value: null` here is what left the store holding a
    // half-made edit beside a committed `deposit-target`, which frames 11, 12
    // and 15/16 then rendered as £0 - an invented figure on three screens, one
    // of them in a headline. The committed value is left exactly as it is and
    // the emptiness is recorded as this screen's own draft state.
    //
    // A field the strip leaves empty because it held only letters takes this
    // same branch, as it did before: the screen draws 09a either way.
    //
    // SO DOES ANYTHING THAT DOES NOT PARSE TO A FINITE NUMBER - "-", ".", "-."
    // all survive the strip and yield NaN. That used to be written to the
    // store, and `JSON.stringify` persists NaN as `null`, so a refresh turned
    // it into exactly the null-beside-a-committed-goal state this fix exists to
    // prevent. It is the same disagreement by a second route, so it takes the
    // same answer: not a figure, therefore a draft.
    //
    // Frame 09's error variant is untouched. It is reached by a committed value
    // the model rejects - `0` (ROUTES.md's own recipe) or a negative - and both
    // are finite, so both still write and still raise `not-positive`.
    const parsed = Number(typed);
    const next = typed === '' || !Number.isFinite(parsed)
      ? setState({ propertyValueCleared: true })
      : setState({
          propertyValueCleared: false,
          'property-value': { value: parsed, provenance: 'entered' },
        });
    rerenderInPlace(container, render, { ...ctx, state: next });
  });

  container.querySelectorAll('[data-action="select-deposit-pct"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const next = setState({ 'deposit-pct': { value: Number(btn.dataset.value), provenance: 'entered' } });
      rerenderInPlace(container, render, { ...ctx, state: next });
    });
  });

  const ltvInfoBtn = container.querySelector('[data-action="open-ltv-info"]');
  if (ltvInfoBtn) {
    ltvInfoBtn.addEventListener('click', () => {
      setState({ returnFrame: '/calculator/property' });
      window.location.hash = '#/learn/ltv';
    });
  }

  container.querySelector('[data-action="exit"]').addEventListener('click', () => {
    setState({ returnFrame: '/calculator/property' });
    window.location.hash = '#/calculator/exit';
  });

  // THE FIRST ENCOUNTER WITH THE TERM for a participant above 500,000, and
  // they meet it having just watched the goal step up by 5,000 for one extra
  // pound - so the explainer matters more here than it does on the tracker.
  //
  // `returnFrame` IS THIS SCREEN, NOT THE TRACKER. Dismissing the sheet has to
  // come back to the calculator step the participant was on. `goBack` handles
  // the ordinary case from history; `returnFrame` is what the sheet's '/home'
  // fallback would otherwise mis-target if it were opened cold.
  if (reliefLost) {
    container.querySelector('[data-action="open-stamp-duty-info"]').addEventListener('click', () => {
      setState({ returnFrame: '/calculator/property' });
      window.location.hash = '#/learn/stamp-duty';
    });
  }

  container.querySelector('[data-action="continue"]').addEventListener('click', () => {
    if (isEmpty || errorText) return;
    const finalPct = { value: depositPct, provenance: state['deposit-pct'].provenance ?? 'derived' };
    const pair = { 'property-value': propertyValue, 'deposit-pct': finalPct };
    const target = depositTarget(pair);
    const loan = loanAmount(pair);
    const value = ltv(pair);
    // DECISIONS.md D70: the tax and the combined goal are committed by the same
    // click that commits the target they are derived from. `loan-amount` and
    // `ltv` above are deliberately unchanged - they size the mortgage and stay
    // on the deposit alone.
    const tax = stampDuty(pair);
    const goal = combinedGoal(pair);
    setState({
      // The draft is resolved by the same click that commits it. Continue is
      // unreachable while the field is empty, so this can only ever be clearing
      // a flag that is already false - it is written so the draft cannot
      // outlive the edit it describes.
      propertyValueCleared: false,
      'deposit-pct': finalPct,
      'deposit-target': { value: target.value, provenance: target.provenance },
      'stamp-duty': { value: tax.value, provenance: tax.provenance },
      'combined-goal': { value: goal.value, provenance: goal.provenance },
      'loan-amount': { value: loan.value, provenance: loan.provenance },
      ltv: { value: value.value, provenance: value.provenance },
      lisaCapBreached: isAboveLisaCap,
    });
    window.location.hash = '#/calculator/saving';
  });
}
