import { useState } from "react";
import { HelpCircle, Receipt, Utensils, Users, Calculator, Share2, Wallet, Settings, Moon, StickyNote, ChevronDown, Sparkles } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
} from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";

const steps = [
    {
        icon: Receipt,
        title: "Split Bill (Bagi Rata)",
        color: "text-primary bg-primary/10",
        steps: [
            "Buat judul tagihan baru (misal: Makan Siang)",
            'Masukkan total tagihan di kolom "Total Tagihan"',
            "Tambahkan nama teman-teman yang ikut patungan",
            "Atur pajak & service (bisa custom atau otomatis)",
            "Lihat hasil split & bagikan ke teman!",
        ],
    },
    {
        icon: Utensils,
        title: "Custom Split Bill",
        color: "text-accent bg-accent/10",
        steps: [
            "Buat judul split bill baru",
            "Tambahkan nama teman-teman",
            "Tambahkan item/menu per orang beserta harganya",
            "Atur pajak & service (dibagi rata ke semua teman)",
            "Lihat hasil & export ke PDF atau share ke WhatsApp!",
        ],
    },
    {
        icon: StickyNote,
        title: "Catatan",
        color: "text-green-600 bg-green-100 dark:bg-green-950 dark:text-green-400",
        steps: [
            "Klik menu Catatan di halaman utama",
            "Klik + untuk membuat catatan baru",
            "Isi judul dan isi catatan, lalu klik Simpan",
            "Gunakan tombol ✏️ untuk edit dan 🗑️ untuk hapus",
            "Atur urutan catatan dengan tombol ↑ ↓",
        ],
    },
    {
        icon: Sparkles,
        title: "Patungan AI",
        color: "text-blue-600 bg-blue-100 dark:bg-blue-950 dark:text-blue-400",
        steps: [
            "Klik ikon ✨ di pojok kiri bawah pada Halaman Utama",
            "Tanyakan apa saja seputar pengeluaran, pengingat, atau tips trip",
            "AI ini sudah ditalai (pre-configured) dengan info aplikasi",
            "Gunakan ikon 🗑️ untuk hapus riwayat chat",
            "Klik ikon Maximize/Minimize (Mode HP) untuk atur ukuran",
        ],
    },
];

const features = [
    { icon: Users, label: "Tambah teman tanpa batas" },
    { icon: Calculator, label: "Pajak & service otomatis / custom" },
    { icon: Share2, label: "Copy, WhatsApp, & export PDF" },
    { icon: Wallet, label: "Data tersimpan otomatis" },
    { icon: Moon, label: "Dark mode tersedia" },
    { icon: StickyNote, label: "Catatan untuk trip & belanja" },
    { icon: Sparkles, label: "AI Assistant (Gemini 2.5)" },
    { icon: Settings, label: "Pengaturan di tombol ⚙️" },
];

const HelpGuide = () => {
    const [expandedStep, setExpandedStep] = useState<number | null>(0); // Default expand first one

    return (
        <Dialog>
            <DialogTrigger asChild>
                <button
                    className="fixed top-4 left-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-card border border-border text-muted-foreground hover:text-primary hover:border-primary/50 transition-all shadow-sm hover:shadow-md"
                    aria-label="Cara Penggunaan"
                >
                    <HelpCircle className="h-5 w-5" />
                </button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[80vh] w-[calc(100%-2rem)] rounded-xl overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-lg">
                        <HelpCircle className="h-5 w-5 text-primary" />
                        Cara Penggunaan
                    </DialogTitle>
                    <DialogDescription>
                        Panduan lengkap menggunakan Patungan By Nexteam
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 mt-2">
                    {/* Step-by-step guides */}
                    {steps.map((section, idx) => (
                        <motion.div
                            key={section.title}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="space-y-2 border border-border rounded-xl overflow-hidden"
                        >
                            <button
                                onClick={() => setExpandedStep(expandedStep === idx ? null : idx)}
                                className="w-full flex items-center justify-between p-3 bg-muted/30 hover:bg-muted/50 transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${section.color}`}>
                                        <section.icon className="h-4 w-4" />
                                    </div>
                                    <h3 className="font-semibold text-foreground text-sm text-left">
                                        {section.title}
                                    </h3>
                                </div>
                                <motion.div
                                    animate={{ rotate: expandedStep === idx ? 0 : -90 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                </motion.div>
                            </button>

                            <AnimatePresence initial={false}>
                                {expandedStep === idx && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.25, ease: "easeInOut" }}
                                        className="overflow-hidden"
                                    >
                                        <ol className="space-y-2 pb-3 px-3 pt-1">
                                            {section.steps.map((step, i) => (
                                                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                                                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
                                                        {i + 1}
                                                    </span>
                                                    <span className="pt-0.5">{step}</span>
                                                </li>
                                            ))}
                                        </ol>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}

                    {/* Divider */}
                    <div className="border-t border-border" />

                    {/* Features */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 }}
                        className="space-y-3"
                    >
                        <h3 className="font-semibold text-foreground text-sm">✨ Fitur</h3>
                        <div className="grid grid-cols-2 gap-2">
                            {features.map((feature, i) => (
                                <div
                                    key={i}
                                    className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2"
                                >
                                    <feature.icon className="h-3.5 w-3.5 text-primary shrink-0" />
                                    <span className="text-xs text-foreground">{feature.label}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Tips */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.35 }}
                        className="rounded-lg bg-primary/5 border border-primary/10 p-3 space-y-1"
                    >
                        <p className="text-xs font-semibold text-primary">💡 Tips</p>
                        <ul className="text-xs text-muted-foreground space-y-0.5">
                            <li>• Data tersimpan otomatis di browser, tidak perlu login</li>
                            <li>• Bisa buat banyak split bill sekaligus</li>
                            <li>• Gunakan Custom Split jika setiap orang pesan menu berbeda</li>
                            <li>• Klik ⚙️ untuk ganti dark mode atau hapus semua data</li>
                        </ul>
                    </motion.div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default HelpGuide;
