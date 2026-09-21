import { createClient } from "@/lib/supabase/server";
import type { LoadNote, LoadNoteAuthorType, UUID } from "../../../types/domain";

interface LoadNoteRow {
  id: string;
  org_id: string;
  load_id: string;
  author_type: string;
  author_user_id: string | null;
  author_label: string;
  note_text: string;
  is_read: boolean;
  created_at: string;
}

const LOAD_NOTE_COLUMNS =
  "id, org_id, load_id, author_type, author_user_id, author_label, note_text, is_read, created_at";

function mapRowToLoadNote(row: LoadNoteRow): LoadNote {
  return {
    id: row.id,
    orgId: row.org_id,
    loadId: row.load_id,
    authorType: row.author_type as LoadNoteAuthorType,
    authorUserId: row.author_user_id,
    authorLabel: row.author_label,
    noteText: row.note_text,
    isRead: row.is_read,
    createdAt: row.created_at,
  };
}

export async function listLoadNotes(loadId: UUID): Promise<LoadNote[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("load_notes")
    .select(LOAD_NOTE_COLUMNS)
    .eq("load_id", loadId)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return (data as unknown as LoadNoteRow[]).map(mapRowToLoadNote);
}

// Staff-authored only -- RLS (load_notes_insert_staff_own_org,
// 050_load_notes.sql) requires author_type = 'staff' and author_user_id =
// auth.uid(), so this can never be used to write a driver-authored row; that
// path is add_driver_load_note() (SECURITY DEFINER RPC) instead.
export async function insertStaffLoadNote(
  loadId: UUID,
  orgId: UUID,
  authorUserId: UUID,
  authorLabel: string,
  noteText: string
): Promise<LoadNote> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("load_notes")
    .insert({
      org_id: orgId,
      load_id: loadId,
      author_type: "staff",
      author_user_id: authorUserId,
      author_label: authorLabel,
      note_text: noteText,
      is_read: true,
    })
    .select(LOAD_NOTE_COLUMNS)
    .single();

  if (error) {
    throw error;
  }

  return mapRowToLoadNote(data as unknown as LoadNoteRow);
}

// load_notes has no UPDATE RLS policy (050_load_notes.sql only added
// SELECT and staff-INSERT) -- a raw `.update()` here would silently affect
// 0 rows instead of erroring. mark_load_notes_read (054_mark_load_notes_
// read_rpc.sql) is the only sanctioned write path: a SECURITY DEFINER RPC
// that re-derives org_id from the caller's own profile row rather than
// trusting a client-supplied value.
export async function markLoadNotesRead(loadId: UUID): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.rpc("mark_load_notes_read", { p_load_id: loadId });

  if (error) {
    throw error;
  }
}

// Same lightweight-join style as getLoadIdsWithCompletedPod
// (lib/repositories/loads.ts): a standalone set-membership query merged at
// the page level, rather than a join added to listLoads()/LOAD_COLUMNS.
export async function getLoadIdsWithUnreadDriverNotes(): Promise<UUID[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("load_notes")
    .select("load_id")
    .eq("author_type", "driver")
    .eq("is_read", false);

  if (error) {
    throw error;
  }

  return Array.from(new Set((data ?? []).map((row) => row.load_id)));
}

// ---------------------------------------------------------------------
// Messages inbox (app/(dashboard)/messages/page.tsx)
//
// Scoping rule, applied as a WHERE clause in the query itself (never a
// client-side filter over an org-wide fetch): profiles.role = 'owner' sees
// every load's messages org-wide (loads_select_own_org /
// load_notes_select_own_org, both org-scoped, already cover that); any
// other role sees only loads.assigned_user_id = their own id
// (052_load_assigned_user.sql). This is a product-level narrowing on top
// of that org-wide RLS, not a replacement for it -- other pages (the Loads
// table, load detail) still need every load in the org regardless of who
// it's assigned to, so the policies themselves stay untouched.

interface MessagesScope {
  userId: UUID;
  role: string | null;
}

async function resolveMessagesScope(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<MessagesScope | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  return { userId: user.id, role: profile?.role ?? null };
}

