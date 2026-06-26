import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "framer-motion";
import { ArrowDown, ArrowUp, Wallet, Sparkles, PlusCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { getDashboardSummary } from "@/lib/expenses.functions";
import { generateInsights } from "@/lib/ai.functions";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Splitly" }] }),
  component: Dashboard,
});

const COLORS = ["#FF6F61", "#A87BFF", "#7C8BFF", "#5CC8A6", "#FFC857", "#FF8FB1", "#6BCBEF", "#B8A47B", "#9AA0A6"];

function Dashboard() {
  const fetchSummary = useServerFn(getDashboardSummary);
  const fetchInsights = useServerFn(generateInsights);

  const { data: summary, isLoading } = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: () => fetchSummary(),
  });

  const [insights, setInsights] = useState<{ topCategory: string; summary: string; tip: string } | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);

  useEffect(() => {
    if (!summary || summary.recent.length === 0) return;
    setInsightsLoading(true);
    fetchInsights({
      data: {
        expenses: summary.recent.map((e: any) => ({
          title: e.title, amount: Number(e.amount), category: e.category, date: e.expense_date,
        })),
      },
    })
      .then(setInsights)
      .finally(() => setInsightsLoading(false));
  }, [summary, fetchInsights]);

  if (isLoading) return <div className="text-muted-foreground">Loading dashboard…</div>;
  if (!summary) return null;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold sm:text-4xl">Hi there 👋</h1>
        <Link to="/expenses/new" className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
          <PlusCircle className="h-4 w-4" /> Add expense
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Net balance" value={summary.net} icon={<Wallet className="h-5 w-5" />} positive={summary.net >= 0} accent />
        <StatCard label="You owe" value={summary.owe} icon={<ArrowDown className="h-5 w-5" />} positive={false} />
        <StatCard label="You're owed" value={summary.owed} icon={<ArrowUp className="h-5 w-5" />} positive />
      </div>

      {/* AI insights */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl p-6">
        <div className="mb-2 inline-flex items-center gap-1.5 text-xs text-primary"><Sparkles className="h-3.5 w-3.5" /> AI Insights</div>
        {insightsLoading && <div className="text-muted-foreground">Thinking…</div>}
        {insights && !insightsLoading && (
          <>
            <div className="font-display text-xl font-semibold">Top category: <span className="gradient-text">{insights.topCategory}</span></div>
            <p className="mt-2 text-sm text-muted-foreground">{insights.summary}</p>
            <p className="mt-3 rounded-xl bg-muted/40 p-3 text-sm">💡 {insights.tip}</p>
          </>
        )}
      </motion.div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-3xl p-6">
          <h3 className="font-semibold">Monthly spending</h3>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary.monthly}>
                <XAxis dataKey="month" stroke="#999" fontSize={12} />
                <YAxis stroke="#999" fontSize={12} />
                <Tooltip contentStyle={{ background: "#1a1a2e", border: "1px solid #333", borderRadius: 12 }} />
                <Bar dataKey="total" fill="url(#g1)" radius={[8, 8, 0, 0]} />
                <defs>
                  <linearGradient id="g1" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#FF6F61" />
                    <stop offset="100%" stopColor="#A87BFF" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-3xl p-6">
          <h3 className="font-semibold">By category</h3>
          <div className="mt-4 h-64">
            {summary.byCategory.length === 0 ? (
              <div className="grid h-full place-items-center text-sm text-muted-foreground">No data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={summary.byCategory} dataKey="total" nameKey="category" innerRadius={50} outerRadius={90} paddingAngle={3}>
                    {summary.byCategory.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#1a1a2e", border: "1px solid #333", borderRadius: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>
      </div>

      {/* Recent */}
      <div className="glass rounded-3xl p-6">
        <h3 className="mb-4 font-semibold">Recent expenses</h3>
        {summary.recent.length === 0 ? (
          <p className="text-sm text-muted-foreground">No expenses yet. <Link to="/expenses/new" className="text-primary hover:underline">Add one →</Link></p>
        ) : (
          <ul className="divide-y divide-border/50">
            {summary.recent.map((e: any) => (
              <li key={e.id} className="flex items-center justify-between py-3">
                <div>
                  <div className="font-medium">{e.title}</div>
                  <div className="text-xs text-muted-foreground">{e.category} · {e.expense_date}</div>
                </div>
                <div className="font-display text-lg font-semibold">₹{Number(e.amount).toFixed(2)}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, positive, accent }: { label: string; value: number; icon: React.ReactNode; positive: boolean; accent?: boolean }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className={`glass rounded-3xl p-6 ${accent ? "ring-1 ring-primary/30" : ""}`}>
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="text-xs uppercase tracking-wider">{label}</span>
        <span className={positive ? "text-success" : "text-warning"}>{icon}</span>
      </div>
      <div className={`mt-3 font-display text-3xl font-bold ${accent ? "gradient-text" : positive ? "text-success" : "text-warning"}`}>
        {value < 0 ? "-" : ""}₹{Math.abs(value).toFixed(2)}
      </div>
    </motion.div>
  );
}
