/**
 * Frame 01 — Home (bank home screen with the feature entry point).
 * Figma node 9:17. Reference: reference/frames/01 Home - Your first home
 * entry point.png.
 */

function transactionRow({ merchant, category, amount }) {
  return `
    <div class="transaction-row">
      <div>
        <p class="transaction-row__merchant">${merchant}</p>
        <p class="transaction-row__category">${category}</p>
      </div>
      <p class="transaction-row__amount">${amount}</p>
    </div>
  `;
}

function transactionGroup(group, isLast) {
  const rows = group.rows.map((row, i) => {
    const divider = i < group.rows.length - 1 ? '<hr class="divider" />' : '';
    return transactionRow(row) + divider;
  }).join('');
  const spacer = isLast ? '' : '<div class="section-spacer"></div>';
  return `
    <p class="section-header">${group.heading}</p>
    ${rows}
    ${spacer}
  `;
}

export function render(container, { content, setState }) {
  const c = content['/home'];

  container.innerHTML = `
    <header class="app-bar" role="banner">
      <div class="app-bar__cell"></div>
      <h1 class="app-bar__title">${c.appBarTitle}</h1>
      <div class="app-bar__cell"></div>
    </header>
    <main class="screen-content" role="main">
      <div class="card balance-card">
        <p class="balance-card__label">${c.balanceLabel}</p>
        <p class="balance-card__amount">${c.balanceAmount}</p>
      </div>

      <div class="card transactions-card">
        ${c.transactionGroups.map((group, i) => transactionGroup(group, i === c.transactionGroups.length - 1)).join('<hr class="divider" />')}
        <button type="button" class="list-row" data-action="see-all-transactions">
          <span class="list-row__label">${c.seeAllTransactions}</span>
          <img class="list-row__chevron" src="assets/icons/chevron-right.svg" alt="" width="20" height="20" />
        </button>
      </div>

      <div class="card card--emphasis entry-card">
        <p class="entry-card__title">${c.entryCardTitle}</p>
        <p class="entry-card__body">${c.entryCardBody}</p>
        <button type="button" class="button button--secondary" data-action="start-journey">
          ${c.entryCardCta}
        </button>
      </div>
    </main>

    <nav class="bottom-nav" aria-label="Primary">
      ${navTab('home', c.bottomNav.home, true)}
      ${navTab('payments', c.bottomNav.payments, false)}
      ${navTab('goals', c.bottomNav.goals, false)}
      ${navTab('insights', c.bottomNav.insights, false)}
      ${navTab('profile', c.bottomNav.profile, false)}
    </nav>
  `;

  container.querySelector('[data-action="start-journey"]').addEventListener('click', () => {
    setState({ journeyStarted: true });
    window.location.hash = '#/journey';
  });
}

function navTab(id, label, active) {
  return `
    <button type="button" class="bottom-nav__tab${active ? ' bottom-nav__tab--active' : ''}" data-tab="${id}">
      ${active ? '<div class="bottom-nav__active-rule"></div>' : ''}
      <img class="bottom-nav__icon" src="assets/icons/nav/${id}.svg" alt="" width="20" height="20" />
      <span class="bottom-nav__label">${label}</span>
    </button>
  `;
}
