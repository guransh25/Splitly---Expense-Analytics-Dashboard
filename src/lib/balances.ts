/**
 * Simple balance algorithm — equal split only.
 *
 * Input: list of expenses, each with paid_by + the user_ids it was split among.
 * Output: net balance per user (positive = is owed money, negative = owes).
 *
 * "Who owes whom" pairs are produced by a greedy match: largest creditor
 * settled by largest debtor until everyone is at zero. This minimizes the
 * number of transactions and is easy to read.
 */
export interface ExpenseForBalance {
  paid_by: string;
  amount: number;
  split_user_ids: string[];
}

export interface Settlement {
  from: string;
  to: string;
  amount: number;
}

export function computeNetBalances(expenses: ExpenseForBalance[]): Record<string, number> {
  const net: Record<string, number> = {};
  for (const e of expenses) {
    if (e.split_user_ids.length === 0) continue;
    const share = e.amount / e.split_user_ids.length;
    net[e.paid_by] = (net[e.paid_by] ?? 0) + e.amount;
    for (const uid of e.split_user_ids) {
      net[uid] = (net[uid] ?? 0) - share;
    }
  }
  // round to 2 decimals
  for (const k of Object.keys(net)) net[k] = Math.round(net[k] * 100) / 100;
  return net;
}

export function computeSettlements(net: Record<string, number>): Settlement[] {
  const creditors = Object.entries(net).filter(([, v]) => v > 0.01).map(([u, v]) => ({ user: u, amount: v }));
  const debtors = Object.entries(net).filter(([, v]) => v < -0.01).map(([u, v]) => ({ user: u, amount: -v }));
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const settlements: Settlement[] = [];
  let i = 0, j = 0;
  while (i < creditors.length && j < debtors.length) {
    const pay = Math.min(creditors[i].amount, debtors[j].amount);
    settlements.push({ from: debtors[j].user, to: creditors[i].user, amount: Math.round(pay * 100) / 100 });
    creditors[i].amount -= pay;
    debtors[j].amount -= pay;
    if (creditors[i].amount < 0.01) i++;
    if (debtors[j].amount < 0.01) j++;
  }
  return settlements;
}
