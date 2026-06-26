import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Upload, KeyRound, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile — Splitly" }] }),
  component: Profile,
});

function Profile() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [pw, setPw] = useState("");
  const [pwBusy, setPwBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setEmail(user.email ?? "");
      const { data: p } = await supabase.from("profiles").select("name, avatar_url").eq("id", user.id).single();
      if (p) {
        setName(p.name);
        if (p.avatar_url) {
          const { data: signed } = await supabase.storage.from("avatars").createSignedUrl(p.avatar_url, 3600);
          if (signed) setAvatarUrl(signed.signedUrl);
        }
      }
    })();
  }, []);

  async function saveName() {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase.from("profiles").update({ name }).eq("id", user.id);
      if (error) throw error;
      toast.success("Name updated");
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pw });
      if (error) throw error;
      toast.success("Password updated");
      setPw("");
    } catch (e: any) { toast.error(e.message); }
    finally { setPwBusy(false); }
  }

  async function uploadAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const path = `${user.id}/avatar-${Date.now()}.${file.name.split(".").pop()}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) return toast.error(error.message);
    await supabase.from("profiles").update({ avatar_url: path }).eq("id", user.id);
    const { data: signed } = await supabase.storage.from("avatars").createSignedUrl(path, 3600);
    if (signed) setAvatarUrl(signed.signedUrl);
    toast.success("Avatar updated");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <h1 className="text-3xl font-bold sm:text-4xl">Profile</h1>

      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl p-6">
        <div className="flex items-center gap-5">
          {avatarUrl ? (
            <img src={avatarUrl} alt="avatar" className="h-20 w-20 rounded-full object-cover" />
          ) : (
            <div className="grid h-20 w-20 place-items-center rounded-full bg-[image:var(--gradient-brand)] font-display text-2xl font-bold text-white">
              {(name || email || "?").slice(0, 1).toUpperCase()}
            </div>
          )}
          <label className="cursor-pointer inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm hover:bg-muted">
            <Upload className="h-4 w-4" /> Upload avatar
            <input type="file" accept="image/*" hidden onChange={uploadAvatar} />
          </label>
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Email</label>
            <div className="mt-1 text-sm text-muted-foreground">{email}</div>
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Display name</label>
            <div className="mt-1 flex gap-2">
              <input value={name} onChange={(e) => setName(e.target.value)} className="flex-1 rounded-xl border border-border bg-input px-4 py-2.5 outline-none focus:ring-2 focus:ring-ring" />
              <button onClick={saveName} disabled={saving} className="rounded-xl bg-primary px-5 py-2.5 font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50">
                {saving ? "…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl p-6">
        <div className="mb-4 flex items-center gap-2"><KeyRound className="h-4 w-4 text-primary" /><h2 className="font-semibold">Change password</h2></div>
        <form onSubmit={changePassword} className="flex gap-2">
          <input value={pw} onChange={(e) => setPw(e.target.value)} type="password" minLength={6} required placeholder="New password"
            className="flex-1 rounded-xl border border-border bg-input px-4 py-2.5 outline-none focus:ring-2 focus:ring-ring" />
          <button disabled={pwBusy} className="rounded-xl bg-primary px-5 py-2.5 font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50">
            {pwBusy ? "…" : "Update"}
          </button>
        </form>
      </motion.section>
    </div>
  );
}
