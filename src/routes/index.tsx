import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Wallet, Sparkles, Users, PieChart, Receipt, ShieldCheck, ArrowRight, Brain, ChartBar, ScanLine } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Splitly — AI-powered expense splitting with friends" },
      { name: "description", content: "Track group spending, auto-categorize with AI, and settle up in one tap. The modern Splitwise alternative." },
      { property: "og:title", content: "Splitly — Split smarter with AI" },
      { property: "og:description", content: "Track group spending and settle up with zero math." },
    ],
  }),
  component: Landing,
});

const fade = { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: "-80px" }, transition: { duration: 0.5 } };

function Landing() {
  return (
    <div className="hero-bg min-h-screen overflow-hidden">
      <Nav />
      <Hero />
      <Features />
      <HowItWorks />
      <Screenshots />
      <Faq />
      <Cta />
      <Footer />
    </div>
  );
}

function Nav() {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/40 border-b border-border/40">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-[image:var(--gradient-brand)]"><Wallet className="h-5 w-5 text-white" /></div>
          <span className="font-display text-xl font-bold">Splitly</span>
        </Link>
        <nav className="hidden items-center gap-7 md:flex text-sm text-muted-foreground">
          <a href="#features" className="hover:text-foreground">Features</a>
          <a href="#how" className="hover:text-foreground">How it works</a>
          <a href="#faq" className="hover:text-foreground">FAQ</a>
        </nav>
        <Link to="/auth" className="inline-flex items-center gap-1 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
          Get started <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative mx-auto max-w-6xl px-4 pb-20 pt-20 text-center sm:px-6 sm:pt-28">
      <motion.div {...fade} className="mb-5 inline-flex items-center gap-2 rounded-full border border-border/60 glass px-4 py-1.5 text-xs text-muted-foreground">
        <Sparkles className="h-3.5 w-3.5 text-primary" /> Powered by Gemini AI
      </motion.div>
      <motion.h1 {...fade} transition={{ duration: 0.6, delay: 0.05 }} className="mx-auto max-w-4xl text-5xl font-bold leading-[1.05] sm:text-7xl">
        Split expenses<br /><span className="gradient-text">without the awkward math.</span>
      </motion.h1>
      <motion.p {...fade} transition={{ duration: 0.6, delay: 0.1 }} className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
        Splitly tracks shared spending across trips, roommates, and group dinners — and uses AI to categorize expenses and surface insights so you can save more.
      </motion.p>
      <motion.div {...fade} transition={{ duration: 0.6, delay: 0.15 }} className="mt-9 flex flex-wrap justify-center gap-3">
        <Link to="/auth" className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-[var(--shadow-glow)] hover:opacity-90">
          Start splitting free <ArrowRight className="h-4 w-4" />
        </Link>
        <a href="#features" className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 font-semibold hover:bg-muted">
          See how it works
        </a>
      </motion.div>

      <motion.div {...fade} transition={{ duration: 0.7, delay: 0.25 }} className="relative mx-auto mt-16 max-w-4xl">
        <div className="glass rounded-3xl p-6 sm:p-10">
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: "Total balance", value: "+ ₹2,340", color: "text-success" },
              { label: "You owe", value: "₹680", color: "text-warning" },
              { label: "You're owed", value: "₹3,020", color: "text-primary" },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl bg-muted/40 p-5 text-left">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</div>
                <div className={`mt-2 font-display text-3xl font-bold ${s.color}`}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}

