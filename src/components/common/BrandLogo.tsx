import React, { useState } from "react";
import gmailPng from "../../assets/gmail.png";

export const ZmailMark: React.FC<{ className?: string; title?: string }> = ({
  className = "w-8 h-8",
  title = "Zmail",
}) => (
  <span
    title={title}
    aria-label={title}
    role="img"
    className={`inline-flex items-center justify-center rounded-lg bg-[#10A37F] text-white select-none ${className}`}
  >
    <svg className="w-[58%] h-[58%]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L1 7" />
    </svg>
  </span>
);

export const GmailLogo: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <img
    src={gmailPng}
    alt="Gmail"
    className={`${className} object-contain inline-block flex-shrink-0 select-none`}
    draggable={false}
  />
);

export const AccountBadge: React.FC<{
  name?: string;
  email: string;
  size?: number;
  className?: string;
}> = ({ name, email, size = 28, className = "" }) => {
  const label = (name || email || "?").trim();
  const initials = label
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "?";

  return (
    <span
      style={{
        width: size,
        height: size,
        fontSize: Math.max(9, Math.round(size * 0.38)),
      }}
      className={`inline-flex items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-black/[0.08] dark:border-white/[0.08] font-medium select-none ${className}`}
    >
      {initials}
    </span>
  );
};

function getRootDomain(domain: string): string {
  if (!domain) return "";
  let clean = domain.toLowerCase().trim();
  if (clean === "slack-mail.com") return "slack.com";
  const parts = clean.split(".");
  if (parts.length <= 2) return clean;
  if (parts.length >= 3 && ["co", "com", "org", "net", "gov", "edu"].includes(parts[parts.length - 2])) {
    return parts.slice(-3).join(".");
  }
  return parts.slice(-2).join(".");
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getInitials(name?: string, email?: string): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  }
  if (email && email.trim()) {
    const userPart = email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "");
    return userPart.slice(0, 2).toUpperCase() || "M";
  }
  return "M";
}

export const SenderAvatar: React.FC<{
  email: string;
  name?: string;
  size?: number;
  className?: string;
}> = ({ email, name, size = 36, className = "" }) => {
  const [imgError, setImgError] = useState(false);

  const cleanEmail = (email || "").trim().toLowerCase();
  const domain = cleanEmail.includes("@") ? cleanEmail.split("@")[1] : "";
  const rootDomain = getRootDomain(domain);

  // 1. Google / YouTube official branding
  const isGoogle = cleanEmail.includes("google") || cleanEmail.includes("youtube");
  if (isGoogle) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`rounded-lg bg-white dark:bg-[#1E2026] border border-black/[0.08] dark:border-white/[0.08] flex items-center justify-center flex-shrink-0 select-none ${className}`}
      >
        <GmailLogo className="w-[60%] h-[60%]" />
      </div>
    );
  }

  // 2. Generic public consumer webmail domains
  const isGenericProvider = [
    "gmail.com",
    "googlemail.com",
    "yahoo.com",
    "ymail.com",
    "hotmail.com",
    "outlook.com",
    "live.com",
    "icloud.com",
    "me.com",
    "aol.com",
    "mail.com",
    "proton.me",
    "protonmail.com",
    "zoho.com",
  ].includes(rootDomain);

  // 3. Known Company/Domain Senders (e.g. github.com, stripe.com, vercel.com, linear.app, etc.)
  const isCompanySender = Boolean(rootDomain && !isGenericProvider);
  const hash = hashString(cleanEmail || name || "contact");

  if (isCompanySender && !imgError) {
    const brandLogoUrl = `https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${rootDomain}&size=128`;
    return (
      <div
        style={{ width: size, height: size }}
        className={`rounded-lg p-1 bg-white dark:bg-zinc-900 border border-black/[0.08] dark:border-white/[0.08] flex items-center justify-center flex-shrink-0 select-none ${className}`}
      >
        {/* Do not force round clip - let square logos be square, round logos be round */}
        <img
          src={brandLogoUrl}
          alt={name || domain || cleanEmail}
          className="w-full h-full object-contain"
          onError={() => setImgError(true)}
          loading="lazy"
          draggable={false}
        />
      </div>
    );
  }

  // Personal contacts or failed logos: clean typographic monogram pill
  const initials = getInitials(name, cleanEmail);
  const palettes = [
    "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700",
    "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40",
    "bg-sky-50 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300 border-sky-200 dark:border-sky-800/40",
    "bg-indigo-50 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/40",
    "bg-violet-50 text-violet-800 dark:bg-violet-950/40 dark:text-violet-300 border-violet-200 dark:border-violet-800/40",
    "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800/40",
  ];
  const colorClass = palettes[hash % palettes.length];

  return (
    <div
      style={{
        width: size,
        height: size,
        fontSize: Math.max(10, Math.round(size * 0.36)),
      }}
      className={`rounded-lg flex items-center justify-center font-semibold select-none flex-shrink-0 border ${colorClass} ${className}`}
    >
      {initials}
    </div>
  );
};
