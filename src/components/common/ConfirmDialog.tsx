import React, { useEffect } from "react";
import { BenchoSlideConfirm } from "../bencho/BenchoSlideConfirm";
import { Icons } from "./Icons";

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  isDestructive = false,
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      } else if (e.key === "Enter" && !isDestructive) {
        e.preventDefault();
        onConfirm();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isDestructive, onConfirm, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-md rounded-xl bg-white dark:bg-[#212121] border border-black/[0.08] dark:border-white/[0.08] shadow-lg p-6 relative select-none animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-white p-1 rounded-md transition-colors cursor-pointer"
        >
          <Icons.Close size={15} />
        </button>

        <div className="flex items-start gap-3.5 mb-5">
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
              isDestructive
                ? "bg-rose-500/10 text-rose-500"
                : "bg-black/5 dark:bg-white/10 text-zinc-800 dark:text-zinc-200"
            }`}
          >
            {isDestructive ? (
              <Icons.Alert size={18} />
            ) : (
              <Icons.Info size={18} />
            )}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-snug tracking-tight">
              {title}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        {/* Destructive Actions: Bencho Slide to Confirm */}
        {isDestructive ? (
          <div className="space-y-3 pt-2">
            <BenchoSlideConfirm
              label={`Slide to ${confirmLabel.toLowerCase()}`}
              confirmedLabel={`${confirmLabel}ed`}
              isDestructive={true}
              onConfirm={onConfirm}
            />

            <div className="flex justify-end pt-1">
              <button
                onClick={onCancel}
                className="px-3.5 py-1.5 rounded-full text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
              >
                {cancelLabel} <kbd className="text-[10px] font-mono opacity-60 ml-1">Esc</kbd>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-black/[0.06] dark:border-white/[0.06]">
            <button
              onClick={onCancel}
              className="px-3.5 py-1.5 rounded-full text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              {cancelLabel} <kbd className="text-[10px] font-mono opacity-60 ml-1">Esc</kbd>
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-1.5 rounded-full text-xs font-semibold bg-black text-white dark:bg-white dark:text-black hover:opacity-90 transition-all cursor-pointer shadow-xs active:scale-95"
            >
              {confirmLabel} <kbd className="text-[10px] font-mono opacity-70 ml-1">↵</kbd>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

