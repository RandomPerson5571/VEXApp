-- Supabase RLS policies for Prisma-managed tables.
-- Apply manually in the Supabase SQL editor or via `supabase db execute`.
-- Requires user.id to match auth.uid() and implicit join tables _TeamEvents / _AuthoredDocs.

CREATE OR REPLACE FUNCTION public.current_user_team_id()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT "teamId"
  FROM "User"
  WHERE "id" = auth.uid()::text
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text
  FROM "User"
  WHERE "id" = auth.uid()::text
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_team_leader_or_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(public.current_user_role() IN ('ADMIN', 'TEAM_LEADER'), false);
$$;

-- User
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_select_own" ON "User";
CREATE POLICY "user_select_own" ON "User"
  FOR SELECT
  USING ("id" = auth.uid()::text);

DROP POLICY IF EXISTS "user_select_teammates" ON "User";
CREATE POLICY "user_select_teammates" ON "User"
  FOR SELECT
  USING (
    "teamId" IS NOT NULL
    AND "teamId" = public.current_user_team_id()
  );

DROP POLICY IF EXISTS "user_insert_own" ON "User";
CREATE POLICY "user_insert_own" ON "User"
  FOR INSERT
  WITH CHECK ("id" = auth.uid()::text);

DROP POLICY IF EXISTS "user_update_own" ON "User";
CREATE POLICY "user_update_own" ON "User"
  FOR UPDATE
  USING ("id" = auth.uid()::text)
  WITH CHECK ("id" = auth.uid()::text);

-- Team
ALTER TABLE "Team" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "team_select_member" ON "Team";
CREATE POLICY "team_select_member" ON "Team"
  FOR SELECT
  USING (id = public.current_user_team_id());

DROP POLICY IF EXISTS "team_update_leader" ON "Team";
CREATE POLICY "team_update_leader" ON "Team"
  FOR UPDATE
  USING (id = public.current_user_team_id() AND public.is_team_leader_or_admin())
  WITH CHECK (id = public.current_user_team_id() AND public.is_team_leader_or_admin());

-- Event
ALTER TABLE "Event" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "event_select_team" ON "Event";
CREATE POLICY "event_select_team" ON "Event"
  FOR SELECT
  USING (
    id IN (
      SELECT "A"
      FROM "_TeamEvents"
      WHERE "B" = public.current_user_team_id()
    )
  );

DROP POLICY IF EXISTS "event_insert_leader" ON "Event";
CREATE POLICY "event_insert_leader" ON "Event"
  FOR INSERT
  WITH CHECK (public.is_team_leader_or_admin());

DROP POLICY IF EXISTS "event_update_leader" ON "Event";
CREATE POLICY "event_update_leader" ON "Event"
  FOR UPDATE
  USING (
    public.is_team_leader_or_admin()
    AND id IN (
      SELECT "A"
      FROM "_TeamEvents"
      WHERE "B" = public.current_user_team_id()
    )
  );

DROP POLICY IF EXISTS "event_delete_leader" ON "Event";
CREATE POLICY "event_delete_leader" ON "Event"
  FOR DELETE
  USING (
    public.is_team_leader_or_admin()
    AND id IN (
      SELECT "A"
      FROM "_TeamEvents"
      WHERE "B" = public.current_user_team_id()
    )
  );

-- _TeamEvents join table
ALTER TABLE "_TeamEvents" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "team_events_select_member" ON "_TeamEvents";
CREATE POLICY "team_events_select_member" ON "_TeamEvents"
  FOR SELECT
  USING ("B" = public.current_user_team_id());

DROP POLICY IF EXISTS "team_events_insert_leader" ON "_TeamEvents";
CREATE POLICY "team_events_insert_leader" ON "_TeamEvents"
  FOR INSERT
  WITH CHECK (
    public.is_team_leader_or_admin()
    AND "B" = public.current_user_team_id()
  );

DROP POLICY IF EXISTS "team_events_delete_leader" ON "_TeamEvents";
CREATE POLICY "team_events_delete_leader" ON "_TeamEvents"
  FOR DELETE
  USING (
    public.is_team_leader_or_admin()
    AND "B" = public.current_user_team_id()
  );

-- Folder (org-wide read for authenticated users until team scoping is added)
ALTER TABLE "Folder" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "folder_select_authenticated" ON "Folder";
CREATE POLICY "folder_select_authenticated" ON "Folder"
  FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "folder_write_leader" ON "Folder";
CREATE POLICY "folder_write_leader" ON "Folder"
  FOR ALL
  USING (public.is_team_leader_or_admin())
  WITH CHECK (public.is_team_leader_or_admin());

-- Documentation
ALTER TABLE "Documentation" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "documentation_select_authenticated" ON "Documentation";
CREATE POLICY "documentation_select_authenticated" ON "Documentation"
  FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "documentation_insert_authenticated" ON "Documentation";
CREATE POLICY "documentation_insert_authenticated" ON "Documentation"
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "documentation_update_author_or_leader" ON "Documentation";
CREATE POLICY "documentation_update_author_or_leader" ON "Documentation"
  FOR UPDATE
  USING (
    public.is_team_leader_or_admin()
    OR id IN (
      SELECT "A"
      FROM "_AuthoredDocs"
      WHERE "B" IN (
        SELECT id FROM "User" WHERE "id" = auth.uid()::text
      )
    )
  );

DROP POLICY IF EXISTS "documentation_delete_leader" ON "Documentation";
CREATE POLICY "documentation_delete_leader" ON "Documentation"
  FOR DELETE
  USING (public.is_team_leader_or_admin());

-- _AuthoredDocs join table
ALTER TABLE "_AuthoredDocs" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authored_docs_select_authenticated" ON "_AuthoredDocs";
CREATE POLICY "authored_docs_select_authenticated" ON "_AuthoredDocs"
  FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "authored_docs_insert_author" ON "_AuthoredDocs";
CREATE POLICY "authored_docs_insert_author" ON "_AuthoredDocs"
  FOR INSERT
  WITH CHECK (
    "B" IN (SELECT id FROM "User" WHERE "id" = auth.uid()::text)
  );

-- NotebookLog
ALTER TABLE "NotebookLog" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notebook_log_select_team" ON "NotebookLog";
CREATE POLICY "notebook_log_select_team" ON "NotebookLog"
  FOR SELECT
  USING (
    "teamId" = public.current_user_team_id()
    OR "userId" = auth.uid()::text
    OR public.current_user_role() = 'ADMIN'
  );

DROP POLICY IF EXISTS "notebook_log_insert_author" ON "NotebookLog";
CREATE POLICY "notebook_log_insert_author" ON "NotebookLog"
  FOR INSERT
  WITH CHECK (
    "userId" = auth.uid()::text
    AND (
      "teamId" = public.current_user_team_id()
      OR public.current_user_role() IN ('ADMIN', 'TEAM_LEADER')
    )
  );

-- Invite
ALTER TABLE "Invite" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "invite_select_leader" ON "Invite";
CREATE POLICY "invite_select_leader" ON "Invite"
  FOR SELECT
  USING (public.is_team_leader_or_admin());
