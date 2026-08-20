/**
 * Frame 01 — Home (bank home screen with the feature entry point).
 * Figma node 9:17. Reference: reference/frames/01 Home - Your first home
 * entry point.png.
 *
 * The tab bar this frame draws is now the shared `bottomNavHTML` component
 * (ui.js), because DECISIONS.md D11 puts the same bar on every full-screen
 * journey screen and one copy of it is better than two that can drift.
 * Rendering it here rather than leaving it to router.js's mount keeps frame
 * 01's own markup self-describing — the bar is part of what this frame is —
 * and router.js's mount is a no-op when a screen already drew one.
 */
import { bottomNavHTML } from '../components/ui.js';
import { chevronRight } from '../icons.js';

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
          ${chevronRight({ size: 'body', className: 'list-row__chevron' })}
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

    ${bottomNavHTML(content.shared.bottomNav)}
  `;

  container.querySelector('[data-action="start-journey"]').addEventListener('click', () => {
    setState({ journeyStarted: true });
    window.location.hash = '#/journey';
  });
}
