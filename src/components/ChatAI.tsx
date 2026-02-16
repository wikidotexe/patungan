import { useState, useRef, useEffect } from "react";
import { Bot, X, Send, Trash2, Sparkles, MessageCircle, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { toast } from "sonner";

interface Message {
    role: "user" | "model";
    content: string;
}

const STORAGE_KEY = "patungan_chat_history";
const API_KEY_STORAGE_KEY = "patungan_gemini_api_key";

const ChatAI = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
    });
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    // Persist messages
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }, [messages]);

    const handleSend = async () => {
        const apiKey = localStorage.getItem(API_KEY_STORAGE_KEY)?.trim();
        if (!apiKey) {
            toast.error("Set Gemini API Key di Settings terlebih dahulu!");
            return;
        }

        if (!input.trim() || isLoading) return;

        const userMessage: Message = { role: "user", content: input.trim() };
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        try {
            const genAI = new GoogleGenerativeAI(apiKey);
            // Using gemini-2.0-flash as requested (referenced as 2.5 by user)
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

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
            toast.error("Gagal menghubungi AI. Cek API Key Anda.");
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
                        initial={{ opacity: 0, y: 20, scale: 0.9, originX: 0, originY: 1 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        className="absolute bottom-16 left-0 w-[calc(100vw-3rem)] sm:w-[400px] h-[500px] max-h-[70vh] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                    <Sparkles className="h-4 w-4" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-foreground">Patungan AI</h3>
                                    <p className="text-[10px] text-muted-foreground leading-tight">Gemini 2.5 Flash</p>
                                </div>
                            </div>
                            <button
                                onClick={clearChat}
                                className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                title="Hapus riwayat chat"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
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

                            {/* No API Key Warning */}
                            {!localStorage.getItem(API_KEY_STORAGE_KEY) && (
                                <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-3 flex gap-3">
                                    <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
                                    <div>
                                        <p className="text-xs font-bold text-destructive">API Key Belum Ada</p>
                                        <p className="text-[10px] text-destructive/80 mt-0.5">
                                            Silakan ke **Settings** untuk memasukkan Gemini API Key agar bisa menggunakan AI.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input Area */}
                        <div className="p-3 border-t border-border bg-muted/10">
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
                                    className="absolute right-2 bottom-5 h-9 w-9 flex items-center justify-center rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
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
