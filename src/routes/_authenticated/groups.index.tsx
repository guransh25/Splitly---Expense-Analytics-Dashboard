import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "framer-motion";
import { Users, PlusCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { createGroup, listMyGroups } from "@/lib/groups.functions";

export const Route = createFileRoute("/_authenticated/groups/")({
  head: () => ({ meta: [{ title: "Groups — Splitly" }] }),
  component: GroupsPage,
});

function GroupsPage() {
  const qc = useQueryClient();
  const fetchGroups = useServerFn(listMyGroups);
  const create = useServerFn(createGroup);
  const [name, setName] = useState("");

  const { data: groups, isLoading } = useQuery({ queryKey: ["groups"], queryFn: () => fetchGroups() });

  const mut = useMutation({
    mutationFn: (n: string) => create({ data: { name: n } }),
    onSuccess: () => {
      toast.success("Group created");
      setName("");
      qc.invalidateQueries({ queryKey: ["groups"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to create"),
  });

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold sm:text-4xl">Your groups</h1>

      <form
        onSubmit={(e) => { e.preventDefault(); if (name.trim()) mut.mutate(name.trim()); }}
        className="glass flex flex-wrap items-center gap-3 rounded-3xl p-5"
      >
        <PlusCircle className="h-5 w-5 text-primary" />
        <input
          value={name} onChange={(e) => setName(e.target.value)}
          placeholder="New group name (e.g. Goa Trip, Flat 4B)"
          className="flex-1 rounded-xl border border-border bg-input px-4 py-2.5 outline-none focus:ring-2 focus:ring-ring"
        />
        <button disabled={mut.isPending} className="rounded-xl bg-primary px-5 py-2.5 font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50">
          {mut.isPending ? "Creating…" : "Create"}
        </button>
      </form>

      {isLoading && <div className="text-muted-foreground">Loading…</div>}

      {groups && groups.length === 0 && (
        <div className="glass rounded-3xl p-10 text-center text-muted-foreground">
          No groups yet. Create your first one above 👆
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(groups ?? []).map((g, i) => (
          <motion.div
            key={g.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
          >
            <Link
              to="/groups/$id" params={{ id: g.id }}
              className="glass block rounded-3xl p-6 transition hover:-translate-y-1 hover:shadow-[var(--shadow-glow)]"
            >
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[image:var(--gradient-brand)]">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div className="mt-4 font-display text-lg font-semibold">{g.name}</div>
              <div className="text-xs text-muted-foreground">Created {new Date(g.created_at).toLocaleDateString()}</div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
