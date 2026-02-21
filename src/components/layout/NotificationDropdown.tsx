"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Upload,
  Trash2,
  Download,
  RefreshCcw,
  Edit3,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { formatTimeAgo, cn } from "@/lib/utils";

interface AuditLog {
  id: string;
  userId: string;
  userName: string | null;
  action: string;
  mediaId: string | null;
  mediaName: string | null;
  fileType: string | null;
  folderId: string | null;
  folderName: string | null;
  timestamp: string;
}

export default function NotificationDropdown({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
    }
  }, [isOpen]);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/admin/history", {
        headers: {
          Authorization: `Bearer ${token}`,
          "x-user-data": localStorage.getItem("user") || "",
        },
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data.slice(0, 10)); // Show only top 10 in dropdown
      }
    } catch (error) {
      console.error("Failed to fetch logs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case "UPLOAD":
        return <Upload className="h-4 w-4 text-emerald-400" />;
      case "DELETE":
        return <Trash2 className="h-4 w-4 text-rose-400" />;
      case "DOWNLOAD":
        return <Download className="h-4 w-4 text-blue-400" />;
      case "REPLACE":
        return <RefreshCcw className="h-4 w-4 text-indigo-400" />;
      case "RENAME":
        return <Edit3 className="h-4 w-4 text-amber-400" />;
      default:
        return <Bell className="h-4 w-4 text-slate-400" />;
    }
  };

  const getActionText = (log: AuditLog) => {
    const name = log.userName || "Someone";
    const target = log.mediaName || "an asset";

    switch (log.action) {
      case "UPLOAD":
        return (
          <>
            <span className="font-bold text-white">{name}</span> uploaded{" "}
            <span className="text-emerald-400">{target}</span>
          </>
        );
      case "DELETE":
        return (
          <>
            <span className="font-bold text-white">{name}</span> deleted{" "}
            <span className="text-rose-400">{target}</span>
          </>
        );
      case "DOWNLOAD":
        return (
          <>
            <span className="font-bold text-white">{name}</span> downloaded{" "}
            <span className="text-blue-400">{target}</span>
          </>
        );
      case "REPLACE":
        return (
          <>
            <span className="font-bold text-white">{name}</span> replaced{" "}
            <span className="text-indigo-400">{target}</span>
          </>
        );
      case "RENAME":
        return (
          <>
            <span className="font-bold text-white">{name}</span> renamed{" "}
            <span className="text-amber-400">{target}</span>
          </>
        );
      default:
        return (
          <>
            <span className="font-bold text-white">{name}</span> performed an
            action
          </>
        );
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-3 w-80 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50"
          >
            <div className="p-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
              <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                <Bell className="h-3 w-3 text-indigo-400" />
                Recent Activity
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-bold">
                {logs.length} New
              </span>
            </div>

            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
              {isLoading ? (
                <div className="p-12 flex flex-col items-center justify-center space-y-3">
                  <div className="w-8 h-8 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Loading feed...
                  </p>
                </div>
              ) : logs.length > 0 ? (
                <div className="divide-y divide-white/5">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className="p-4 hover:bg-white/[0.02] transition-colors group"
                    >
                      <div className="flex gap-4">
                        <div className="p-2 rounded-xl bg-slate-800 border border-white/5 shrink-0 h-fit group-hover:border-indigo-500/30 transition-colors">
                          {getActionIcon(log.action)}
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-slate-300 leading-relaxed">
                            {getActionText(log)}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                            <Clock className="h-3 w-3" />
                            {formatTimeAgo(log.timestamp)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="p-4 rounded-full bg-slate-800 border border-white/5">
                    <CheckCircle2 className="h-8 w-8 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-400">
                      All caught up!
                    </p>
                    <p className="text-[10px] text-slate-600 font-medium mt-1">
                      No recent activity to show.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => {
                onClose();
                window.location.href = "/admin/history";
              }}
              className="w-full p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-white hover:bg-white/[0.02] border-t border-white/5 transition-all"
            >
              View Full History
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
