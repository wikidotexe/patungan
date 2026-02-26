import { useState, useMemo, useEffect, useRef } from "react";
import { Person, formatRupiah, TAX_RATE, SERVICE_CHARGE_RATE } from "@/lib/bill";
import { PeopleSection } from "@/components/PeopleSection";
import { ArrowLeft, CheckCircle2, Share2, Copy, Trash2, MessageCircle, Plus, X } from "lucide-react";
import { loadBillFromSupabase, saveBillToSupabase, deleteBillFromSupabase } from "@/lib/supabase";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import Footer from "@/components/Footer";
import { getStoredUser } from "@/lib/userStore";
import { localDraft } from "@/lib/localDraft";

const genId = () => crypto.randomUUID();

interface BillItem { id: string; name: string; price: number; }

const SplitBill = () => {
  const isMobile = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(max-width: 768px)").matches;

  const getTitleFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get("title") || "";
  };

  const initialTitle = getTitleFromUrl();
  const userEmail = getStoredUser()?.email ?? "";
  const draftKey = `bill_${userEmail}_${initialTitle}`;

  const [isLoading, setIsLoading] = useState(true);
  const [billName, setBillName] = useState("");
  const [persons, setPersons] = useState<Person[]>([]);
  const [enableService, setEnableService] = useState(true);
  const [enableTax, setEnableTax] = useState(true);
  const [customService, setCustomService] = useState("");
  const [customTax, setCustomTax] = useState("");

  // Items state
  const [items, setItems] = useState<BillItem[]>([]);
  const [newItemName, setNewItemName] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const itemNameRef = useRef<HTMLInputElement>(null);

  const itemsTotal = items.reduce((s, i) => s + i.price, 0);
  const totalBill = String(itemsTotal);

  // Load from Supabase, fallback to localStorage
  useEffect(() => {
    if (!initialTitle) { setIsLoading(false); return; }
    const loadData = async () => {
      const result = await loadBillFromSupabase(initialTitle, userEmail);
      if (result) {
        const { bill, people } = result;
        setBillName(bill.bill_name || initialTitle);
        setPersons(people.map((p) => ({ id: p.person_id, name: p.person_name })));
        setEnableService(bill.enable_service);
        setEnableTax(bill.enable_tax);
        setCustomService(bill.custom_service || "");
        setCustomTax(bill.custom_tax || "");
        try {
          const parsed = bill.items_json ? JSON.parse(bill.items_json) : [];
          setItems(Array.isArray(parsed) ? parsed : []);
        } catch { setItems([]); }
      } else {
        const draft = localDraft.get<{
          billName: string; items: BillItem[];
          persons: Person[]; enableService: boolean; enableTax: boolean;
          customService: string; customTax: string;
        }>(draftKey);
        if (draft) {
          setBillName(draft.billName);
          setItems(draft.items || []);
          setPersons(draft.persons);
          setEnableService(draft.enableService);
          setEnableTax(draft.enableTax);
          setCustomService(draft.customService);
          setCustomTax(draft.customTax);
        }
      }
      setIsLoading(false);
    };
    loadData();
  }, [initialTitle]);

  // Save to localStorage draft immediately
  useEffect(() => {
    if (!initialTitle || isLoading) return;
    localDraft.set(draftKey, { billName, items, persons, enableService, enableTax, customService, customTax });
  }, [billName, items, persons, enableService, enableTax, customService, customTax, initialTitle, isLoading]);

  // Sync to Supabase (debounced, fire-and-forget)
  useEffect(() => {
    if (!initialTitle || isLoading) return;
    const timeoutId = setTimeout(() => {
      saveBillToSupabase(initialTitle, billName, totalBill, persons, enableService, enableTax, customService, customTax, userEmail, items);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [billName, items, persons, enableService, enableTax, customService, customTax, initialTitle, isLoading]);

  const addItem = () => {
    const name = newItemName.trim();
    const price = parseFloat(newItemPrice);
    if (!name) { toast.error("Isi nama item"); return; }
    if (!price || price <= 0) { toast.error("Isi harga yang valid"); return; }
    setItems((prev) => [...prev, { id: genId(), name, price }]);
    setNewItemName("");
    setNewItemPrice("");
    itemNameRef.current?.focus();
  };

  const removeItem = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));

  const addPerson = (name: string) => setPersons((prev) => [...prev, { id: genId(), name }]);
  const removePerson = (id: string) => setPersons((prev) => prev.filter((p) => p.id !== id));

  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const resetData = async () => {
    setBillName(initialTitle);

    setItems([]);
    setPersons([]);
    setEnableService(true);
    setEnableTax(true);
    setCustomService("");
    setCustomTax("");
    localDraft.remove(draftKey);
    await deleteBillFromSupabase(initialTitle, userEmail);
    toast.info("Data dibersihkan");
    setResetConfirmOpen(false);
  };

  const calculation = useMemo(() => {
    const base = parseFloat(totalBill) || 0;
    let service = 0;
    let tax = 0;
    if (enableService) {
      service = customService && !isNaN(Number(customService)) ? Number(customService) : base * SERVICE_CHARGE_RATE;
    }
    if (enableTax) {
      tax = customTax && !isNaN(Number(customTax)) ? Number(customTax) : (base + service) * TAX_RATE;
    }
    const total = base + service + tax;
    const perPerson = persons.length > 0 ? total / persons.length : 0;
    return { base, service, tax, total, perPerson };
  }, [totalBill, persons.length, enableService, enableTax, customService, customTax]);

  const copyPerson = (name: string, amount: number) => {
    navigator.clipboard.writeText(`${name}: ${formatRupiah(amount)}`);
    toast.success("Disalin ke clipboard!");
  };

  const shareToWhatsApp = () => {
    if (persons.length === 0 || calculation.base === 0) {
      toast.error("Data kosong! Tambahkan data terlebih dahulu."); return;
    }
    const lines = [
      `🧾 Split Bill`,
      billName ? `Judul: ${billName}` : undefined,
      items.length > 0 ? `\nItem:` : undefined,
      ...items.map((it) => `  • ${it.name}: ${formatRupiah(it.price)}`),
      `\nTotal: ${formatRupiah(calculation.total)}`,
      "----------------------------------",
      "",
      ...persons.map((p) => `• ${p.name}: ${formatRupiah(calculation.perPerson)}`),
      "",
      "----------------------------------",
      "Patungan by Nexteam",
    ];
    const text = lines.filter((l) => l !== undefined).join("\n");
    if (navigator.share) { navigator.share({ text }); }
    else { window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank"); }
  };

  const copyAll = () => {
    const lines = [
      `🧾 Split Bill`,
      billName ? `Judul: ${billName}` : undefined,
      items.length > 0 ? `\nItem:` : undefined,
      ...items.map((it) => `  • ${it.name}: ${formatRupiah(it.price)}`),
      `\nTotal: ${formatRupiah(calculation.total)}`,
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
        {/* Header */}
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

          {/* Items section */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Item / Menu {items.length > 0 && <span className="text-primary">({items.length})</span>}
            </label>

            {/* Item list */}
            <AnimatePresence initial={false}>
              {items.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2"
                >
                  <span className="text-sm text-foreground flex-1 truncate">{item.name}</span>
                  <span className="text-sm font-semibold text-primary mr-2">{formatRupiah(item.price)}</span>
                  <button onClick={() => removeItem(item.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Add item row */}
            <div className="flex gap-2">
              <input
                ref={itemNameRef}
                type="text"
                placeholder="Nama item..."
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addItem()}
                className="flex-1 min-w-0 rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2"
              />
              <input
                type="number"
                placeholder="Harga"
                value={newItemPrice}
                onChange={(e) => setNewItemPrice(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addItem()}
                className="w-28 rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2"
              />
              <button
                onClick={addItem}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Subtotal from items */}
          {items.length > 0 && (
            <div className="flex justify-between items-center border-t border-border pt-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Subtotal</span>
              <span className="text-base font-bold text-foreground">{formatRupiah(itemsTotal)}</span>
            </div>
          )}
          {items.length === 0 && (
            <p className="text-xs text-muted-foreground">Tambahkan item untuk menghitung total otomatis</p>
          )}
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
                <input type="number" min="0" placeholder="Rp Custom" value={customService} onChange={(e) => setCustomService(e.target.value)}
                  className="w-24 rounded-lg border border-input bg-background px-2 py-1 text-xs outline-none ring-ring focus:ring-2" />
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
                <input type="number" min="0" placeholder="Rp Custom" value={customTax} onChange={(e) => setCustomTax(e.target.value)}
                  className="w-24 rounded-lg border border-input bg-background px-2 py-1 text-xs outline-none ring-ring focus:ring-2" />
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
                  <button onClick={shareToWhatsApp} className="flex items-center gap-1.5 text-sm text-green-600 hover:text-green-700 transition-colors">
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
            <AlertDialogAction onClick={resetData} className="rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90">Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SplitBill;
