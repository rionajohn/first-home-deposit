/**
 * Frame 03 — Consent and linked accounts. Figma node 10:45. Reference:
 * reference/frames/03 Consent and linked accounts.png.
 *
 * Variants built (build-spec.md section 2):
 *   - none-selected: savingsWithUs === null, continue disabled
 *   - personalised: savingsWithUs === true
 *   - estimate: savingsWithUs === false (estimate-mode banner — no
 *     reference PNG for this state; built per DECISIONS.md D7 from the
 *     existing info-banner pattern)
 *   - all-selected / some-selected: the "Select all accounts" checkbox,
 *     reflecting the deposit group's included count
 *   - assigned / unassigned: account-row + group-header styling
 *
 * This screen also seeds three of the section 6 state figures
 * (saved-toward-deposit, emergency-fund, unassigned) from the mock account
 * data in src/model/accounts.js when "Agree and continue" is pressed — see
 * DECISIONS.md D5 on provenance: these are 'read', not hardcoded, because
 * every downstream screen (checkpoint-amount, the tracker, MIP) depends on
 * them.
 */
import { appBarHTML, bindAppBarBack, actionBarHTML, infoBannerHTML } from '../components/ui.js';
import { formatCurrency, formatAccountBalance } from '../format.js';
import { effectiveAccounts, groupTotals, depositSelection, GROUP_ORDER } from '../model/accounts.js';

export const anchors = ['guidanceNotAdvice'];

function checkboxRow({ checked, title, body, action, trailing = '', strong = false }) {
  const titleClass = strong ? 'checkbox-row__title checkbox-row__title--strong' : 'checkbox-row__title';
  return `
    <button type="button" class="checkbox-row" role="checkbox" aria-checked="${checked}" data-action="${action}">
      <span class="checkbox-row__box"><img src="assets/icons/tick.svg" alt="" width="13" height="10" /></span>
      <span class="checkbox-row__text">
        <span class="${titleClass}">${title}</span>
        ${body ? `<span class="checkbox-row__body">${body}</span>` : ''}
      </span>
      ${trailing ? `<span class="checkbox-row__trailing">${trailing}</span>` : ''}
    </button>
  `;
}

function accountRow(account, content) {
  const caption = account.captionKey ? content.accountCaptions[account.captionKey] : null;
  const disabled = !account.movable;
  return `
    <div class="account-row-wrap">
      <button type="button" class="account-row" data-action="open-account" data-account-id="${account.id}" ${disabled ? 'disabled aria-disabled="true"' : ''}>
        <span class="account-row__info">
          <span class="account-row__name">${account.name}</span>
          <span class="account-row__category">${account.category}</span>
        </span>
        <span class="account-row__right">
          <span class="account-row__balance">${formatAccountBalance(account.balance)}</span>
          ${disabled ? '' : '<img class="list-row__chevron" src="assets/icons/chevron-right.svg" alt="" width="20" height="20" />'}
        </span>
      </button>
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
      <p class="account-group-header__total">${formatCurrency(totals[totalKey])}</p>
    </div>
    ${accounts.map((a) => accountRow(a, content)).join('')}
    ${sortButton}
    ${group !== 'excluded' ? '<div class="accounts-card__spacer-lg"></div>' : ''}
  `;
}

