/**
 * Frame 01 — Home (bank home screen with the feature entry point).
 * Figma node 9:17. Reference: reference/frames/01 Home - Your first home
 * entry point.png.
 *
 * THIS FRAME NO LONGER DRAWS ITS OWN TAB BAR. It used to render
 * `bottomNavHTML` directly, on the reasoning that the bar is part of what
 * frame 01 is and router.js's mount is a no-op when a screen already drew
 * one. That second half was the problem: `mountBottomNav` is what BINDS the
 * tabs, and it returns early the moment it finds a bar already in the DOM —
 * so on this one screen the bar was rendered and then wired to nothing.
 *
 * That was invisible while Home was the only tab that resolved, because
 * tapping Home on frame 01 is a no-op either way. The moment Goals became a
 * live tab (D11, as amended) it stopped being invisible: an enabled,
 * focusable Goals button that did nothing, on the first screen of the study,
 * and only on that screen. Letting router.js own the bar everywhere removes
 * the special case rather than adding a second place that binds it.
 */
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
  `;

  container.querySelector('[data-action="start-journey"]').addEventListener('click', () => {
    setState({ journeyStarted: true, journeyEntryPoint: '/home', flowEntryHistoryLength: window.history.length });
    window.location.hash = '#/journey';
  });
}
