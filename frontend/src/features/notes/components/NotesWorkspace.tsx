"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { SearchBar } from "@/features/todo/components/SearchBar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  createNote,
  deleteNote,
  fetchNotes,
  fetchRevisions,
  restoreRevision,
  updateNote,
} from "../lib/api";
import { Note, NoteRevision } from "../types";

type ViewFilter = "active" | "archived" | "trashed";

const SAVE_DEBOUNCE_MS = 900;

const initialDraft = { title: "", body_md: "" };

export function NotesWorkspace() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [draft, setDraft] = useState<{ title: string; body_md: string }>(initialDraft);
  const [view, setView] = useState<ViewFilter>("active");
  const [pinnedOnly, setPinnedOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [revisions, setRevisions] = useState<NoteRevision[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  const selectedNote = useMemo(
    () => notes.find((note) => note.id === selectedId) || null,
    [notes, selectedId],
  );

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  useEffect(() => {
    if (selectedNote) {
      setDraft({
        title: selectedNote.title || "",
        body_md: selectedNote.body_md || "",
      });
      loadRevisions(selectedNote.id);
    } else {
      setDraft(initialDraft);
      setRevisions([]);
    }
  }, [selectedNote, loadRevisions]);

  // Autosave when draft changes
  useEffect(() => {
    if (!selectedNote) return;

    const hasChanges = draft.title !== (selectedNote.title || "") || draft.body_md !== (selectedNote.body_md || "");

    if (!hasChanges) return;

    const timer = setTimeout(() => {
      handleSaveDraft(selectedNote.id, draft);
    }, SAVE_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [draft, selectedNote]);

  const loadNotes = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetchNotes({
        q: search || undefined,
        pinned: pinnedOnly ? true : undefined,
        archived: view === "archived" ? true : undefined,
        trashed: view === "trashed" ? true : undefined,
      });
      setNotes(response.data);

      if (selectedId && !response.data.some((n) => n.id === selectedId)) {
        setSelectedId(response.data[0]?.id ?? null);
      } else if (!selectedId) {
        setSelectedId(response.data[0]?.id ?? null);
      }
    } catch {
      toast.error("ノート一覧の取得に失敗しました");
    } finally {
      setIsLoading(false);
    }
  }, [pinnedOnly, search, selectedId, view]);

  const loadRevisions = useCallback(async (noteId: number) => {
    try {
      const response = await fetchRevisions(noteId);
      setRevisions(response.data);
    } catch {
      setRevisions([]);
    }
  }, []);

  async function handleSaveDraft(id: number, payload: { title: string; body_md: string }) {
    setIsSaving(true);
    try {
      const updated = await updateNote(id, payload);
      setNotes((prev) => prev.map((note) => (note.id === id ? updated : note)));
      setLastSavedAt(new Date().toISOString());
    } catch {
      toast.error("保存に失敗しました");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCreateNote() {
    setIsSaving(true);
    try {
      const note = await createNote({ title: "新しいメモ", body_md: "" });
      setNotes((prev) => [note, ...prev]);
      setSelectedId(note.id);
      setLastSavedAt(note.updated_at);
      toast.success("新しいノートを作成しました");
    } catch {
      toast.error("ノートの作成に失敗しました");
    } finally {
      setIsSaving(false);
    }
  }

  async function handlePinToggle(note: Note) {
    try {
      const updated = await updateNote(note.id, { pinned: !note.pinned });
      setNotes((prev) => prev.map((n) => (n.id === note.id ? updated : n)));
      toast.success(updated.pinned ? "ピン留めしました" : "ピン留めを外しました");
      if (pinnedOnly && !updated.pinned) {
        loadNotes();
      }
    } catch {
      toast.error("ピン状態の更新に失敗しました");
    }
  }

  async function handleArchiveToggle(note: Note) {
    try {
      const updated = await updateNote(note.id, { archived: !note.archived_at });

      setNotes((prev) => {
        const mapped = prev.map((n) => (n.id === note.id ? updated : n));
        return mapped.filter((n) => {
          if (view === "active" && n.id === note.id && updated.archived_at) return false;
          if (view === "archived" && n.id === note.id && !updated.archived_at) return false;
          return true;
        });
      });

      if (view === "archived" && !updated.archived_at && selectedId === note.id) {
        setSelectedId(notes.find((n) => n.id !== note.id)?.id ?? null);
      }

      toast.success(updated.archived_at ? "アーカイブしました" : "アーカイブを解除しました");
    } catch {
      toast.error("アーカイブの更新に失敗しました");
    }
  }

  async function handleTrashToggle(note: Note) {
    try {
      const updated = await updateNote(note.id, { trashed: !note.trashed_at });
      setNotes((prev) => {
        const mapped = prev.map((n) => (n.id === note.id ? updated : n));
        if (view === "trashed") {
          return mapped.filter((n) => !(n.id === note.id && !updated.trashed_at));
        }
        return mapped.filter((n) => !(n.id === note.id && updated.trashed_at));
      });
      if (updated.trashed_at && selectedId === note.id) {
        setSelectedId(null);
      }
      toast.success(updated.trashed_at ? "ゴミ箱に移動しました" : "ゴミ箱から復元しました");
    } catch {
      toast.error("ゴミ箱への移動に失敗しました");
    }
  }

  async function handleDeleteForever(note: Note) {
    try {
      await deleteNote(note.id, true);
      setNotes((prev) => prev.filter((n) => n.id !== note.id));
      if (selectedId === note.id) {
        setSelectedId(null);
      }
      toast.success("ノートを完全に削除しました");
    } catch {
      toast.error("削除に失敗しました");
    }
  }

  async function handleRestoreRevision(revisionId: number) {
    if (!selectedNote) return;
    try {
      const restored = await restoreRevision(selectedNote.id, revisionId);
      setNotes((prev) => prev.map((n) => (n.id === restored.id ? restored : n)));
      setDraft({
        title: restored.title || "",
        body_md: restored.body_md || "",
      });
      loadRevisions(restored.id);
      toast.success("リビジョンを復元しました");
    } catch {
      toast.error("リビジョンの復元に失敗しました");
    }
  }

  const previewHtml = useMemo(() => {
    const text = draft.body_md || "";
    if (!text.trim()) return "<p class=\"text-muted-foreground\">何も入力されていません</p>";
    return renderMarkdown(text);
  }, [draft]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[320px,1fr] gap-6">
      <Card className="p-4 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold">ノート</p>
            <p className="text-xs text-muted-foreground">検索とフィルター</p>
          </div>
          <Button size="sm" onClick={handleCreateNote} disabled={isSaving}>
            新規作成
          </Button>
        </div>
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="ノートを検索..."
          debounceDelay={400}
        />
        <div className="flex flex-wrap gap-2">
          <FilterButton
            active={view === "active"}
            onClick={() => setView("active")}
          >
            アクティブ
          </FilterButton>
          <FilterButton
            active={view === "archived"}
            onClick={() => setView("archived")}
          >
            アーカイブ
          </FilterButton>
          <FilterButton
            active={view === "trashed"}
            onClick={() => setView("trashed")}
          >
            ゴミ箱
          </FilterButton>
          <FilterButton
            active={pinnedOnly}
            onClick={() => setPinnedOnly((v) => !v)}
          >
            ピンのみ
          </FilterButton>
        </div>
        <Separator />
        <div className="space-y-2 max-h-[65vh] overflow-y-auto pr-1">
          {isLoading && <p className="text-sm text-muted-foreground">読み込み中...</p>}
          {!isLoading && notes.length === 0 && (
            <p className="text-sm text-muted-foreground">ノートがありません</p>
          )}
          {notes.map((note) => (
            <button
              key={note.id}
              type="button"
              onClick={() => setSelectedId(note.id)}
              className={`w-full text-left rounded-md border px-3 py-2 transition ${
                selectedId === note.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-sm line-clamp-1">
                  {note.title || "無題のノート"}
                </span>
                <div className="flex gap-1">
                  {note.pinned && <Badge variant="secondary" className="text-[10px]">Pin</Badge>}
                  {note.archived_at && <Badge variant="outline" className="text-[10px]">Arch</Badge>}
                  {note.trashed_at && <Badge variant="destructive" className="text-[10px]">Trash</Badge>}
                </div>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {(note.body_md || "").slice(0, 120) || "本文なし"}
              </p>
              <p className="text-[11px] text-muted-foreground">
                更新:
                {" "}
                {new Date(note.updated_at).toLocaleString()}
              </p>
            </button>
          ))}
        </div>
      </Card>

      <Card className="p-4 space-y-4 min-h-[70vh]">
        {!selectedNote
          ? (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                左のリストからノートを選択するか、新規作成してください。
              </div>
            )
          : (
              <>
                <div className="flex items-center justify-between gap-2">
                  <Input
                    value={draft.title}
                    onChange={(e) => setDraft((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="タイトル"
                    className="font-semibold text-lg"
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePinToggle(selectedNote)}
                    >
                      {selectedNote.pinned ? "ピン解除" : "ピン留め"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleArchiveToggle(selectedNote)}
                    >
                      {selectedNote.archived_at ? "アーカイブ解除" : "アーカイブ"}
                    </Button>
                    <Button
                      variant={selectedNote.trashed_at ? "default" : "destructive"}
                      size="sm"
                      onClick={() => handleTrashToggle(selectedNote)}
                    >
                      {selectedNote.trashed_at ? "復元" : "ゴミ箱へ"}
                    </Button>
                    {selectedNote.trashed_at && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteForever(selectedNote)}
                      >
                        完全削除
                      </Button>
                    )}
                  </div>
                </div>

                <Textarea
                  value={draft.body_md}
                  onChange={(e) => setDraft((prev) => ({ ...prev, body_md: e.target.value }))}
                  placeholder="Markdownでメモを書いてください"
                  className="min-h-[220px] font-mono text-sm"
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {isSaving
                      ? "保存中..."
                      : lastSavedAt
                        ? `保存済み: ${new Date(lastSavedAt).toLocaleTimeString()}`
                        : "自動保存が有効です"}
                  </span>
                  <span>
                    リビジョン:
                    {" "}
                    {revisions.length}
                    件
                  </span>
                </div>

                <Separator />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-semibold">プレビュー</p>
                    <div
                      className="rounded border bg-muted/30 p-3 prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: previewHtml }}
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold">リビジョン</p>
                    <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
                      {revisions.length === 0 && (
                        <p className="text-xs text-muted-foreground">リビジョンがありません</p>
                      )}
                      {revisions.map((rev) => (
                        <div
                          key={rev.id}
                          className="rounded border p-2 text-xs flex items-center justify-between gap-2"
                        >
                          <div>
                            <p className="font-semibold line-clamp-1">{rev.title || "無題"}</p>
                            <p className="text-muted-foreground">
                              {new Date(rev.created_at).toLocaleString()}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRestoreRevision(rev.id)}
                          >
                            復元
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
      </Card>
    </div>
  );
}

function FilterButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <Button
      variant={active ? "default" : "outline"}
      size="sm"
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

function renderMarkdown(markdown: string): string {
  const escaped = markdown
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const withBlocks = escaped
    .replace(/^### (.*)$/gm, "<h3>$1</h3>")
    .replace(/^## (.*)$/gm, "<h2>$1</h2>")
    .replace(/^# (.*)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/(^|\n)- (.*)/g, "$1• $2")
    .replace(/\n{2,}/g, "</p><p>");

  return `<p>${withBlocks.replace(/\n/g, "<br />")}</p>`;
}
