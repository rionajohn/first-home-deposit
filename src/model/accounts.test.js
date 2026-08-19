import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { MOCK_ACCOUNTS, effectiveAccounts, groupTotals, depositSelection } from './accounts.js';

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

  test('deposit selection starts at 4 of 4, matching the reference "Select all accounts" row', () => {
    const accounts = effectiveAccounts();
    assert.deepEqual(depositSelection(accounts), { selected: 4, total: 4 });
  });

  test('deselecting a deposit account via "included" removes it from the deposit total and the selection count', () => {
    const accounts = effectiveAccounts({}, { 'house-pot': false });
    const totals = groupTotals(accounts);
    assert.equal(totals.deposit, 8950 - 3150);
    assert.deepEqual(depositSelection(accounts), { selected: 3, total: 4 });
  });

  test('a 03b move re-groups the account and its balance follows it', () => {
    const accounts = effectiveAccounts({ 'house-pot': 'excluded' });
    const totals = groupTotals(accounts);
    assert.equal(totals.deposit, 8950 - 3150);
    assert.equal(totals.notCounted, 420 + 3150);
    assert.deepEqual(depositSelection(accounts), { selected: 3, total: 3 });
  });

  test('moving the unassigned account into deposit adds it to the deposit total', () => {
    const accounts = effectiveAccounts({ 'stocks-isa': 'deposit' });
    const totals = groupTotals(accounts);
    assert.equal(totals.unassigned, 0);
    assert.equal(totals.deposit, 8950 + 2400);
  });
});
