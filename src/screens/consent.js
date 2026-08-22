/**
 * Frame 03 - Your accounts. Figma node 10:45. Reference:
 * reference/frames/03 Consent and linked accounts.png.
 *
 * THIS SCREEN NO LONGER ASKS A QUESTION. The app assumes the participant's
 * accounts are connected, because this is their main bank, so what is left
 * here is the part that was always real user input: which accounts count
 * toward a deposit, and what each one is for. Gone with the account-linking
 * choice are the savings-with-us question and its estimate branch, the
 * consent statement, "Not now" and the declined path behind it. See
 * DECISIONS.md D28.
 *
 * Variants built (build-spec.md section 2):
 *   - all-selected / some-selected: the "Select all accounts" checkbox,
 *     reflecting the deposit group's included count
 *   - assigned / unassigned: account-row + group-header styling
 *
 * The three account figures (saved-toward-deposit, emergency-fund,
 * unassigned) are seeded at session start now (src/state.js), not here.
 * This screen recalculates them on every selection change and on Continue,
 * through the same accountFigures helper, so what it commits is always what
 * is on screen - see DECISIONS.md D5 on provenance.
 */
import { appBarHTML, bindAppBarBack, actionBarHTML, infoBannerHTML } from '../components/ui.js';
import { formatCurrency, formatAccountBalance } from '../format.js';
import {
  effectiveAccounts,
  groupTotals,
  depositSelection,
  isSelectedForDeposit,
  selectAllPatch,
  toggleAccountPatch,
  accountFigures,
  GROUP_ORDER,
} from '../model/accounts.js';
import { checkmark, chevronRight, minus } from '../icons.js';

export const anchors = ['guidanceNotAdvice'];

/**
 * A real `<input type="checkbox">` inside a `<label>`, not a button with
 * `role="checkbox"`.
 *
 * The select-all row has three states, and the third one — mixed — has no
 * HTML attribute: `indeterminate` is a DOM property only, set in JavaScript
 * after render (see below). Assistive technology reads it from the native
 * control, announcing "partially checked", which `aria-checked="mixed"` on a
 * button can only approximate.
 *
 * The input is visually hidden but NOT `display: none` — it stays in the
 * accessibility tree and stays focusable, and its focus ring is drawn on the
 * box beside it (components.css). Wrapping everything in the `<label>` means
 * the whole row is the hit target, natively, and the accessible name picks up
 * the title, the body and the count together — "Select all accounts, 4 of 5
 * selected".
 *
 * The box holds both glyphs; CSS shows whichever of :checked / :indeterminate
 * applies, and neither when the box is empty.
 */
function checkboxRow({ checked, title, body, action, trailing = '', trailingRole = '', strong = false }) {
  const titleClass = strong ? 'checkbox-row__title checkbox-row__title--strong' : 'checkbox-row__title';
  return `
    <label class="checkbox-row">
      <input type="checkbox" class="checkbox-row__input" data-action="${action}" ${checked ? 'checked' : ''} />
      <span class="checkbox-row__box" aria-hidden="true">
        ${checkmark({ size: 'footnote', weight: 'bold' })}
        ${minus({ size: 'footnote', weight: 'bold' })}
      </span>
      <span class="checkbox-row__text">
        <span class="${titleClass}">${title}</span>
        ${body ? `<span class="checkbox-row__body">${body}</span>` : ''}
      </span>
      ${trailing ? `<span class="checkbox-row__trailing"${trailingRole ? ` data-role="${trailingRole}"` : ''}>${trailing}</span>` : ''}
    </label>
  `;
}

