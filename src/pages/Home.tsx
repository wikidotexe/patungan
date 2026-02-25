import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Receipt, Utensils, Wallet, StickyNote, ChevronDown, ArrowRight, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Footer from "@/components/Footer";
import CoffeeBubble from "@/components/CoffeeBubble";
import HelpGuide from "@/components/HelpGuide";
import SettingsDialog from "@/components/SettingsDialog";
import { UserSetupDialog } from "@/components/UserSetupDialog";
import { AppUser, clearStoredUser } from "@/lib/userStore";

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

const Home = () => {
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    clearStoredUser();
    setProfileOpen(false);
    window.location.reload();
  };

  const features = [
    {
      id: 0,
      title: "Split Bill",
      description: "Bagi rata total tagihan ke semua teman",
      icon: Receipt,
      color: "bg-primary/10 text-primary",
      borderColor: "hover:border-primary/30",
      to: "/split-bill-title",
    },
    {
      id: 1,
      title: "Custom Split Bill",
      description: "Pilih item per teman, hitung otomatis",
      icon: Utensils,
      color: "bg-accent/10 text-accent",
      borderColor: "hover:border-accent/30",
      to: "/custom-split-title",
    },
    {
      id: 2,
      title: "Catatan",
      description: "Catat pengeluaran saat trip atau belanja",
      icon: StickyNote,
      color: "bg-green-100 dark:bg-green-950 text-green-600 dark:text-green-400",
      borderColor: "hover:border-green-400",
      to: "/notes",
    },
    {
      id: 3,
      title: "Kantongin",
      description: "Management uang, redirect ke Kantongin",
      icon: Wallet,
      color: "bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400",
      borderColor: "hover:border-blue-400",
      href: "https://kantongin.vercel.app/",
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <UserSetupDialog onComplete={setUser} />
      <HelpGuide />
      <SettingsDialog />
      <CoffeeBubble />
      {/* User avatar dropdown — fixed next to settings icon */}
      {user && (
        <motion.div
          ref={profileRef}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed top-4 right-16 z-50"
        >
          <button
            onClick={() => setProfileOpen((p) => !p)}
            className={`flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold shadow-sm hover:shadow-md hover:scale-105 transition-all ${profileOpen ? "ring-2 ring-primary/50 ring-offset-2 ring-offset-background" : ""}`}
            aria-label={`User: ${user.username}`}
          >
            {getInitials(user.username)}
          </button>

          {/* Dropdown */}
          <AnimatePresence>
            {profileOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -6 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-12 w-52 rounded-xl border border-border bg-card shadow-xl overflow-hidden origin-top-right"
              >
                {/* Profile info */}
                <div className="px-4 py-3 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                      {getInitials(user.username)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{user.username}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </div>
                </div>
                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Keluar Sesi
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
      <div className="w-full max-w-md space-y-8 text-center flex-1 mx-auto flex flex-col items-center justify-center px-4 md:px-0 py-12">
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Wallet className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold text-foreground font-display text-center">Patungan By Nexteam</h1>
          <p className="text-sm text-muted-foreground max-w-[280px] mx-auto leading-relaxed text-center">
            Bagi tagihan dengan mudah • Pajak & Service otomatis
          </p>
        </motion.div>

        <div className="grid gap-3 w-full">
          {features.map((feature, idx) => {
            const isExpanded = expandedCard === idx;
            const Icon = feature.icon;

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`group rounded-2xl border bg-card transition-all ${isExpanded ? "border-primary/40 ring-1 ring-primary/5 shadow-md" : "border-border shadow-sm"} ${feature.borderColor}`}
              >
                <button
                  onClick={() => setExpandedCard(isExpanded ? null : idx)}
                  className="w-full flex items-center justify-between p-4 sm:p-5 text-left transition-all"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 ${isExpanded ? "scale-105" : "group-hover:scale-105"} ${feature.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="font-bold text-card-foreground text-lg leading-tight">{feature.title}</h2>
                      {!isExpanded && (
                        <p className="text-xs text-muted-foreground truncate max-w-[180px]">{feature.description}</p>
                      )}
                    </div>
                  </div>
                  <motion.div
                    animate={{ rotate: isExpanded ? 0 : -90, opacity: isExpanded ? 1 : 0.6 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className={`h-5 w-5 ${isExpanded ? "text-primary" : "text-muted-foreground"}`} />
                  </motion.div>
                </button>

                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 space-y-4 pt-1">
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {feature.description}
                        </p>
                        {feature.to ? (
                          <Link
                            to={feature.to}
                            className="flex items-center justify-center gap-2 w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-sm hover:opacity-90 active:scale-[0.98] transition-all"
                          >
                            Cus Cobain
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        ) : (
                          <a
                            href={feature.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 w-full rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white shadow-sm hover:opacity-90 active:scale-[0.98] transition-all"
                          >
                            Buka Kantongin
                            <ArrowRight className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Home;
