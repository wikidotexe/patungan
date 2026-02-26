import React, { useState, useMemo, useRef, useEffect } from "react";
import { Person, formatRupiah, TAX_RATE, SERVICE_CHARGE_RATE } from "@/lib/bill";
import { PeopleSection } from "@/components/PeopleSection";
import { ArrowLeft, CheckCircle2, Share2, Copy, Receipt, Plus, Trash2, FileDown, MessageCircle, Pencil, Check, X, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { loadCustomBillFromSupabase, saveCustomBillToSupabase, deleteCustomBillFromSupabase, getAllBillsFromSupabase, type Bill } from "@/lib/supabase";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { exportElementToPDF, type ReceiptPerson } from "@/lib/pdf";
import Footer from "@/components/Footer";
import { getStoredUser } from "@/lib/userStore";
import { localDraft } from "@/lib/localDraft";

const genId = () => crypto.randomUUID();

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
    if (persons.length === 0) {
      toast.error("Data kosong! Tambahkan teman terlebih dahulu.");
      return;
    }
    const lines = [
      `🧾 Custom Split Bill`,
      splitTitle ? `Judul: ${splitTitle}` : undefined,
      `Total: ${formatRupiah(totalBill)}`,
      "----------------------------------",
      "",
      ...summaries.map((s) => `• ${s.name}: ${formatRupiah(s.total)}`),
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
  const draftKey = `custom_bill_${userEmail}_${initialTitle}`;
  const [isLoading, setIsLoading] = useState(true);
  const [persons, setPersons] = useState<PersonWithItems[]>([]);
  const [splitTitle, setSplitTitle] = useState(initialTitle);
  const [enableService, setEnableService] = useState(true);
  const [enableTax, setEnableTax] = useState(true);
  const [customService, setCustomService] = useState("");
  const [customTax, setCustomTax] = useState("");
  const pdfRef = useRef<HTMLDivElement>(null);
  const [collapsedResults, setCollapsedResults] = useState<string[]>([]);

  // Import sharing state
  const [importModal, setImportModal] = useState(false);
  const [importBills, setImportBills] = useState<Bill[]>([]);
  const [importLoading, setImportLoading] = useState(false);

  // Load data from Supabase on mount
  useEffect(() => {
    if (!initialTitle) {
      setIsLoading(false);
      return;
    }

    const loadData = async () => {
      const result = await loadCustomBillFromSupabase(initialTitle, userEmail);
      if (result) {
        const { people, items } = result;
        const personMapped = people.map((p) => ({
          id: p.person_id,
          name: p.person_name,
          items: items
            .filter((item) => item.assignedTo.includes(p.person_id))
            .map((item) => ({
              id: item.item_id,
              name: item.item_name,
              price: item.item_price,
            })),
        }));
        setPersons(personMapped);
        setEnableService(result.bill.enable_service);
        setEnableTax(result.bill.enable_tax);
        setCustomService(result.bill.custom_service || "");
        setCustomTax(result.bill.custom_tax || "");
      } else {
        // Supabase failed → load from local draft
        const draft = localDraft.get<{
          persons: PersonWithItems[];
          enableService: boolean; enableTax: boolean;
          customService: string; customTax: string;
        }>(draftKey);
        if (draft) {
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

  // Always save to localStorage draft immediately (no debounce)
  useEffect(() => {
    if (!splitTitle || isLoading) return;
    localDraft.set(draftKey, { persons, enableService, enableTax, customService, customTax });
  }, [persons, splitTitle, enableService, enableTax, customService, customTax, isLoading]);

  // Sync to Supabase (debounced, fire-and-forget)
  useEffect(() => {
    if (!splitTitle || isLoading) return;

    const saveData = async () => {
      const items: Array<{ id: string; name: string; price: number; assignedTo: string[] }> = [];
      for (const person of persons) {
        for (const item of person.items) {
          const existingItem = items.find((i) => i.id === item.id);
          if (existingItem) {
            existingItem.assignedTo.push(person.id);
          } else {
            items.push({
              id: item.id,
              name: item.name,
              price: item.price,
              assignedTo: [person.id],
            });
          }
        }
      }
      await saveCustomBillToSupabase(
        splitTitle,
        persons.map((p) => ({ id: p.id, name: p.name })),
        items,
        enableService,
        enableTax,
        customService,
        customTax,
        userEmail,
      );
    };

    const timeoutId = setTimeout(saveData, 500);
    return () => clearTimeout(timeoutId);
  }, [persons, splitTitle, enableService, enableTax, customService, customTax, isLoading]);

  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  const resetData = async () => {
    setPersons([]);
    setEnableService(true);
    setEnableTax(true);
    setCustomService("");
    setCustomTax("");
    localDraft.remove(draftKey);
    await deleteCustomBillFromSupabase(splitTitle, userEmail);
    toast.info("Data dibersihkan");
    setResetConfirmOpen(false);
  };

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
  const updateItemInPerson = (personId: string, itemId: string, name: string, price: number) => {
    setPersons((prev) => prev.map((p) => (p.id === personId ? { ...p, items: p.items.map((i) => (i.id === itemId ? { ...i, name, price } : i)) } : p)));
  };

  // Open import modal and fetch available split bills with items
  const openImportModal = async () => {
    setImportModal(true);
    setImportLoading(true);
    const bills = await getAllBillsFromSupabase(userEmail);
    // Only show bills that have items
    const withItems = bills.filter((b) => {
      try { return JSON.parse(b.items_json || "[]").length > 0; } catch { return false; }
    });
    setImportBills(withItems);
    setImportLoading(false);
  };

  // Import a split bill: divide its total equally among all persons
  const importSharing = (bill: Bill) => {
    const items: Array<{ name: string; price: number }> = (() => {
      try { return JSON.parse(bill.items_json || "[]"); } catch { return []; }
    })();
    const itemsTotal = items.reduce((s: number, i: any) => s + (i.price || 0), 0);
    if (!itemsTotal || persons.length === 0) {
      toast.error("Tidak ada data yang bisa diimport.");
      return;
    }
    const perPerson = Math.round(itemsTotal / persons.length);
    const label = `Sharing: ${bill.bill_name || bill.title}`;
    setPersons((prev) =>
      prev.map((p) => ({
        ...p,
        items: [...p.items, { id: genId(), name: label, price: perPerson }],
      }))
    );
    setImportModal(false);
    toast.success(`Import sharing berhasil! ${formatRupiah(perPerson)}/orang`);
  };

  const summaries = useMemo(() => {
    const totalSubtotal = persons.reduce((sum, p) => sum + p.items.reduce((isum, i) => isum + i.price, 0), 0);

    let totalServiceTotal = 0;
    if (enableService) {
      if (customService && !isNaN(Number(customService))) {
        totalServiceTotal = Number(customService);
      } else {
        totalServiceTotal = totalSubtotal * SERVICE_CHARGE_RATE;
      }
    }

    let totalTaxTotal = 0;
    if (enableTax) {
      if (customTax && !isNaN(Number(customTax))) {
        totalTaxTotal = Number(customTax);
      } else {
        totalTaxTotal = (totalSubtotal + totalServiceTotal) * TAX_RATE;
      }
    }

    const avgService = persons.length > 0 ? totalServiceTotal / persons.length : 0;
    const avgTax = persons.length > 0 ? totalTaxTotal / persons.length : 0;

    return persons.map((person) => {
      const subtotal = person.items.reduce((sum, i) => sum + i.price, 0);
      const serviceCharge = avgService;
      const tax = avgTax;
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
    if (persons.length === 0) {
      toast.error("Data kosong! Tambahkan teman terlebih dahulu.");
      return;
    }
    const lines = [
      `🧾 Custom Split Bill`,
      splitTitle ? `Judul: ${splitTitle}` : undefined,
      `Total: ${formatRupiah(totalBill)}`,
      "----------------------------------",
      "",
      ...summaries.map((s) => `• ${s.name}: ${formatRupiah(s.total)}`),
      "",
      "----------------------------------",
      "Patungan by Nexteam",
    ];
    navigator.clipboard.writeText(lines.filter((l) => l !== undefined).join("\n"));
    toast.success("Ringkasan disalin!");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="w-full max-w-xl mx-auto px-2 md:px-4 py-8 space-y-6 flex-1">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex h-9 w-9 items-center justify-center rounded-lg bg-card border border-border text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-xl font-bold text-foreground">{splitTitle || "Custom Split Bill"}</h1>
          </div>
          <button onClick={() => setResetConfirmOpen(true)} className="flex h-9 w-9 items-center justify-center rounded-lg bg-card border border-border text-muted-foreground hover:text-destructive transition-colors" title="Hapus Data">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        {/* People */}
        <div className="rounded-xl border border-border bg-card p-4">
          <PeopleSection persons={persons} onAdd={addPerson} onRemove={removePerson} />
        </div>

        {/* Per-person items */}
        {persons.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Item per Teman</h2>
              <button
                onClick={openImportModal}
                className="flex items-center gap-1.5 text-xs font-semibold text-primary border border-primary/30 bg-primary/5 hover:bg-primary/10 rounded-lg px-3 py-1.5 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                Import Sharing
              </button>
            </div>
            {persons.map((person) => (
              <PersonItemCard
                key={person.id}
                person={person}
                onAddItem={(name, price) => addItemToPerson(person.id, name, price)}
                onRemoveItem={(itemId) => removeItemFromPerson(person.id, itemId)}
                onUpdateItem={(itemId, name, price) => updateItemInPerson(person.id, itemId, name, price)}
              />
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
              <p className="text-xs text-muted-foreground">{enableTax ? (customTax ? `custom: ${formatRupiah(Number(customTax))}` : "otomatis") : "nonaktif"}</p>
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
                      const receiptPersons: ReceiptPerson[] = summaries.map((s) => ({
                        name: s.name,
                        items: s.items,
                        subtotal: s.subtotal,
                        serviceCharge: s.serviceCharge,
                        tax: s.tax,
                        total: s.total,
                      }));
                      exportElementToPDF(
                        pdfRef.current!,
                        `patungan-${splitTitle || "receipt"}.pdf`,
                        splitTitle || "Custom Split Bill",
                        receiptPersons
                      );
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
                    <button onClick={() => setCollapsedResults((prev) => (prev.includes(s.id) ? prev.filter((id) => id !== s.id) : [...prev, s.id]))} className="flex w-full items-center justify-between text-left">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Receipt className="h-4 w-4" />
                        </div>
                        <div>
                          <span className="font-bold text-foreground">{s.name}</span>
                          {collapsedResults.includes(s.id) && <p className="text-xs text-primary font-semibold">{formatRupiah(s.total)}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            copyPerson(s);
                          }}
                          className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Copy className="h-4 w-4" />
                        </span>
                        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${collapsedResults.includes(s.id) ? "" : "rotate-180"}`} />
                      </div>
                    </button>
                    <AnimatePresence initial={false}>
                      {!collapsedResults.includes(s.id) && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2, ease: "easeInOut" }} className="overflow-hidden">
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
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
      <Footer />

      {/* Import Sharing Modal */}
      <AnimatePresence>
        {importModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-4 pb-4 sm:pb-0"
            onClick={() => setImportModal(false)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-sm rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <div>
                  <h3 className="font-bold text-foreground">Import Sharing</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Pilih Split Bill untuk dibagi rata ke semua teman</p>
                </div>
                <button onClick={() => setImportModal(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Bill list */}
              <div className="max-h-80 overflow-y-auto p-3 space-y-2">
                {importLoading ? (
                  <p className="text-center text-sm text-muted-foreground py-6">Memuat daftar bill...</p>
                ) : importBills.length === 0 ? (
                  <div className="text-center py-8 space-y-1">
                    <p className="text-sm font-medium text-foreground">Belum ada Split Bill dengan item</p>
                    <p className="text-xs text-muted-foreground">Buat Split Bill dulu dan tambahkan item di sana</p>
                  </div>
                ) : (
                  importBills.map((bill) => {
                    const items: Array<{ name: string; price: number }> = (() => {
                      try { return JSON.parse(bill.items_json || "[]"); } catch { return []; }
                    })();
                    const total = items.reduce((s, i) => s + (i.price || 0), 0);
                    const perPerson = persons.length > 0 ? Math.round(total / persons.length) : 0;
                    return (
                      <button
                        key={bill.id}
                        onClick={() => importSharing(bill)}
                        className="w-full text-left rounded-xl border border-border bg-background hover:border-primary/50 hover:bg-primary/5 px-4 py-3 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-foreground text-sm">{bill.bill_name || bill.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{items.length} item · Total {formatRupiah(total)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">per orang</p>
                            <p className="font-bold text-primary text-sm">{formatRupiah(perPerson)}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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

// Sub-component for per-person item input
function PersonItemCard({
  person,
  onAddItem,
  onRemoveItem,
  onUpdateItem,
}: {
  person: PersonWithItems;
  onAddItem: (name: string, price: number) => void;
  onRemoveItem: (itemId: string) => void;
  onUpdateItem: (itemId: string, name: string, price: number) => void;
}) {
  const [itemName, setItemName] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [collapsed, setCollapsed] = useState(false);

  const handleAdd = () => {
    const price = parseFloat(itemPrice);
    if (itemName.trim() && !isNaN(price) && price > 0) {
      onAddItem(itemName.trim(), price);
      setItemName("");
      setItemPrice("");
    }
  };

  const startEditing = (item: PersonItem) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditPrice(String(item.price));
  };

  const handleUpdate = () => {
    const price = parseFloat(editPrice);
    if (editingId && editName.trim() && !isNaN(price) && price > 0) {
      onUpdateItem(editingId, editName.trim(), price);
      setEditingId(null);
    }
  };

  const itemTotal = person.items.reduce((sum, i) => sum + i.price, 0);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Collapsible Header */}
      <button onClick={() => setCollapsed(!collapsed)} className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/30 transition-colors">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-foreground">{person.name}</h3>
          {person.items.length > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/10 px-1.5 text-[10px] font-bold text-primary">{person.items.length}</span>}
        </div>
        <div className="flex items-center gap-2">
          {person.items.length > 0 && <span className="text-xs font-medium text-primary">{formatRupiah(itemTotal)}</span>}
          <motion.div animate={{ rotate: collapsed ? -90 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </motion.div>
        </div>
      </button>

      {/* Collapsible Body */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: "easeInOut" }} className="overflow-hidden">
            <div className="px-4 pt-1 pb-4 space-y-3">
              <div className="flex flex-wrap gap-2">
                <input
                  type="text"
                  placeholder="Nama item..."
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="min-w-0 flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2"
                />
                <input
                  type="number"
                  placeholder="Harga"
                  value={itemPrice}
                  onChange={(e) => setItemPrice(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                  className="min-w-0 w-32 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2"
                />
                <button onClick={handleAdd} className="flex shrink-0 items-center justify-center rounded-lg bg-primary px-3 py-2 text-primary-foreground transition-colors hover:opacity-90">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <AnimatePresence>
                {person.items.map((item) => (
                  <motion.div key={item.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                    {editingId === item.id ? (
                      <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="min-w-0 flex-1 basis-[60%] rounded border border-input bg-background px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-primary"
                          autoFocus
                        />
                        <input
                          type="number"
                          value={editPrice}
                          onChange={(e) => setEditPrice(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleUpdate()}
                          className="min-w-0 w-20 flex-shrink-0 rounded border border-input bg-background px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-primary"
                        />
                        <div className="flex gap-1">
                          <button onClick={handleUpdate} className="text-primary hover:text-primary/80 transition-colors">
                            <Check className="h-4 w-4" />
                          </button>
                          <button onClick={() => setEditingId(null)} className="text-muted-foreground hover:text-foreground transition-colors">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="text-sm">
                          <span className="font-medium text-foreground">{item.name}</span>
                          <span className="ml-2 text-primary font-medium">{formatRupiah(item.price)}</span>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => startEditing(item)} className="rounded-lg p-1 text-muted-foreground hover:text-primary transition-colors">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => onRemoveItem(item.id)} className="rounded-lg p-1 text-muted-foreground hover:text-destructive transition-colors">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Index;
