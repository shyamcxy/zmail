import React from "react";
import { motion } from "framer-motion";
import { useMailStore } from "../../stores/mailStore";
import { GmailLogo } from "../common/BrandLogo";
import { tactile } from "../../lib/tactileAudio";
import { Icons } from "../common/Icons";

export const AppHeader: React.FC = () => {
  const {
    accounts,
    selectedAccountId,
    selectAccount,
    connectGmail,
    theme,
    setTheme,
    setCommandPaletteOpen,
    setAiCopilotOpen,
    isAiCopilotOpen,
    setComposeOpen,
    setComposeMinimized,
    isSidebarExpanded,
    toggleSidebar,
    showConfirm,
    closeConfirm,
  } = useMailStore();

  const handleAddAccount = () => {
    showConfirm({
      title: "Connect Email Account",
      description: "You will be redirected to Google OAuth to authorize access to your mailbox securely without storing credentials in the cloud.",
      confirmLabel: "Continue to Sign In",
      isDestructive: false,
      onConfirm: async () => {
        closeConfirm();
        await connectGmail();
      },
    });
  };

  return (
    <header
      data-tauri-drag-region
      className="h-11 pr-3 pl-[80px] bg-[#F9F9F9] dark:bg-[#171717] border-b border-black/[0.06] dark:border-white/[0.06] flex items-center justify-between select-none flex-shrink-0 transition-colors duration-150 z-30"
    >
      {/* Left: Sidebar Toggle + Account Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        {/* Sidebar Toggle Button */}
        <button
          onClick={toggleSidebar}
          title={isSidebarExpanded ? "Close sidebar (Cmd+\\)" : "Open sidebar (Cmd+\\)"}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
        >
          <Icons.Sidebar size={16} />
        </button>

        {/* All Inboxes Unified Pill */}
        <div className="relative">
          {selectedAccountId === null && (
            <motion.div
              layoutId="active-account-pill"
              className="absolute inset-0 bg-white dark:bg-[#2F2F2F] rounded-lg shadow-2xs border border-black/5 dark:border-white/5 -z-0"
              transition={{ type: "spring", stiffness: 450, damping: 32 }}
            />
          )}
          <button
            onClick={() => {
              tactile.click();
              selectAccount(null);
            }}
            className={`relative z-10 flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-xs font-medium transition-colors duration-100 cursor-pointer ${
              selectedAccountId === null
                ? "text-zinc-900 dark:text-white"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/[0.05]"
            }`}
          >
            <GmailLogo className="w-3.5 h-3.5" />
            <span className="tracking-tight">All Inboxes</span>
          </button>
        </div>

        {accounts.map((acc) => {
          const isSelected = selectedAccountId === acc.id;
          const initials = (acc.displayName || acc.email).slice(0, 2).toUpperCase();

          return (
            <div key={acc.id} className="relative">
              {isSelected && (
                <motion.div
                  layoutId="active-account-pill"
                  className="absolute inset-0 bg-white dark:bg-[#2F2F2F] rounded-lg shadow-2xs border border-black/5 dark:border-white/5 -z-0"
                  transition={{ type: "spring", stiffness: 450, damping: 32 }}
                />
              )}
              <button
                onClick={() => {
                  tactile.click();
                  selectAccount(acc.id);
                }}
                className={`relative z-10 flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-xs font-medium transition-colors duration-100 cursor-pointer ${
                  isSelected
                    ? "text-zinc-900 dark:text-white"
                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/[0.05]"
                }`}
              >
                <div className="w-3.5 h-3.5 rounded-md bg-black/10 dark:bg-white/15 text-[9px] font-bold flex items-center justify-center">
                  {initials[0]}
                </div>
                <span className="truncate max-w-[120px] tracking-tight">{acc.displayName || acc.email}</span>
              </button>
            </div>
          );
        })}

        <button
          onClick={handleAddAccount}
          title="Connect another account"
          className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-800 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
        >
          <Icons.Add size={15} />
        </button>
      </div>

      {/* Center: Search Omnibox */}
      <button
        onClick={() => setCommandPaletteOpen(true)}
        className="hidden md:flex items-center gap-2 h-7 px-3 rounded-full bg-black/[0.03] dark:bg-white/[0.05] border border-black/5 dark:border-white/5 text-xs text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/10 transition-all cursor-pointer max-w-xs w-64 justify-between"
      >
        <div className="flex items-center gap-2 truncate">
          <Icons.Search size={14} className="text-zinc-400 flex-shrink-0" />
          <span className="truncate text-xs font-normal">Search messages...</span>
        </div>
        <kbd className="font-mono text-[10px] bg-black/5 dark:bg-white/10 px-1.5 py-0.2 rounded text-zinc-400 font-semibold flex-shrink-0">
          ⌘K
        </kbd>
      </button>

      {/* Right Controls: Compose, Copilot toggle, Theme */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {/* Compose Trigger */}
        <button
          onClick={() => {
            setComposeOpen(true);
            setComposeMinimized(false);
          }}
          title="New message (C)"
          className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
        >
          <Icons.Edit size={16} />
        </button>

        {/* Copilot Toggle */}
        <button
          onClick={() => setAiCopilotOpen(!isAiCopilotOpen)}
          title="Toggle Copilot (Cmd+J)"
          className={`h-7 px-2.5 rounded-lg flex items-center gap-1.5 text-xs font-medium transition-all duration-100 cursor-pointer ${
            isAiCopilotOpen
              ? "bg-[#10A37F] text-white shadow-2xs font-semibold"
              : "bg-black/5 dark:bg-white/[0.06] text-zinc-700 dark:text-zinc-300 hover:bg-black/10 dark:hover:bg-white/10"
          }`}
        >
          <Icons.Sparkles size={14} />
          <span className="hidden sm:inline tracking-tight">Copilot</span>
        </button>

        {/* Theme Switcher Toggle */}
        <div className="flex items-center p-0.5 rounded-lg bg-black/5 dark:bg-white/[0.05]">
          {[
            { id: "light", label: "Light", icon: Icons.Sun },
            { id: "dark", label: "Dark", icon: Icons.Moon },
            { id: "system", label: "Auto", icon: Icons.Laptop },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTheme(id as "light" | "dark" | "system")}
              title={label}
              className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors duration-100 cursor-pointer ${
                theme === id
                  ? "bg-white dark:bg-[#2F2F2F] text-zinc-950 dark:text-white shadow-2xs font-medium"
                  : "text-zinc-400 hover:text-zinc-800 dark:hover:text-white"
              }`}
            >
              <Icon size={13} />
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};

