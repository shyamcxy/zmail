import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  CheckCircle2,
  CornerUpLeft,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { useMailStore } from "../../stores/mailStore";
import { api } from "../../lib/ipc";
import { SenderAvatar } from "../common/BrandLogo";
import { BenchoProfileCard } from "../bencho/BenchoProfileCard";
import { BenchoCopyButton } from "../bencho/BenchoCopyButton";
import { BenchoThinking } from "../bencho/BenchoThinking";
import { tactile } from "../../lib/tactileAudio";
import { Icons } from "../common/Icons";

function prepareEmailHtml(rawHtml: string): string {
  if (!rawHtml) return "";

  // Strip script tags and dangerous inline handlers for sandbox isolation
  let cleaned = rawHtml
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");

  const baseStyle = `
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style id="zmail-base-styling">
      :root {
        color-scheme: light !important;
      }
      * {
        box-sizing: border-box;
      }
      html {
        background-color: #ffffff !important;
      }
      html, body {
        margin: 0;
        padding: 24px 20px;
        color: #1a202c !important;
        background-color: #ffffff !important;
        font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        font-size: 14px;
        line-height: 1.65;
        word-break: break-word;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        overflow-y: hidden !important;
        scrollbar-width: none !important;
        -ms-overflow-style: none !important;
      }
      ::-webkit-scrollbar {
        display: none !important;
        width: 0 !important;
        height: 0 !important;
      }
      table, td, th {
        font-family: inherit;
        max-width: 100% !important;
      }
      p, div, span, li {
        font-family: inherit;
      }
      img {
        max-width: 100% !important;
        height: auto !important;
        border-radius: 4px;
      }
      a {
        color: #10a37f;
        text-decoration: underline;
        text-underline-offset: 2px;
        cursor: pointer !important;
      }
    </style>
  `;

  const hasHtmlTag = /<html[\s>]/i.test(cleaned);
  const hasHeadTag = /<head[\s>]/i.test(cleaned);

  if (hasHtmlTag) {
    if (hasHeadTag) {
      return cleaned.replace(/<head[\s>]/i, (match) => `${match}\n${baseStyle}`);
    } else {
      return cleaned.replace(/<html[\s>]/i, (match) => `${match}\n<head>${baseStyle}</head>`);
    }
  }

  return `<!DOCTYPE html>
<html>
<head>
  ${baseStyle}
</head>
<body>
  ${cleaned}
</body>
</html>`;
}

