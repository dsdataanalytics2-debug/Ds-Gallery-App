"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Loader2,
  CheckCircle2,
  RefreshCw,
  Trash2,
  ArrowRightLeft,
  Chrome,
  AlertCircle,
  Shield,
  Database,
  ExternalLink,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface GoogleAccount {
  id: string;
  tenantId: string;
  email: string;
  displayName: string | null;
  picture: string | null;
  isActive: boolean;
  rootFolderId: string | null;
}

const AVATAR_COLORS = [
  "bg-indigo-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-cyan-500",
];

function AccountAvatar({
  account,
  size = 40,
}: {
  account: GoogleAccount;
  size?: number;
}) {
  const [imgError, setImgError] = useState(false);
  const colorClass =
    AVATAR_COLORS[(account.email.charCodeAt(0) || 0) % AVATAR_COLORS.length];
  const initial =
    (account.displayName || account.email)[0]?.toUpperCase() ?? "G";

  if (account.picture && !imgError) {
    return (
      <img
        src={account.picture}
        alt={account.displayName || account.email}
        width={size}
        height={size}
        className="rounded-full object-cover shrink-0 ring-2 ring-white/10"
        style={{ width: size, height: size }}
        onError={() => setImgError(true)}
      />
    );
  }
  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center text-white font-bold shrink-0 ring-2 ring-white/10",
        colorClass,
      )}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initial}
    </div>
  );
}

