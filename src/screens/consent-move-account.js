/**
 * Frame 03b — Move this account. Figma node 63:610. Reference:
 * reference/frames/03b Move this account.png.
 *
 * A sheet, not a push (DECISIONS.md D1 / SPEC.md transition rules): rises
 * from the bottom over a dimmed scrim, dismissed by scrim tap or Cancel.
 * Always returns to state.returnFrame, which /consent sets to '/consent'
 * before opening this screen.
 */
import { formatAccountBalance } from '../format.js';
import { MOCK_ACCOUNTS, accountFigures } from '../model/accounts.js';
import { sheetHeaderHTML, actionBarDockHTML } from '../components/ui.js';
import { goBack } from '../router.js';

export const anchors = ['guidanceNotAdvice'];

function radioOption({ group, current, title, body }) {
  return `
    <button type="button" class="radio-option" role="radio" aria-checked="${group === current}" data-action="choose-purpose" data-group="${group}">
      <span class="radio-option__circle"></span>
      <span class="radio-option__text">
        <span class="radio-option__title">${title}</span>
        <span class="radio-option__body">${body}</span>
      </span>
    </button>
  `;
}

export function render(container, ctx) {
  const { state, setState, content } = ctx;
  const c = content['/consent/move-account'];
  const reg = content.shared.regulatory;

  const account = MOCK_ACCOUNTS.find((a) => a.id === state.selectedAccountId);
  const currentGroup = account ? (state.accountAssignments[account.id] ?? account.group) : null;
  const returnHash = `#${state.returnFrame || '/consent'}`;

  if (!account) {
    // Deep-linked or reloaded with no account selected — nothing sensible to show.
    window.location.replace(returnHash);
    return;
  }

  container.innerHTML = `
    <div class="sheet-overlay">
      <div class="sheet-scrim" data-action="dismiss"></div>
      <div class="bottom-sheet sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-heading">
        ${sheetHeaderHTML({ heading: c.heading })}
        <div class="bottom-sheet__content">
          <div class="account-summary-card">
            <p class="account-summary-card__name">${account.name}</p>
            <p class="account-summary-card__balance">${formatAccountBalance(account.balance)}</p>
          </div>
          <div class="purpose-options">
            ${radioOption({ group: 'deposit', current: currentGroup, title: c.options.deposit.title, body: c.options.deposit.body })}
            ${radioOption({ group: 'emergency', current: currentGroup, title: c.options.emergency.title, body: c.options.emergency.body })}
            ${radioOption({ group: 'excluded', current: currentGroup, title: c.options.excluded.title, body: c.options.excluded.body })}
          </div>
          <p class="legal-text">${reg.guidanceNotAdvice}</p>
        </div>
        ${actionBarDockHTML(`
          <button type="button" class="button button--primary" data-action="save">${c.save}</button>
          <button type="button" class="text-action" data-action="dismiss">${c.cancel}</button>
        `)}
      </div>
    </div>
  `;

  let pendingGroup = currentGroup;

  container.querySelectorAll('[data-action="choose-purpose"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      pendingGroup = btn.dataset.group;
      container.querySelectorAll('[data-action="choose-purpose"]').forEach((b) => {
        b.setAttribute('aria-checked', String(b.dataset.group === pendingGroup));
      });
    });
  });

  container.querySelectorAll('[data-action="dismiss"]').forEach((el) => {
    el.addEventListener('click', goBack);
  });

  container.querySelector('[data-action="save"]').addEventListener('click', () => {
    // Moving an account changes which totals its balance lands in, so the
    // three account-derived figures are recalculated here exactly as they are
    // when the "Select all accounts" row changes — one helper, one rule. The
    // move is the participant's own input, so accountSelectionEdited flips
    // and the figures carry 'entered' from here on (DECISIONS.md D5).
    const moved = {
      accountAssignments: { ...state.accountAssignments, [account.id]: pendingGroup },
      accountSelectionEdited: true,
    };
    setState({
      ...moved,
      ...accountFigures({ ...state, ...moved }),
      selectedAccountId: null,
    });
    window.location.hash = returnHash;
  });
}