export function render(container, ctx) {
  const { state, setState, content } = ctx;
  const c = content['/consent'];
  const reg = content.shared.regulatory;

  const accounts = effectiveAccounts(state.accountAssignments, state.accountIncluded);
  const totals = groupTotals(accounts);
  const selection = depositSelection(accounts);
  const allSelected = selection.selected === selection.total && selection.total > 0;

  const grouped = GROUP_ORDER.map((group) => ({
    group,
    accounts: accounts.filter((a) => a.group === group),
  }));

  container.innerHTML = `
    ${appBarHTML({ title: c.appBarTitle, left: 'back', appBarLabels: content.shared.appBar })}
    <div class="screen-content">
      <p class="screen-title">${c.headline}</p>
      <p class="entry-card__body">${c.subhead}</p>

      <div class="card savings-question-card">
        <p class="savings-question-card__question">${c.savingsQuestion}</p>
        <div class="choice-row">
          <button type="button" class="button button--choice" aria-pressed="${state.savingsWithUs === true}" data-action="savings-with-us" data-value="true">${c.yesLabel}</button>
          <button type="button" class="button button--choice" aria-pressed="${state.savingsWithUs === false}" data-action="savings-with-us" data-value="false">${c.noLabel}</button>
        </div>
        <p class="account-row__caption">${c.savingsHint}</p>
      </div>

      <hr class="divider" />

      <p class="section-heading">${c.usingWhatWeCanSeeHeading}</p>

      ${checkboxRow({
        checked: state.consentStatementChecked,
        title: c.consentStatementTitle,
        body: c.consentStatementBody,
        action: 'toggle-consent-statement',
      })}

      ${state.savingsWithUs === false ? infoBannerHTML(c.estimateModeBanner) : ''}

      <div class="card accounts-card">
        <p class="accounts-card__header-title">${c.accountsCardHeader}</p>
        <div class="accounts-card__spacer-sm"></div>
        <p class="account-row__caption">${c.accountsCardIntro}</p>
        <div class="accounts-card__spacer-lg"></div>
        ${checkboxRow({
          checked: allSelected,
          title: c.selectAllLabel,
          body: null,
          action: 'select-all-accounts',
          trailing: `${selection.selected} ${c.selectedCountOf} ${selection.total} ${c.selectedCountSuffix}`,
          strong: true,
        })}
        <div class="accounts-card__spacer-lg"></div>
        ${grouped.map(({ group, accounts: groupAccounts }) => groupSection(group, groupAccounts, totals, c)).join('')}
      </div>

      <p class="legal-text">${c.fscsNote}</p>

      ${infoBannerHTML(c.withdrawBanner)}

      <p class="legal-text">${reg.guidanceNotAdvice}</p>
    </div>
    ${actionBarHTML({
      primaryLabel: c.primaryCta,
      primaryAction: 'agree-continue',
      primaryDisabled: state.savingsWithUs === null,
      secondaryLabel: c.secondaryCta,
      secondaryAction: 'not-now',
    })}
  `;

  bindAppBarBack(container, () => {
    window.location.hash = '#/journey';
  });

  container.querySelectorAll('[data-action="savings-with-us"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const value = btn.dataset.value === 'true';
      const next = setState({ savingsWithUs: value });
      render(container, { ...ctx, state: next });
    });
  });

  container.querySelector('[data-action="toggle-consent-statement"]').addEventListener('click', () => {
    const next = setState({ consentStatementChecked: !state.consentStatementChecked });
    render(container, { ...ctx, state: next });
  });

  container.querySelector('[data-action="select-all-accounts"]').addEventListener('click', () => {
    const target = !allSelected;
    const included = { ...state.accountIncluded };
    for (const a of accounts) {
      if (a.group === 'deposit') included[a.id] = target;
    }
    const next = setState({ accountIncluded: included });
    render(container, { ...ctx, state: next });
  });

  container.querySelectorAll('[data-action="open-account"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const next = setState({ selectedAccountId: btn.dataset.accountId, returnFrame: '/consent' });
      render(container, { ...ctx, state: next });
      window.location.hash = '#/consent/move-account';
    });
  });

  container.querySelector('[data-action="agree-continue"]').addEventListener('click', () => {
    if (state.savingsWithUs === null) return;
    const mode = state.savingsWithUs ? 'personalised' : 'estimate';
    const provenance = state.savingsWithUs ? 'read' : 'estimated';
    setState({
      mode,
      consentGiven: true,
      'saved-toward-deposit': { value: totals.deposit, provenance },
      'emergency-fund': { value: totals.emergency, provenance },
      unassigned: { value: totals.unassigned, provenance },
    });
    window.location.hash = mode === 'personalised' ? '#/position' : '#/position?mode=estimate';
  });

  container.querySelector('[data-action="not-now"]').addEventListener('click', () => {
    setState({ consentGiven: false, mode: 'general' });
    window.location.hash = '#/consent/declined';
  });
}
