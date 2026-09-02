/**
 * Frame 06 — What we found. Figma node 31:359. Reference:
 * reference/frames/06 What we found.png.
 *
 * Variants built (build-spec.md section 2):
 *   - emergency fund covered: emergency-fund >= 3 x essential-spending
 *   - emergency fund short: below that (No frame drawn — DECISIONS.md D7
 *     fallback, same card shape with a neutral icon and different copy)
 *   - deposit accounts assigned: saved-toward-deposit > 0
 *   - no accounts assigned: saved-toward-deposit = 0 (No frame drawn —
 *     DECISIONS.md D7 fallback, the shared empty-state-card pattern)
 *
 * Re-derives saved-toward-deposit / emergency-fund / unassigned from
 * src/model/accounts.js on every render (not just once at /consent) so a
 * 03b move made from this screen's own "Tell us what it's for" row is
 * reflected immediately — the same recompute consent.js does.
 */
import {
  appBarHTML,
  bindAppBarLeading,
  actionBarHTML,
  infoBannerHTML,
  flagRowHTML,
  disclosureHTML,
  proportionRowsHTML,
  figureRowHTML,
  figureDisplayHTML,
  emptyStateCardHTML,
  howThisWorksCardHTML,
  rerenderInPlace,
} from '../components/ui.js';
import { formatCurrency } from '../format.js';
import { effectiveAccounts, groupTotals, countedTowardDeposit, listContainsAny } from '../model/accounts.js';
import { LISA_CAP_PROPERTY_VALUE } from '../model/rates.js';
import { arrowUpRight, checkmarkCircle, chevronRight, infoCircle } from '../icons.js';
import { accountFiguresPatch, startingSavedTowardDeposit } from '../skip-ahead.js';

export const anchors = ['guidanceNotAdvice'];

// THE ACCOUNTS `lisaCaption` IS ABOUT, so the general rule can be applied to
// it rather than the account being named inside the template string. It reads
// as a list because the rule takes a set: if a second Lifetime ISA is ever
// added to the mock data, the caption should survive while either is listed,
// and that is an edit here rather than a rewrite of the condition below.
const LISA_CAPTION_ACCOUNTS = ['lifetime-isa'];

function fill(template, values) {
  return Object.entries(values).reduce((s, [k, v]) => s.replace(`{${k}}`, v), template);
}

function statusCard({ icon, headline, body, contentHtml }) {
  return `
    <div class="card status-card">
      <div class="status-card__header">
        <div class="status-card__glyph">${icon({ size: 'body' })}</div>
        <div class="status-card__text">
          <p class="status-card__headline">${headline}</p>
          <p class="status-card__body">${body}</p>
        </div>
      </div>
      ${contentHtml}
    </div>
  `;
}

