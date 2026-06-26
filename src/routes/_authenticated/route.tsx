import { createFileRoute, Link, Outlet, redirect, useRouter } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { LayoutDashboard, Users, PlusCircle, User as UserIcon, LogOut, Wallet } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AuthLayout,
});

function AuthLayout() {
  const router = useRouter();

  async function signOut() {
    await supabase.auth.signOut();
    toast.success("Signed out");
    router.navigate({ to: "/auth" });
  }

  return (
    <div className="hero-bg min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border/40 backdrop-blur-xl bg-background/60">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-[image:var(--gradient-brand)]">
              <Wallet className="h-5 w-5 text-white" />
            </div>
            <span className="font-display text-lg font-bold">Splitly</span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            <NavLink to="/dashboard" icon={<LayoutDashboard className="h-4 w-4" />}>Dashboard</NavLink>
            <NavLink to="/groups" icon={<Users className="h-4 w-4" />}>Groups</NavLink>
            <NavLink to="/expenses/new" icon={<PlusCircle className="h-4 w-4" />}>New expense</NavLink>
            <NavLink to="/profile" icon={<UserIcon className="h-4 w-4" />}>Profile</NavLink>
          </nav>
          <button
            onClick={signOut}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm hover:bg-muted"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
        {/* mobile nav */}
        <div className="flex items-center justify-around border-t border-border/40 px-2 py-2 md:hidden">
          <NavLink to="/dashboard" icon={<LayoutDashboard className="h-4 w-4" />}>Home</NavLink>
          <NavLink to="/groups" icon={<Users className="h-4 w-4" />}>Groups</NavLink>
          <NavLink to="/expenses/new" icon={<PlusCircle className="h-4 w-4" />}>Add</NavLink>
          <NavLink to="/profile" icon={<UserIcon className="h-4 w-4" />}>Me</NavLink>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}

function NavLink({ to, icon, children }: { to: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      activeProps={{ className: "bg-muted text-foreground" }}
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
    >
      {icon} {children}
    </Link>
  );
}
