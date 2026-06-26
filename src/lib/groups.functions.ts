/**
 * Group + member server functions.
 * All run as the signed-in user; RLS enforces access.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const listMyGroups = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    // groups where I'm a member OR creator
    const { data: memberships } = await supabase
      .from("group_members")
      .select("group_id")
      .eq("user_id", userId);
    const ids = (memberships ?? []).map((m) => m.group_id);
    const { data, error } = await supabase
      .from("groups")
      .select("id, name, created_at, created_by")
      .or(`created_by.eq.${userId}${ids.length ? `,id.in.(${ids.join(",")})` : ""}`)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

export const createGroup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ name: z.string().trim().min(1).max(80) }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: group, error } = await supabase
      .from("groups")
      .insert({ name: data.name, created_by: userId })
      .select()
      .single();
    if (error) throw error;
    // auto-add creator as first member
    await supabase.from("group_members").insert({ group_id: group.id, user_id: userId });
    return group;
  });

export const getGroupDetail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ groupId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: group, error } = await supabase
      .from("groups")
      .select("id, name, created_by, created_at")
      .eq("id", data.groupId)
      .single();
    if (error) throw error;
    const { data: members } = await supabase
      .from("group_members")
      .select("user_id, joined_at, profiles:profiles!group_members_user_id_fkey(id, name, email, avatar_url)")
      .eq("group_id", data.groupId);
    return { group, members: members ?? [] };
  });

export const addMemberByEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ groupId: z.string().uuid(), email: z.string().trim().email() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    // find user by email via profiles
    const { data: profile, error: pErr } = await supabase
      .from("profiles")
      .select("id, name, email")
      .eq("email", data.email.toLowerCase())
      .maybeSingle();
    if (pErr) throw pErr;
    if (!profile) throw new Error("No user with that email. Ask them to sign up first.");
    const { error } = await supabase.from("group_members").insert({ group_id: data.groupId, user_id: profile.id });
    if (error && !`${error.message}`.includes("duplicate")) throw error;
    return { ok: true, addedName: profile.name };
  });

export const joinGroupById = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ groupId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("group_members").insert({ group_id: data.groupId, user_id: userId });
    if (error) throw error;
    return { ok: true };
  });