export function render(container, ctx) {
  const { state: initialState, setState, content } = ctx;
  const c = content['/position/summary'];
  const reg = content.shared.regulatory;

  const accounts = effectiveAccounts(initialState.accountAssignments, initialState.accountIncluded);
  const totals = groupTotals(accounts);
  const provenance = 'read';
  let state = initialState;
  // THE COMPARISON IS AGAINST THE STARTING POSITION, NOT THE FIGURE ON SCREEN.
  // Ordinarily those are the same thing. While the skip-ahead control on
  // /goals is at "Further along" they are not: `saved-toward-deposit` holds
  // the checkpoint position, which will never equal an account total, so a
  // bare comparison would fire a write on every render and each one would
  // overwrite the skipped position - silently returning the session to "Now"
  // while the control still read "Further along", and discarding the
  // participant's own account edit when the control was moved back.
  // `accountFiguresPatch` re-points the recomputed deposit total at the
  // stashed starting position instead; see src/skip-ahead.js.
  if (
    startingSavedTowardDeposit(state).value !== totals.deposit ||
    state['emergency-fund'].value !== totals.emergency ||
    state.unassigned.value !== totals.unassigned
  ) {
    state = setState(accountFiguresPatch(state, {
      'saved-toward-deposit': { value: totals.deposit, provenance },
      'emergency-fund': { value: totals.emergency, provenance },
      unassigned: { value: totals.unassigned, provenance },
    }));
  }

  const moneyIn = state['money-in'].value;
  const essentialSpending = state['essential-spending'].value;
  const leftOverValue = state['left-over'].value;
  const emergencyFund = state['emergency-fund'].value;
  const savedTowardDeposit = state['saved-toward-deposit'].value;

  const emergencyCovered = emergencyFund >= 3 * essentialSpending;
  const emergencyAccounts = accounts.filter((a) => a.group === 'emergency');
  // THE BREAKDOWN IS THE SUM'S OWN SET, NOT THE GROUP.
  // This read `a.group === 'deposit'`, which is one of the three terms the
  // deposit total applies - so an account the participant had unticked was
  // dropped from the headline and still listed beneath it under "Read from
  // this account", inside a list of accounts feeding a total it was not part
  // of. `countedTowardDeposit` is the list form of what `groupTotals` adds up,
  // so the rows cannot sum to anything but the figure above them.
  const depositAccounts = countedTowardDeposit(accounts);
  const unassignedAccounts = accounts.filter((a) => a.group === 'unassigned');

  const essentialsPct = moneyIn ? Math.round((essentialSpending / moneyIn) * 100) : 0;
  const leftOverPct = moneyIn ? Math.round((leftOverValue / moneyIn) * 100) : 0;

  const emergencyCard = statusCard({
    icon: emergencyCovered ? checkmarkCircle : infoCircle,
    headline: emergencyCovered ? c.emergencyCoveredHeadline : c.emergencyShortHeadline,
    body: fill(emergencyCovered ? c.emergencyCoveredBody : c.emergencyShortBody, { amount: formatCurrency(emergencyFund) }),
    contentHtml: emergencyAccounts.length
      ? figureRowHTML({ label: c.heldInLabel, trailing: emergencyAccounts.map((a) => a.name).join(', '), caption: c.heldInCaption })
      : '',
  });

  let depositCard;
  if (savedTowardDeposit <= 0) {
    depositCard = emptyStateCardHTML({
      title: c.noAccountsHeadline,
      body: c.noAccountsBody,
      ctaLabel: c.noAccountsCta,
      ctaAction: 'open-consent',
    });
  } else {
    const sortCount = unassignedAccounts.length;
    const sortHeading = sortCount === 1 ? c.oneLeftToSort : fill(c.manyLeftToSort, { count: sortCount });
    depositCard = `
      <div class="card status-card">
        <div class="status-card__header">
          <div class="status-card__glyph">${arrowUpRight({ size: 'body' })}</div>
          <div class="status-card__text">
            <p class="status-card__headline">${c.depositOnWayHeadline}</p>
            <p class="status-card__body">${fill(c.depositOnWayBody, { amount: formatCurrency(savedTowardDeposit) })}</p>
          </div>
        </div>
        ${figureDisplayHTML({ value: formatCurrency(savedTowardDeposit), caption: c.savedTowardDepositLabel })}
        <p class="provenance-caption provenance-caption--center">${c.savedTowardDepositCaption}</p>
        <div class="status-card__account-list">
          ${depositAccounts.map((a) => figureRowHTML({ label: a.name, trailing: formatCurrency(a.balance), caption: c.accountBalanceCaption })).join('')}
        </div>
        ${listContainsAny(depositAccounts, LISA_CAPTION_ACCOUNTS)
          ? `<p class="account-row__caption">${fill(c.lisaCaption, { cap: formatCurrency(LISA_CAP_PROPERTY_VALUE) })}</p>`
          : ''}
        ${sortCount > 0 ? `
          <div class="status-card__still-to-sort">
            <h3 class="section-heading">${sortHeading}</h3>
            ${unassignedAccounts.map((a) => `
              ${figureRowHTML({ label: a.name, value: formatCurrency(a.balance), caption: c.onlyYouKnowCaption })}
              <button type="button" class="list-row" data-action="sort-account" data-account-id="${a.id}">
                <span class="list-row__label">${c.tellUsLabel}</span>
                ${chevronRight({ size: 'body', className: 'list-row__chevron' })}
              </button>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }

  const disclosureContent = `
    ${proportionRowsHTML([
      {
        label: c.proportions.essentialsLabel,
        valueText: formatCurrency(essentialSpending),
        pct: essentialsPct,
        pctText: `${essentialsPct}% ${c.proportions.ofWhatComesIn}`,
      },
      {
        label: c.proportions.leftOverLabel,
        valueText: formatCurrency(leftOverValue),
        pct: leftOverPct,
        pctText: `${leftOverPct}% ${c.proportions.ofWhatComesIn}`,
      },
    ])}
    ${figureRowHTML({ label: c.moneyInLabel, value: formatCurrency(moneyIn), caption: c.moneyInCaption })}
    ${figureRowHTML({ label: c.essentialSpendingLabel, value: formatCurrency(-essentialSpending), caption: content.shared.essentialSpendingCaption })}
    ${figureRowHTML({ label: c.leftOverEachMonthLabel, value: formatCurrency(leftOverValue), caption: content.shared.leftOverCaption })}
    ${figureRowHTML({ label: c.savedTowardDepositLabel, value: formatCurrency(savedTowardDeposit), caption: c.savedTowardDepositCaption })}
  `;

  container.innerHTML = `
    ${appBarHTML({ title: c.appBarTitle, left: 'back', appBarLabels: content.shared.appBar })}
    <main class="screen-content" role="main">
      <h2 class="screen-title">${c.headline}</h2>
      <p class="entry-card__body">${c.body}</p>

      <div class="check-results">
        ${emergencyCard}
        ${depositCard}
      </div>

      ${disclosureHTML({ id: 'summary-breakdown', title: c.disclosureTitle, open: state.summaryDisclosureOpen, contentHtml: disclosureContent })}

      ${infoBannerHTML(c.calculatorNote)}

      ${howThisWorksCardHTML({
        id: 'summary-how-we-worked',
        open: state.summaryHowWeWorkedOpen,
        title: c.howWeWorkedTitle,
        intro: c.howWeWorkedIntro,
        rows: [
          c.whatWeRead,
          { ...c.whatWeWorkedOut, value: fill(c.whatWeWorkedOut.value, { essential: formatCurrency(essentialSpending), leftOver: formatCurrency(leftOverValue) }) },
          c.whatWeAssumed,
        ],
        navLabel: c.seeHowWeWorkedLabel,
        navAction: 'open-assumptions-card',
      })}

      ${flagRowHTML(c.flagLabel)}
      <p class="legal-text">${reg.guidanceNotAdvice}</p>

      <div class="card decision-card">
        <h3 class="section-heading">${c.decisionHeadline}</h3>
        <p class="entry-card__body">${c.decisionBody}</p>
      </div>
    </main>
    ${actionBarHTML({
      primaryLabel: c.primaryCta,
      primaryAction: 'goal-yes',
      secondaryLabel: c.secondaryCta,
      secondaryAction: 'goal-no',
    })}
  `;

  bindAppBarLeading(container);

  // TWO COLLAPSIBLES ON THIS SCREEN, SO THE BINDING ROUTES ON THE ID.
  // The "What we used to check this" breakdown and the "How we worked this
  // out" card both emit `data-action="toggle-disclosure"`; a bare
  // querySelector would have bound the first and left the card inert, which
  // is exactly the silent half-wiring a single-match query invites when a
  // second instance of a component arrives later. Each has its own state key
  // (D12), so opening one never opens the other.
  const DISCLOSURE_KEYS = {
    'summary-breakdown': 'summaryDisclosureOpen',
    'summary-how-we-worked': 'summaryHowWeWorkedOpen',
  };

  container.querySelectorAll('[data-action="toggle-disclosure"]').forEach((btn) => {
    const key = DISCLOSURE_KEYS[btn.dataset.disclosureId];
    if (!key) return;
    btn.addEventListener('click', () => {
      const next = setState({ [key]: !state[key] });
      rerenderInPlace(container, render, { ...ctx, state: next });
    });
  });

  // ONE ROUTE TO FRAME 29 FROM THIS SCREEN, NOT TWO.
  // This screen used to draw the underlined "How did we work this out?"
  // info-link AND the card's own "See how we worked this out" nav row, and
  // both opened /assumptions/saving — the same sheet, from two controls a
  // thumb's width apart, worded almost identically. The card's nav row is
  // the one that survives: it belongs to howThisWorksCardHTML rather than
  // being a loose link, it sits under the rows whose working it explains,
  // and it is the same footer 12, 13, 20 and 21 draw. The loose link had no
  // such anchor — it named no figure and sat between two unrelated cards.
  container.querySelector('[data-action="open-assumptions-card"]').addEventListener('click', () => {
    setState({ returnFrame: '/position/summary' });
    window.location.hash = '#/assumptions/saving';
  });

  const openConsentBtn = container.querySelector('[data-action="open-consent"]');
  if (openConsentBtn) {
    openConsentBtn.addEventListener('click', () => {
      window.location.hash = '#/consent';
    });
  }

  container.querySelectorAll('[data-action="sort-account"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      setState({ selectedAccountId: btn.dataset.accountId, returnFrame: '/position/summary' });
      window.location.hash = '#/consent/move-account';
    });
  });

  container.querySelector('[data-action="goal-yes"]').addEventListener('click', () => {
    setState({ goal: 'house' });
    window.location.hash = '#/goal-check';
  });

  container.querySelector('[data-action="goal-no"]').addEventListener('click', () => {
    // "Not right now - save for something else" now lands somewhere that
    // answers it. Frame 07 ("Generic savings goal") is still out of scope
    // (build-spec.md section 3: "Remove") — this is NOT that screen, and no
    // generic goal-setting flow was built. It is /goals, the bank's own
    // goals area, which already holds the participant's pots and offers one
    // card back into the deposit calculator. Returning to frame 01 made a
    // considered "no" indistinguishable from a dead end. See DECISIONS.md
    // D21.
    setState({ goal: 'other' });
    window.location.hash = '#/goals';
  });
}
