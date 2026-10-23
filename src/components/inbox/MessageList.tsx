import React, { useEffect } from "react";
import {
  Columns2,
  Rows,
  Inbox,
  Building2,
  Megaphone,
  Users,
  CircleDot,
  Radio,
} from "lucide-react";
import { useMailStore } from "../../stores/mailStore";
import { MessageRow } from "./MessageRow";
import { Icons } from "../common/Icons";

export const MessageList: React.FC = () => {
  const {
    messages,
    selectedMessageId,
    selectMessage,
    toggleStar,
    archiveMessage,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    selectCategory,
    isSyncing,
    triggerSync,
    layoutMode,
    setLayoutMode,
    categoryCounts,
    isUnreadOnly,
    setIsUnreadOnly,
  } = useMailStore();

  // Keyboard navigation: J/K to move, E to archive, S to star
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      const currentIndex = messages.findIndex((m) => m.id === selectedMessageId);

      if (e.key === "j" || e.key === "ArrowDown") {
        e.preventDefault();
        const nextIndex = Math.min(currentIndex + 1, messages.length - 1);
        if (messages[nextIndex]) {
          selectMessage(messages[nextIndex].id);
        }
      } else if (e.key === "k" || e.key === "ArrowUp") {
        e.preventDefault();
        const prevIndex = Math.max(currentIndex - 1, 0);
        if (messages[prevIndex]) {
          selectMessage(messages[prevIndex].id);
        }
      } else if (e.key === "e") {
        if (selectedMessageId) {
          e.preventDefault();
          archiveMessage(selectedMessageId);
        }
      } else if (e.key === "s") {
        if (selectedMessageId) {
          e.preventDefault();
          toggleStar(selectedMessageId);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [messages, selectedMessageId, selectMessage, archiveMessage, toggleStar]);

  const categories = [
    { id: null, label: "All", count: categoryCounts.all, icon: null },
    { id: "primary", label: "Primary", count: categoryCounts.primary, icon: Inbox },
    { id: "company", label: "Company", count: categoryCounts.company, icon: Building2 },
    { id: "promotion", label: "Promo", count: categoryCounts.promotion, icon: Megaphone },
    { id: "social", label: "Social", count: categoryCounts.social, icon: Users },
  ];

  return (
    <div
      className={`${
        layoutMode === "list" ? "flex-1 w-full" : "w-[360px] xl:w-[390px] flex-shrink-0"
      } h-full bg-[#FFFFFF] dark:bg-[#171717] border-r border-black/[0.06] dark:border-white/[0.06] flex flex-col transition-colors duration-150 z-10`}
    >
      {/* Category Pills Strip (ChatGPT Desktop Style) */}
      <div className="pt-2 px-3 pb-2 border-b border-black/[0.05] dark:border-white/[0.05] flex items-center justify-between gap-1.5 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            const Icon = cat.icon;
            return (
              <button
                key={cat.label}
                onClick={() => selectCategory(cat.id)}
                className={`flex items-center gap-1.5 h-6 px-2.5 rounded-full text-xs font-medium transition-all duration-100 cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? "bg-black text-white dark:bg-white dark:text-black shadow-2xs font-semibold"
                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
                }`}
              >
                {Icon && <Icon className="w-3 h-3" />}
                <span className="tracking-tight">{cat.label}</span>
                {cat.count > 0 && (
                  <span
                    className={`text-[10px] font-mono tabular-nums ${
                      isSelected
                        ? "text-zinc-300 dark:text-zinc-600 font-bold"
                        : "text-zinc-400"
                    }`}
                  >
                    {cat.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* View Layout & Filter Controls */}
        <div className="flex items-center gap-1 flex-shrink-0 pl-1">
          <button
            onClick={() => setIsUnreadOnly(!isUnreadOnly)}
            title={isUnreadOnly ? "Showing unread only" : "Filter by unread"}
            className={`p-1 rounded-md transition-colors cursor-pointer ${
              isUnreadOnly
                ? "bg-[#10A37F]/15 text-[#10A37F]"
                : "text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
            }`}
          >
            <CircleDot className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setLayoutMode(layoutMode === "split" ? "list" : "split")}
            title={layoutMode === "split" ? "Switch to Full List View" : "Switch to Side-by-Side View"}
            className="p-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            {layoutMode === "split" ? (
              <Columns2 className="w-3.5 h-3.5 text-zinc-900 dark:text-white" />
            ) : (
              <Rows className="w-3.5 h-3.5" />
            )}
          </button>

          <button
            onClick={() => triggerSync()}
            disabled={isSyncing}
            title="Sync mailboxes"
            className="p-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Icons.Reload size={14} className={isSyncing ? "animate-spin text-[#10A37F]" : ""} />
          </button>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="p-2 border-b border-black/[0.05] dark:border-white/[0.05]">
        <div className="relative">
          <Icons.Search size={14} className="text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search messages..."
            className="w-full bg-[#F4F4F4] dark:bg-[#2F2F2F] border border-black/5 dark:border-white/5 rounded-lg pl-8 pr-7 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 outline-none transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
            >
              <Icons.Close size={14} />
            </button>
          )}
        </div>
      </div>


      {/* Clean Non-Overlapping Message List */}
      <div className="flex-1 overflow-y-auto px-1.5 py-1 space-y-0.5">
        {messages.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-center px-4">
            <Radio className="w-5 h-5 text-zinc-400 mb-2 opacity-50" />
            <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-0.5">No messages</p>
            <span className="text-[11px] text-zinc-400">
              {searchQuery ? "No matches found" : isUnreadOnly ? "All messages read" : "Inbox zero"}
            </span>
          </div>
        ) : (
          messages.map((message) => (
            <MessageRow
              key={message.id}
              message={message}
              isSelected={message.id === selectedMessageId}
              onSelect={() => selectMessage(message.id)}
              onToggleStar={() => toggleStar(message.id)}
            />
          ))
        )}
      </div>

      {/* Footer Info Telemetry */}
      <div className="h-7 px-3 border-t border-black/[0.05] dark:border-white/[0.05] bg-transparent flex items-center justify-between text-[10px] text-zinc-400 select-none">
        <span>{messages.length} messages</span>
        <span>
          <kbd className="font-semibold text-zinc-600 dark:text-zinc-400">J</kbd>/<kbd className="font-semibold text-zinc-600 dark:text-zinc-400">K</kbd> to move
        </span>
      </div>
    </div>
  );
};
