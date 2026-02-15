import { Coffee } from "lucide-react";
import { motion } from "framer-motion";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

const CoffeeBubble = () => {
    return (
        <div className="fixed bottom-20 md:bottom-6 right-6 z-50">
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <motion.a
                            href="https://lynk.id/nexteam/s/v1xwgxzxod9l"
                            target="_blank"
                            rel="noopener noreferrer"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="flex h-14 w-14 items-center justify-center rounded-full bg-foreground text-background shadow-lg shadow-foreground/20 hover:opacity-90 transition-all font-bold"
                        >
                            <Coffee className="h-6 w-6" />
                        </motion.a>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="bg-card text-card-foreground border-border">
                        <p className="font-medium text-sm">Dukung Kita ya! ☕️</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
    );
};

export default CoffeeBubble;
