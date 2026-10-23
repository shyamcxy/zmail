import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Search, Check } from "lucide-react";
import { SenderAvatar } from "../common/BrandLogo";
import { BenchoCopyButton } from "./BenchoCopyButton";
import { useMailStore } from "../../stores/mailStore";

interface BenchoProfileCardProps {
  email: string;
  name?: string;
  children: React.ReactNode;
}

export const BenchoProfileCard: React.FC<BenchoProfileCardProps> = ({
  email,
  name,
  children,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const { setSearchQuery } = useMailStore();

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => {
      setIsOpen(true);
    }, 280);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => {
      setIsOpen(false);
    }, 200);
  };

  const handleSearchSender = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSearchQuery(`from:${email}`);
    setIsOpen(false);
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 4 }}
            transition={{ type: "spring", stiffness: 450, damping: 30 }}
            className="absolute top-full left-0 mt-2 z-50 w-72 rounded-2xl bg-[#FFFFFF] dark:bg-[#212121] border border-black/10 dark:border-white/10 shadow-xl p-4 select-none backdrop-blur-md"
          >
            {/* Header: Avatar + Verification badge */}
            <div className="flex items-start gap-3 mb-3">
              <SenderAvatar email={email} name={name} size={48} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate tracking-tight">
                    {name || email.split("@")[0]}
                  </h4>
                  <ShieldCheck className="w-3.5 h-3.5 text-[#10A37F] flex-shrink-0" />
                </div>
                <div className="text-xs font-mono text-zinc-400 truncate mt-0.5">
                  {email}
                </div>
              </div>
            </div>

            {/* Security Verification Metrics */}
            <div className="p-2.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/5 dark:border-white/5 space-y-1.5 mb-3">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-zinc-500">Authentication</span>
                <span className="font-semibold text-[#10A37F] flex items-center gap-1">
                  <Check className="w-3 h-3" /> SPF & DKIM Pass
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-zinc-500">Encryption</span>
                <span className="font-mono text-zinc-700 dark:text-zinc-300">TLS 1.3</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-zinc-500">Privacy Status</span>
                <span className="font-semibold text-zinc-700 dark:text-zinc-300">Trackers Blocked</span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 pt-1 border-t border-black/[0.06] dark:border-white/[0.06]">
              <BenchoCopyButton textToCopy={email} label="Copy" className="flex-1 justify-center" />
              <button
                type="button"
                onClick={handleSearchSender}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                <Search className="w-3 h-3" />
                <span>Find Mails</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
