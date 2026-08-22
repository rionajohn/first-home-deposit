import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  MOCK_ACCOUNTS,
  effectiveAccounts,
  groupTotals,
  depositSelection,
  isSelectedForDeposit,
  selectAllPatch,
  toggleAccountPatch,
  accountFigures,
} from './accounts.js';

describe('accounts — frame 03 mock data (build-spec.md section 4 worked examples)', () => {
  test('default grouping matches the reference PNG totals', () => {
    const accounts = effectiveAccounts();
    const totals = groupTotals(accounts);
    assert.equal(totals.unassigned, 2400);
    assert.equal(totals.deposit, 8950); // house pot + instant saver + cash isa + lifetime isa
    assert.equal(totals.emergency, 5600);
    assert.equal(totals.notCounted, 420); // holiday pot only — current account is excludeFromTotal
  });

  test('the current account never contributes to any total, even though it renders in "Not counted"', () => {
    const current = MOCK_ACCOUNTS.find((a) => a.id === 'current-account');
    assert.equal(current.group, 'excluded');
    assert.equal(current.excludeFromTotal, true);
  });

  test('a 03b move re-groups the account and its balance follows it', () => {
    const accounts = effectiveAccounts({ 'house-pot': 'excluded' });
    const totals = groupTotals(accounts);
    assert.equal(totals.deposit, 8950 - 3150);
    assert.equal(totals.notCounted, 420 + 3150);
  });

  test('moving the unassigned account into deposit adds it to the deposit total', () => {
    const accounts = effectiveAccounts({ 'stocks-isa': 'deposit' });
    const totals = groupTotals(accounts);
    assert.equal(totals.unassigned, 0);
    assert.equal(totals.deposit, 8950 + 2400);
  });
});

describe('countsTowardDeposit — the one place the rule lives', () => {
  const counts = (id) => MOCK_ACCOUNTS.find((a) => a.id === id).countsTowardDeposit;

  test('savings-type accounts count, including one not sorted yet', () => {
    assert.equal(counts('stocks-isa'), true); // "Not sorted yet"
    assert.equal(counts('house-pot'), true); // Pot
    assert.equal(counts('instant-saver'), true); // Savings
    assert.equal(counts('cash-isa'), true); // Cash ISA
    assert.equal(counts('lifetime-isa'), true); // Lifetime ISA
  });

  test('a current account, a short-term goal pot and the emergency fund do not', () => {
    assert.equal(counts('current-account'), false);
    assert.equal(counts('holiday-pot'), false);
    assert.equal(counts('emergency-fund'), false);
  });

  test('every account carries the flag explicitly — none is left to be inferred', () => {
    for (const account of MOCK_ACCOUNTS) {
      assert.equal(typeof account.countsTowardDeposit, 'boolean', account.id);
    }
  });
});

describe('deposit selection — frame 03 "N of M selected" and its three-state checkbox', () => {
  test('M is every counting account, so the default state is 4 of 5 and indeterminate', () => {
    // The four filed under "Toward your deposit" are selected; the Stocks and
    // shares ISA counts but is still sitting under "Not sorted yet".
    assert.deepEqual(depositSelection(effectiveAccounts()), {
      selected: 4,
      total: 5,
      checked: false,
      indeterminate: true,
    });
  });

  test('selecting all reaches N === M and reads as checked, not indeterminate', () => {
    const patch = selectAllPatch(effectiveAccounts(), {}, {}, true);
    const accounts = effectiveAccounts(patch.accountAssignments, patch.accountIncluded);
    assert.deepEqual(depositSelection(accounts), {
      selected: 5,
      total: 5,
      checked: true,
      indeterminate: false,
    });
    // Selecting all had to file the unsorted account under the deposit group
    // for it to be counted at all.
    assert.equal(patch.accountAssignments['stocks-isa'], 'deposit');
    assert.equal(groupTotals(accounts).deposit, 8950 + 2400);
    assert.equal(groupTotals(accounts).unassigned, 0);
  });

  test('deselecting all reaches N === 0 and reads as neither checked nor indeterminate', () => {
    const patch = selectAllPatch(effectiveAccounts(), {}, {}, false);
    const accounts = effectiveAccounts(patch.accountAssignments, patch.accountIncluded);
    assert.deepEqual(depositSelection(accounts), {
      selected: 0,
      total: 5,
      checked: false,
      indeterminate: false,
    });
    assert.equal(groupTotals(accounts).deposit, 0);
  });

  test('deselecting all leaves the participant\'s own filing alone', () => {
    const patch = selectAllPatch(effectiveAccounts(), { 'cash-isa': 'emergency' }, {}, false);
    assert.equal(patch.accountAssignments['cash-isa'], 'emergency');
  });

  test('deselecting one account moves both halves of the count and the deposit total', () => {
    const accounts = effectiveAccounts({}, { 'house-pot': false });
    assert.deepEqual(depositSelection(accounts), {
      selected: 3,
      total: 5,
      checked: false,
      indeterminate: true,
    });
    assert.equal(groupTotals(accounts).deposit, 8950 - 3150);
  });

  test('M does not move when a 03b move refiles an account — it is still one of your savings accounts', () => {
    const accounts = effectiveAccounts({ 'house-pot': 'emergency' });
    const selection = depositSelection(accounts);
    assert.equal(selection.total, 5);
    assert.equal(selection.selected, 3);
  });

  test('a non-counting account filed under the deposit group is shown but never counted', () => {
    const accounts = effectiveAccounts({ 'holiday-pot': 'deposit' });
    const holidayPot = accounts.find((a) => a.id === 'holiday-pot');
    assert.equal(holidayPot.group, 'deposit');
    assert.equal(isSelectedForDeposit(holidayPot), false);
    assert.equal(groupTotals(accounts).deposit, 8950);
    assert.equal(depositSelection(accounts).total, 5);
  });
});

