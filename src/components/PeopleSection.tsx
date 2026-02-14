import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Person } from "@/lib/bill";
import { motion, AnimatePresence } from "framer-motion";

interface PeopleSectionProps {
  persons: Person[];
  onAdd: (name: string) => void;
  onRemove: (id: string) => void;
}

export function PeopleSection({ persons, onAdd, onRemove }: PeopleSectionProps) {
  const [name, setName] = useState("");

  const handleAdd = () => {
    if (name.trim()) {
      onAdd(name.trim());
      setName("");
    }
  };

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Nama Teman Kalian</h2>
      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          placeholder="Tulis nama teman kalian..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          className="min-w-0 flex-1 rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none ring-ring focus:ring-2"
        />
        <button onClick={handleAdd} className="flex shrink-0 items-center gap-1 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90">
          <Plus className="h-4 w-4" />
          Tambah
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        <AnimatePresence>
          {persons.map((p) => (
            <motion.span
              key={p.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-sm font-medium text-secondary-foreground"
            >
              {p.name}
              <button onClick={() => onRemove(p.id)} className="rounded-full p-0.5 transition-colors hover:bg-destructive/20">
                <X className="h-3 w-3" />
              </button>
            </motion.span>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
