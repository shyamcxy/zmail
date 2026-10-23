import React, { useEffect } from "react";
import { AppHeader } from "./AppHeader";
import { NavRail } from "./NavRail";
import { MessageList } from "../inbox/MessageList";
import { MessageDetailView } from "../reader/MessageDetailView";
import { ComposeModal } from "../compose/ComposeModal";
import { CommandPalette } from "../command/CommandPalette";
import { ConfirmDialog } from "../common/ConfirmDialog";
import { KeyboardShortcutsModal } from "../common/KeyboardShortcutsModal";
import { AiAssistantDock } from "../ai/AiAssistantDock";
import { useMailStore } from "../../stores/mailStore";
import { Icons } from "../common/Icons";

export const AppShell: React.FC = () => {
  const {
    toastMessage,
    clearToast,
    confirmDialog,
    closeConfirm,
    isAiCopilotOpen,
    setAiCopilotOpen,
    layoutMode,
    selectedMessageId,
    clearSelectedMessage,
    isComposeOpen,
    isCommandPaletteOpen,
    toggleSidebar,
    init,
  } = useMailStore();

  useEffect(() => {
    init();
  }, [init]);

  // Global shortcut: Cmd+J toggles AI Copilot, Cmd+\ toggles sidebar, Esc navigates back in list view
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "\\") {
        e.preventDefault();
        toggleSidebar();
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        setAiCopilotOpen(!isAiCopilotOpen);
      } else if (
        e.key === "Escape" &&
        layoutMode === "list" &&
        selectedMessageId &&
        !isComposeOpen &&
        !isCommandPaletteOpen &&
        !confirmDialog
      ) {
        e.preventDefault();
        clearSelectedMessage();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isAiCopilotOpen,
    setAiCopilotOpen,
    layoutMode,
    selectedMessageId,
    clearSelectedMessage,
    isComposeOpen,
    isCommandPaletteOpen,
    confirmDialog,
    toggleSidebar,
  ]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#FFFFFF] dark:bg-[#212121] text-zinc-900 dark:text-[#ECECEC] font-sans antialiased relative selection:bg-[#10A37F]/25">
      {/* Top macOS App Header (Traffic lights + Accounts) */}
      <AppHeader />

      {/* Main Workspace Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Icon Rail */}
        <NavRail />

        {/* Content Area (Split View vs Full List View) */}
        <main className="flex flex-1 overflow-hidden bg-[#FFFFFF] dark:bg-[#212121]">
          {layoutMode === "split" ? (
            <>
              <MessageList />
              {selectedMessageId ? (
                <>
                  <MessageDetailView />
                  {isAiCopilotOpen && <AiAssistantDock />}
                </>
              ) : isAiCopilotOpen ? (
                <AiAssistantDock isFullWidth />
              ) : (
                <MessageDetailView />
              )}
            </>
          ) : selectedMessageId ? (
            <>
              <MessageDetailView />
              {isAiCopilotOpen && <AiAssistantDock />}
            </>
          ) : isAiCopilotOpen ? (
            <>
              <MessageList />
              <AiAssistantDock />
            </>
          ) : (
            <MessageList />
          )}
        </main>
      </div>

      {/* Modals & Overlays */}
      <ComposeModal />
      <CommandPalette />
      <KeyboardShortcutsModal />

      {/* Global Confirmation Dialog */}
      {confirmDialog && (
        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          title={confirmDialog.title}
          description={confirmDialog.description}
          confirmLabel={confirmDialog.confirmLabel}
          cancelLabel={confirmDialog.cancelLabel}
          isDestructive={confirmDialog.isDestructive}
          onConfirm={confirmDialog.onConfirm}
          onCancel={closeConfirm}
        />
      )}

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 left-20 z-50 max-w-md bg-white/95 dark:bg-[#212121]/95 border border-black/[0.08] dark:border-white/[0.08] rounded-xl p-3.5 flex items-start gap-3 shadow-lg text-xs backdrop-blur-xl transition-all duration-150 ease-out select-none">
          <Icons.Info size={16} className="text-[#10A37F] flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-zinc-800 dark:text-zinc-200 leading-relaxed font-normal break-words max-h-36 overflow-y-auto">
            {toastMessage}
          </div>
          <button
            onClick={clearToast}
            className="text-zinc-400 hover:text-zinc-700 dark:hover:text-white p-0.5 rounded transition-colors cursor-pointer"
          >
            <Icons.Close size={13} />
          </button>
        </div>
      )}
    </div>
  );
};