function Features() {
  const items = [
    { icon: Brain, title: "AI auto-categorization", desc: "Type 'Uber ₹250' — Gemini tags it as Transport. No menus, no manual taxonomy." },
    { icon: Users, title: "Smart groups", desc: "Roommates, trips, dinners. Add members and start splitting in seconds." },
    { icon: PieChart, title: "Beautiful analytics", desc: "Monthly bar charts and category breakdowns that actually look good." },
    { icon: Sparkles, title: "Spending insights", desc: "Personalized AI tips: your top category, monthly summary, savings ideas." },
    { icon: ShieldCheck, title: "Private by design", desc: "Row-level security on every record. Your data is only seen by your group." },
    { icon: Receipt, title: "Equal split, simplified", desc: "We do the math. You see who owes whom in plain language." },
  ];
  return (
    <section id="features" className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
      <motion.h2 {...fade} className="text-center text-4xl font-bold sm:text-5xl">Everything you need.<br /><span className="gradient-text">Nothing you don't.</span></motion.h2>
      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it, i) => (
          <motion.div key={it.title} {...fade} transition={{ duration: 0.5, delay: i * 0.05 }} className="glass group rounded-3xl p-7 transition hover:-translate-y-1 hover:shadow-[var(--shadow-glow)]">
            <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[image:var(--gradient-brand)]"><it.icon className="h-5 w-5 text-white" /></div>
            <h3 className="text-lg font-semibold">{it.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{it.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { icon: Users, title: "Create a group", desc: "Add your trip-mates or flatmates by email." },
    { icon: ScanLine, title: "Log an expense", desc: "Title + amount. AI picks the category for you." },
    { icon: ChartBar, title: "Settle up", desc: "See exactly who owes whom — no more spreadsheets." },
  ];
  return (
    <section id="how" className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
      <motion.h2 {...fade} className="text-center text-4xl font-bold sm:text-5xl">From zero to settled in <span className="gradient-text">3 steps</span></motion.h2>
      <div className="mt-14 grid gap-6 md:grid-cols-3">
        {steps.map((s, i) => (
          <motion.div key={s.title} {...fade} transition={{ duration: 0.5, delay: i * 0.1 }} className="glass relative rounded-3xl p-8">
            <div className="absolute -top-4 left-6 grid h-9 w-9 place-items-center rounded-full bg-primary font-display text-sm font-bold text-primary-foreground">{i + 1}</div>
            <s.icon className="h-7 w-7 text-primary" />
            <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function Screenshots() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
      <motion.h2 {...fade} className="text-center text-4xl font-bold sm:text-5xl">Designed to feel <span className="gradient-text">premium</span></motion.h2>
      <motion.div {...fade} transition={{ delay: 0.1 }} className="mt-12 grid gap-5 md:grid-cols-2">
        <div className="glass rounded-3xl p-6">
          <div className="text-xs text-muted-foreground">Dashboard</div>
          <div className="mt-3 font-display text-3xl font-bold gradient-text">+ ₹4,820</div>
          <div className="mt-1 text-sm text-muted-foreground">Net balance this month</div>
          <div className="mt-6 flex items-end gap-2">
            {[40, 60, 35, 80, 55, 90].map((h, i) => (
              <div key={i} className="w-full rounded-md bg-[image:var(--gradient-brand)]" style={{ height: `${h}px` }} />
            ))}
          </div>
        </div>
        <div className="glass rounded-3xl p-6">
          <div className="text-xs text-muted-foreground">AI insights</div>
          <div className="mt-3 font-display text-xl font-semibold">Top category: Food 🍜</div>
          <p className="mt-3 text-sm text-muted-foreground">You spent ₹3,200 on food this month — about 40% of total spend. Try cooking one extra meal at home each week to save ~₹600.</p>
          <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-xs">
            <Sparkles className="h-3 w-3 text-primary" /> Generated by Gemini
          </div>
        </div>
      </motion.div>
    </section>
  );
}

function Faq() {
  const items = [
    { q: "Is Splitly free?", a: "Yes, the core app is free to use." },
    { q: "Does it support unequal splits?", a: "Not yet — Splitly focuses on equal splits to keep the experience simple and fast." },
    { q: "How does AI categorization work?", a: "When you add an expense, we send the title and amount to Gemini, which suggests one of nine categories. You can always change it." },
    { q: "Is my data private?", a: "Every record is protected by row-level security. Only the members of a group can see that group's expenses." },
  ];
  return (
    <section id="faq" className="mx-auto max-w-3xl px-4 py-24 sm:px-6">
      <motion.h2 {...fade} className="text-center text-4xl font-bold sm:text-5xl">Questions, <span className="gradient-text">answered</span></motion.h2>
      <div className="mt-12 space-y-3">
        {items.map((it) => <FaqItem key={it.q} {...it} />)}
      </div>
    </section>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div {...fade} className="glass rounded-2xl">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between px-6 py-5 text-left">
        <span className="font-medium">{q}</span>
        <span className={`text-primary transition ${open ? "rotate-45" : ""}`}>＋</span>
      </button>
      {open && <p className="px-6 pb-5 text-sm text-muted-foreground">{a}</p>}
    </motion.div>
  );
}

function Cta() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-24 sm:px-6">
      <motion.div {...fade} className="glass rounded-3xl p-12 text-center">
        <h2 className="text-4xl font-bold sm:text-5xl">Ready to split smarter?</h2>
        <p className="mt-4 text-muted-foreground">Join in 30 seconds — no credit card required.</p>
        <Link to="/auth" className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 font-semibold text-primary-foreground shadow-[var(--shadow-glow)] hover:opacity-90">
          Get started free <ArrowRight className="h-4 w-4" />
        </Link>
      </motion.div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/40 mt-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:px-6">
        <div className="flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-lg bg-[image:var(--gradient-brand)]"><Wallet className="h-3.5 w-3.5 text-white" /></div>
          <span>© {new Date().getFullYear()} Splitly. Built with love.</span>
        </div>
        <div className="flex items-center gap-5">
          <a href="#features" className="hover:text-foreground">Features</a>
          <a href="#faq" className="hover:text-foreground">FAQ</a>
        </div>
      </div>
    </footer>
  );
}