/**
 * One linked account: a selection checkbox, then the rest of the row as a
 * separate button that opens 03b (DECISIONS.md D16).
 *
 * Two targets, deliberately separate. Nesting a `<label><input></label>`
 * inside the `<button>` this row used to be is invalid HTML and gives one
 * tap two meanings; splitting them means the checkbox toggles selection and
 * everything else — name, type, balance, chevron — still opens the sheet
 * where the account's purpose is set. Both are at least 48px (D1): the
 * checkbox gets its own 48x48 label, and the button keeps the row's 64px
 * minimum.
 *
 * Only counting accounts get a checkbox — `countsTowardDeposit` in
 * accounts.js, the same flag the count and the totals read, so a current
 * account or a holiday pot cannot be selected by any route. Those rows draw
 * no empty box and no placeholder: an empty box would read as "unticked,
 * tick me", which is exactly the wrong thing to say about an account that
 * can never be counted.
 *
 * The input carries its own `aria-label` because the label element wraps
 * only the box glyph. Without it a screen reader would announce five
 * checkboxes all called nothing.
 */
function accountRow(account, content) {
  const caption = account.captionKey ? content.accountCaptions[account.captionKey] : null;
  const disabled = !account.movable;
  const selectLabel = content.accountSelectLabelTemplate.replace('{account}', account.name);

  const select = account.countsTowardDeposit
    ? `
      <label class="account-row__select">
        <input
          type="checkbox"
          class="checkbox-row__input"
          data-action="toggle-account"
          data-account-id="${account.id}"
          aria-label="${selectLabel}"
          ${isSelectedForDeposit(account) ? 'checked' : ''}
        />
        <span class="checkbox-row__box" aria-hidden="true">
          ${checkmark({ size: 'footnote', weight: 'bold' })}
        </span>
      </label>`
    : '';

  return `
    <div class="account-row-wrap">
      <div class="account-row">
        ${select}
        <button type="button" class="account-row__open" data-action="open-account" data-account-id="${account.id}" ${disabled ? 'disabled aria-disabled="true"' : ''}>
          <span class="account-row__info">
            <span class="account-row__name">${account.name}</span>
            <span class="account-row__category">${account.category}</span>
          </span>
          <span class="account-row__right">
            <span class="account-row__balance">${formatAccountBalance(account.balance)}</span>
            ${disabled ? '' : chevronRight({ size: 'body', className: 'list-row__chevron' })}
          </span>
        </button>
      </div>
      ${caption ? `<p class="account-row__caption">${caption}</p>` : ''}
    </div>
  `;
}

function groupSection(group, accounts, totals, content) {
  if (accounts.length === 0) return '';
  const g = content.groups[group];
  const totalKey = group === 'excluded' ? 'notCounted' : group;
  const headerClass = group === 'unassigned' ? ' account-group-header--unassigned' : '';
  const sortButton = group === 'unassigned'
    ? `<button type="button" class="button button--secondary" data-action="open-account" data-account-id="${accounts[0].id}">${content.sortThisOut}</button><div class="accounts-card__spacer-lg"></div>`
    : '';

  return `
    <div class="account-group-header${headerClass}">
      <span>
        <p class="account-group-header__title">${g.header}</p>
        ${g.subtitle ? `<p class="account-group-header__subtitle">${g.subtitle}</p>` : ''}
      </span>
      <p class="account-group-header__total" data-role="group-total" data-group="${group}">${formatCurrency(totals[totalKey])}</p>
    </div>
    ${accounts.map((a) => accountRow(a, content)).join('')}
    ${sortButton}
    ${group !== 'excluded' ? '<div class="accounts-card__spacer-lg"></div>' : ''}
  `;
}

/**
 * Everything the accounts card draws, derived from state in one place so the
 * first render and every later update read it the same way.
 *
 * `signature` is what tells an update whether the card's STRUCTURE moved —
 * which accounts are in which group, in what order. Ticking an account
 * already filed under "Toward your deposit" leaves it unchanged, so nothing
 * has to be rebuilt; ticking one under "Not sorted yet" files it, which
 * empties that group and removes its "Sort this out" button, and the list has
 * to be redrawn. Comparing the signature is how `syncAccounts` tells those
 * two cases apart instead of rebuilding every time.
 */
