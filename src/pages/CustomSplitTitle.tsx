import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Trash2, Clock, Plus, Pencil, Check, X, Search } from "lucide-react";
import { toast } from "sonner";
import { getAllCustomBillsFromSupabase, deleteCustomBillFromSupabase } from "@/lib/supabase";
import { getStoredUser } from "@/lib/userStore";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const CustomSplitTitle = () => {
  const [title, setTitle] = useState("");
  const [savedBills, setSavedBills] = useState<{ title: string; created_at: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const userEmail = getStoredUser()?.email ?? "";

  useEffect(() => {
    const loadBills = async () => {
      const bills = await getAllCustomBillsFromSupabase(userEmail);
      setSavedBills(bills);
      setIsLoading(false);
    };
    loadBills();
  }, []);

  const confirmDeleteBill = async () => {
    if (!deleteTarget) return;

    const success = await deleteCustomBillFromSupabase(deleteTarget, userEmail);
    if (success) {
      const newList = savedBills.filter((b) => b.title !== deleteTarget);
      setSavedBills(newList);
      toast.success(`"${deleteTarget}" berhasil dihapus`);
    } else {
      toast.error(`Gagal menghapus "${deleteTarget}"`);
    }
    setDeleteTarget(null);
  };

  const renameBill = (oldTitle: string) => {
    toast.info("Rename belum tersedia. Silakan hapus dan buat baru dengan judul yang diinginkan.");
    setEditingTitle(null);
  };

  const formatDate = (timestamp: string) => {
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(timestamp));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      navigate(`/custom-split?title=${encodeURIComponent(title)}`);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center py-3 px-2.5 sm:py-12 sm:px-4">
      <div className="w-full max-w-md space-y-4 sm:space-y-8">
        <div className="flex items-center gap-2 sm:gap-3">
          <Link to="/" className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-card border border-border text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Link>
          <h2 className="text-lg sm:text-2xl font-bold text-foreground">Custom Split Bill</h2>
        </div>

        <div className="space-y-4 sm:space-y-6">
          <section className="space-y-2.5 sm:space-y-4">
            <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 sm:gap-2">
              <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Buat Baru
            </h3>
            <form onSubmit={handleSubmit} className="space-y-2.5 sm:space-y-4">
              <input
                type="text"
                placeholder="Judul Split Bill (misal: Nongkrong, dll)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm sm:px-4 sm:py-3 sm:text-lg outline-none ring-ring focus:ring-2"
                autoFocus
              />
              <button type="submit" className="w-full rounded-lg bg-primary text-primary-foreground py-2.5 sm:py-3 font-semibold text-sm sm:text-lg transition-colors hover:opacity-90">
                Mulai Custom Split
              </button>
            </form>
          </section>

          {savedBills.length > 0 && (
            <section className="space-y-2.5 sm:space-y-4 pt-3 sm:pt-4 border-t border-border">
              <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 sm:gap-2">
                <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Data Tersimpan
              </h3>
              <div className="relative">
                <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  placeholder="Cari judul..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background pl-8 sm:pl-9 pr-8 sm:pr-9 py-1.5 sm:py-2.5 text-xs sm:text-sm outline-none ring-ring focus:ring-2"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    aria-label="Bersihkan pencarian"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              {(() => {
                const filtered = savedBills.filter((b) => b.title.toLowerCase().includes(searchQuery.trim().toLowerCase())).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

                if (filtered.length === 0) {
                  return <p className="text-xs text-muted-foreground text-center py-6">Tidak ada data yang cocok dengan "{searchQuery}"</p>;
                }

                return (
                  <div className="grid gap-2 sm:gap-3">
                    {filtered.map((bill) => (
                      <div key={bill.title} className="group flex items-center justify-between rounded-xl border border-border bg-card p-2.5 sm:p-4 transition-all hover:shadow-md hover:border-primary/30">
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
                            <button onClick={() => navigate(`/custom-split?title=${encodeURIComponent(bill.title)}`)} className="flex-1 text-left min-w-0">
                              <p className="font-semibold text-foreground text-sm sm:text-base truncate">{bill.title}</p>
                              <p className="text-[10px] sm:text-xs text-muted-foreground">{formatDate(bill.created_at)}</p>
                            </button>
                            <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => {
                                  setEditingTitle(bill.title);
                                  setEditValue(bill.title);
                                }}
                                className="h-7 w-7 sm:h-8 sm:w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                                disabled
                              >
                                <Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              </button>
                              <button
                                onClick={() => setDeleteTarget(bill.title)}
                                className="h-7 w-7 sm:h-8 sm:w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                              >
                                <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })()}
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
            <AlertDialogDescription>Data untuk "{deleteTarget}" akan dihapus secara permanen. Tindakan ini tidak bisa dibatalkan.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-lg">Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteBill} className="rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CustomSplitTitle;
