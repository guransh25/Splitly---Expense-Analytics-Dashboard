DROP POLICY IF EXISTS "gm_insert" ON public.group_members;
CREATE POLICY "gm_insert" ON public.group_members FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    OR public.is_group_member(group_id, auth.uid())
    OR EXISTS (SELECT 1 FROM public.groups g WHERE g.id = group_id AND g.created_by = auth.uid())
  );