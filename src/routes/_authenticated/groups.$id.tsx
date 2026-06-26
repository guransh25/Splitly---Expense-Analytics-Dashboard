import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "framer-motion";
import { ArrowRight, Mail, Trash2, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { addMemberByEmail, getGroupDetail } from "@/lib/groups.functions";
import { deleteExpense, getGroupBalances, listGroupExpenses } from "@/lib/expenses.functions";

export const Route = createFileRoute("/_authenticated/groups/$id")({
  head: () => ({ meta: [{ title: "Group — Splitly" }] }),
  component: GroupDetail,
});

function GroupDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const fetchDetail = useServerFn(getGroupDetail);
  const fetchExpenses = useServerFn(listGroupExpenses);
  const fetchBalances = useServerFn(getGroupBalances);
  const addMember = useServerFn(addMemberByEmail);
  const delExp = useServerFn(deleteExpense);

  const detail = useQuery({ queryKey: ["group", id], queryFn: () => fetchDetail({ data: { groupId: id } }) });
  const expenses = useQuery({ queryKey: ["group-expenses", id], queryFn: () => fetchExpenses({ data: { groupId: id } }) });
  const balances = useQuery({ queryKey: ["group-balances", id], queryFn: () => fetchBalances({ data: { groupId: id } }) });

  const [email, setEmail] = useState("");
  const add = useMutation({
    mutationFn: (e: string) => addMember({ data: { groupId: id, email: e } }),
    onSuccess: (r) => { toast.success(`Added ${r.addedName}`); setEmail(""); qc.invalidateQueries({ queryKey: ["group", id] }); },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  const del = useMutation({
    mutationFn: (eid: string) => delExp({ data: { id: eid } }),
    onSuccess: () => {
      toast.success("Expense deleted");
      qc.invalidateQueries({ queryKey: ["group-expenses", id] });
      qc.invalidateQueries({ queryKey: ["group-balances", id] });
    },
  });

  if (detail.isLoading) return <div className="text-muted-foreground">Loading…</div>;
  if (!detail.data) return null;

  const members: any[] = detail.data.members;
  const memberMap = new Map(members.map((m) => [m.user_id, m.profiles?.name ?? "Someone"]));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to="/groups" className="text-xs text-muted-foreground hover:text-foreground">← Groups</Link>
          <h1 className="mt-1 text-3xl font-bold sm:text-4xl">{detail.data.group.name}</h1>
        </div>
        <Link
          to="/expenses/new"
          search={{ groupId: id }}
          className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          + Add expense
        </Link>
      </div>

      {/* Members */}
      <div className="glass rounded-3xl p-6">
        <div className="mb-4 flex items-center gap-2"><Users className="h-4 w-4 text-primary" /><h3 className="font-semibold">Members</h3></div>
        <div className="mb-4 flex flex-wrap gap-2">
          {members.map((m) => (
            <span key={m.user_id} className="rounded-full bg-muted/60 px-3 py-1 text-sm">{m.profiles?.name ?? "?"}</span>
          ))}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); if (email.trim()) add.mutate(email.trim()); }} className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="friend@example.com"
              className="w-full rounded-xl border border-border bg-input pl-9 pr-3 py-2.5 outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <button disabled={add.isPending} className="rounded-xl bg-primary px-5 py-2.5 font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50">
            {add.isPending ? "Adding…" : "Add member"}
          </button>
        </form>
        <p className="mt-2 text-xs text-muted-foreground">The person must already have a Splitly account.</p>
      </div>

      {/* Balances */}
      <div className="glass rounded-3xl p-6">
        <h3 className="mb-4 font-semibold">Settle up</h3>
        {balances.data?.settlements.length === 0 ? (
          <p className="text-sm text-muted-foreground">Everyone is square 🎉</p>
        ) : (
          <ul className="space-y-2">
            {balances.data?.settlements.map((s, i) => (
              <li key={i} className="flex items-center justify-between rounded-2xl bg-muted/40 px-4 py-3">
                <span className="flex items-center gap-2">
                  <span className="font-medium">{memberMap.get(s.from) ?? "Someone"}</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{memberMap.get(s.to) ?? "Someone"}</span>
                </span>
                <span className="font-display text-lg font-semibold gradient-text">₹{s.amount.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Expenses */}
      <div className="glass rounded-3xl p-6">
        <h3 className="mb-4 font-semibold">Expenses</h3>
        {expenses.data?.length === 0 && <p className="text-sm text-muted-foreground">No expenses yet.</p>}
        <ul className="divide-y divide-border/50">
          {(expenses.data ?? []).map((e: any) => (
            <ExpenseRow key={e.id} e={e} memberMap={memberMap} onDelete={() => del.mutate(e.id)} />
          ))}
        </ul>
      </div>
    </div>
  );
}

function ExpenseRow({ e, memberMap, onDelete }: { e: any; memberMap: Map<string, string>; onDelete: () => void }) {
  return (
    <motion.li initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between py-3">
      <div>
        <div className="font-medium">{e.title}</div>
        <div className="text-xs text-muted-foreground">
          {e.category} · paid by {memberMap.get(e.paid_by) ?? "?"} · {e.expense_date}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-display text-lg font-semibold">₹{Number(e.amount).toFixed(2)}</span>
        <button onClick={onDelete} title="Delete" className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </motion.li>
  );
}
