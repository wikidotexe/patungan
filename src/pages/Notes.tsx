import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, StickyNote, Pencil, Check, X, ArrowUp, ArrowDown, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Footer from "@/components/Footer";
import {
    loadNotesFromSupabase,
    saveNoteToSupabase,
    deleteNoteFromSupabase,
    updateNotesOrderInSupabase,
} from "@/lib/supabase";
import { getStoredUser } from "@/lib/userStore";

interface Note {
    id: string;       // note_id (UUID string)
    title: string;
    content: string;
    createdAt: number;
    updatedAt: number;
    sortOrder: number;
}

const genId = () => crypto.randomUUID();

const formatDate = (ts: number) =>
    new Date(ts).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

const Notes = () => {
    const userEmail = getStoredUser()?.email ?? "";
    const [notes, setNotes] = useState<Note[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [newTitle, setNewTitle] = useState("");
    const [newContent, setNewContent] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState("");
    const [editContent, setEditContent] = useState("");
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
    const [isAdding, setIsAdding] = useState(false);

    // Load notes from Supabase on mount
    useEffect(() => {
        const load = async () => {
            const rows = await loadNotesFromSupabase(userEmail);
            const mapped: Note[] = rows.map((r) => ({
                id: r.note_id,
                title: r.title,
                content: r.content,
                createdAt: new Date(r.created_at).getTime(),
                updatedAt: new Date(r.updated_at).getTime(),
                sortOrder: r.sort_order,
            }));
            setNotes(mapped);
            setIsLoading(false);
        };
        load();
    }, []);

    const addNote = async () => {
        const title = newTitle.trim();
        const content = newContent.trim();
        if (!title && !content) {
            toast.error("Isi judul atau catatan terlebih dahulu!");
            return;
        }
        const now = Date.now();
        const note: Note = {
            id: genId(),
            title: title || "Tanpa Judul",
            content,
            createdAt: now,
            updatedAt: now,
            sortOrder: 0,
        };

        // Shift existing notes down
        const updatedNotes = [note, ...notes.map((n, i) => ({ ...n, sortOrder: i + 1 }))];
        setNotes(updatedNotes);
        setNewTitle("");
        setNewContent("");
        setIsAdding(false);
        toast.success("Catatan ditambahkan!");

        // Save to Supabase (new note + update sort orders)
        await saveNoteToSupabase({ note_id: note.id, title: note.title, content: note.content, sort_order: 0, user_email: userEmail });
        await updateNotesOrderInSupabase(
            updatedNotes.slice(1).map((n) => ({ note_id: n.id, sort_order: n.sortOrder }))
        );
    };

    const saveEdit = async () => {
        if (!editingId) return;
        const title = editTitle.trim();
        const content = editContent.trim();
        if (!title && !content) {
            toast.error("Catatan tidak boleh kosong!");
            return;
        }
        const now = Date.now();
        const updatedNote = notes.find((n) => n.id === editingId);
        if (!updatedNote) return;

        setNotes((prev) =>
            prev.map((n) =>
                n.id === editingId
                    ? { ...n, title: title || "Tanpa Judul", content, updatedAt: now }
                    : n
            )
        );
        setEditingId(null);
        toast.success("Catatan diperbarui!");

        await saveNoteToSupabase({
            note_id: editingId,
            title: title || "Tanpa Judul",
            content,
            sort_order: updatedNote.sortOrder,
            user_email: userEmail,
        });
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        setNotes((prev) => prev.filter((n) => n.id !== deleteTarget));
        setDeleteTarget(null);
        toast.success("Catatan dihapus!");

        await deleteNoteFromSupabase(deleteTarget);
    };

    const startEdit = (note: Note) => {
        setEditingId(note.id);
        setEditTitle(note.title);
        setEditContent(note.content);
    };

    const moveNote = async (index: number, direction: "up" | "down") => {
        const target = direction === "up" ? index - 1 : index + 1;
        if (target < 0 || target >= notes.length) return;

        const reordered = [...notes];
        [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
        const withOrder = reordered.map((n, i) => ({ ...n, sortOrder: i }));
        setNotes(withOrder);

        await updateNotesOrderInSupabase(withOrder.map((n) => ({ note_id: n.id, sort_order: n.sortOrder })));
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <div className="w-full max-w-md mx-auto flex-1 px-4 py-6 md:px-0 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link to="/" className="flex h-9 w-9 items-center justify-center rounded-lg bg-card border border-border text-muted-foreground hover:text-foreground transition-colors">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                        <h1 className="text-xl font-bold text-foreground">Catatan</h1>
                    </div>
                    <button
                        onClick={() => { setIsAdding(!isAdding); setNewTitle(""); setNewContent(""); }}
                        className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-colors"
                    >
                        {isAdding ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    </button>
                </div>

                {/* Add Note Form */}
                <AnimatePresence>
                    {isAdding && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2, ease: "easeInOut" }}
                            className="overflow-hidden"
                        >
                            <div className="rounded-xl border border-primary/30 bg-card p-4 space-y-3">
                                <input
                                    type="text"
                                    placeholder="Judul catatan..."
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-semibold outline-none ring-ring focus:ring-2"
                                />
                                <textarea
                                    placeholder="Tulis catatan di sini..."
                                    value={newContent}
                                    onChange={(e) => setNewContent(e.target.value)}
                                    rows={4}
                                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2 resize-none"
                                />
                                <button
                                    onClick={addNote}
                                    className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-colors"
                                >
                                    Simpan Catatan
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Loading State */}
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Memuat catatan...</p>
                    </div>
                ) : notes.length === 0 && !isAdding ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 space-y-3">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                            <StickyNote className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <p className="text-muted-foreground text-sm">Belum ada catatan</p>
                        <p className="text-muted-foreground text-xs">Klik + untuk menambahkan catatan baru</p>
                    </motion.div>
                ) : (
                    <div className="space-y-3">
                        <AnimatePresence>
                            {notes.map((note, i) => (
                                <motion.div
                                    key={note.id}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: -50 }}
                                    transition={{ delay: i * 0.03 }}
                                    layout
                                    className="rounded-xl border border-border bg-card p-4 space-y-2"
                                >
                                    {editingId === note.id ? (
                                        /* Edit Mode */
                                        <div className="space-y-3">
                                            <input
                                                type="text"
                                                value={editTitle}
                                                onChange={(e) => setEditTitle(e.target.value)}
                                                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-semibold outline-none ring-ring focus:ring-2"
                                                autoFocus
                                            />
                                            <textarea
                                                value={editContent}
                                                onChange={(e) => setEditContent(e.target.value)}
                                                rows={4}
                                                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2 resize-none"
                                            />
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={saveEdit}
                                                    className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-colors"
                                                >
                                                    <Check className="h-4 w-4" />
                                                    Simpan
                                                </button>
                                                <button
                                                    onClick={() => setEditingId(null)}
                                                    className="flex items-center justify-center rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                                                >
                                                    Batal
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        /* View Mode */
                                        <>
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-semibold text-foreground truncate">{note.title}</h3>
                                                    <p className="text-xs text-muted-foreground mt-0.5">{formatDate(note.updatedAt)}</p>
                                                </div>
                                                <div className="flex items-center gap-0.5 shrink-0">
                                                    <button
                                                        onClick={() => moveNote(i, "up")}
                                                        disabled={i === 0}
                                                        className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-30 disabled:pointer-events-none"
                                                    >
                                                        <ArrowUp className="h-3.5 w-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => moveNote(i, "down")}
                                                        disabled={i === notes.length - 1}
                                                        className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-30 disabled:pointer-events-none"
                                                    >
                                                        <ArrowDown className="h-3.5 w-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => startEdit(note)}
                                                        className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                                                    >
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteTarget(note.id)}
                                                        className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                            {note.content && (
                                                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                                                    {note.content}
                                                </p>
                                            )}
                                        </>
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
            <Footer />

            {/* Delete Confirmation */}
            <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <AlertDialogContent className="max-w-sm w-[calc(100%-2rem)] rounded-xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <Trash2 className="h-5 w-5 text-destructive" />
                            Hapus Catatan?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Catatan ini akan dihapus secara permanen. Tindakan ini tidak bisa dibatalkan.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-lg">Batal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Hapus
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default Notes;
