import { Coffee } from "lucide-react";
import { motion } from "framer-motion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const CoffeeBubble = () => {
  return (
    <div className="fixed bottom-16 sm:bottom-20 md:bottom-6 right-4 sm:right-6 z-50">
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
              className="flex h-10 w-10 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-foreground/75 backdrop-blur-xl border border-white/30 text-background shadow-lg shadow-black/10 hover:bg-foreground/90 transition-all font-bold"
            >
              <Coffee className="h-4 w-4 sm:h-6 sm:w-6" />
            </motion.a>
          </TooltipTrigger>
          <TooltipContent side="left" className="glass glass-sheen rounded-xl text-foreground">
            <p className="font-medium text-sm">Dukung Kita ya! ☕️</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default CoffeeBubble;
