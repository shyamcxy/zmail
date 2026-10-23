import React, { useState } from "react";
import { motion } from "framer-motion";
import { useMailStore } from "../../stores/mailStore";
import { AccountBadge } from "../common/BrandLogo";
import { tactile } from "../../lib/tactileAudio";
import { Icons } from "../common/Icons";

export const NavRail: React.FC = () => {
  const {
    selectedView,
    selectView,
    messages,
    setComposeOpen,
    setComposeMinimized,
    isSyncing,
    triggerSync,
    accounts,
    isSidebarExpanded,
    connectGmail,
    disconnectAccount,
    showConfirm,
    closeConfirm,
  } = useMailStore();

  const [showAccountMenu, setShowAccountMenu] = useState(false);

  const unreadCount = messages.filter((m) => !m.isRead).length;
  const starredCount = messages.filter((m) => m.isStarred).length;

  const navItems = [
    { id: "inbox" as const, label: "Inbox", icon: Icons.Mail, count: unreadCount, shortcut: "G I" },
    { id: "starred" as const, label: "Starred", icon: Icons.Star, count: starredCount, shortcut: "S" },
    { id: "newsletters" as const, label: "Subscriptions", icon: Icons.News, shortcut: "G N" },
    { id: "archive" as const, label: "Archive", icon: Icons.Archive, shortcut: "E" },
    { id: "trash" as const, label: "Trash", icon: Icons.Trash, shortcut: "#" },
  ];

  const primaryAccount = accounts[0];
  const userInitials = primaryAccount
    ? (primaryAccount.displayName || primaryAccount.email).slice(0, 2).toUpperCase()
    : "ZM";

  const handleDisconnect = (accId: string, email: string) => {
    setShowAccountMenu(false);
    showConfirm({
      title: "Disconnect Account?",
      description: `Remove ${email} from Zmail? Your emails and tokens will be securely removed locally, but remain intact on your provider.`,
      confirmLabel: "Disconnect",
      isDestructive: true,
      onConfirm: async () => {
        closeConfirm();
        await disconnectAccount(accId);
      },
    });
  };

  const handleAddAccount = () => {
    setShowAccountMenu(false);
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
    <nav
      className={`h-full bg-[#F9F9F9] dark:bg-[#171717] border-r border-black/[0.06] dark:border-white/[0.06] flex flex-col justify-between py-3 select-none flex-shrink-0 transition-all duration-150 ease-out z-20 ${
        isSidebarExpanded ? "w-60 px-3" : "w-14 items-center px-1.5"
      }`}
    >
      {/* Top Header & Actions */}
      <div className="flex flex-col gap-2 w-full">
        {/* New Message / Compose Button */}
        <div className="w-full flex justify-center">
          <button
            onClick={() => {
              setComposeOpen(true);
              setComposeMinimized(false);
            }}
            title="New message (C)"
            className={`rounded-lg flex items-center transition-all duration-100 cursor-pointer font-medium active:scale-[0.98] ${
              isSidebarExpanded
                ? "w-full h-9 px-3 justify-between bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/8 dark:hover:bg-white/10 text-zinc-900 dark:text-zinc-100 text-xs"
                : "w-9 h-9 justify-center bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/8 dark:hover:bg-white/10 text-zinc-900 dark:text-zinc-100"
            }`}
          >
            <div className="flex items-center gap-2">
              <Icons.Edit size={16} className="text-zinc-700 dark:text-zinc-200" />
              {isSidebarExpanded && (
                <span className="font-medium text-xs tracking-tight">New message</span>
              )}
            </div>
            {isSidebarExpanded && (
              <kbd className="font-mono text-[10px] text-zinc-400 bg-black/5 dark:bg-white/10 px-1.5 py-0.5 rounded">
                C
              </kbd>
            )}
          </button>
        </div>

        {/* Mailbox Navigation Items */}
        <div className="flex flex-col gap-0.5 w-full pt-1.5">
          {isSidebarExpanded && (
            <div className="px-3 pb-1 text-[11px] font-medium text-zinc-400 dark:text-zinc-500">
              Mailboxes
            </div>
          )}

          {navItems.map((item) => {
            const isSelected = selectedView === item.id;
            const Icon = item.icon;

            return (
              <div key={item.id} className="relative group w-full flex justify-center">
                {isSelected && (
                  <motion.div
                    layoutId="active-mailbox-pill"
                    className={`absolute inset-0 bg-[#ECECEC] dark:bg-[#2F2F2F] rounded-lg -z-0 ${
                      !isSidebarExpanded ? "w-9 h-9 mx-auto" : ""
                    }`}
                    transition={{ type: "spring", stiffness: 450, damping: 32 }}
                  />
                )}
                <button
                  onClick={() => {
                    tactile.click();
                    selectView(item.id);
                  }}
                  className={`relative z-10 rounded-lg flex items-center transition-colors duration-100 cursor-pointer text-xs ${
                    isSidebarExpanded
                      ? "w-full px-3 h-8 gap-2.5 justify-between"
                      : "w-9 h-9 justify-center mx-auto"
                  } ${
                    isSelected
                      ? "text-zinc-950 dark:text-white font-semibold"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/[0.04] font-normal"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      size={16}
                      className={`flex-shrink-0 ${
                        isSelected ? "text-zinc-950 dark:text-white" : "text-zinc-500 dark:text-zinc-400"
                      }`}
                    />
                    {isSidebarExpanded && <span className="truncate tracking-tight">{item.label}</span>}
                  </div>

                  {item.count !== undefined && item.count > 0 && isSidebarExpanded && (
                    <span
                      className={`text-[10px] font-mono tabular-nums px-1.5 py-0.2 rounded-full font-medium ${
                        isSelected
                          ? "bg-black/10 dark:bg-white/15 text-zinc-950 dark:text-white"
                          : "text-zinc-400"
                      }`}
                    >
                      {item.count}
                    </span>
                  )}

                  {/* Dot indicator when collapsed */}
                  {item.count !== undefined && item.count > 0 && !isSidebarExpanded && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#10A37F] ring-2 ring-[#F9F9F9] dark:ring-[#171717]" />
                  )}
                </button>

                {/* Refined Tooltip in Collapsed Mode */}
                {!isSidebarExpanded && (
                  <div className="absolute left-full ml-2.5 top-1/2 -translate-y-1/2 z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-100 whitespace-nowrap px-2.5 py-1 rounded-lg bg-white dark:bg-[#212121] text-zinc-900 dark:text-zinc-100 border border-black/[0.08] dark:border-white/[0.08] text-xs font-medium shadow-sm flex items-center gap-2">
                    <span>{item.label}</span>
                    {item.count !== undefined && item.count > 0 && (
                      <span className="text-[10px] text-zinc-400 font-mono">
                        ({item.count})
                      </span>
                    )}
                    <kbd className="text-[10px] font-mono opacity-50 bg-black/5 dark:bg-white/10 px-1 rounded">
                      {item.shortcut}
                    </kbd>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Area: Sync & User Profile */}
      <div className="flex flex-col gap-1 w-full relative">
        {/* Sync Button */}
        <div className="w-full flex justify-center">
          <button
            onClick={() => triggerSync()}
            disabled={isSyncing}
            title={isSyncing ? "Syncing..." : "Sync Mail"}
            className={`rounded-lg flex items-center text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-[#ECECEC] dark:hover:bg-[#2F2F2F] transition-colors cursor-pointer disabled:opacity-50 ${
              isSidebarExpanded
                ? "w-full px-3 py-1.5 gap-2.5 text-xs font-normal"
                : "w-9 h-9 justify-center mx-auto"
            }`}
          >
            <Icons.Reload
              size={15}
              className={`flex-shrink-0 ${
                isSyncing ? "animate-spin text-[#10A37F]" : ""
              }`}
            />
            {isSidebarExpanded && (
              <span className="tracking-tight">{isSyncing ? "Syncing..." : "Sync"}</span>
            )}
          </button>
        </div>

        {/* User Account Button */}
        {primaryAccount && (
          <div className="relative w-full flex justify-center">
            <button
              onClick={() => setShowAccountMenu(!showAccountMenu)}
              title={primaryAccount.displayName || primaryAccount.email}
              className={`rounded-lg flex items-center transition-colors duration-100 cursor-pointer hover:bg-[#ECECEC] dark:hover:bg-[#2F2F2F] ${
                isSidebarExpanded
                  ? "w-full p-2 gap-2 text-left"
                  : "w-9 h-9 justify-center mx-auto"
              }`}
            >
              <div className="w-6 h-6 rounded-md bg-[#10A37F] text-white flex items-center justify-center text-[10px] font-bold select-none flex-shrink-0">
                {userInitials}
              </div>

              {isSidebarExpanded && (
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate tracking-tight">
                    {primaryAccount.displayName || primaryAccount.email}
                  </div>
                </div>
              )}

              {isSidebarExpanded && (
                <Icons.ArrowRight size={13} className="text-zinc-400 flex-shrink-0 opacity-60" />
              )}
            </button>

            {/* Account Switcher Dropdown Popover */}
            {showAccountMenu && (
              <div className="absolute bottom-full left-0 mb-2 w-64 rounded-xl bg-white dark:bg-[#252525] border border-black/10 dark:border-white/10 shadow-lg p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-2.5 py-1 text-[11px] font-medium text-zinc-400">
                  Accounts
                </div>

                {accounts.map((acc) => (
                  <div
                    key={acc.id}
                    className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/[0.06] flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <AccountBadge name={acc.displayName} email={acc.email} size={20} />
                      <span className="truncate text-zinc-800 dark:text-zinc-200">
                        {acc.email}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDisconnect(acc.id, acc.email)}
                      title="Disconnect Account"
                      className="p-1 text-zinc-400 hover:text-rose-500 rounded transition-colors cursor-pointer"
                    >
                      <Icons.Logout size={14} />
                    </button>
                  </div>
                ))}

                <div className="pt-1 mt-1 border-t border-black/6 dark:border-white/6">
                  <button
                    onClick={handleAddAccount}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-zinc-800 dark:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/[0.06] font-medium transition-colors cursor-pointer"
                  >
                    <Icons.Add size={14} className="text-zinc-500" />
                    <span>Add account</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};
