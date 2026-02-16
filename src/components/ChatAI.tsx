import { useState, useRef, useEffect } from "react";
import { Bot, X, Send, Trash2, Sparkles, MessageCircle, AlertCircle, Maximize2, Minimize2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { toast } from "sonner";
import { useLocation } from "react-router-dom";

interface Message {
    role: "user" | "model";
    content: string;
}

const STORAGE_KEY = "patungan_chat_history";
const API_KEY_STORAGE_KEY = "patungan_gemini_api_key";

const ChatAI = () => {
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);
    const [isMaximized, setIsMaximized] = useState(true);
    const [messages, setMessages] = useState<Message[]>(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
    });
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isMobile, setIsMobile] = useState(false);

    // Initial check and resize listener for mobile
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    // Auto scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isLoading, isOpen, isMaximized]);

    // Persist messages
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }, [messages]);

    // Visibility logic: Only on Home page
    const isVisible = location.pathname === "/";

    if (!isVisible) return null;

    const handleSend = async () => {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY?.trim();
        if (!apiKey || apiKey === "your_api_key_here") {
            toast.error("Gemini API Key belum dikonfigurasi di environment!");
            return;
        }

        if (!input.trim() || isLoading) return;

        const userMessage: Message = { role: "user", content: input.trim() };
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        try {
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({
                model: "gemini-2.5-flash-lite",
                systemInstruction: "Kamu adalah Patungan AI, asisten pintar untuk aplikasi 'Patungan By Nexteam'. Tugasmu adalah membantu pengguna memahami fitur aplikasi dan memberikan tips terkait pengelolaan pengeluaran atau rencana trip.\n\n" +
                    "Fitur Aplikasi Patungan:\n" +
                    "1. Split Bill (Bagi Rata): Membagi total tagihan secara merata.\n" +
                    "2. Custom Split Bill: Membagi tagihan berdasarkan item per orang. Bisa ekspor PDF & share WhatsApp.\n" +
                    "3. Catatan (Notes): Mencatat daftar belanja/trip dengan fitur filter & reorder.\n" +
                    "4. Kantongin: Manajemen uang (link ke ekosistem Nexteam).\n" +
                    "5. Settings (⚙️): Ganti Dark/Light mode, atur API Key, atau hapus semua data.\n\n" +
                    "Berikan jawaban yang ramah, ringkas, dan solutif dalam Bahasa Indonesia."
            });

            const chatSession = model.startChat({
                history: messages.map(m => ({
                    role: m.role,
                    parts: [{ text: m.content }],
                })),
            });

            const result = await chatSession.sendMessage(userMessage.content);
            const response = await result.response;
            const text = response.text();

            setMessages((prev) => [...prev, { role: "model", content: text }]);
        } catch (error) {
            console.error("Gemini Error:", error);
            toast.error("Gagal menghubungi AI. Cek konfigurasi API Key.");
            setMessages((prev) => [...prev, { role: "model", content: "Maaf, terjadi kesalahan saat menghubungi AI. Pastikan API Key benar dan internet lancar." }]);
        } finally {
            setIsLoading(false);
        }
    };

    const clearChat = () => {
        setMessages([]);
        localStorage.removeItem(STORAGE_KEY);
        toast.success("Riwayat chat dihapus");
    };

    return (
        <div className="fixed bottom-20 md:bottom-8 left-6 z-[60]">
            {/* Floating Button */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-shadow"
            >
                {isOpen ? <X className="h-6 w-6" /> : <Sparkles className="h-7 w-7" />}
            </motion.button>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        layout
                        initial={isMobile && isMaximized ? { opacity: 0, y: "100%" } : { opacity: 0, y: 20, scale: 0.9, originX: 0, originY: 1 }}
                        animate={isMobile && isMaximized ? { opacity: 1, y: 0 } : { opacity: 1, y: 0, scale: 1 }}
                        exit={isMobile && isMaximized ? { opacity: 0, y: "100%" } : { opacity: 0, y: 20, scale: 0.9 }}
                        transition={{
                            layout: { type: "spring", damping: 30, stiffness: 300 },
                            opacity: { duration: 0.2 }
                        }}
                        className={`
                            fixed md:absolute bg-card border border-border shadow-2xl flex flex-col overflow-hidden
                            ${isMobile && isMaximized
                                ? "inset-0 w-full h-full rounded-none z-[75]"
                                : isMobile && !isMaximized
                                    ? "bottom-24 left-4 right-4 h-[550px] max-h-[75vh] rounded-2xl z-[75]"
                                    : "bottom-16 left-0 w-[400px] h-[500px] max-h-[70vh] rounded-2xl"
                            }
                        `}
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                    <Sparkles className="h-4 w-4" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-foreground">Patungan AI</h3>
                                    <p className="text-[10px] text-muted-foreground leading-tight">Gemini 2.5 Flash Lite</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={clearChat}
                                    className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                    title="Hapus riwayat chat"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                                {isMobile && (
                                    <button
                                        onClick={() => setIsMaximized(!isMaximized)}
                                        className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted transition-colors"
                                        title={isMaximized ? "Minimize" : "Maximize"}
                                    >
                                        {isMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                                    </button>
                                )}
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted transition-colors"
                                    title="Tutup"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                            {messages.length === 0 && (
                                <div className="text-center py-10 space-y-3">
                                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                                        <MessageCircle className="h-8 w-8 text-muted-foreground" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-foreground">Halo! Saya AI Patungan.</p>
                                        <p className="text-xs text-muted-foreground px-6 text-pretty">
                                            Tanyakan apa saja seputar pengeluaran, tips trip, atau bantuan lainnya.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {messages.map((m, i) => (
                                <div
                                    key={i}
                                    className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                                >
                                    <div
                                        className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm leading-relaxed ${m.role === "user"
                                            ? "bg-primary text-primary-foreground rounded-tr-none"
                                            : "bg-muted text-foreground rounded-tl-none border border-border"
                                            }`}
                                    >
                                        {m.content}
                                    </div>
                                </div>
                            ))}

                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-muted text-foreground rounded-2xl p-3 flex gap-1 rounded-tl-none border border-border">
                                        <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                        <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                        <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce"></span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input Area */}
                        <div className="p-3 pb-8 md:pb-3 border-t border-border bg-muted/10 shrink-0">
                            <div className="relative">
                                <textarea
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSend();
                                        }
                                    }}
                                    placeholder="Ketik pesan..."
                                    rows={1}
                                    className="w-full rounded-xl border border-input bg-card pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none max-h-32"
                                    style={{ height: `${Math.min(input.split("\n").length * 20 + 44, 128)}px` }}
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!input.trim() || isLoading}
                                    className="absolute right-2 bottom-5 md:bottom-5 h-9 w-9 flex items-center justify-center rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
                                >
                                    <Send className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ChatAI;
