/**
 * Expense server functions: CRUD + dashboard summary + group balances.
 * Equal-split only.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { computeNetBalances, computeSettlements } from "./balances";

const expenseInput = z.object({
  group_id: z.string().uuid(),
  title: z.string().trim().min(1).max(120),
  amount: z.number().positive().max(10_000_000),
  category: z.string().trim().min(1).max(40),
  description: z.string().max(500).optional().nullable(),
  expense_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  split_user_ids: z.array(z.string().uuid()).min(1),
});

export const createExpense = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => expenseInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: expense, error } = await supabase
      .from("expenses")
      .insert({
        group_id: data.group_id,
        paid_by: userId,
        title: data.title,
        amount: data.amount,
        category: data.category,
        description: data.description ?? null,
        expense_date: data.expense_date,
      })
      .select()
      .single();
    if (error) throw error;

    const n = data.split_user_ids.length;
    const baseShare = Math.floor((data.amount / n) * 100) / 100;
    const remainder = Math.round((data.amount - baseShare * n) * 100) / 100;
    const splits = data.split_user_ids.map((uid, i) => ({
      expense_id: expense.id,
      user_id: uid,
      // Give the leftover pennies to the last person so the splits sum exactly.
      share_amount: i === n - 1 ? Math.round((baseShare + remainder) * 100) / 100 : baseShare,
    }));
    const { error: sErr } = await supabase.from("expense_splits").insert(splits);
    if (sErr) throw sErr;
    return expense;
  });

export const deleteExpense = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("expenses").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const listGroupExpenses = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ groupId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: expenses, error } = await supabase
      .from("expenses")
      .select("id, title, amount, category, description, expense_date, paid_by, created_at, expense_splits(user_id, share_amount)")
      .eq("group_id", data.groupId)
      .order("expense_date", { ascending: false });
    if (error) throw error;
    return expenses ?? [];
  });

export const getGroupBalances = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ groupId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: expenses, error } = await supabase
      .from("expenses")
      .select("paid_by, amount, expense_splits(user_id)")
      .eq("group_id", data.groupId);
    if (error) throw error;
    const forCalc = (expenses ?? []).map((e: any) => ({
      paid_by: e.paid_by,
      amount: Number(e.amount),
      split_user_ids: (e.expense_splits ?? []).map((s: any) => s.user_id),
    }));
    const net = computeNetBalances(forCalc);
    const settlements = computeSettlements(net);
    return { net, settlements };
  });

export const getDashboardSummary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    // groups I'm in
    const { data: memberships } = await supabase.from("group_members").select("group_id").eq("user_id", userId);
    const groupIds = (memberships ?? []).map((m) => m.group_id);

    let expenses: any[] = [];
    if (groupIds.length) {
      const { data, error } = await supabase
        .from("expenses")
        .select("id, title, amount, category, expense_date, paid_by, group_id, expense_splits(user_id, share_amount)")
        .in("group_id", groupIds)
        .order("expense_date", { ascending: false });
      if (error) throw error;
      expenses = data ?? [];
    }

    // totals
    let owe = 0, owed = 0;
    for (const e of expenses) {
      const splits: any[] = e.expense_splits ?? [];
      const mySplit = splits.find((s) => s.user_id === userId);
      if (e.paid_by === userId) {
        // I paid: others owe me their shares
        const othersShare = splits.filter((s) => s.user_id !== userId).reduce((a, s) => a + Number(s.share_amount), 0);
        owed += othersShare;
      } else if (mySplit) {
        owe += Number(mySplit.share_amount);
      }
    }

    // by month (last 6 months)
    const byMonth: Record<string, number> = {};
    const byCategory: Record<string, number> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      byMonth[d.toISOString().slice(0, 7)] = 0;
    }
    for (const e of expenses) {
      const m = String(e.expense_date).slice(0, 7);
      if (m in byMonth) byMonth[m] += Number(e.amount);
      byCategory[e.category] = (byCategory[e.category] ?? 0) + Number(e.amount);
    }

    return {
      owe: Math.round(owe * 100) / 100,
      owed: Math.round(owed * 100) / 100,
      net: Math.round((owed - owe) * 100) / 100,
      recent: expenses.slice(0, 5),
      monthly: Object.entries(byMonth).map(([month, total]) => ({ month, total: Math.round(total * 100) / 100 })),
      byCategory: Object.entries(byCategory).map(([category, total]) => ({ category, total: Math.round(total * 100) / 100 })),
      groupCount: groupIds.length,
      expenseCount: expenses.length,
    };
  });