function accountsView(state) {
  const accounts = effectiveAccounts(state.accountAssignments, state.accountIncluded);
  const grouped = GROUP_ORDER.map((group) => ({
    group,
    accounts: accounts.filter((a) => a.group === group),
  }));
  return {
    accounts,
    grouped,
    totals: groupTotals(accounts),
    selection: depositSelection(accounts),
    signature: grouped.map(({ group, accounts: rows }) => `${group}:${rows.map((a) => a.id).join(',')}`).join('|'),
  };
}

function countLabel(selection, c) {
  return `${selection.selected} ${c.selectedCountOf} ${selection.total} ${c.selectedCountSuffix}`;
}

function groupsHTML(view, c) {
  return view.grouped
    .map(({ group, accounts: groupAccounts }) => groupSection(group, groupAccounts, view.totals, c))
    .join('');
}

/**
 * Updates the accounts card to match `state`, touching only what changed —
 * and never touching `.screen-content`, which is what owns the scroll
 * position (DECISIONS.md D16).
 *
 * Ordinary case: the participant ticks or unticks an account that is already
 * filed where it needs to be. Nothing is removed from the DOM at all. The
 * checkboxes, the count and the group subtotals are properties and text
 * nodes, so they are set directly; the element the participant is touching is
 * never replaced, so focus stays on it without anything having to restore it.
 *
 * Structural case: the tick moved an account between groups. Only the
 * `[data-role="account-groups"]` subtree is rebuilt — still not the scroller.
 * Focus is restored afterwards if it was inside that subtree, because the
 * element the participant tapped no longer exists. Handlers survive either
 * way: they are delegated from the card, not bound per row.
 */
function syncAccounts(container, state, c) {
  const view = accountsView(state);
  const groups = container.querySelector('[data-role="account-groups"]');

  if (groups && groups.dataset.signature !== view.signature) {
    const active = document.activeElement;
    const restore = groups.contains(active) && active.dataset
      ? { action: active.dataset.action, accountId: active.dataset.accountId }
      : null;

    groups.innerHTML = groupsHTML(view, c);
    groups.dataset.signature = view.signature;

    if (restore && restore.action) {
      const selector = restore.accountId
        ? `[data-action="${restore.action}"][data-account-id="${restore.accountId}"]`
        : `[data-action="${restore.action}"]`;
      const target = groups.querySelector(selector);
      if (target) target.focus({ preventScroll: true });
    }
  }

  const selectAll = container.querySelector('[data-action="select-all-accounts"]');
  if (selectAll) {
    selectAll.checked = view.selection.checked;
    selectAll.indeterminate = view.selection.indeterminate;
  }

  const count = container.querySelector('[data-role="selected-count"]');
  if (count) count.textContent = countLabel(view.selection, c);

  for (const account of view.accounts) {
    const box = container.querySelector(`[data-action="toggle-account"][data-account-id="${account.id}"]`);
    if (box) box.checked = isSelectedForDeposit(account);
  }

  for (const [group, total] of Object.entries({
    unassigned: view.totals.unassigned,
    deposit: view.totals.deposit,
    emergency: view.totals.emergency,
    excluded: view.totals.notCounted,
  })) {
    const el = container.querySelector(`[data-role="group-total"][data-group="${group}"]`);
    if (el) el.textContent = formatCurrency(total);
  }

  return view;
}

