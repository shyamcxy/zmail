import React, { useState, useEffect, useRef } from "react";
import { useMailStore } from "../../stores/mailStore";
import { api } from "../../lib/ipc";
import { GmailLogo } from "../common/BrandLogo";
import { Icons } from "../common/Icons";

interface AttachedItem {
  id: string;
  name: string;
  size: number;
  type: string;
}

export const ComposeModal: React.FC = () => {
  const {
    isComposeOpen,
    setComposeOpen,
    isComposeMinimized,
    setComposeMinimized,
    accounts,
    showConfirm,
    closeConfirm,
    showToast,
  } = useMailStore();

  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [to, setTo] = useState("");
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [attachments, setAttachments] = useState<AttachedItem[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (accounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts, selectedAccountId]);

  const handleClose = () => {
    if (to.trim() || subject.trim() || body.trim() || attachments.length > 0) {
      showConfirm({
        title: "Discard draft?",
        description: "Your draft will be deleted.",
        confirmLabel: "Discard",
        isDestructive: true,
        onConfirm: () => {
          closeConfirm();
          resetFields();
          setComposeOpen(false);
          setComposeMinimized(false);
        },
      });
      return;
    }
    resetFields();
    setComposeOpen(false);
    setComposeMinimized(false);
  };

  const resetFields = () => {
    setTo("");
    setCc("");
    setBcc("");
    setShowCc(false);
    setShowBcc(false);
    setSubject("");
    setBody("");
    setAttachments([]);
    setIsMaximized(false);
  };

  // Keyboard shortcut: Esc to close, Cmd+Enter to send
  useEffect(() => {
    if (!isComposeOpen || isComposeMinimized) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
      } else if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleSend();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isComposeOpen, isComposeMinimized, to, subject, body, attachments, selectedAccountId]);

  if (!isComposeOpen) return null;

  const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newItems: AttachedItem[] = Array.from(files).map((f) => ({
      id: Math.random().toString(36).substring(2, 9),
      name: f.name,
      size: f.size,
      type: f.type,
    }));

    setAttachments((prev) => [...prev, ...newItems]);
    e.target.value = "";
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleSend = async () => {
    if (!to.trim()) return;

    setIsSending(true);
    try {
      await api.sendEmail({
        accountId: selectedAccountId,
        to: to.split(",").map((t) => t.trim()).filter(Boolean),
        cc: cc ? cc.split(",").map((t) => t.trim()).filter(Boolean) : undefined,
        bcc: bcc ? bcc.split(",").map((t) => t.trim()).filter(Boolean) : undefined,
        subject,
        bodyText: body,
      });

      showToast("Message sent.");
      resetFields();
      setComposeOpen(false);
      setComposeMinimized(false);
    } catch (err: any) {
      console.error("Failed to send email:", err);
      showToast(err?.message || "Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  // Minimized Floating Pill Bar (Bottom Right)
  if (isComposeMinimized) {
    return (
      <div
        onClick={() => setComposeMinimized(false)}
        className="fixed bottom-0 right-8 z-40 h-10 w-72 rounded-t-xl bg-white/95 dark:bg-[#1E1E1E]/95 backdrop-blur-xl border border-black/[0.08] dark:border-white/[0.08] shadow-md flex items-center justify-between px-3.5 cursor-pointer hover:bg-zinc-50 dark:hover:bg-[#252525] transition-colors select-none"
      >
        <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate tracking-tight">
          {subject || "Draft"}
        </span>
        <div
          className="flex items-center gap-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-white"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => setComposeMinimized(false)}
            className="p-1 hover:bg-black/5 dark:hover:bg-white/[0.08] rounded transition-colors"
          >
            <Icons.Maximize size={14} />
          </button>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-black/5 dark:hover:bg-white/[0.08] rounded transition-colors"
          >
            <Icons.Close size={14} />
          </button>
        </div>
      </div>
    );
  }

  // Gmail-Style Docked Bottom-Right Compose Console
  return (
    <div
      className={
        isMaximized
          ? "fixed inset-8 z-40 rounded-xl bg-white dark:bg-[#212121] border border-black/[0.08] dark:border-white/[0.08] shadow-xl flex flex-col overflow-hidden select-none"
          : "fixed bottom-0 right-8 z-40 w-[600px] max-w-[95vw] h-[540px] rounded-t-xl bg-white dark:bg-[#212121] border border-black/[0.08] dark:border-white/[0.08] shadow-xl flex flex-col overflow-hidden select-none"
      }
    >
      {/* Console Header */}
      <div className="h-10 px-4 bg-[#F9F9F9] dark:bg-[#171717] border-b border-black/[0.06] dark:border-white/[0.06] flex items-center justify-between select-none">
        <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate tracking-tight">
          {subject || "New Message"}
        </span>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setComposeMinimized(true)}
            title="Minimize"
            className="p-1 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white rounded hover:bg-black/5 dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
          >
            <Icons.Minimize size={14} />
          </button>
          <button
            onClick={() => setIsMaximized(!isMaximized)}
            title={isMaximized ? "Exit full screen" : "Full screen"}
            className="p-1 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white rounded hover:bg-black/5 dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
          >
            {isMaximized ? (
              <Icons.Minimize size={14} />
            ) : (
              <Icons.Maximize size={14} />
            )}
          </button>
          <button
            onClick={handleClose}
            title="Close"
            className="p-1 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white rounded hover:bg-black/5 dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
          >
            <Icons.Close size={14} />
          </button>
        </div>
      </div>

      {/* Account From Selector */}
      {accounts.length > 1 && (
        <div className="px-4 py-1.5 border-b border-black/5 dark:border-white/[0.05] flex items-center gap-2 text-xs text-zinc-500">
          <span className="font-mono text-[11px] w-14 text-zinc-400 uppercase">From:</span>
          <div className="flex items-center gap-2 flex-1">
            <GmailLogo className="w-3.5 h-3.5" />
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="bg-transparent text-xs text-zinc-800 dark:text-zinc-200 outline-none cursor-pointer font-medium"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id} className="dark:bg-[#11141E]">
                  {acc.displayName} &lt;{acc.email}&gt;
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Recipients: To, Cc, Bcc */}
      <div className="px-4 border-b border-black/5 dark:border-white/[0.06] text-xs">
        <div className="flex items-center gap-2 py-1.5">
          <span className="font-mono text-[11px] w-14 text-zinc-400 uppercase">To:</span>
          <input
            type="text"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="Recipients (comma separated)"
            autoFocus
            className="flex-1 bg-transparent text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 outline-none font-medium"
          />
          <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400">
            {!showCc && (
              <button
                type="button"
                onClick={() => setShowCc(true)}
                className="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors cursor-pointer"
              >
                Cc
              </button>
            )}
            {!showBcc && (
              <button
                type="button"
                onClick={() => setShowBcc(true)}
                className="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors cursor-pointer"
              >
                Bcc
              </button>
            )}
          </div>
        </div>

        {showCc && (
          <div className="flex items-center gap-2 py-1.5 border-t border-black/5 dark:border-white/[0.04]">
            <span className="font-mono text-[11px] w-14 text-zinc-400 uppercase">Cc:</span>
            <input
              type="text"
              value={cc}
              onChange={(e) => setCc(e.target.value)}
              placeholder="Cc recipients"
              className="flex-1 bg-transparent text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 outline-none"
            />
          </div>
        )}

        {showBcc && (
          <div className="flex items-center gap-2 py-1.5 border-t border-black/5 dark:border-white/[0.04]">
            <span className="font-mono text-[11px] w-14 text-zinc-400 uppercase">Bcc:</span>
            <input
              type="text"
              value={bcc}
              onChange={(e) => setBcc(e.target.value)}
              placeholder="Bcc recipients"
              className="flex-1 bg-transparent text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 outline-none"
            />
          </div>
        )}

        {/* Subject */}
        <div className="flex items-center gap-2 py-1.5 border-t border-black/5 dark:border-white/[0.04]">
          <span className="font-mono text-[11px] w-14 text-zinc-400 uppercase">Subject:</span>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject heading"
            className="flex-1 bg-transparent text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 outline-none font-semibold"
          />
        </div>
      </div>

      {/* Body Area */}
      <div className="flex-1 p-4 overflow-y-auto">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write a message..."
          className="w-full h-full min-h-[160px] bg-transparent text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 outline-none resize-none leading-relaxed font-sans"
        />

        {/* Attached Files Chips */}
        {attachments.length > 0 && (
          <div className="pt-3 border-t border-black/5 dark:border-white/[0.06] flex flex-wrap gap-2">
            {attachments.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-white/[0.06] border border-black/10 dark:border-white/[0.08] text-xs text-zinc-800 dark:text-zinc-200"
              >
                <Icons.Attachment size={14} className="text-[#10A37F]" />
                <span className="truncate max-w-[180px] font-medium">{item.name}</span>
                <span className="font-mono text-[10px] text-zinc-400">
                  ({formatFileSize(item.size)})
                </span>
                <button
                  type="button"
                  onClick={() => removeAttachment(item.id)}
                  className="text-zinc-400 hover:text-rose-500 ml-1 transition-colors cursor-pointer"
                >
                  <Icons.Close size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Hidden File & Photo Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileAttach}
        className="hidden"
      />
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileAttach}
        className="hidden"
      />

      {/* Bottom Toolbar */}
      <div className="h-12 px-4 border-t border-black/[0.06] dark:border-white/[0.06] bg-[#F9F9F9] dark:bg-[#171717] flex items-center justify-between select-none">
        <div className="flex items-center gap-2">
          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={isSending || !to.trim()}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-black text-white dark:bg-white dark:text-black hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-semibold transition-all cursor-pointer shadow-xs active:scale-95"
          >
            <Icons.Send size={13} />
            <span>{isSending ? "Sending..." : "Send"}</span>
            <kbd className="hidden sm:inline font-mono text-[9px] opacity-60 ml-1">
              ⌘↵
            </kbd>
          </button>

          {/* Attach Document File */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Attach files"
            className="p-1.5 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-lg hover:bg-black/5 dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
          >
            <Icons.Attachment size={16} />
          </button>
        </div>

        {/* Right Action: Discard Draft */}
        <button
          onClick={handleClose}
          title="Discard draft"
          className="p-1.5 text-zinc-400 hover:text-rose-500 rounded-lg hover:bg-black/5 dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
        >
          <Icons.Trash size={16} />
        </button>
      </div>
    </div>
  );
};

