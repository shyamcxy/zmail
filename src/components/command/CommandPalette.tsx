import React, { useState, useEffect } from "react";
import { useMailStore } from "../../stores/mailStore";
import { Icons } from "../common/Icons";

export const CommandPalette: React.FC = () => {
  const {
    isCommandPaletteOpen,
    setCommandPaletteOpen,
    setComposeOpen,
    setAiCopilotOpen,
    selectView,
    triggerSync,
    setTheme,
  } = useMailStore();

  const [search, setSearch] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen(!isCommandPaletteOpen);
      } else if (e.key === "Escape" && isCommandPaletteOpen) {
        e.preventDefault();
        setCommandPaletteOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCommandPaletteOpen, setCommandPaletteOpen]);

  if (!isCommandPaletteOpen) return null;

  const actions = [
    {
      id: "ai_copilot",
      label: "Open Copilot",
      icon: Icons.Sparkles,
      shortcut: "⌘J",
      run: () => setAiCopilotOpen(true),
    },
    {
      id: "compose",
      label: "New Message",
      icon: Icons.Edit,
      shortcut: "C",
      run: () => setComposeOpen(true),
    },
    {
      id: "theme_light",
      label: "Switch to Light Mode",
      icon: Icons.Sun,
      run: () => setTheme("light"),
    },
    {
      id: "theme_dark",
      label: "Switch to Dark Mode",
      icon: Icons.Moon,
      run: () => setTheme("dark"),
    },
    {
      id: "theme_system",
      label: "Use System Theme",
      icon: Icons.Laptop,
      run: () => setTheme("system"),
    },
    {
      id: "inbox",
      label: "Go to Inbox",
      icon: Icons.Mail,
      shortcut: "G I",
      run: () => selectView("inbox"),
    },
    {
      id: "starred",
      label: "Go to Starred",
      icon: Icons.Star,
      shortcut: "S",
      run: () => selectView("starred"),
    },
    {
      id: "newsletters",
      label: "Subscriptions",
      icon: Icons.News,
      shortcut: "G N",
      run: () => selectView("newsletters"),
    },
    {
      id: "sync",
      label: "Sync Mail",
      icon: Icons.Reload,
      run: () => triggerSync(),
    },
  ];

  const filtered = actions.filter((a) =>
    a.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center pt-24 p-4 animate-in fade-in duration-100">
      <div className="w-full max-w-lg bg-white dark:bg-[#212121] border border-black/[0.08] dark:border-white/[0.08] rounded-xl flex flex-col overflow-hidden shadow-lg select-none">
        {/* Search Input */}
        <div className="h-11 px-3.5 border-b border-black/[0.06] dark:border-white/[0.06] flex items-center gap-2.5">
          <Icons.Search size={16} className="text-zinc-400 flex-shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Type a command or search..."
            autoFocus
            className="flex-1 bg-transparent text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 outline-none font-medium"
          />
          <button
            onClick={() => setCommandPaletteOpen(false)}
            className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-white cursor-pointer rounded-md"
          >
            <Icons.Close size={14} />
          </button>
        </div>

        {/* Action List */}
        <div className="p-1.5 max-h-72 overflow-y-auto space-y-0.5">
          {filtered.length === 0 ? (
            <div className="p-4 text-center text-xs text-zinc-400 font-mono">
              No matching commands
            </div>
          ) : (
            filtered.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  onClick={() => {
                    action.run();
                    setCommandPaletteOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[#ECECEC] dark:hover:bg-[#2F2F2F] text-xs text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white transition-all cursor-pointer text-left group"
                >
                  <div className="flex items-center gap-2.5">
                    <Icon size={15} className="text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors" />
                    <span className="font-medium tracking-tight">{action.label}</span>
                  </div>
                  {action.shortcut && (
                    <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-black/5 dark:bg-white/10 text-zinc-500 dark:text-zinc-400 border border-black/5 dark:border-white/10 font-semibold">
                      {action.shortcut}
                    </kbd>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Footer Hint */}
        <div className="h-8 px-4 border-t border-black/[0.05] dark:border-white/[0.05] bg-transparent flex items-center justify-between text-[10px] font-mono text-zinc-400 select-none">
          <span>Navigate with arrows</span>
          <span>
            <kbd className="text-zinc-600 dark:text-zinc-300 font-semibold">Esc</kbd> dismiss
          </span>
        </div>
      </div>
    </div>
  );
};

