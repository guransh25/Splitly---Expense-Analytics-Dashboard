import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { listMyGroups, getGroupDetail } from "@/lib/groups.functions";
import { createExpense } from "@/lib/expenses.functions";
import { categorizeExpense } from "@/lib/ai.functions";

const searchSchema = z.object({ groupId: z.string().uuid().optional() });

export const Route = createFileRoute("/_authenticated/expenses/new")({
  head: () => ({ meta: [{ title: "New expense — Splitly" }] }),
  validateSearch: searchSchema,
  component: NewExpense,
});

const CATEGORIES = ["Food", "Transport", "Shopping", "Entertainment", "Bills", "Travel", "Groceries", "Health", "Other"];

function NewExpense() {
  const router = useRouter();
  const search = Route.useSearch();
  const fetchGroups = useServerFn(listMyGroups);
  const fetchDetail = useServerFn(getGroupDetail);
  const create = useServerFn(createExpense);
  const categorize = useServerFn(categorizeExpense);

  const groups = useQuery({ queryKey: ["groups"], queryFn: () => fetchGroups() });

  const [groupId, setGroupId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Other");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [splitWith, setSplitWith] = useState<Set<string>>(new Set());
  const [aiBusy, setAiBusy] = useState(false);

  useEffect(() => {
    if (!groupId && (search.groupId || groups.data?.[0]?.id)) {
      setGroupId(search.groupId ?? groups.data![0].id);
    }
  }, [groups.data, search.groupId, groupId]);

  const detail = useQuery({
    queryKey: ["group", groupId],
    queryFn: () => fetchDetail({ data: { groupId } }),
    enabled: !!groupId,
  });

  useEffect(() => {
    if (detail.data) setSplitWith(new Set(detail.data.members.map((m: any) => m.user_id)));
  }, [detail.data]);

  async function autoCategorize() {
    if (!title || !amount) return toast.error("Add a title and amount first");
    setAiBusy(true);
    try {
      const r = await categorize({ data: { title, amount: Number(amount) } });
      setCategory(r.category);
      toast.success(`AI says: ${r.category}`);
    } finally { setAiBusy(false); }
  }

  const mut = useMutation({
    mutationFn: async () =>
      create({
        data: {
          group_id: groupId,
          title: title.trim(),
          amount: Number(amount),
          category,
          description: description || null,
          expense_date: date,
          split_user_ids: Array.from(splitWith),
        },
      }),
    onSuccess: () => {
      toast.success("Expense added");
      router.navigate({ to: "/groups/$id", params: { id: groupId } });
    },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  if (groups.isLoading) return <div className="text-muted-foreground">Loading…</div>;
  if (groups.data?.length === 0) {
    return <div className="glass rounded-3xl p-10 text-center">Create a group first to add expenses.</div>;
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-3xl font-bold sm:text-4xl">Add expense</h1>

      <motion.form
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        onSubmit={(e) => { e.preventDefault(); mut.mutate(); }}
        className="glass space-y-5 rounded-3xl p-6"
      >
        <Field label="Group">
          <select value={groupId} onChange={(e) => setGroupId(e.target.value)} className="select-input">
            {(groups.data ?? []).map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </Field>

        <Field label="Title">
          <input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Uber to airport" className="text-input" />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Amount (₹)">
            <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" step="0.01" min="0.01" required placeholder="250" className="text-input" />
          </Field>
          <Field label="Date">
            <input value={date} onChange={(e) => setDate(e.target.value)} type="date" required className="text-input" />
          </Field>
        </div>

        <Field label="Category">
          <div className="flex gap-2">
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="select-input flex-1">
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
            <button type="button" onClick={autoCategorize} disabled={aiBusy}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-sm hover:bg-muted disabled:opacity-50">
              <Sparkles className="h-4 w-4 text-primary" /> {aiBusy ? "…" : "AI suggest"}
            </button>
          </div>
        </Field>

        <Field label="Description (optional)">
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="text-input" />
        </Field>

        <Field label="Split with (equal split)">
          <div className="flex flex-wrap gap-2">
            {(detail.data?.members ?? []).map((m: any) => {
              const on = splitWith.has(m.user_id);
              return (
                <button type="button" key={m.user_id}
                  onClick={() => {
                    const n = new Set(splitWith);
                    on ? n.delete(m.user_id) : n.add(m.user_id);
                    setSplitWith(n);
                  }}
                  className={`rounded-full px-3 py-1.5 text-sm transition ${on ? "bg-primary text-primary-foreground" : "bg-muted/60 hover:bg-muted"}`}
                >
                  {m.profiles?.name ?? "?"}
                </button>
              );
            })}
          </div>
          {amount && splitWith.size > 0 && (
            <p className="mt-2 text-xs text-muted-foreground">
              Each person pays ₹{(Number(amount) / splitWith.size).toFixed(2)}
            </p>
          )}
        </Field>

        <button disabled={mut.isPending || splitWith.size === 0} className="w-full rounded-xl bg-primary py-3 font-semibold text-primary-foreground shadow-[var(--shadow-glow)] hover:opacity-90 disabled:opacity-50">
          {mut.isPending ? "Saving…" : "Add expense"}
        </button>
      </motion.form>

      <style>{`
        .text-input, .select-input { width: 100%; border-radius: 0.75rem; border: 1px solid var(--color-border); background: var(--color-input); padding: 0.625rem 1rem; outline: none; color: var(--color-foreground); }
        .text-input:focus, .select-input:focus { box-shadow: 0 0 0 2px var(--color-ring); }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
