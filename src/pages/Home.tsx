import { Link } from "react-router-dom";
import { SplitSquareVertical, Receipt, Utensils, Wallet } from "lucide-react";
import { motion } from "framer-motion";

const Home = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="w-full max-w-md space-y-8 text-center flex-1 mx-auto flex flex-col items-center justify-center px-4 md:px-0">
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Wallet className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Patungan By Nexteam</h1>
          <p className="text-sm text-muted-foreground">Bagi tagihan dengan mudah • Pajak & Service otomatis</p>
        </motion.div>

        <div className="grid gap-4 w-full">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Link to="/split-bill-title" className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 text-left transition-all hover:shadow-md hover:border-primary/30">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Receipt className="h-6 w-6" />
              </div>
              <div>
                <h2 className="font-bold text-card-foreground">Split Bill</h2>
                <p className="text-sm text-muted-foreground">Bagi rata total tagihan ke semua teman</p>
              </div>
            </Link>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Link to="/custom-split-title" className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 text-left transition-all hover:shadow-md hover:border-primary/30">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <Utensils className="h-6 w-6" />
              </div>
              <div>
                <h2 className="font-bold text-card-foreground">Custom Split Bill</h2>
                <p className="text-sm text-muted-foreground">Pilih item per teman, hitung otomatis</p>
              </div>
            </Link>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <a href="https://kantongin.vercel.app/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 text-left transition-all hover:shadow-md hover:border-blue-400">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                <Wallet className="h-6 w-6" />
              </div>
              <div>
                <h2 className="font-bold text-card-foreground">Kantongin</h2>
                <p className="text-sm text-muted-foreground">Management uang, redirect ke Kantongin</p>
              </div>
            </a>
          </motion.div>
        </div>
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

export default Home;
