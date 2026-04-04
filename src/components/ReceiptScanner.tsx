import { useRef, useState, useEffect } from "react";
import { Camera, Image, Loader2, Check, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { formatRupiah, type Person } from "@/lib/bill";

interface ScannedItem {
  id: string;
  name: string;
  price: number;
  personIds: string[];
}

interface SplitProps {
  mode: "split";
  onConfirm: (items: Array<{ name: string; price: number }>) => void;
}

interface CustomProps {
  mode: "custom";
  persons: Person[];
  onConfirm: (items: Array<{ name: string; price: number; personId: string }>) => void;
}

type ReceiptScannerProps = SplitProps | CustomProps;

interface DropdownState {
  itemId: string;
}

export const ReceiptScanner = (props: ReceiptScannerProps) => {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  const [showReview, setShowReview] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<DropdownState | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-dropdown]")) {
        setOpenDropdown(null);
      }
    };

    if (openDropdown) {
      document.addEventListener("click", handleClickOutside);
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [openDropdown]);

  const processFile = async (file: File) => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY?.trim();
    if (!apiKey || apiKey === "your_api_key_here") {
      toast.error("Gemini API Key belum dikonfigurasi!");
      return;
    }

    setIsScanning(true);
    const toastId = toast.loading("Memindai struk...");

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const mimeType = file.type || "image/jpeg";

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

      const prompt = `Kamu adalah asisten untuk mengekstrak data dari struk/bon/nota pembayaran.
Ekstrak semua item beserta harganya dari gambar struk ini.
Kembalikan HANYA array JSON tanpa penjelasan, markdown, atau teks apapun, contoh: [{"name":"Nasi Goreng","price":25000},{"name":"Es Teh","price":8000}]
Harga harus berupa angka integer dalam Rupiah, tanpa titik atau koma pemisah ribuan.
Jangan sertakan pajak, service charge, diskon, atau total keseluruhan — hanya item individual.
Jika tidak ada item yang terdeteksi, kembalikan [].`;

      const result = await model.generateContent([{ inlineData: { data: base64, mimeType } }, prompt]);

      let text = result.response.text().trim();
      const fenceMatch = text.match(/```(?:json)?\n?([\s\S]*?)\n?```/);
      if (fenceMatch) text = fenceMatch[1].trim();

      const parsed: Array<{ name: string; price: number }> = JSON.parse(text);

      if (!Array.isArray(parsed) || parsed.length === 0) {
        toast.dismiss(toastId);
        toast.error("Tidak ada item yang terdeteksi. Coba ambil foto lebih jelas.");
        return;
      }

      const defaultPersonIds = props.mode === "custom" && props.persons.length === 1 ? [props.persons[0].id] : [];

      const withIds: ScannedItem[] = parsed.map((item) => ({
        id: crypto.randomUUID(),
        name: item.name,
        price: Math.round(Number(item.price)),
        personIds: defaultPersonIds,
      }));

      setScannedItems(withIds);
      setShowReview(true);
      toast.dismiss(toastId);
      toast.success(`${withIds.length} item berhasil dipindai`);
    } catch (err) {
      console.error(err);
      toast.dismiss(toastId);
      toast.error("Gagal memindai struk. Pastikan foto jelas dan coba lagi.");
    } finally {
      setIsScanning(false);
      if (cameraInputRef.current) cameraInputRef.current.value = "";
      if (galleryInputRef.current) galleryInputRef.current.value = "";
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const updatePersonId = (id: string, personId: string) => {
    setScannedItems((prev) => prev.map((item) => (item.id === id ? { ...item, personId } : item)));
  };

  const togglePerson = (itemId: string, personId: string) => {
    setScannedItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const has = item.personIds.includes(personId);
        return {
          ...item,
          personIds: has ? item.personIds.filter((id) => id !== personId) : [...item.personIds, personId],
        };
      }),
    );
  };

  const removeScannedItem = (id: string) => {
    setScannedItems((prev) => prev.filter((item) => item.id !== id));
    if (openDropdown?.itemId === id) setOpenDropdown(null);
  };

  const handleConfirm = () => {
    if (props.mode === "split") {
      props.onConfirm(scannedItems.map(({ name, price }) => ({ name, price })));
    } else {
      const unassigned = scannedItems.filter((i) => i.personIds.length === 0);
      if (unassigned.length > 0) {
        toast.error("Pilih penerima untuk semua item terlebih dahulu");
        return;
      }
      const expanded: Array<{ name: string; price: number; personId: string }> = [];
      for (const item of scannedItems) {
        const splitPrice = Math.round(item.price / item.personIds.length);
        for (const personId of item.personIds) {
          expanded.push({ name: item.name, price: splitPrice, personId });
        }
      }
      props.onConfirm(expanded);
    }
    setShowReview(false);
    setScannedItems([]);
    setOpenDropdown(null);
  };

  const handleClose = () => {
    setShowReview(false);
    setScannedItems([]);
    setOpenDropdown(null);
  };

  return (
    <>
      {/* Hidden file inputs */}
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
      <input ref={galleryInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

      {/* Trigger button + source menu */}
      <div className="relative">
        <button
          onClick={() => setShowMenu((v) => !v)}
          disabled={isScanning}
          className="flex items-center gap-1.5 text-xs font-semibold text-primary border border-primary/30 bg-primary/5 hover:bg-primary/10 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Foto struk untuk scan otomatis"
        >
          {isScanning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
          Scan Struk
        </button>

        <AnimatePresence>
          {showMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                transition={{ duration: 0.12 }}
                className="absolute right-0 top-full mt-1.5 z-50 w-44 rounded-xl border border-border bg-card shadow-lg overflow-hidden"
              >
                <button
                  onClick={() => {
                    setShowMenu(false);
                    cameraInputRef.current?.click();
                  }}
                  className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                >
                  <Camera className="h-4 w-4 text-primary shrink-0" />
                  Ambil Foto
                </button>
                <div className="border-t border-border" />
                <button
                  onClick={() => {
                    setShowMenu(false);
                    galleryInputRef.current?.click();
                  }}
                  className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                >
                  <Image className="h-4 w-4 text-primary shrink-0" />
                  Pilih dari Galeri
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Review Bottom Sheet */}
      <AnimatePresence>
        {showReview && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50" onClick={handleClose} />

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="relative z-10 w-full sm:max-w-md bg-card border border-border rounded-t-2xl sm:rounded-2xl p-3 sm:p-4 max-h-[90vh] sm:max-h-[85vh] flex flex-col"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3 shrink-0 gap-2">
                <div className="min-w-0">
                  <h2 className="font-bold text-foreground text-sm sm:text-base">Review Scan Struk</h2>
                  <p className="text-xs text-muted-foreground">
                    {scannedItems.length} item
                    {props.mode === "custom" && " — pilih penerima"}
                  </p>
                </div>
                <button onClick={handleClose} className="h-7 w-7 sm:h-8 sm:w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Items list */}
              <div className="overflow-y-auto flex-1 space-y-2 pr-0.5 -mx-1 px-1">
                {scannedItems.length === 0 ? (
                  <p className="text-xs sm:text-sm text-muted-foreground text-center py-6">Semua item dihapus</p>
                ) : (
                  scannedItems.map((item) => (
                    <div key={item.id} className="flex items-start sm:items-center gap-1.5 sm:gap-2 rounded-lg border border-border bg-background px-2.5 sm:px-3 py-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-foreground truncate">{item.name}</p>
                        <p className="text-xs text-primary font-semibold">{formatRupiah(item.price)}</p>
                      </div>

                      {/* Person selector for custom mode */}
                      {props.mode === "custom" && (
                        <div className="relative" data-dropdown>
                          <button
                            onClick={() => setOpenDropdown(openDropdown?.itemId === item.id ? null : { itemId: item.id })}
                            className={`text-xs rounded-lg border px-2 sm:px-2.5 py-1 sm:py-1.5 font-medium transition-colors shrink-0 max-w-[90px] sm:max-w-[110px] overflow-hidden text-ellipsis whitespace-nowrap ${
                              item.personIds.length > 0 ? "border-primary/40 bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-primary/30"
                            }`}
                          >
                            {item.personIds.length > 0
                              ? (props as CustomProps).persons
                                  .filter((p) => item.personIds.includes(p.id))
                                  .map((p) => p.name)
                                  .join(", ")
                              : "Pilih..."}
                          </button>
                          {openDropdown?.itemId === item.id && (
                            <div className="absolute top-full right-0 mt-1 w-40 sm:w-48 bg-card border border-border rounded-lg shadow-lg z-20 p-1.5 sm:p-2 space-y-0.5 sm:space-y-1 max-h-48 overflow-y-auto">
                              {(props as CustomProps).persons.map((person) => (
                                <label key={person.id} className="flex items-center gap-2 p-1.5 sm:p-2 hover:bg-muted rounded cursor-pointer" onClick={(e) => e.stopPropagation()}>
                                  <input type="checkbox" checked={item.personIds.includes(person.id)} onChange={() => togglePerson(item.id, person.id)} className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                  <span className="text-xs sm:text-sm truncate">{person.name}</span>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      <button onClick={() => removeScannedItem(item.id)} className="shrink-0 text-muted-foreground hover:text-destructive transition-colors mt-0.5 sm:mt-0">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="flex gap-2 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-border shrink-0">
                <button onClick={handleClose} className="flex-1 py-2 sm:py-2.5 rounded-lg border border-border text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Batal
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={scannedItems.length === 0}
                  className="flex-1 py-2 sm:py-2.5 rounded-lg bg-primary text-primary-foreground text-xs sm:text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-1 sm:gap-2"
                >
                  <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Tambahkan</span>
                  <span className="sm:hidden">OK</span> ({scannedItems.length})
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
