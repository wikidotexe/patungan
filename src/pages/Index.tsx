import React, { useState, useMemo, useRef } from "react";
import { Person, formatRupiah, TAX_RATE, SERVICE_CHARGE_RATE } from "@/lib/bill";
import { PeopleSection } from "@/components/PeopleSection";
import { ArrowLeft, CheckCircle2, Share2, Copy, Receipt, Plus, Trash2, FileDown, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { exportElementToPDF } from "@/lib/pdf";

let nextId = 1;
const genId = () => String(nextId++);

interface PersonItem {
  id: string;
  name: string;
  price: number;
}

interface PersonWithItems extends Person {
  items: PersonItem[];
}

const Index = () => {
  // Helper: detect mobile
  const isMobile = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(max-width: 768px)").matches;

  // WhatsApp share handler
  const shareToWhatsApp = () => {
    if (persons.length === 0 || summaries.every((s) => s.items.length === 0)) {
      toast.error("Data kosong! Tambahkan teman dan item terlebih dahulu.");
      return;
    }
    const lines = [
      `🧾 Custom Split Bill`,
      splitTitle ? `Judul: ${splitTitle}` : "",
      `Total: ${formatRupiah(totalBill)}`,
      "",
      ...summaries.map((s) => [`• ${s.name}: ${formatRupiah(s.total)}`, ...s.items.map((i) => `  - ${i.name}: ${formatRupiah(i.price)}`)].join("\n")),
      "",
      "Patungan by Nexteam",
    ];
    const text = lines.filter(Boolean).join("\n");
    if (navigator.share) {
      navigator.share({ text });
    } else {
      const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
      window.open(url, "_blank");
    }
  };
  const [persons, setPersons] = useState<PersonWithItems[]>([]);
  const [splitTitle, setSplitTitle] = useState("");
  // Get title from query param
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const title = params.get("title");
    if (title) setSplitTitle(title);
  }, []);
  const [enableService, setEnableService] = useState(true);
  const [enableTax, setEnableTax] = useState(true);
  const [customService, setCustomService] = useState<string>("");
  const [customTax, setCustomTax] = useState<string>("");
  const pdfRef = useRef<HTMLDivElement>(null);

  const addPerson = (name: string) => {
    setPersons((prev) => [...prev, { id: genId(), name, items: [] }]);
  };
  const removePerson = (id: string) => {
    setPersons((prev) => prev.filter((p) => p.id !== id));
  };

  const addItemToPerson = (personId: string, itemName: string, price: number) => {
    setPersons((prev) => prev.map((p) => (p.id === personId ? { ...p, items: [...p.items, { id: genId(), name: itemName, price }] } : p)));
  };

  const removeItemFromPerson = (personId: string, itemId: string) => {
    setPersons((prev) => prev.map((p) => (p.id === personId ? { ...p, items: p.items.filter((i) => i.id !== itemId) } : p)));
  };

  const summaries = useMemo(() => {
    return persons.map((person) => {
      const subtotal = person.items.reduce((sum, i) => sum + i.price, 0);
      // Custom service and tax (if filled, use as absolute value, else fallback to percent)
      let serviceCharge = 0;
      let tax = 0;
      if (enableService) {
        if (customService && !isNaN(Number(customService))) {
          serviceCharge = Number(customService);
        } else {
          serviceCharge = subtotal * SERVICE_CHARGE_RATE;
        }
      }
      if (enableTax) {
        if (customTax && !isNaN(Number(customTax))) {
          tax = Number(customTax);
        } else {
          tax = (subtotal + serviceCharge) * TAX_RATE;
        }
      }
      const total = subtotal + serviceCharge + tax;
      return { ...person, subtotal, serviceCharge, tax, total };
    });
  }, [persons, enableService, enableTax, customService, customTax]);

  const totalBill = useMemo(() => summaries.reduce((sum, s) => sum + s.total, 0), [summaries]);

  const copyPerson = (s: (typeof summaries)[0]) => {
    const lines = [
      `🧾 ${s.name}`,
      ...s.items.map((i) => `• ${i.name}: ${formatRupiah(i.price)}`),
      `Subtotal: ${formatRupiah(s.subtotal)}`,
      enableService ? `Service (${SERVICE_CHARGE_RATE * 100}%): ${formatRupiah(s.serviceCharge)}` : "",
      enableTax ? `PB1 (${TAX_RATE * 100}%): ${formatRupiah(s.tax)}` : "",
      `Total: ${formatRupiah(s.total)}`,
    ].filter(Boolean);
    navigator.clipboard.writeText(lines.join("\n"));
    toast.success("Disalin ke clipboard!");
  };

  const copyAll = () => {
    if (persons.length === 0 || summaries.every((s) => s.items.length === 0)) {
      toast.error("Data kosong! Tambahkan teman dan item terlebih dahulu.");
      return;
    }
    const lines = [
      `🧾 Custom Split Bill`,
      splitTitle ? `Judul: ${splitTitle}` : "",
      `Total: ${formatRupiah(totalBill)}`,
      "",
      ...summaries.map((s) => [`• ${s.name}: ${formatRupiah(s.total)}`, ...s.items.map((i) => `  - ${i.name}: ${formatRupiah(i.price)}`)].join("\n")),
      "",
      "Patungan by Nexteam",
    ];
    navigator.clipboard.writeText(lines.filter(Boolean).join("\n"));
    toast.success("Ringkasan disalin!");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="w-full max-w-xl mx-auto px-2 md:px-4 py-8 space-y-6 flex-1">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex h-9 w-9 items-center justify-center rounded-lg bg-card border border-border text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-xl font-bold text-foreground">{splitTitle || "Custom Split Bill"}</h1>
        </div>

        {/* People */}
        <div className="rounded-xl border border-border bg-card p-4">
          <PeopleSection persons={persons} onAdd={addPerson} onRemove={removePerson} />
        </div>

        {/* Per-person items */}
        {persons.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Item per Teman</h2>
            {persons.map((person) => (
              <PersonItemCard key={person.id} person={person} onAddItem={(name, price) => addItemToPerson(person.id, name, price)} onRemoveItem={(itemId) => removeItemFromPerson(person.id, itemId)} />
            ))}
          </div>
        )}

        {/* Tax & Service */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pajak & Service</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">Service Charge {SERVICE_CHARGE_RATE * 100}%</p>
              <p className="text-xs text-muted-foreground">{enableService ? (customService ? `custom: ${formatRupiah(Number(customService))}` : "otomatis") : "nonaktif"}</p>
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
              <p className="text-xs text-muted-foreground">{enableTax ? (customTax ? `custom: ${formatRupiah(Number(customTax))}` : "otomatis") : "nonaktif"}</p>
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
          <div className="border-t border-border pt-3 flex justify-between items-center">
            <span className="font-semibold text-foreground">Total</span>
            <span className="text-lg font-bold text-primary">{formatRupiah(totalBill)}</span>
          </div>
        </div>

        {/* Results */}
        {summaries.some((s) => s.items.length > 0) && (
          <>
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
                  <button
                    onClick={() => {
                      if (pdfRef.current) exportElementToPDF(pdfRef.current, `patungan-receipt.pdf`, splitTitle || "Custom Split Bill");
                    }}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <FileDown className="h-4 w-4" />
                    Export PDF
                  </button>
                </div>
              </div>
              <div ref={pdfRef} className="grid gap-3 sm:grid-cols-2">
                {summaries.map((s, i) => (
                  <motion.div key={s.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-xl border border-border bg-background p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Receipt className="h-4 w-4" />
                        </div>
                        <span className="font-bold text-foreground">{s.name}</span>
                      </div>
                      <button onClick={() => copyPerson(s)} className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground transition-colors">
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                    {s.items.length > 0 ? (
                      <>
                        <div className="space-y-1">
                          {s.items.map((item) => (
                            <div key={item.id} className="flex justify-between text-sm">
                              <span className="text-muted-foreground">{item.name}</span>
                              <span className="text-foreground">{formatRupiah(item.price)}</span>
                            </div>
                          ))}
                        </div>
                        <div className="border-t border-border pt-2 space-y-1 text-xs text-muted-foreground">
                          <div className="flex justify-between">
                            <span>Subtotal</span>
                            <span>{formatRupiah(s.subtotal)}</span>
                          </div>
                          {enableService && (
                            <div className="flex justify-between">
                              <span>Service ({SERVICE_CHARGE_RATE * 100}%)</span>
                              <span>{formatRupiah(s.serviceCharge)}</span>
                            </div>
                          )}
                          {enableTax && (
                            <div className="flex justify-between">
                              <span>PB1 ({TAX_RATE * 100}%)</span>
                              <span>{formatRupiah(s.tax)}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex justify-between font-bold text-foreground pt-1 border-t border-border">
                          <span>Total</span>
                          <span className="text-primary">{formatRupiah(s.total)}</span>
                        </div>
                      </>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">Belum ada item</p>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
      <footer className="w-full text-center py-6 text-xs text-muted-foreground">
        © 2026 Patungan by{" "}
        <a href="https://www.nofileexistshere.my.id/" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">
          Nexteam
        </a>
        . All rights reserved.
      </footer>
    </div>
  );
};

// Sub-component for per-person item input
function PersonItemCard({ person, onAddItem, onRemoveItem }: { person: PersonWithItems; onAddItem: (name: string, price: number) => void; onRemoveItem: (itemId: string) => void }) {
  const [itemName, setItemName] = useState("");
  const [itemPrice, setItemPrice] = useState("");

  const handleAdd = () => {
    const price = parseFloat(itemPrice);
    if (itemName.trim() && !isNaN(price) && price > 0) {
      onAddItem(itemName.trim(), price);
      setItemName("");
      setItemPrice("");
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <h3 className="font-semibold text-foreground">{person.name}</h3>
      <div className="flex gap-2">
        <input type="text" placeholder="Nama item..." value={itemName} onChange={(e) => setItemName(e.target.value)} className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2" />
        <input
          type="number"
          placeholder="Harga (Rp)"
          value={itemPrice}
          onChange={(e) => setItemPrice(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          className="w-28 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2"
        />
        <button onClick={handleAdd} className="flex items-center justify-center rounded-lg bg-primary px-3 py-2 text-primary-foreground transition-colors hover:opacity-90">
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <AnimatePresence>
        {person.items.map((item) => (
          <motion.div key={item.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
            <div className="text-sm">
              <span className="font-medium text-foreground">{item.name}</span>
              <span className="ml-2 text-primary font-medium">{formatRupiah(item.price)}</span>
            </div>
            <button onClick={() => onRemoveItem(item.id)} className="rounded-lg p-1 text-muted-foreground hover:text-destructive transition-colors">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export default Index;
