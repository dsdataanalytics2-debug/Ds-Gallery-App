"use client";

import { useState, useEffect } from "react";
import {
  History,
  Search,
  Filter,
  Download,
  Trash2,
  Upload,
  User,
  Clock,
  FileText,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AuditLog {
  id: string;
  userName: string;
  action: "UPLOAD" | "DELETE" | "DOWNLOAD";
  mediaName: string;
  fileType: string;
  folderName: string;
  timestamp: string;
}

export default function HistoryPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/admin/history", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setLogs(data);
        }
      } catch (e) {
        console.error("Failed to fetch logs", e);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const getActionIcon = (action: string) => {
    switch (action) {
      case "UPLOAD":
        return <Upload className="h-4 w-4 text-emerald-400" />;
      case "DELETE":
        return <Trash2 className="h-4 w-4 text-rose-400" />;
      case "DOWNLOAD":
        return <Download className="h-4 w-4 text-indigo-400" />;
      default:
        return <History className="h-4 w-4" />;
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.mediaName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === "all" || log.action === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="h-full flex flex-col gap-10">
      <div className="flex flex-col gap-4 pt-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-indigo-400">
          <History className="h-3 w-3" />
          <span>System Audit</span>
        </div>
        <div className="space-y-2">
          <h1 className="text-5xl font-bold tracking-tight text-white">
            Activity History
          </h1>
          <p className="text-slate-400 text-base max-w-2xl leading-relaxed">
            Track all media interactions across your library. Monitor who
            uploaded, deleted, or downloaded specific assets.
          </p>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-6 bg-card/30 border border-border rounded-[2.5rem] p-8 overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              placeholder="Search by user or file..."
              className="w-full bg-white/[0.03] border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 p-1 bg-white/5 rounded-xl overflow-x-auto">
            {["all", "UPLOAD", "DELETE", "DOWNLOAD"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap",
                  filter === f
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                    : "text-slate-400 hover:text-white",
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center gap-4">
              <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Retrieving Logs...
              </p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-4">
              <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center">
                <FileText className="h-8 w-8" />
              </div>
              <p className="text-sm font-bold uppercase tracking-widest">
                No activity found
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="group flex flex-col md:flex-row md:items-center gap-6 p-5 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-indigo-500/30 transition-all relative overflow-hidden"
                >
                  <div className="absolute inset-y-0 left-0 w-1 bg-transparent group-hover:bg-indigo-500 transition-all" />

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-white/5 flex items-center justify-center text-white">
                      {getActionIcon(log.action)}
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-white uppercase tracking-wider">
                        {log.action}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        <Clock className="h-3 w-3" />
                        {new Date(log.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col md:flex-row md:items-center gap-8">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                        <User className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                          Contributor
                        </p>
                        <p className="text-sm font-bold text-white italic">
                          {log.userName || "System User"}
                        </p>
                      </div>
                    </div>

                    <div className="flex-1">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        Asset Detail
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white max-w-sm truncate">
                          {log.mediaName || "N/A"}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-white/5 text-[9px] font-bold text-slate-400 uppercase tracking-tighter border border-white/5">
                          {log.fileType}
                        </span>
                      </div>
                    </div>

                    <div className="hidden lg:block">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        Source Folder
                      </p>
                      <p className="text-sm font-bold text-indigo-400">
                        {log.folderName || "---"}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center justify-end">
                    <button className="p-2 rounded-xl bg-white/5 text-slate-500 hover:text-white transition-colors">
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