export function render(container, ctx) {
  const { state, setState, content } = ctx;
  const c = content['/consent'];
  const reg = content.shared.regulatory;

  const view = accountsView(state);
  const { accounts, totals, selection, grouped } = view;

  container.innerHTML = `
    ${appBarHTML({ title: c.appBarTitle, left: 'back', appBarLabels: content.shared.appBar })}
    <main class="screen-content" role="main">
      <h2 class="screen-title">${c.headline}</h2>
      <p class="entry-card__body">${c.subhead}</p>

      <div class="card accounts-card">
        <p class="accounts-card__header-title">${c.accountsCardHeader}</p>
        <div class="accounts-card__spacer-sm"></div>
        <p class="account-row__caption">${c.accountsCardIntro}</p>
        <div class="accounts-card__spacer-lg"></div>
        ${checkboxRow({
          checked: selection.checked,
          title: c.selectAllLabel,
          body: null,
          action: 'select-all-accounts',
          trailing: countLabel(selection, c),
          trailingRole: 'selected-count',
          strong: true,
        })}
        <div class="accounts-card__spacer-lg"></div>
        <div data-role="account-groups" data-signature="${view.signature}">${groupsHTML(view, c)}</div>
      </div>

      <p class="legal-text">${c.fscsNote}</p>

      ${infoBannerHTML(content.shared.dataSource)}

      <p class="legal-text">${reg.guidanceNotAdvice}</p>
    </main>
    ${actionBarHTML({
      primaryLabel: c.primaryCta,
      primaryAction: 'continue',
    })}
  `;

  bindAppBarBack(container);

  // The mixed state, set as the DOM property because there is no attribute
  // for it. Rendered markup can only carry `checked`; this is what makes the
  // row announce as partially checked when some but not all of the counting
  // accounts are selected.
  container.querySelector('[data-action="select-all-accounts"]').indeterminate = selection.indeterminate;

  // --- Account selection, delegated from the card ---------------------------
  // Delegation rather than a listener per row, because the group list is
  // rebuilt whenever a tick moves an account between groups; per-row listeners
  // would go with it and the next tap would do nothing. One listener on the
  // card outlives every rebuild.
  const card = container.querySelector('.accounts-card');

  // `state` is captured per render, so an update reads the store rather than
  // the stale closure — several ticks in a row have to compound.
  let live = state;

  function applySelection(patch) {
    const edited = { ...patch, accountSelectionEdited: true };
    // Recalculate the figures this screen owns in the same step, so
    // saved-toward-deposit always matches what the row says is selected —
    // rather than only catching up on "Agree and continue".
    live = setState({ ...edited, ...accountFigures({ ...live, ...edited }) });
    syncAccounts(container, live, c);
  }

  card.addEventListener('change', (event) => {
    const target = event.target;
    if (!target.dataset) return;

    if (target.dataset.action === 'select-all-accounts') {
      // "Selects all when not all are selected, and deselects all when all
      // are" — so indeterminate and unchecked both select, and only a fully
      // checked row deselects. Read from the live view, not the render-time
      // one, so a second tap sees the first tap's result.
      const view = accountsView(live);
      applySelection(selectAllPatch(view.accounts, live.accountAssignments, live.accountIncluded, !view.selection.checked));
      return;
    }

    if (target.dataset.action === 'toggle-account') {
      const view = accountsView(live);
      const account = view.accounts.find((a) => a.id === target.dataset.accountId);
      if (!account) return;
      applySelection(toggleAccountPatch(account, live.accountAssignments, live.accountIncluded, target.checked));
    }
  });

  // Delegated for the same reason as the checkboxes above — the "Sort this
  // out" button and every account row live inside the rebuildable subtree.
  // No re-render before navigating: the router draws 03b, and re-rendering
  // frame 03 first would only destroy the element router.js captures to
  // restore focus to when the sheet closes.
  card.addEventListener('click', (event) => {
    const btn = event.target.closest('[data-action="open-account"]');
    if (!btn || btn.disabled) return;
    live = setState({ selectedAccountId: btn.dataset.accountId, returnFrame: '/consent' });
    window.location.hash = '#/consent/move-account';
  });

  container.querySelector('[data-action="continue"]').addEventListener('click', () => {
    // Same helper the selection handler and 03b use, so the figures committed
    // here are the ones already on screen, with the provenance the
    // participant's own edits have earned them (DECISIONS.md D5). Reads
    // `live` rather than the render-time state, because selection changes
    // since this render updated the store without re-rendering.
    setState(accountFigures(live));
    window.location.hash = '#/position';
  });
}
