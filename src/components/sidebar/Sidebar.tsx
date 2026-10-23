import React from "react";
import {
  Inbox,
  Sparkles,
  Star,
  Newspaper,
  Archive,
  Trash2,
  Plus,
  Command,
  Sun,
  Moon,
  Laptop,
  RotateCw,
  LogOut,
} from "lucide-react";
import { useMailStore } from "../../stores/mailStore";
import { GmailLogo } from "../common/BrandLogo";

export const Sidebar: React.FC = () => {
  const {
    accounts,
    selectedAccountId,
    selectAccount,
    selectedView,
    selectView,
    messages,
    isSyncing,
    triggerSync,
    connectGmail,
    disconnectAccount,
    setComposeOpen,
    setComposeMinimized,
    setCommandPaletteOpen,
    setAiCopilotOpen,
    theme,
    setTheme,
  } = useMailStore();

  const unreadCount = messages.filter((m) => !m.isRead).length;

  return (
    <aside className="w-60 h-full bg-[#F3F4F6] dark:bg-[#0D0F12] border-r border-black/10 dark:border-white/[0.07] flex flex-col justify-between select-none transition-colors duration-150 flex-shrink-0">
      <div>
        {/* Top Header with dedicated macOS Traffic Light space */}
        <div
          data-tauri-drag-region
          className="h-11 pl-[78px] pr-3 flex items-center justify-between border-b border-black/10 dark:border-white/[0.06]"
        >
          <span className="font-semibold text-xs tracking-tight text-zinc-900 dark:text-[#EDEDED]">
            Zmail
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setAiCopilotOpen(true)}
              title="Open AI Copilot (Cmd+J)"
              className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/20 text-[11px] font-medium transition-colors cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-purple-500" />
              <span>Copilot</span>
            </button>

            <button
              onClick={() => setCommandPaletteOpen(true)}
              title="Command Palette (Cmd+K)"
              className="p-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded hover:bg-black/5 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              <Command className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Compose Button */}
        <div className="p-2.5">
          <button
            onClick={() => {
              setComposeOpen(true);
              setComposeMinimized(false);
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-white dark:bg-white/[0.07] hover:bg-zinc-50 dark:hover:bg-white/[0.12] border border-black/10 dark:border-white/[0.08] text-xs text-zinc-900 dark:text-[#EDEDED] font-medium transition-colors cursor-pointer shadow-xs"
          >
            <span className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
              New Message
            </span>
            <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/5 dark:bg-black/40 text-zinc-400 border border-black/10 dark:border-white/[0.06]">
              C
            </kbd>
          </button>
        </div>

        {/* Main Navigation Views */}
        <nav className="px-2 space-y-0.5">
          <button
            onClick={() => selectView("inbox")}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
              selectedView === "inbox" && selectedAccountId === null
                ? "bg-black/5 dark:bg-white/[0.08] text-zinc-900 dark:text-white font-medium"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/[0.03]"
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Inbox className="w-3.5 h-3.5 text-blue-500" />
              All Inboxes
            </span>
            {unreadCount > 0 && (
              <span className="font-mono tabular-nums text-[10px] px-1.5 py-0.2 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/25">
                {unreadCount}
              </span>
            )}
          </button>

          <button
            onClick={() => selectView("starred")}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
              selectedView === "starred"
                ? "bg-black/5 dark:bg-white/[0.08] text-zinc-900 dark:text-white font-medium"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/[0.03]"
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Star className="w-3.5 h-3.5 text-amber-500" />
              Starred
            </span>
          </button>

          <button
            onClick={() => selectView("newsletters")}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
              selectedView === "newsletters"
                ? "bg-black/5 dark:bg-white/[0.08] text-zinc-900 dark:text-white font-medium"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/[0.03]"
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Newspaper className="w-3.5 h-3.5 text-emerald-500" />
              Subscriptions
            </span>
          </button>

          <button
            onClick={() => selectView("archive")}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
              selectedView === "archive"
                ? "bg-black/5 dark:bg-white/[0.08] text-zinc-900 dark:text-white font-medium"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/[0.03]"
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Archive className="w-3.5 h-3.5 text-zinc-400" />
              Archive
            </span>
          </button>

          <button
            onClick={() => selectView("trash")}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
              selectedView === "trash"
                ? "bg-black/5 dark:bg-white/[0.08] text-zinc-900 dark:text-white font-medium"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/[0.03]"
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
              Trash
            </span>
          </button>
        </nav>

        {/* Accounts List Section with Real Official Gmail Logo */}
        <div className="mt-5 px-3">
          <div className="flex items-center justify-between mb-1.5 px-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Accounts
            </span>
            <button
              onClick={() => connectGmail()}
              title="Connect Gmail Account"
              className="p-1 rounded text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-0.5">
            {accounts.map((acc) => {
              const isSelected = selectedAccountId === acc.id;
              return (
                <div
                  key={acc.id}
                  className={`w-full group flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors text-left ${
                    isSelected
                      ? "bg-black/5 dark:bg-white/[0.08] text-zinc-900 dark:text-white font-medium"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/[0.03]"
                  }`}
                >
                  <button
                    onClick={() => selectAccount(acc.id)}
                    className="flex-1 flex items-center gap-2 truncate cursor-pointer text-left"
                  >
                    <GmailLogo className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{acc.displayName || acc.email}</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      disconnectAccount(acc.id);
                    }}
                    title="Disconnect account"
                    className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-rose-500 transition-opacity cursor-pointer"
                  >
                    <LogOut className="w-3 h-3" />
                  </button>
                </div>
              );
            })}

            {accounts.length === 0 && (
              <button
                onClick={() => connectGmail()}
                className="w-full flex items-center justify-center gap-2 px-2.5 py-2 rounded-lg border border-dashed border-black/10 dark:border-white/[0.1] text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:border-black/20 dark:hover:border-white/[0.2] hover:bg-black/5 dark:hover:bg-white/[0.03] transition-colors cursor-pointer"
              >
                <GmailLogo className="w-4 h-4" />
                <span>Connect Gmail</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Footer: Sync Status & Theme Switcher */}
      <div className="p-3 border-t border-black/10 dark:border-white/[0.06] space-y-2">
        <div className="flex items-center justify-between px-2 py-0.5 text-[11px] text-zinc-500">
          <span className="flex items-center gap-1.5">
            <RotateCw className={`w-3 h-3 ${isSyncing ? "animate-spin text-blue-500" : "text-zinc-400"}`} />
            <span>{isSyncing ? "Syncing..." : "Up to date"}</span>
          </span>
          <button
            onClick={() => triggerSync()}
            disabled={isSyncing}
            className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer disabled:opacity-50"
          >
            Sync
          </button>
        </div>

        {/* Tactile 3-Way Theme Switcher (Light / Dark / Auto) */}
        <div className="grid grid-cols-3 p-0.5 rounded-lg bg-black/5 dark:bg-white/[0.05] border border-black/5 dark:border-white/[0.06]">
          <button
            onClick={() => setTheme("light")}
            title="Light Mode"
            className={`flex items-center justify-center gap-1 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
              theme === "light"
                ? "bg-white text-zinc-900 shadow-xs"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            <Sun className="w-3 h-3" />
            <span>Light</span>
          </button>

          <button
            onClick={() => setTheme("dark")}
            title="Dark Mode"
            className={`flex items-center justify-center gap-1 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
              theme === "dark"
                ? "bg-zinc-800 text-white shadow-xs"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            <Moon className="w-3 h-3" />
            <span>Dark</span>
          </button>

          <button
            onClick={() => setTheme("system")}
            title="Follow macOS System"
            className={`flex items-center justify-center gap-1 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
              theme === "system"
                ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            <Laptop className="w-3 h-3" />
            <span>Auto</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
