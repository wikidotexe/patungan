import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { BillItem, Person, formatRupiah } from "@/lib/bill";
import { motion, AnimatePresence } from "framer-motion";

interface ItemsSectionProps {
  items: BillItem[];
  persons: Person[];
  onAdd: (name: string, price: number) => void;
  onRemove: (id: string) => void;
  onToggleAssign: (itemId: string, personId: string) => void;
}

export function ItemsSection({ items, persons, onAdd, onRemove, onToggleAssign }: ItemsSectionProps) {
  const [itemName, setItemName] = useState("");
  const [itemPrice, setItemPrice] = useState("");

  const handleAdd = () => {
    const price = parseFloat(itemPrice);
    if (itemName.trim() && !isNaN(price) && price > 0) {
      onAdd(itemName.trim(), price);
      setItemName("");
      setItemPrice("");
    }
  };

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">🍽️ Item / Menu</h2>
      <div className="flex flex-wrap gap-2">
        <input type="text" placeholder="Nama item..." value={itemName} onChange={(e) => setItemName(e.target.value)} className="glass-subtle min-w-0 flex-1 rounded-xl px-3 py-2 text-sm outline-none ring-ring focus:ring-2" />
        <input
          type="number"
          placeholder="Harga (Rp)"
          value={itemPrice}
          onChange={(e) => setItemPrice(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          className="glass-subtle min-w-0 w-32 rounded-xl px-3 py-2 text-sm outline-none ring-ring focus:ring-2"
        />
        <button
          onClick={handleAdd}
          className="flex shrink-0 items-center gap-1 rounded-xl bg-primary/70 backdrop-blur-xl border border-white/30 shadow-lg shadow-black/10 px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/85"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <AnimatePresence>
        {items.map((item) => (
          <motion.div key={item.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="glass glass-sheen rounded-2xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-card-foreground">{item.name}</span>
                <span className="ml-2 text-sm text-primary font-medium">{formatRupiah(item.price)}</span>
              </div>
              <button onClick={() => onRemove(item.id)} className="rounded-xl p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            {persons.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {persons.map((p) => {
                  const isAssigned = item.assignedTo.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      onClick={() => onToggleAssign(item.id, p.id)}
                      className={`rounded-full px-2.5 py-1 text-xs font-medium transition-all ${
                        isAssigned ? "bg-primary/70 backdrop-blur-xl border border-white/30 text-primary-foreground shadow-lg shadow-black/10 hover:bg-primary/85" : "glass-subtle text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {p.name}
                    </button>
                  );
                })}
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