describe('toggleAccountPatch — a single account checkbox (DECISIONS.md D16)', () => {
  test('ticking an account already filed under deposit just includes it', () => {
    const accounts = effectiveAccounts({}, { 'house-pot': false });
    const housePot = accounts.find((a) => a.id === 'house-pot');
    const patch = toggleAccountPatch(housePot, {}, { 'house-pot': false }, true);
    const after = effectiveAccounts(patch.accountAssignments, patch.accountIncluded);
    assert.equal(isSelectedForDeposit(after.find((a) => a.id === 'house-pot')), true);
    assert.equal(groupTotals(after).deposit, 8950);
  });

  test('unticking clears the flag and leaves the filing alone', () => {
    const accounts = effectiveAccounts();
    const cashIsa = accounts.find((a) => a.id === 'cash-isa');
    const patch = toggleAccountPatch(cashIsa, {}, {}, false);
    assert.equal(patch.accountAssignments['cash-isa'], undefined);
    const after = effectiveAccounts(patch.accountAssignments, patch.accountIncluded);
    assert.equal(after.find((a) => a.id === 'cash-isa').group, 'deposit');
    assert.equal(isSelectedForDeposit(after.find((a) => a.id === 'cash-isa')), false);
    assert.equal(groupTotals(after).deposit, 8950 - 1200);
    assert.deepEqual(depositSelection(after), {
      selected: 3, total: 5, checked: false, indeterminate: true,
    });
  });

  test('ticking an unsorted account files it under deposit, the same rule select-all uses', () => {
    const accounts = effectiveAccounts();
    const stocks = accounts.find((a) => a.id === 'stocks-isa');
    const patch = toggleAccountPatch(stocks, {}, {}, true);
    assert.equal(patch.accountAssignments['stocks-isa'], 'deposit');
    const after = effectiveAccounts(patch.accountAssignments, patch.accountIncluded);
    assert.deepEqual(depositSelection(after), {
      selected: 5, total: 5, checked: true, indeterminate: false,
    });
    assert.equal(groupTotals(after).unassigned, 0);
    assert.equal(groupTotals(after).deposit, 8950 + 2400);
  });

  test('ticking every counting account one at a time equals one select-all', () => {
    let assignments = {}, included = {};
    for (const account of effectiveAccounts(assignments, included)) {
      if (!account.countsTowardDeposit) continue;
      const patch = toggleAccountPatch(account, assignments, included, true);
      assignments = patch.accountAssignments;
      included = patch.accountIncluded;
    }
    const oneShot = selectAllPatch(effectiveAccounts(), {}, {}, true);
    assert.deepEqual(
      depositSelection(effectiveAccounts(assignments, included)),
      depositSelection(effectiveAccounts(oneShot.accountAssignments, oneShot.accountIncluded))
    );
  });
});

describe('accountFigures — provenance propagation (DECISIONS.md D5)', () => {
  const base = { accountAssignments: {}, accountIncluded: {}, accountSelectionEdited: false };

  test('untouched, the figures are read from account data', () => {
    const figures = accountFigures(base);
    assert.deepEqual(figures['saved-toward-deposit'], { value: 8950, provenance: 'read' });
    assert.deepEqual(figures['emergency-fund'], { value: 5600, provenance: 'read' });
    assert.deepEqual(figures.unassigned, { value: 2400, provenance: 'read' });
  });

  test('once the participant has changed which accounts count, all three carry entered', () => {
    const figures = accountFigures({
      ...base,
      accountIncluded: { 'house-pot': false },
      accountSelectionEdited: true,
    });
    assert.equal(figures['saved-toward-deposit'].value, 8950 - 3150);
    assert.equal(figures['saved-toward-deposit'].provenance, 'entered');
    assert.equal(figures['emergency-fund'].provenance, 'entered');
    assert.equal(figures.unassigned.provenance, 'entered');
  });

  test('a 03b move recalculates the same way, entered included', () => {
    const figures = accountFigures({
      ...base,
      accountAssignments: { 'stocks-isa': 'deposit' },
      accountSelectionEdited: true,
    });
    assert.equal(figures['saved-toward-deposit'].value, 8950 + 2400);
    assert.equal(figures.unassigned.value, 0);
    assert.equal(figures['saved-toward-deposit'].provenance, 'entered');
  });
});