function renderLinkifiedText(text: string) {
  const urlRegex = /(https?:\/\/[^\s<>"']+)/g;
  const parts = text.split(urlRegex);

  return parts.map((part, index) => {
    if (urlRegex.test(part)) {
      return (
        <a
          key={index}
          href={part}
          onClick={(e) => {
            e.preventDefault();
            api.openExternalUrl(part);
          }}
          className="text-cyan-600 dark:text-cyan-400 underline hover:opacity-80 cursor-pointer"
        >
          {part}
        </a>
      );
    }
    return part;
  });
}

export const MessageDetailView: React.FC = () => {
  const {
    selectedMessageDetail,
    archiveMessage,
    trashMessage,
    toggleStar,
    toggleRead,
    triggerTriage,
    setComposeOpen,
    setComposeMinimized,
    setAiCopilotOpen,
    showConfirm,
    closeConfirm,
    layoutMode,
    clearSelectedMessage,
  } = useMailStore();

  const [isUnsubscribing, setIsUnsubscribing] = useState(false);
  const [unsubSuccess, setUnsubSuccess] = useState(false);
  const [isTriaging, setIsTriaging] = useState(false);
  const [smartReplies, setSmartReplies] = useState<string[]>([]);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const detail = selectedMessageDetail;
    if (!detail) {
      setSmartReplies([]);
      return;
    }
    setUnsubSuccess(false);
    if (detail.smartReplies && detail.smartReplies.length > 0) {
      setSmartReplies(detail.smartReplies);
      return;
    }
    setSmartReplies([]);
    api.generateSmartReplies(detail.id).then((replies) => {
      setSmartReplies(replies);
    }).catch(() => {
      // ignore failures; keep empty
    });
  }, [selectedMessageDetail?.id]);

  const adjustIframeHeight = useCallback(() => {
    if (iframeRef.current) {
      try {
        const doc =
          iframeRef.current.contentDocument ||
          iframeRef.current.contentWindow?.document;
        if (doc && doc.body) {
          const height = Math.max(
            doc.body.scrollHeight,
            doc.documentElement.scrollHeight,
            doc.body.offsetHeight,
            doc.documentElement.offsetHeight,
            200
          );
          if (height > 0) {
            iframeRef.current.style.height = `${height + 24}px`;
          }
        }
      } catch {
        // Fallback
      }
    }
  }, []);

  const formattedHtml = useMemo(() => {
    return selectedMessageDetail?.bodyHtml
      ? prepareEmailHtml(selectedMessageDetail.bodyHtml)
      : "";
  }, [selectedMessageDetail?.bodyHtml]);

  const attachLinkInterceptor = useCallback(() => {
    try {
      const doc =
        iframeRef.current?.contentDocument ||
        iframeRef.current?.contentWindow?.document;
      if (!doc) return;

      const handleDocClick = (e: MouseEvent) => {
        const anchor = (e.target as Element)?.closest("a");
        if (!anchor) return;

        const href = anchor.getAttribute("href") || (anchor as HTMLAnchorElement).href;
        if (
          href &&
          href !== "#" &&
          !href.startsWith("#") &&
          !href.startsWith("javascript:")
        ) {
          e.preventDefault();
          e.stopPropagation();
          api.openExternalUrl(href);
        }
      };

      doc.removeEventListener("click", handleDocClick as EventListener, true);
      doc.addEventListener("click", handleDocClick as EventListener, true);

      doc.querySelectorAll("a").forEach((link) => {
        link.style.cursor = "pointer";
      });
    } catch {
      // Ignore
    }
  }, []);

  useEffect(() => {
    attachLinkInterceptor();
    const t1 = setTimeout(attachLinkInterceptor, 150);
    const t2 = setTimeout(attachLinkInterceptor, 500);
    const t3 = setTimeout(attachLinkInterceptor, 1200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [selectedMessageDetail?.id, formattedHtml, attachLinkInterceptor]);

  const handleIframeLoad = () => {
    adjustIframeHeight();
    setTimeout(adjustIframeHeight, 100);
    setTimeout(adjustIframeHeight, 300);
    setTimeout(adjustIframeHeight, 800);
    setTimeout(adjustIframeHeight, 1500);
    attachLinkInterceptor();

    try {
      const doc =
        iframeRef.current?.contentDocument ||
        iframeRef.current?.contentWindow?.document;
      if (doc) {
        if (doc.body) {
          doc.body.style.backgroundColor = "#ffffff";
          doc.body.style.color = "#1a202c";
        }
        if (doc.documentElement) {
          doc.documentElement.style.backgroundColor = "#ffffff";
        }
        if (doc.body && typeof ResizeObserver !== "undefined") {
          const ro = new ResizeObserver(() => {
            adjustIframeHeight();
          });
          ro.observe(doc.body);
        }
      }
    } catch {
      // Ignore
    }
  };

  if (!selectedMessageDetail) {
    return (
      <div className="flex-1 h-full bg-white dark:bg-[#1E1E1E] flex flex-col items-center justify-center text-center p-8 select-none transition-colors duration-150">
        <div className="w-12 h-12 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/[0.08] flex items-center justify-center mb-3">
          <Icons.Mail size={22} className="text-zinc-600 dark:text-zinc-400" />
        </div>
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1 tracking-tight">No Message Selected</h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mb-5 leading-relaxed">
          Select an email from the list to view its contents, or navigate using <kbd className="font-mono text-zinc-700 dark:text-zinc-300 font-medium">J</kbd> / <kbd className="font-mono text-zinc-700 dark:text-zinc-300 font-medium">K</kbd>.
        </p>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setAiCopilotOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/8 dark:hover:bg-white/10 text-zinc-800 dark:text-zinc-200 border border-black/8 dark:border-white/10 text-xs font-medium transition-all cursor-pointer"
          >
            <Icons.Sparkles size={14} className="text-[#10A37F]" />
            <span>Open Copilot</span>
            <kbd className="font-mono text-[9px] opacity-60 bg-black/5 dark:bg-white/10 px-1 py-0.2 rounded">⌘J</kbd>
          </button>

          <button
            onClick={() => {
              setComposeOpen(true);
              setComposeMinimized(false);
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-black text-white dark:bg-white dark:text-black text-xs font-medium transition-all cursor-pointer shadow-xs active:scale-95"
          >
            <span>New Message</span>
            <kbd className="font-mono text-[9px] opacity-70 ml-1">C</kbd>
          </button>
        </div>
      </div>
    );
  }

  const msg = selectedMessageDetail;

  const handleUnsubscribePrompt = () => {
    if (!msg.unsubUrl) return;
    showConfirm({
      title: "Unsubscribe from this mailing list?",
      description: `Send an automated unsubscribe request to ${msg.from.name || msg.from.address}.`,
      confirmLabel: "Unsubscribe",
      isDestructive: false,
      onConfirm: async () => {
        closeConfirm();
        setIsUnsubscribing(true);
        try {
          const ok = await api.executeOneClickUnsubscribe(msg.unsubUrl!);
          if (ok) setUnsubSuccess(true);
        } catch (err) {
          console.error("Unsubscribe failed:", err);
        } finally {
          setIsUnsubscribing(false);
        }
      },
    });
  };

  const handleRunAiTriage = async () => {
    setIsTriaging(true);
    try {
      await triggerTriage(msg.id);
    } finally {
      setIsTriaging(false);
    }
  };

  return (
    <div className="flex-1 h-full bg-[#FFFFFF] dark:bg-[#212121] flex flex-col overflow-hidden transition-colors duration-150">
      {/* Top Action Pill Bar */}
      <div className="h-11 px-6 border-b border-black/[0.06] dark:border-white/[0.06] bg-[#FFFFFF] dark:bg-[#212121] flex items-center justify-between flex-shrink-0 transition-colors duration-150 z-10">
        <div className="flex items-center gap-1.5">
          {layoutMode === "list" && (
            <button
              onClick={() => clearSelectedMessage()}
              title="Back"
              className="flex items-center gap-1 px-2.5 py-1 -ml-2 mr-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/[0.06] text-xs text-zinc-700 dark:text-zinc-300 font-medium transition-colors cursor-pointer"
            >
              <Icons.ArrowLeft size={14} />
              <span>Back</span>
            </button>
          )}

          <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-black/[0.03] dark:bg-white/[0.04]">
            <button
              onClick={() => archiveMessage(msg.id)}
              title="Archive (E)"
              className="p-1.5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white rounded-md hover:bg-white dark:hover:bg-[#2F2F2F] transition-all cursor-pointer"
            >
              <Icons.Archive size={15} />
            </button>
            <button
              onClick={() => trashMessage(msg.id)}
              title="Delete (#)"
              className="p-1.5 text-zinc-600 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-md hover:bg-white dark:hover:bg-[#2F2F2F] transition-all cursor-pointer"
            >
              <Icons.Trash size={15} />
            </button>
            <button
              onClick={() => toggleStar(msg.id)}
              title="Star (S)"
              className="p-1.5 text-zinc-600 dark:text-zinc-400 hover:text-amber-500 rounded-md hover:bg-white dark:hover:bg-[#2F2F2F] transition-all cursor-pointer"
            >
              <Icons.Star
                size={15}
                className={msg.isStarred ? "text-amber-400 fill-amber-400" : ""}
              />
            </button>
            <button
              onClick={() => toggleRead(msg.id)}
              title="Toggle Read / Unread"
              className="px-2.5 py-1 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white rounded-md hover:bg-white dark:hover:bg-[#2F2F2F] transition-all cursor-pointer font-medium"
            >
              {msg.isRead ? "Mark Unread" : "Mark Read"}
            </button>
          </div>
        </div>

        {/* Right Action Icons: Reply, Copilot */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setComposeOpen(true);
              setComposeMinimized(false);
            }}
            title="Reply (R)"
            className="flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-black text-white dark:bg-white dark:text-black text-xs font-semibold hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-2xs"
          >
            <CornerUpLeft className="w-3 h-3" />
            <span className="tracking-tight">Reply</span>
          </button>

          <button
            onClick={() => setAiCopilotOpen(true)}
            title="Open Copilot (Cmd+J)"
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-zinc-800 dark:text-zinc-200 text-xs font-medium transition-all cursor-pointer"
          >
            <Icons.Sparkles size={14} className="text-[#10A37F]" />
            <span className="tracking-tight">Copilot</span>
          </button>
        </div>
      </div>

      {/* Main Email Scroll Area */}
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6 w-full">
        {/* Email Subject Heading */}
        <h1 className="text-xl font-semibold text-zinc-950 dark:text-zinc-100 tracking-tight leading-snug">
          {msg.subject || "(No Subject)"}
        </h1>

        {/* Sender & Recipient Metadata */}
        <div className="flex items-start justify-between pb-4 border-b border-black/[0.06] dark:border-white/[0.06]">
          <BenchoProfileCard email={msg.from.address} name={msg.from.name}>
            <div className="flex items-center gap-3 cursor-pointer group">
              <SenderAvatar
                email={msg.from.address}
                name={msg.from.name}
                size={42}
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-zinc-950 dark:text-zinc-100 tracking-tight group-hover:text-[#10A37F] transition-colors">
                    {msg.from.name || msg.from.address}
                  </span>
                  <span className="text-xs font-mono text-zinc-400">
                    &lt;{msg.from.address}&gt;
                  </span>
                </div>
                <div className="text-xs text-zinc-500 mt-0.5 flex items-center gap-2">
                  <span>to {msg.to.map((t) => t.name || t.address).join(", ")}</span>
                  <span className="text-zinc-300 dark:text-zinc-600">•</span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#10A37F]">
                    <ShieldCheck className="w-3 h-3" />
                    TLS Verified
                  </span>
                </div>
              </div>
            </div>
          </BenchoProfileCard>

          <time className="text-xs font-mono tabular-nums text-zinc-400">
            {new Date(msg.receivedAt).toLocaleString([], {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </time>
        </div>

        {/* AI Summary Callout */}
        <div className="p-4 rounded-xl bg-[#F4F4F4] dark:bg-[#2F2F2F] border border-black/5 dark:border-white/5 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icons.Sparkles size={16} className="text-[#10A37F]" />
              <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
                AI Summary & Insights
              </span>
            </div>
            <div className="flex items-center gap-2">
              {msg.aiSummary && (
                <BenchoCopyButton textToCopy={msg.aiSummary} label="Copy" />
              )}
              <button
                onClick={() => {
                  tactile.click();
                  handleRunAiTriage();
                }}
                disabled={isTriaging}
                title="Re-run local AI summary"
                className="flex items-center gap-1 text-[11px] text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer font-medium"
              >
                {isTriaging ? (
                  <Loader2 className="w-3 h-3 animate-spin text-[#10A37F]" />
                ) : (
                  <Icons.Sparkles size={13} />
                )}
                <span>{isTriaging ? "Analyzing..." : "Re-analyze"}</span>
              </button>
            </div>
          </div>

          {isTriaging ? (
            <BenchoThinking label="Generating summary..." />
          ) : (
            <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed font-normal">
              {msg.aiSummary ||
                "AI extracted key points and takeaways from this conversation thread."}
            </p>
          )}

          <div className="flex flex-wrap gap-1.5 pt-1">
            <button
              onClick={() => setAiCopilotOpen(true)}
              className="px-3 py-1 rounded-full bg-white dark:bg-[#212121] text-[11px] font-medium text-zinc-800 dark:text-zinc-200 border border-black/5 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer shadow-2xs"
            >
              Draft polite reply
            </button>
            <button
              onClick={() => setAiCopilotOpen(true)}
              className="px-3 py-1 rounded-full bg-white dark:bg-[#212121] text-[11px] font-medium text-zinc-800 dark:text-zinc-200 border border-black/5 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer shadow-2xs"
            >
              Extract deliverables
            </button>
            <button
              onClick={() => setAiCopilotOpen(true)}
              className="px-3 py-1 rounded-full bg-white dark:bg-[#212121] text-[11px] font-medium text-zinc-800 dark:text-zinc-200 border border-black/5 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer shadow-2xs"
            >
              Audit sender
            </button>
          </div>
        </div>

        {/* Unsubscribe Success Banner */}
        {unsubSuccess && (
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs text-emerald-800 dark:text-emerald-300 font-medium">
              Unsubscribe request sent successfully.
            </span>
          </div>
        )}

        {/* One-Click Unsubscribe Action Banner */}
        {msg.unsubOneClick && !unsubSuccess && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Verified RFC 8058 1-Click Unsubscribe available.</span>
            </div>
            <button
              onClick={handleUnsubscribePrompt}
              disabled={isUnsubscribing}
              className="px-3 py-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
            >
              {isUnsubscribing ? "Unsubscribing..." : "Unsubscribe Now"}
            </button>
          </div>
        )}

        {/* Email Body Content */}
        <div className="pt-2 w-full">
          {msg.bodyHtml ? (
            <div className="w-full bg-white rounded-xl border border-black/[0.08] dark:border-white/[0.08] shadow-2xs overflow-hidden">
              <iframe
                ref={iframeRef}
                title="Email Content"
                scrolling="no"
                sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
                srcDoc={formattedHtml}
                onLoad={handleIframeLoad}
                className="w-full border-0 block bg-white"
                style={{ width: "100%", border: 0, outline: "none", overflow: "hidden", backgroundColor: "#ffffff" }}
              />
            </div>
          ) : (
            <div className="p-6 bg-white dark:bg-[#262626] rounded-xl border border-black/[0.06] dark:border-white/[0.06] text-zinc-900 dark:text-zinc-100 text-sm leading-relaxed whitespace-pre-wrap font-sans w-full select-text shadow-2xs">
              {renderLinkifiedText(msg.bodyText || msg.snippet)}
            </div>
          )}
        </div>

        {/* Smart Quick Reply Matrix */}
        {smartReplies.length > 0 && (
          <div className="pt-2 space-y-2">
            <div className="text-xs font-mono uppercase tracking-wider text-zinc-400">
              Suggested Direct Replies
            </div>
            <div className="flex flex-wrap gap-2">
              {smartReplies.map((reply, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setComposeOpen(true);
                    setComposeMinimized(false);
                  }}
                  className="px-3.5 py-1.5 rounded-full bg-white dark:bg-[#121622] text-[11px] font-medium text-zinc-800 dark:text-zinc-200 border border-black/10 dark:border-white/10 hover:border-cyan-500 transition-all cursor-pointer shadow-2xs text-left"
                >
                  {reply}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Attachments Section */}
        {msg.hasAttachments && (
          <div className="pt-4 border-t border-black/8 dark:border-white/[0.07] space-y-2.5">
            <div className="text-xs font-mono uppercase tracking-wider text-zinc-400">
              Attachments {msg.attachments?.length ? `(${msg.attachments.length} ${msg.attachments.length === 1 ? "file" : "files"})` : ""}
            </div>
            {msg.attachments && msg.attachments.length > 0 ? (
              <div className="flex flex-wrap gap-2.5">
                {msg.attachments.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-black/[0.03] dark:bg-white/[0.05] border border-black/8 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
                  >
                    <Icons.Attachment size={16} className="text-[#10A37F] shrink-0" />
                    <div className="text-left min-w-0">
                      <div className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate max-w-[200px]">
                        {att.filename}
                      </div>
                      <div className="text-[10px] font-mono text-zinc-400">
                        {(att.sizeBytes / 1024).toFixed(att.sizeBytes > 1024 * 1024 ? 1 : 0)}{" "}
                        {att.sizeBytes > 1024 * 1024 ? "MB" : "KB"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-zinc-400">Attachments available for download.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

