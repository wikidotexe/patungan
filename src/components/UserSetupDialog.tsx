import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserRound, Mail, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { upsertUser } from "@/lib/supabase";
import { getStoredUser, storeUser, AppUser } from "@/lib/userStore";

interface UserSetupDialogProps {
  onComplete: (user: AppUser) => void;
}

export function UserSetupDialog({ onComplete }: UserSetupDialogProps) {
  const [visible, setVisible] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Determine if we should show the dialog
  useEffect(() => {
    const stored = getStoredUser();
    if (!stored) {
      // Small delay so the home page renders first
      const t = setTimeout(() => setVisible(true), 400);
      return () => clearTimeout(t);
    } else {
      onComplete(stored);
    }
  }, []);

  const isEmailValid = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = username.trim();
    const mail = email.trim().toLowerCase();

    if (!name) {
      toast.error("Nama tidak boleh kosong!");
      return;
    }
    if (!isEmailValid(mail)) {
      toast.error("Format email tidak valid!");
      return;
    }

    setIsSubmitting(true);
    const ok = await upsertUser(mail, name);
    setIsSubmitting(false);

    if (!ok) {
      toast.error("Gagal menyimpan sesi. Coba lagi.");
      return;
    }

    const user: AppUser = { username: name, email: mail };
    storeUser(user);
    setVisible(false);
    onComplete(user);
    toast.success(`Selamat datang, ${name}! 🎉`);
  };

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div key="backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-background/40 backdrop-blur-md" />

          {/* Dialog */}
          <motion.div
            key="dialog"
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", duration: 0.4, bounce: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="glass-strong glass-sheen w-full max-w-sm rounded-2xl overflow-hidden">
              {/* Header */}
              <div className="relative z-10 bg-primary/70 backdrop-blur-xl border-b border-white/25 px-6 py-5 text-primary-foreground">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-foreground/20 backdrop-blur-md border border-white/30">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-bold text-lg">Selamat Datang!</h2>
                    <p className="text-xs text-primary-foreground/75">Patungan by Nexteam</p>
                  </div>
                </div>
              </div>

              {/* Body */}
              <form onSubmit={handleSubmit} className="relative z-10 p-6 space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">Masukkan nama dan email kamu untuk menyimpan sesi. Data kamu akan aman di cloud. ☁️</p>

                {/* Username */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground uppercase tracking-wider">Nama</label>
                  <div className="relative">
                    <UserRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Nama kamu..."
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="glass-subtle w-full rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none ring-ring focus:ring-2 transition-all"
                      autoFocus
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground uppercase tracking-wider">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="email"
                      placeholder="email@kamu.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="glass-subtle w-full rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none ring-ring focus:ring-2 transition-all"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-primary/70 backdrop-blur-xl border border-white/30 shadow-lg shadow-black/10 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/85 active:scale-[0.98] transition-all disabled:opacity-60 disabled:pointer-events-none"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    "Mulai Patungan 🚀"
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
