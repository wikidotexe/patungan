import { useState, useMemo, useEffect } from "react";
import { Person, formatRupiah, TAX_RATE, SERVICE_CHARGE_RATE } from "@/lib/bill";
import { PeopleSection } from "@/components/PeopleSection";
import { ArrowLeft, CheckCircle2, Share2, Copy, Trash2, MessageCircle } from "lucide-react";
import { loadBillFromSupabase, saveBillToSupabase, deleteBillFromSupabase } from "@/lib/supabase";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import Footer from "@/components/Footer";
import { getStoredUser } from "@/lib/userStore";

let nextId = 1;
const genId = () => String(nextId++);

const SplitBill = () => {
  const isMobile = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(max-width: 768px)").matches;

  const shareToWhatsApp = () => {
    if (persons.length === 0 || calculation.base === 0) {
      toast.error("Data kosong! Tambahkan data terlebih dahulu.");
      return;
    }
    const lines = [
      `🧾 Split Bill`,
      billName ? `Judul: ${billName}` : undefined,
      `Total: ${formatRupiah(calculation.total)}`,
      "----------------------------------",
      "",
      ...persons.map((p) => `• ${p.name}: ${formatRupiah(calculation.perPerson)}`),
      "",
      "----------------------------------",
      "Patungan by Nexteam",
    ];
    const text = lines.filter((l) => l !== undefined).join("\n");
    if (navigator.share) {
      navigator.share({ text });
    } else {
      const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
      window.open(url, "_blank");
    }
  };
  // Helper to get title from URL immediately
  const getTitleFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get("title") || "";
  };

  const initialTitle = getTitleFromUrl();
  const userEmail = getStoredUser()?.email ?? "";
  const [isLoading, setIsLoading] = useState(true);
  const [billName, setBillName] = useState("");
  const [totalBill, setTotalBill] = useState("");
  const [persons, setPersons] = useState<Person[]>([]);
  const [enableService, setEnableService] = useState(true);
  const [enableTax, setEnableTax] = useState(true);
  const [customService, setCustomService] = useState("");
  const [customTax, setCustomTax] = useState("");

  // Load data from Supabase on mount
  useEffect(() => {
    if (!initialTitle) {
      setIsLoading(false);
      return;
    }

    const loadData = async () => {
      const result = await loadBillFromSupabase(initialTitle, userEmail);
      if (result) {
        const { bill, people } = result;
        setBillName(bill.bill_name || initialTitle);
        setTotalBill(bill.total_bill?.toString() || "");
        setPersons(
          people.map((p) => ({
            id: p.person_id,
            name: p.person_name,
          })),
        );
        setEnableService(bill.enable_service);
        setEnableTax(bill.enable_tax);
        setCustomService(bill.custom_service || "");
        setCustomTax(bill.custom_tax || "");
      } else {
      }
      setIsLoading(false);
    };

    loadData();
  }, [initialTitle]);

  // Persistence to Supabase
  useEffect(() => {
    if (!initialTitle || isLoading) return;

    const saveData = async () => {
      const success = await saveBillToSupabase(initialTitle, billName, totalBill, persons, enableService, enableTax, customService, customTax, userEmail);
      if (!success) {
        console.error("❌ Failed to save bill data!");
        toast.error("Gagal menyimpan data");
      }
    };

    // Debounce saving to avoid too many requests
    const timeoutId = setTimeout(() => {
      saveData();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [billName, totalBill, persons, enableService, enableTax, customService, customTax, initialTitle, isLoading]);

  const addPerson = (name: string) => {
    setPersons((prev) => [...prev, { id: genId(), name }]);
  };

  const removePerson = (id: string) => {
    setPersons((prev) => prev.filter((p) => p.id !== id));
  };

  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  const resetData = async () => {
    setBillName(initialTitle);
    setTotalBill("");
    setPersons([]);
    setEnableService(true);
    setEnableTax(true);
    setCustomService("");
    setCustomTax("");

    await deleteBillFromSupabase(initialTitle, userEmail);
    toast.info("Data dibersihkan");
    setResetConfirmOpen(false);
  };

  const calculation = useMemo(() => {
    const base = parseFloat(totalBill) || 0;
    let service = 0;
    let tax = 0;
    if (enableService) {
      if (customService && !isNaN(Number(customService))) {
        service = Number(customService);
      } else {
        service = base * SERVICE_CHARGE_RATE;
      }
    }
    if (enableTax) {
      if (customTax && !isNaN(Number(customTax))) {
        tax = Number(customTax);
      } else {
        tax = (base + service) * TAX_RATE;
      }
    }
    const total = base + service + tax;
    const perPerson = persons.length > 0 ? total / persons.length : 0;
    return { base, service, tax, total, perPerson };
  }, [totalBill, persons.length, enableService, enableTax, customService, customTax]);

  const copyPerson = (name: string, amount: number) => {
    navigator.clipboard.writeText(`${name}: ${formatRupiah(amount)}`);
    toast.success("Disalin ke clipboard!");
  };

  const copyAll = () => {
    const lines = [
      `🧾 Split Bill`,
      billName ? `Judul: ${billName}` : undefined,
      `Total: ${formatRupiah(calculation.total)}`,
      "----------------------------------",
      "",
      ...persons.map((p) => `• ${p.name}: ${formatRupiah(calculation.perPerson)}`),
      "",
      "----------------------------------",
      "Patungan by Nexteam",
    ];
    navigator.clipboard.writeText(lines.filter((l) => l !== undefined).join("\n"));
    toast.success("Ringkasan disalin!");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-xl px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex h-9 w-9 items-center justify-center rounded-lg bg-card border border-border text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-xl font-bold text-foreground">Split Bill</h1>
          </div>
          <button onClick={() => setResetConfirmOpen(true)} className="flex h-9 w-9 items-center justify-center rounded-lg bg-card border border-border text-muted-foreground hover:text-destructive transition-colors" title="Hapus Data">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        {/* Bill Info */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nama Tagihan</label>
            <input
              type="text"
              placeholder="Contoh: Makan Siang"
              value={billName}
              onChange={(e) => setBillName(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Tagihan</label>
            <div className="flex items-center gap-2 rounded-lg border border-input bg-background px-3 py-2.5">
              <span className="text-sm font-medium text-muted-foreground">Rp</span>
              <input type="number" placeholder="400.000" value={totalBill} onChange={(e) => setTotalBill(e.target.value)} className="flex-1 bg-transparent text-lg font-bold text-foreground outline-none" />
            </div>
            {calculation.base > 0 && <p className="text-xs text-muted-foreground">{formatRupiah(calculation.base)}</p>}
          </div>
        </div>

        {/* People */}
        <div className="rounded-xl border border-border bg-card p-4">
          <PeopleSection persons={persons} onAdd={addPerson} onRemove={removePerson} />
        </div>

        {/* Tax & Service */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pajak & Service</h2>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">Service Charge {SERVICE_CHARGE_RATE * 100}%</p>
              <p className="text-xs text-muted-foreground">{enableService ? (customService ? `custom: ${formatRupiah(Number(customService))}` : formatRupiah(calculation.service)) : formatRupiah(0)}</p>
            </div>
            <div className="flex items-center gap-2">
              {enableService && (
                <input
                  type="number"
                  min="0"
                  placeholder="Rp Custom"
                  value={customService}
                  onChange={(e) => setCustomService(e.target.value)}
                  className="w-24 rounded-lg border border-input bg-background px-2 py-1 text-xs outline-none ring-ring focus:ring-2"
                />
              )}
              <button onClick={() => setEnableService(!enableService)} className={`relative h-6 w-11 rounded-full transition-colors ${enableService ? "bg-primary" : "bg-muted"}`}>
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-primary-foreground shadow transition-transform ${enableService ? "left-[22px]" : "left-0.5"}`} />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">PB1 / Pajak {TAX_RATE * 100}%</p>
              <p className="text-xs text-muted-foreground">{enableTax ? (customTax ? `custom: ${formatRupiah(Number(customTax))}` : formatRupiah(calculation.tax)) : formatRupiah(0)}</p>
            </div>
            <div className="flex items-center gap-2">
              {enableTax && (
                <input
                  type="number"
                  min="0"
                  placeholder="Rp Custom"
                  value={customTax}
                  onChange={(e) => setCustomTax(e.target.value)}
                  className="w-24 rounded-lg border border-input bg-background px-2 py-1 text-xs outline-none ring-ring focus:ring-2"
                />
              )}
              <button onClick={() => setEnableTax(!enableTax)} className={`relative h-6 w-11 rounded-full transition-colors ${enableTax ? "bg-primary" : "bg-muted"}`}>
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-primary-foreground shadow transition-transform ${enableTax ? "left-[22px]" : "left-0.5"}`} />
              </button>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground italic mt-1 font-medium">* Pajak dan service, di bagi rata ke semua teman</p>
          <div className="border-t border-border pt-3 flex justify-between items-center">
            <span className="font-semibold text-foreground">Total</span>
            <span className="text-lg font-bold text-primary">{formatRupiah(calculation.total)}</span>
          </div>
        </div>

        {/* Results */}
        {persons.length > 0 && calculation.base > 0 && (
          <div className="rounded-xl border border-border bg-card p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <h2 className="font-bold text-foreground">Hasil Split</h2>
              </div>
              <div className="flex gap-2">
                <button onClick={copyAll} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <Share2 className="h-4 w-4" />
                  Salin Semua
                </button>
                {isMobile && (
                  <button onClick={shareToWhatsApp} className="flex items-center gap-1.5 text-sm text-green-600 hover:text-green-700 transition-colors" title="Share ke WhatsApp">
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp
                  </button>
                )}
              </div>
            </div>

            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="rounded-xl bg-foreground p-5 text-center">
              <p className="text-sm text-muted">Per Teman</p>
              <p className="text-3xl font-bold text-background">{formatRupiah(calculation.perPerson)}</p>
            </motion.div>

            <div className="space-y-2">
              {persons.map((p, i) => (
                <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="flex items-center justify-between rounded-xl bg-background border border-border px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-sm font-bold text-muted-foreground">{p.name.charAt(0).toUpperCase()}</div>
                    <span className="font-semibold text-foreground">{p.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground">{formatRupiah(calculation.perPerson)}</span>
                    <button onClick={() => copyPerson(p.name, calculation.perPerson)} className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground transition-colors">
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
      <Footer />

      <AlertDialog open={resetConfirmOpen} onOpenChange={setResetConfirmOpen}>
        <AlertDialogContent className="max-w-sm w-[calc(100%-2rem)] rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              Hapus Semua Data?
            </AlertDialogTitle>
            <AlertDialogDescription>Semua data input untuk bill ini akan dihapus. Tindakan ini tidak bisa dibatalkan.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-lg">Batal</AlertDialogCancel>
            <AlertDialogAction onClick={resetData} className="rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SplitBill;
