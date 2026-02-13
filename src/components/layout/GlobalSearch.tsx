"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Folder, ImageIcon, Film, X, Command } from "lucide-react";
import { useRouter } from "next/navigation";

export default function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      setIsOpen((prev) => !prev);
    }
    if (e.key === "Escape") {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] px-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-900 border border-border rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center px-4 py-4 border-b border-border">
          <Search className="h-5 w-5 text-slate-400 mr-3" />
          <input
            autoFocus
            type="text"
            placeholder="Search everything..."
            className="flex-1 bg-transparent border-none outline-none text-white text-lg placeholder:text-slate-500"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded border border-border bg-slate-800 text-[10px] font-medium text-slate-400">
            <span>ESC</span>
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2 custom-scrollbar">
          {query.length === 0 ? (
            <div className="p-4 text-center text-slate-500">
              <p className="text-sm">Search for folders, images, or videos</p>
            </div>
          ) : (
            <div className="space-y-4 p-2">
              {/* Search results logic would go here */}
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2">
                Folders
              </div>
              <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors text-left group">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                  <Folder className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Sample Folder</p>
                  <p className="text-xs text-slate-500">
                    Collection • 12 items
                  </p>
                </div>
              </button>

              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2">
                Media
              </div>
              <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors text-left group">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                  <ImageIcon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">
                    product-hero.jpg
                  </p>
                  <p className="text-xs text-slate-500">Image • 2.4 MB</p>
                </div>
              </button>
            </div>
          )}
        </div>

        <div className="p-3 border-t border-border bg-slate-950/50 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex gap-4">
            <span className="flex items-center gap-1 leading-none">
              <span className="p-0.5 rounded bg-slate-800 border border-border">
                ↑↓
              </span>{" "}
              to navigate
            </span>
            <span className="flex items-center gap-1 leading-none">
              <span className="p-0.5 rounded bg-slate-800 border border-border">
                Enter
              </span>{" "}
              to select
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
