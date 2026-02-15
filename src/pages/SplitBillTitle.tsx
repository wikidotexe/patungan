import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Trash2, Clock, Plus } from "lucide-react";
import { toast } from "sonner";

const SplitBillTitle = () => {
  const [title, setTitle] = useState("");
  const [savedBills, setSavedBills] = useState<{ title: string; createdAt: number }[]>([]);
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

  const deleteBill = (billTitle: string) => {
    if (confirm(`Hapus data untuk "${billTitle}"?`)) {
      // Clear data for this bill
      localStorage.removeItem(`patungan_${billTitle}_billName`);
      localStorage.removeItem(`patungan_${billTitle}_totalBill`);
      localStorage.removeItem(`patungan_${billTitle}_persons`);
      localStorage.removeItem(`patungan_${billTitle}_enableService`);
      localStorage.removeItem(`patungan_${billTitle}_enableTax`);
      localStorage.removeItem(`patungan_${billTitle}_customService`);
      localStorage.removeItem(`patungan_${billTitle}_customTax`);

      // Update list
      const newList = savedBills.filter((b) => b.title !== billTitle);
      setSavedBills(newList);
      localStorage.setItem("patungan_bill_list", JSON.stringify(newList));
      toast.success(`"${billTitle}" berhasil dihapus`);
    }
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
                      <button onClick={() => navigate(`/split-bill?title=${encodeURIComponent(bill.title)}`)} className="flex-1 text-left">
                        <p className="font-semibold text-foreground">{bill.title}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(bill.createdAt)}</p>
                      </button>
                      <button
                        onClick={() => deleteBill(bill.title)}
                        className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default SplitBillTitle;
