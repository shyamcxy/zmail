import React, { useState } from "react";
import { Copy, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { tactile } from "../../lib/tactileAudio";

interface BenchoCopyButtonProps {
  textToCopy: string;
  label?: string;
  className?: string;
  size?: number;
}

export const BenchoCopyButton: React.FC<BenchoCopyButtonProps> = ({
  textToCopy,
  label,
  className = "",
  size = 14,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    tactile.click();

    setTimeout(() => {
      setCopied(false);
    }, 1800);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={copied ? "Copied!" : "Copy to clipboard"}
      className={`relative inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-all duration-150 cursor-pointer active:scale-95 hover:bg-black/5 dark:hover:bg-white/10 ${
        copied
          ? "text-[#10A37F] bg-[#10A37F]/10 dark:bg-[#10A37F]/15"
          : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
      } ${className}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        {copied ? (
          <motion.span
            key="check"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 25 }}
            className="flex items-center"
          >
            <Check size={size} strokeWidth={2.5} className="text-[#10A37F]" />
          </motion.span>
        ) : (
          <motion.span
            key="copy"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="flex items-center"
          >
            <Copy size={size} strokeWidth={2} />
          </motion.span>
        )}
      </AnimatePresence>
      {label && <span>{copied ? "Copied!" : label}</span>}
    </button>
  );
};
