import React, { useEffect } from "react";
import { useMailStore } from "../../stores/mailStore";
import { Icons } from "./Icons";

export const KeyboardShortcutsModal: React.FC = () => {
  const { isShortcutsModalOpen, setShortcutsModalOpen } = useMailStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      if (e.key === "?" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setShortcutsModalOpen(!isShortcutsModalOpen);
      } else if (e.key === "Escape" && isShortcutsModalOpen) {
        e.preventDefault();
        setShortcutsModalOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isShortcutsModalOpen, setShortcutsModalOpen]);

  if (!isShortcutsModalOpen) return null;

  const shortcutGroups = [
    {
      title: "Navigation",
      items: [
        { label: "Next message", keys: ["J", "↓"] },
        { label: "Previous message", keys: ["K", "↑"] },
        { label: "Toggle sidebar", keys: ["⌘", "\\"] },
        { label: "Back to list", keys: ["Esc"] },
      ],
    },
    {
      title: "Actions",
      items: [
        { label: "Archive message", keys: ["E"] },
        { label: "Delete message", keys: ["#"] },
        { label: "Star message", keys: ["S"] },
        { label: "Reply", keys: ["R"] },
        { label: "Open Copilot", keys: ["⌘", "J"] },
        { label: "Command Palette", keys: ["⌘", "K"] },
      ],
    },
    {
      title: "Mailboxes",
      items: [
        { label: "Go to Inbox", keys: ["G", "I"] },
        { label: "Go to Subscriptions", keys: ["G", "N"] },
        { label: "Shortcuts reference", keys: ["?"] },
      ],
    },
    {
      title: "Composer",
      items: [
        { label: "New message", keys: ["C"] },
        { label: "Send email", keys: ["⌘", "↵"] },
        { label: "Discard draft", keys: ["Esc"] },
      ],
    },
  ];

  return (
    <div
      onClick={() => setShortcutsModalOpen(false)}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-100 select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-xl bg-white dark:bg-[#212121] border border-black/[0.08] dark:border-white/[0.08] shadow-lg p-6 relative animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-black/[0.06] dark:border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-black/5 dark:bg-white/10 flex items-center justify-center text-zinc-700 dark:text-zinc-200">
              <kbd className="font-mono text-xs font-bold">⌘</kbd>
            </div>
            <h2 className="text-sm font-semibold text-zinc-950 dark:text-white tracking-tight">
              Keyboard Shortcuts
            </h2>
          </div>

          <button
            onClick={() => setShortcutsModalOpen(false)}
            className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-white rounded-md transition-colors cursor-pointer"
          >
            <Icons.Close size={15} />
          </button>
        </div>

        {/* Shortcuts Grid */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-4 pt-4">
          {shortcutGroups.map((group) => (
            <div key={group.title} className="space-y-2">
              <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-semibold">
                {group.title}
              </div>
              <div className="space-y-1.5">
                {group.items.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between text-xs py-0.5"
                  >
                    <span className="text-zinc-600 dark:text-zinc-300 tracking-tight">
                      {item.label}
                    </span>
                    <div className="flex items-center gap-1">
                      {item.keys.map((k, i) => (
                        <kbd
                          key={i}
                          className="min-w-[20px] h-5 px-1.5 rounded-md bg-black/5 dark:bg-white/10 text-zinc-700 dark:text-zinc-200 text-[10px] font-mono font-semibold flex items-center justify-center border border-black/5 dark:border-white/10"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="pt-4 mt-4 border-t border-black/[0.06] dark:border-white/[0.06] flex items-center justify-between text-[11px] text-zinc-400">
          <span>Press <kbd className="font-mono text-zinc-600 dark:text-zinc-300 font-semibold">?</kbd> anytime to toggle</span>
          <button
            onClick={() => setShortcutsModalOpen(false)}
            className="px-3.5 py-1.5 rounded-full bg-black text-white dark:bg-white dark:text-black text-xs font-semibold hover:opacity-90 transition-all cursor-pointer shadow-xs active:scale-95"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