export default function GoogleDriveConnect() {
  const [accounts, setAccounts] = useState<GoogleAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [switchingId, setSwitchingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchAccounts = useCallback(async () => {
    try {
      const res = await fetch("/api/google-auth/accounts", {
        cache: "no-store",
      });
      const data = await res.json();
      setAccounts(data.accounts || []);
    } catch {
      console.error("Failed to fetch accounts");
      showToast("error", "Failed to load Google accounts.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
    const params = new URLSearchParams(window.location.search);
    if (params.get("connected") === "true") {
      showToast("success", "Account synchronized across all clusters.");
      window.history.replaceState({}, "", window.location.pathname);
    }
    const oauthError = params.get("oauth_error");
    if (oauthError) {
      showToast("error", `Protocol error: ${decodeURIComponent(oauthError)}`);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [fetchAccounts]);

  const handleSwitch = async (id: string) => {
    setSwitchingId(id);
    try {
      const res = await fetch(`/api/google-auth/accounts/${id}/switch`, {
        method: "POST",
      });
      if (res.ok) {
        setAccounts((prev) =>
          prev.map((a) => ({ ...a, isActive: a.id === id })),
        );
        showToast("success", "Active node switched successfully.");
      } else {
        showToast("error", "Handshake failed. Account reset aborted.");
      }
    } finally {
      setSwitchingId(null);
    }
  };

  const handleRemove = async (id: string, label: string) => {
    if (!confirm(`Disconnect "${label}" node? Operation is irreversible.`))
      return;
    setRemovingId(id);
    try {
      const res = await fetch(`/api/google-auth/accounts/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.status === 409) {
        showToast("error", data.error);
      } else if (res.ok) {
        showToast("success", `Node "${label}" disconnected from cloud.`);
        await fetchAccounts();
      } else {
        showToast("error", data.error || "De-registration failed.");
      }
    } finally {
      setRemovingId(null);
    }
  };

  const activeAccount = accounts.find((a) => a.isActive);

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={cn(
              "flex items-start gap-3 px-5 py-4 rounded-2xl border text-xs font-bold shadow-2xl backdrop-blur-xl z-50",
              toast.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                : "bg-red-500/10 border-red-500/20 text-red-400",
            )}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            )}
            <div className="space-y-0.5">
              <p className="uppercase tracking-widest">
                {toast.type === "success"
                  ? "Operation Success"
                  : "Protocol Error"}
              </p>
              <p className="font-medium opacity-80">{toast.message}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Wrapper */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              Google Drive Gateway
            </h4>
            <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-[9px] font-black text-indigo-400 tracking-tighter uppercase animation-pulse">
              {accounts.length} Node{accounts.length !== 1 ? "s" : ""}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            {activeAccount
              ? `Syncing via ${activeAccount.displayName || activeAccount.email}`
              : "Zero active connections found."}
          </p>
        </div>

        <button
          onClick={() => (window.location.href = "/api/google-auth/start")}
          className="group relative flex items-center gap-2.5 px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_30px_-5px_rgba(79,70,229,0.5)] transition-all overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          <Chrome className="h-3.5 w-3.5" />
          Authorize New Node
        </button>
      </div>

      {/* Accounts Pipeline */}
      <div className="relative">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <div className="relative">
              <Loader2 className="h-10 w-10 animate-spin text-indigo-500 opacity-20" />
              <Database className="h-5 w-5 text-indigo-400 absolute inset-0 m-auto" />
            </div>
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em] animate-pulse">
              Initializing cloud streams...
            </p>
          </div>
        ) : accounts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="border border-dashed border-white/5 rounded-[2rem] p-12 flex flex-col items-center gap-6 text-center bg-white/[0.01] backdrop-blur-sm"
          >
            <div className="w-16 h-16 rounded-[1.25rem] bg-indigo-500/5 border border-indigo-500/10 flex items-center justify-center">
              <Shield className="h-8 w-8 text-indigo-600/50" />
            </div>
            <div className="space-y-2">
              <p className="text-base font-bold text-white tracking-tight">
                No Cloud Nodes Connected
              </p>
              <p className="text-xs text-slate-500 max-w-[260px] leading-relaxed">
                Connect your first Google Drive account to activate the dynamic
                multi-tenant storage engine.
              </p>
            </div>
            <button
              onClick={() => (window.location.href = "/api/google-auth/start")}
              className="px-8 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold transition-all"
            >
              Start Connection Flow
            </button>
          </motion.div>
        ) : (
          <motion.div layout className="space-y-3">
            <AnimatePresence mode="popLayout">
              {accounts.map((account) => (
                <motion.div
                  key={account.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={cn(
                    "relative group flex items-center gap-5 p-5 rounded-[1.75rem] border transition-all overflow-hidden backdrop-blur-md",
                    account.isActive
                      ? "border-emerald-500/30 bg-emerald-500/10 shadow-[0_0_50px_-12px_rgba(16,185,129,0.15)]"
                      : "border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04]",
                  )}
                >
                  {/* Active Indicator Glow */}
                  {account.isActive && (
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[40px] rounded-full -translate-y-1/2 translate-x-1/2" />
                  )}

                  <AccountAvatar account={account} size={48} />

                  <div className="flex-1 min-w-0 z-10">
                    <div className="flex items-center gap-2.5 mb-0.5">
                      <p className="text-sm font-bold text-white truncate group-hover:text-indigo-300 transition-colors">
                        {account.displayName || account.email}
                      </p>
                      {account.isActive && (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/20 shadow-lg shadow-emerald-500/20">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span className="text-[9px] font-black text-emerald-400 uppercase tracking-tighter">
                            Gateway Active
                          </span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 font-medium truncate mb-2">
                      {account.email}
                    </p>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-[9px] font-black text-slate-400 bg-white/5 px-2 py-1 rounded-lg border border-white/5 uppercase tracking-widest">
                        <Database className="h-2.5 w-2.5" />
                        ID: {account.tenantId || "Default"}
                      </span>
                      {account.rootFolderId && (
                        <a
                          href={`https://drive.google.com/drive/folders/${account.rootFolderId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[9px] font-bold text-indigo-400 hover:text-indigo-300 bg-indigo-400/5 px-2 py-1 rounded-lg border border-indigo-400/10 uppercase tracking-widest transition-all hover:scale-105"
                        >
                          <ExternalLink className="h-2.5 w-2.5" />
                          Vault
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 z-10">
                    {!account.isActive && (
                      <button
                        onClick={() => handleSwitch(account.id)}
                        disabled={!!switchingId || !!removingId}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed group/btn"
                      >
                        {switchingId === account.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <ArrowRightLeft className="h-3 w-3 group-hover:rotate-180 transition-transform duration-500" />
                        )}
                        Switch
                      </button>
                    )}
                    <button
                      onClick={() =>
                        handleRemove(
                          account.id,
                          account.displayName || account.email,
                        )
                      }
                      disabled={!!switchingId || !!removingId}
                      className="p-3 rounded-2xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 transition-all disabled:opacity-30"
                    >
                      {removingId === account.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      <div className="flex justify-end pt-2">
        <button
          onClick={() => {
            setIsLoading(true);
            fetchAccounts();
          }}
          className="group flex items-center gap-2 text-[10px] font-bold text-slate-500 hover:text-indigo-400 transition-all uppercase tracking-[0.2em]"
        >
          <RefreshCw
            className={cn(
              "h-3 w-3 transition-transform duration-700",
              isLoading && "animate-spin",
            )}
          />
          Re-sync Registry
        </button>
      </div>
    </div>
  );
}
