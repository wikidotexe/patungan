import { Settings as SettingsIcon, Moon, Sun, Trash2, Info, Code2 } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { useState } from "react";

const APP_VERSION = "1.2.1";

const SettingsDialog = () => {
    const { theme, setTheme } = useTheme();
    const [open, setOpen] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [geminiKey, setGeminiKey] = useState(() => localStorage.getItem("patungan_gemini_api_key") || "");

    const deleteAllData = () => {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.startsWith("patungan_") || key.startsWith("custom_patungan_"))) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach((key) => localStorage.removeItem(key));
        toast.success(`${keysToRemove.length} data berhasil dihapus!`);
        setConfirmOpen(false);
        setOpen(false);
    };

    return (
        <>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <button
                        className="fixed top-4 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-card border border-border text-muted-foreground hover:text-primary hover:border-primary/50 transition-all shadow-sm hover:shadow-md"
                        aria-label="Settings"
                    >
                        <SettingsIcon className="h-5 w-5" />
                    </button>
                </DialogTrigger>
                <DialogContent className="max-w-md max-h-[80vh] w-[calc(100%-2rem)] rounded-xl overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-lg">
                            <SettingsIcon className="h-5 w-5 text-primary" />
                            Settings
                        </DialogTitle>
                        <DialogDescription>
                            Pengaturan aplikasi Patungan
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 mt-2">
                        {/* Dark Mode */}
                        <div className="flex items-center justify-between rounded-xl border border-border bg-background p-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                    {theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-foreground">Tampilan</p>
                                    <p className="text-xs text-muted-foreground">{theme === "dark" ? "Dark Mode" : "Light Mode"}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                                className={`relative h-7 w-12 rounded-full transition-colors ${theme === "dark" ? "bg-primary" : "bg-muted"}`}
                            >
                                <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-primary-foreground shadow transition-transform ${theme === "dark" ? "left-[22px]" : "left-0.5"}`} />
                            </button>
                        </div>

                        {/* Delete All Data */}
                        <button
                            onClick={() => setConfirmOpen(true)}
                            className="w-full flex items-center gap-3 rounded-xl border border-destructive/20 bg-background p-4 text-left hover:bg-destructive/5 transition-colors group"
                        >
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                                <Trash2 className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-destructive">Hapus Semua Data</p>
                                <p className="text-xs text-muted-foreground">Hapus semua data split bill yang tersimpan</p>
                            </div>
                        </button>

                        {/* Divider */}
                        <div className="border-t border-border" />

                        {/* About Us */}
                        <div className="rounded-xl border border-border bg-background p-4 space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                    <Info className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-foreground">About Us</p>
                                    <p className="text-xs text-muted-foreground">Tentang Patungan</p>
                                </div>
                            </div>
                            <div className="text-xs text-muted-foreground space-y-1.5 pl-12">
                                <p>
                                    <span className="font-semibold text-foreground">Patungan</span> adalah aplikasi web untuk membagi tagihan dengan mudah dan adil.
                                </p>
                                <p>
                                    Dibuat oleh{" "}
                                    <a href="https://www.nofileexistshere.my.id/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">
                                        Nexteam
                                    </a>
                                </p>
                            </div>
                        </div>

                        {/* Gemini API Key */}
                        <div className="rounded-xl border border-border bg-background p-4 space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                    <Code2 className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-foreground">Gemini API Key</p>
                                    <p className="text-xs text-muted-foreground">Untuk fitur Chat AI</p>
                                </div>
                            </div>
                            <div className="pl-12">
                                <input
                                    type="password"
                                    placeholder="Masukkan API Key..."
                                    value={geminiKey}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setGeminiKey(val);
                                        localStorage.setItem("patungan_gemini_api_key", val);
                                    }}
                                    className="w-full rounded-lg border border-input bg-card px-3 py-2 text-xs outline-none ring-ring focus:ring-2"
                                />
                                <p className="text-[10px] text-muted-foreground mt-1.5 leading-relaxed">
                                    Dapatkan API Key di <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">Google AI Studio</a>. Data tersimpan lokal.
                                </p>
                            </div>
                        </div>

                        {/* App Version */}
                        <div className="flex items-center justify-between rounded-xl border border-border bg-background p-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                                    <Code2 className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-foreground">Versi Aplikasi</p>
                                    <p className="text-xs text-muted-foreground">v{APP_VERSION}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Popup */}
            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <AlertDialogContent className="max-w-sm w-[calc(100%-2rem)] rounded-xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <Trash2 className="h-5 w-5 text-destructive" />
                            Hapus Semua Data?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Semua data split bill yang tersimpan akan dihapus secara permanen. Tindakan ini tidak bisa dibatalkan.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-lg">Batal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={deleteAllData}
                            className="rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Hapus Semua
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};

export default SettingsDialog;

