import { BillSummary, formatRupiah, TAX_RATE, SERVICE_CHARGE_RATE } from "@/lib/bill";
import { motion } from "framer-motion";
import { Receipt } from "lucide-react";

interface BillSummaryCardProps {
  summaries: BillSummary[];
  totalBill: number;
}

export function BillSummaryCard({ summaries, totalBill }: BillSummaryCardProps) {
  if (summaries.length === 0) return null;

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        📊 Ringkasan
      </h2>

      <div className="rounded-xl border border-border bg-card p-4 space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Service Charge ({SERVICE_CHARGE_RATE * 100}%)</span>
          <span>otomatis</span>
        </div>
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Pajak PB1 ({TAX_RATE * 100}%)</span>
          <span>otomatis</span>
        </div>
        <div className="border-t border-border pt-2 flex justify-between font-bold text-foreground">
          <span>Total</span>
          <span className="text-primary">{formatRupiah(totalBill)}</span>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {summaries.map((s, i) => (
          <motion.div
            key={s.personId}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-xl border border-border bg-card p-4 space-y-2"
          >
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Receipt className="h-4 w-4" />
              </div>
              <span className="font-bold text-card-foreground">{s.personName}</span>
            </div>

            <div className="space-y-1">
              {s.items.map((item, j) => (
                <div key={j} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{item.name}</span>
                  <span className="text-card-foreground">{formatRupiah(item.amount)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-border pt-2 space-y-1 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatRupiah(s.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Service ({SERVICE_CHARGE_RATE * 100}%)</span>
                <span>{formatRupiah(s.serviceCharge)}</span>
              </div>
              <div className="flex justify-between">
                <span>PB1 ({TAX_RATE * 100}%)</span>
                <span>{formatRupiah(s.tax)}</span>
              </div>
            </div>

            <div className="flex justify-between font-bold text-card-foreground pt-1 border-t border-border">
              <span>Total</span>
              <span className="text-primary">{formatRupiah(s.total)}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
