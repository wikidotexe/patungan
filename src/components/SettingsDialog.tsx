import { Settings as SettingsIcon, Moon, Sun, Trash2, Info, Code2, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { useState } from "react";
import { deleteAllDataFromSupabase } from "@/lib/supabase";

const APP_VERSION = "2.2.1";

const SettingsDialog = () => {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [isDeleting, setIsDeleting] = useState(false);

  const deleteAllData = async () => {
    setIsDeleting(true);
    const { success, count } = await deleteAllDataFromSupabase();
    setIsDeleting(false);

    if (success) {
      toast.success(`Semua data berhasil dihapus dari database!`);
    } else {
      toast.error("Gagal menghapus data. Coba lagi.");
    }
    setConfirmOpen(false);
    setOpen(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <button className="glass glass-sheen fixed top-4 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground hover:text-primary transition-all" aria-label="Settings">
            <SettingsIcon className="h-5 w-5" />
          </button>
        </DialogTrigger>
        <DialogContent className="max-w-md max-h-[80vh] w-[calc(100%-2rem)] rounded-xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <SettingsIcon className="h-5 w-5 text-primary" />
              Settings
            </DialogTitle>
            <DialogDescription>Pengaturan aplikasi Patungan</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            {/* Dark Mode */}
            <div className="glass-subtle flex items-center justify-between rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">{theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}</div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Tampilan</p>
                  <p className="text-xs text-muted-foreground">{theme === "dark" ? "Dark Mode" : "Light Mode"}</p>
                </div>
              </div>
              <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className={`relative h-7 w-12 rounded-full transition-colors ${theme === "dark" ? "bg-primary" : "bg-muted"}`}>
                <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-primary-foreground shadow transition-transform ${theme === "dark" ? "left-[22px]" : "left-0.5"}`} />
              </button>
            </div>

            {/* Delete All Data */}
            <button onClick={() => setConfirmOpen(true)} className="glass-subtle w-full flex items-center gap-3 rounded-2xl border-destructive/25 p-4 text-left hover:bg-destructive/10 transition-colors group">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                <Trash2 className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-destructive">Hapus Semua Data</p>
                <p className="text-xs text-muted-foreground">Hapus semua data split bill yang tersimpan</p>
              </div>
            </button>

            {/* Divider */}
            <div className="border-t border-border/60" />

            {/* About Us */}
            <div className="glass-subtle rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
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

            {/* App Version */}
            <div className="glass-subtle flex items-center justify-between rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="glass-subtle flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground">
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
        <AlertDialogContent className="glass-strong glass-sheen max-w-sm w-[calc(100%-2rem)] rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              Hapus Semua Data?
            </AlertDialogTitle>
            <AlertDialogDescription>Semua data split bill yang tersimpan akan dihapus secara permanen. Tindakan ini tidak bisa dibatalkan.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="glass-subtle rounded-xl">Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteAllData}
              disabled={isDeleting}
              className="rounded-xl bg-destructive/75 backdrop-blur-xl border border-white/30 shadow-lg shadow-black/10 text-destructive-foreground hover:bg-destructive/90 disabled:opacity-60"
            >
              {isDeleting ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Menghapus...
                </span>
              ) : (
                "Hapus Semua"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default SettingsDialog;
