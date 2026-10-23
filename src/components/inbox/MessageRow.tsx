import React from "react";
import { CheckCircle2 } from "lucide-react";
import { Message } from "../../lib/types";
import { SenderAvatar } from "../common/BrandLogo";
import { BenchoProfileCard } from "../bencho/BenchoProfileCard";
import { tactile } from "../../lib/tactileAudio";
import { Icons } from "../common/Icons";

interface MessageRowProps {
  message: Message;
  isSelected: boolean;
  onSelect: () => void;
  onToggleStar: (e: React.MouseEvent) => void;
}

export const MessageRow: React.FC<MessageRowProps> = ({
  message,
  isSelected,
  onSelect,
  onToggleStar,
}) => {
  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  return (
    <div
      onClick={() => {
        tactile.click();
        onSelect();
      }}
      className={`mx-1.5 my-0.5 p-2.5 rounded-lg transition-all duration-100 cursor-pointer select-none flex items-start gap-3 relative group ${
        isSelected
          ? "bg-[#ECECEC] dark:bg-[#2F2F2F] text-zinc-950 dark:text-white"
          : "hover:bg-[#ECECEC]/50 dark:hover:bg-[#2F2F2F]/50 text-zinc-700 dark:text-zinc-300"
      }`}
    >
      {/* Left: Avatar with Bencho Profile Popover */}
      <div className="relative flex-shrink-0 pt-0.5" onClick={(e) => e.stopPropagation()}>
        <BenchoProfileCard email={message.from.address} name={message.from.name}>
          <div className="relative">
            <SenderAvatar
              email={message.from.address}
              name={message.from.name}
              size={34}
            />
            {!message.isRead && (
              <span
                title="Unread message"
                className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#10A37F] ring-2 ring-white dark:ring-[#212121]"
              />
            )}
          </div>
        </BenchoProfileCard>
      </div>

      {/* Right Column: Name, Subject, Snippet */}
      <div className="flex-1 min-w-0">
        {/* Row 1: Sender Name & Timestamp */}
        <div className="flex items-center justify-between gap-1 mb-0.5">
          <span
            className={`text-xs truncate tracking-tight ${
              message.isRead
                ? "text-zinc-600 dark:text-zinc-400 font-normal"
                : "text-zinc-950 dark:text-white font-semibold"
            }`}
          >
            {message.from.name || message.from.address}
          </span>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {message.hasAttachments && (
              <Icons.Attachment size={12} className="text-zinc-400" />
            )}
            <time className="text-[11px] font-mono tabular-nums text-zinc-400">
              {formatTime(message.receivedAt)}
            </time>
          </div>
        </div>

        {/* Row 2: Subject */}
        <div
          className={`text-xs truncate mb-0.5 leading-snug tracking-tight ${
            message.isRead
              ? "text-zinc-500 dark:text-zinc-400 font-normal"
              : "text-zinc-900 dark:text-zinc-100 font-medium"
          }`}
        >
          {message.subject || "(No Subject)"}
        </div>

        {/* Row 3: Snippet & Action Chips */}
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500 truncate line-clamp-1 flex-1 font-normal">
            {message.snippet}
          </p>

          <div className="flex items-center gap-1 flex-shrink-0">
            {message.aiPriority && message.aiPriority !== "low" && (
              <span
                className={`text-[9px] font-mono uppercase px-1.5 py-0.2 rounded-full font-medium ${
                  message.aiPriority === "critical"
                    ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                    : message.aiPriority === "high"
                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                }`}
              >
                {message.aiPriority}
              </span>
            )}

            {message.unsubOneClick && (
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 font-medium">
                <CheckCircle2 className="w-2.5 h-2.5" />
                1-Click
              </span>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleStar(e);
              }}
              title={message.isStarred ? "Starred" : "Star"}
              className={`p-0.5 rounded transition-colors cursor-pointer ${
                message.isStarred
                  ? "text-amber-400"
                  : "text-zinc-300 dark:text-zinc-600 opacity-0 group-hover:opacity-100 hover:text-amber-400"
              }`}
            >
              <Icons.Star
                size={14}
                className={message.isStarred ? "text-amber-400 fill-amber-400" : ""}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

