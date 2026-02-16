import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Trash2, Clock, Plus, Pencil, Check, X } from "lucide-react";
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

const SplitBillTitle = () => {
  const [title, setTitle] = useState("");
  const [savedBills, setSavedBills] = useState<{ title: string; createdAt: number }[]>([]);
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const listStr = localStorage.getItem("patungan_bill_list");
    if (listStr) {
      let list = JSON.parse(listStr);
      // Migration: convert string[] to object[]
      if (list.length > 0 && typeof list[0] === "string") {
        list = list.map((title: string) => ({ title, createdAt: Date.now() }));
        localStorage.setItem("patungan_bill_list", JSON.stringify(list));
      }
      setSavedBills(list);
    }
  }, []);

  const confirmDeleteBill = () => {
    if (!deleteTarget) return;
    localStorage.removeItem(`patungan_${deleteTarget}_billName`);
    localStorage.removeItem(`patungan_${deleteTarget}_totalBill`);
    localStorage.removeItem(`patungan_${deleteTarget}_persons`);
    localStorage.removeItem(`patungan_${deleteTarget}_enableService`);
    localStorage.removeItem(`patungan_${deleteTarget}_enableTax`);
    localStorage.removeItem(`patungan_${deleteTarget}_customService`);
    localStorage.removeItem(`patungan_${deleteTarget}_customTax`);

    const newList = savedBills.filter((b) => b.title !== deleteTarget);
    setSavedBills(newList);
    localStorage.setItem("patungan_bill_list", JSON.stringify(newList));
    toast.success(`"${deleteTarget}" berhasil dihapus`);
    setDeleteTarget(null);
  };

  const renameBill = (oldTitle: string) => {
    const newTitle = editValue.trim();
    if (!newTitle || newTitle === oldTitle) {
      setEditingTitle(null);
      return;
    }
    if (savedBills.some((b) => b.title === newTitle)) {
      toast.error(`Judul "${newTitle}" sudah ada!`);
      return;
    }

    // Migrate localStorage keys
    const keys = ["_billName", "_totalBill", "_persons", "_enableService", "_enableTax", "_customService", "_customTax"];
    keys.forEach((key) => {
      const val = localStorage.getItem(`patungan_${oldTitle}${key}`);
      if (val !== null) {
        localStorage.setItem(`patungan_${newTitle}${key}`, val);
        localStorage.removeItem(`patungan_${oldTitle}${key}`);
      }
    });
    // Also update the bill name value itself
    localStorage.setItem(`patungan_${newTitle}_billName`, newTitle);

    // Update bill list
    const newList = savedBills.map((b) => (b.title === oldTitle ? { ...b, title: newTitle } : b));
    setSavedBills(newList);
    localStorage.setItem("patungan_bill_list", JSON.stringify(newList));
    setEditingTitle(null);
    toast.success(`Judul diubah menjadi "${newTitle}"`);
  };

  const formatDate = (timestamp: number) => {
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(timestamp));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      navigate(`/split-bill?title=${encodeURIComponent(title.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center py-12 px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex h-9 w-9 items-center justify-center rounded-lg bg-card border border-border text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h2 className="text-2xl font-bold text-foreground">Split Bill</h2>
        </div>

        <div className="space-y-6">
          <section className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Buat Baru
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Judul Split Bill (misal: Nongkrong, dll)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-4 py-3 text-lg outline-none ring-ring focus:ring-2"
                autoFocus
              />
              <button type="submit" className="w-full rounded-lg bg-primary text-primary-foreground py-3 font-semibold text-lg transition-colors hover:opacity-90">
                Mulai Split Bill
              </button>
            </form>
          </section>

          {savedBills.length > 0 && (
            <section className="space-y-4 pt-4 border-t border-border">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Data Tersimpan
              </h3>
              <div className="grid gap-3">
                {savedBills
                  .sort((a, b) => b.createdAt - a.createdAt)
                  .map((bill) => (
                    <div key={bill.title} className="group flex items-center justify-between rounded-xl border border-border bg-card p-4 transition-all hover:shadow-md hover:border-primary/30">
                      {editingTitle === bill.title ? (
                        <div className="flex flex-1 items-center gap-2">
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && renameBill(bill.title)}
                            className="flex-1 rounded-lg border border-input bg-background px-3 py-1.5 text-sm outline-none ring-ring focus:ring-2"
                            autoFocus
                          />
                          <button onClick={() => renameBill(bill.title)} className="text-primary hover:text-primary/80 transition-colors">
                            <Check className="h-4 w-4" />
                          </button>
                          <button onClick={() => setEditingTitle(null)} className="text-muted-foreground hover:text-foreground transition-colors">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <button onClick={() => navigate(`/split-bill?title=${encodeURIComponent(bill.title)}`)} className="flex-1 text-left">
                            <p className="font-semibold text-foreground">{bill.title}</p>
                            <p className="text-xs text-muted-foreground">{formatDate(bill.createdAt)}</p>
                          </button>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => { setEditingTitle(bill.title); setEditValue(bill.title); }}
                              className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(bill.title)}
                              className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
              </div>
            </section>
          )}
        </div>
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="max-w-sm w-[calc(100%-2rem)] rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              Hapus Data?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Data untuk "{deleteTarget}" akan dihapus secara permanen. Tindakan ini tidak bisa dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-lg">Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteBill}
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

export default SplitBillTitle;

