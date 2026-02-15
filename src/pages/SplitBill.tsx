import { useState, useMemo, useEffect } from "react";
import { Person, formatRupiah, TAX_RATE, SERVICE_CHARGE_RATE } from "@/lib/bill";
import { PeopleSection } from "@/components/PeopleSection";
import { ArrowLeft, CheckCircle2, Share2, Copy, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import Footer from "@/components/Footer";

let nextId = 1;
const genId = () => String(nextId++);

const SplitBill = () => {
  // Helper to get title from URL immediately
  const getTitleFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get("title") || "";
  };

  const initialTitle = getTitleFromUrl();
  const [billName, setBillName] = useState(() => {
    if (!initialTitle) return "";
    return localStorage.getItem(`patungan_${initialTitle}_billName`) || initialTitle;
  });
  const [totalBill, setTotalBill] = useState(() => {
    if (!initialTitle) return "";
    return localStorage.getItem(`patungan_${initialTitle}_totalBill`) || "";
  });
  const [persons, setPersons] = useState<Person[]>(() => {
    if (!initialTitle) return [];
    const saved = localStorage.getItem(`patungan_${initialTitle}_persons`);
    return saved ? JSON.parse(saved) : [];
  });
  const [enableService, setEnableService] = useState(() => {
    if (!initialTitle) return true;
    const saved = localStorage.getItem(`patungan_${initialTitle}_enableService`);
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [enableTax, setEnableTax] = useState(() => {
    if (!initialTitle) return true;
    const saved = localStorage.getItem(`patungan_${initialTitle}_enableTax`);
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [customService, setCustomService] = useState(() => {
    if (!initialTitle) return "";
    return localStorage.getItem(`patungan_${initialTitle}_customService`) || "";
  });
  const [customTax, setCustomTax] = useState(() => {
    if (!initialTitle) return "";
    return localStorage.getItem(`patungan_${initialTitle}_customTax`) || "";
  });

  // Persistence
  useEffect(() => {
    if (!initialTitle) return;
    localStorage.setItem(`patungan_${initialTitle}_billName`, billName);
    localStorage.setItem(`patungan_${initialTitle}_totalBill`, totalBill);
    localStorage.setItem(`patungan_${initialTitle}_persons`, JSON.stringify(persons));
    localStorage.setItem(`patungan_${initialTitle}_enableService`, JSON.stringify(enableService));
    localStorage.setItem(`patungan_${initialTitle}_enableTax`, JSON.stringify(enableTax));
    localStorage.setItem(`patungan_${initialTitle}_customService`, customService);
    localStorage.setItem(`patungan_${initialTitle}_customTax`, customTax);

    // Update global bill list with timestamp
    const savedList = localStorage.getItem("patungan_bill_list");
    let list: any[] = savedList ? JSON.parse(savedList) : [];

    // Migration: convert string[] to object[] if needed
    if (list.length > 0 && typeof list[0] === "string") {
      list = list.map((title) => ({ title, createdAt: Date.now() }));
    }

    const billIndex = list.findIndex((b) => b.title === initialTitle);
    if (billIndex === -1) {
      localStorage.setItem("patungan_bill_list", JSON.stringify([...list, { title: initialTitle, createdAt: Date.now() }]));
    }
  }, [billName, totalBill, persons, enableService, enableTax, customService, customTax, initialTitle]);

  const addPerson = (name: string) => {
    setPersons((prev) => [...prev, { id: genId(), name }]);
  };

  const removePerson = (id: string) => {
    setPersons((prev) => prev.filter((p) => p.id !== id));
  };

  const resetData = () => {
    if (confirm("Hapus semua data input untuk bill ini?")) {
      setBillName(initialTitle);
      setTotalBill("");
      setPersons([]);
      setEnableService(true);
      setEnableTax(true);
      setCustomService("");
      setCustomTax("");
      localStorage.removeItem(`patungan_${initialTitle}_billName`);
      localStorage.removeItem(`patungan_${initialTitle}_totalBill`);
      localStorage.removeItem(`patungan_${initialTitle}_persons`);
      localStorage.removeItem(`patungan_${initialTitle}_enableService`);
      localStorage.removeItem(`patungan_${initialTitle}_enableTax`);
      localStorage.removeItem(`patungan_${initialTitle}_customService`);
      localStorage.removeItem(`patungan_${initialTitle}_customTax`);
      toast.info("Data dibersihkan");
    }
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
      `🧾 ${billName || "Split Bill"}`,
      `Total: ${formatRupiah(calculation.total)}`,
      `Per orang (${persons.length}): ${formatRupiah(calculation.perPerson)}`,
      "",
      ...persons.map((p) => `• ${p.name}: ${formatRupiah(calculation.perPerson)}`),
      "",
      "Patungan by Nexteam",
    ];
    navigator.clipboard.writeText(lines.join("\n"));
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
          <button onClick={resetData} className="flex h-9 w-9 items-center justify-center rounded-lg bg-card border border-border text-muted-foreground hover:text-destructive transition-colors" title="Hapus Data">
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
                  placeholder="Custom"
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
                  placeholder="Custom"
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
          <p className="text-[10px] text-muted-foreground italic mt-1 font-medium">
            * Pajak dan service, di bagi rata ke semua teman
          </p>
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
              <button onClick={copyAll} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <Share2 className="h-4 w-4" />
                Salin Semua
              </button>
            </div>

            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="rounded-xl bg-foreground p-5 text-center">
              <p className="text-sm text-muted">Per orang</p>
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
    </div>
  );
};

export default SplitBill;