// Load ids visible to a non-owner in the Messages inbox. Owners never call
// this -- they see every load in the org, which loads_select_own_org
// already guarantees without a narrower id list.
async function getAssignedLoadIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: UUID
): Promise<UUID[]> {
  const { data, error } = await supabase
    .from("loads")
    .select("id")
    .eq("assigned_user_id", userId);

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => row.id);
}

// Total count for the sidebar "Messages" badge -- same scoping rule as
// listMessageThreads, kept as its own query (rather than
// listMessageThreads().length) so the sidebar badge doesn't have to fetch
// and reduce every thread's note history on every dashboard page load.
export async function getUnreadStaffMessageCount(): Promise<number> {
  const supabase = await createClient();
  const scope = await resolveMessagesScope(supabase);
  if (!scope) {
    return 0;
  }

  let query = supabase
    .from("load_notes")
    .select("id", { count: "exact", head: true })
    .eq("author_type", "driver")
    .eq("is_read", false);

  if (scope.role !== "owner") {
    const loadIds = await getAssignedLoadIds(supabase, scope.userId);
    if (loadIds.length === 0) {
      return 0;
    }
    query = query.in("load_id", loadIds);
  }

  const { count, error } = await query;
  if (error) {
    throw error;
  }

  return count ?? 0;
}

export interface MessageThreadSummary {
  loadId: UUID;
  loadNumber: string | null;
  lastMessageText: string;
  lastMessageAuthorLabel: string;
  lastMessageAuthorType: LoadNoteAuthorType;
  lastMessageCreatedAt: string;
  isUnread: boolean;
}

// One row per load with at least one note, latest note first. The
// assigned_user_id WHERE clause (via getAssignedLoadIds, above) is applied
// server-side before any note is fetched -- a non-owner's query never
// touches another member's load_notes rows in the first place, it isn't
// fetched-then-discarded client-side.
export async function listMessageThreads(): Promise<MessageThreadSummary[]> {
  const supabase = await createClient();
  const scope = await resolveMessagesScope(supabase);
  if (!scope) {
    return [];
  }

  let loadsQuery = supabase.from("loads").select("id, load_number");
  if (scope.role !== "owner") {
    loadsQuery = loadsQuery.eq("assigned_user_id", scope.userId);
  }

  const { data: scopedLoads, error: loadsError } = await loadsQuery;
  if (loadsError) {
    throw loadsError;
  }
  if (!scopedLoads || scopedLoads.length === 0) {
    return [];
  }

  const loadNumberById = new Map(scopedLoads.map((row) => [row.id, row.load_number]));
  const loadIds = scopedLoads.map((row) => row.id);

  const { data: notes, error: notesError } = await supabase
    .from("load_notes")
    .select("load_id, author_type, author_label, note_text, is_read, created_at")
    .in("load_id", loadIds)
    .order("created_at", { ascending: false });

  if (notesError) {
    throw notesError;
  }

  const threadsByLoadId = new Map<UUID, MessageThreadSummary>();
  for (const note of notes ?? []) {
    const existing = threadsByLoadId.get(note.load_id);
    if (!existing) {
      // First row seen per load_id is its latest, thanks to the
      // created_at desc ordering above.
      threadsByLoadId.set(note.load_id, {
        loadId: note.load_id,
        loadNumber: loadNumberById.get(note.load_id) ?? null,
        lastMessageText: note.note_text,
        lastMessageAuthorLabel: note.author_label,
        lastMessageAuthorType: note.author_type as LoadNoteAuthorType,
        lastMessageCreatedAt: note.created_at,
        isUnread: note.author_type === "driver" && !note.is_read,
      });
    } else if (note.author_type === "driver" && !note.is_read) {
      // A load can have unread driver notes further back in its history
      // even when the latest note is a since-sent staff reply.
      existing.isUnread = true;
    }
  }

  return Array.from(threadsByLoadId.values()).sort(
    (a, b) => new Date(b.lastMessageCreatedAt).getTime() - new Date(a.lastMessageCreatedAt).getTime()
  );
}
