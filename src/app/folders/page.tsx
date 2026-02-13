"use client";

import { useState, useEffect } from "react";
import {
  Search,
  LayoutGrid,
  List,
  Plus,
  MoreHorizontal,
  Folder as FolderIcon,
  Calendar,
  Layers,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";
import { Folder } from "@/types";
import { cn } from "@/lib/utils";
import CreateFolderModal from "@/components/folders/CreateFolderModal";

export default function FoldersPage() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const fetchFolders = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/folders", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setFolders(data);
      }
    } catch (error) {
      console.error("Failed to fetch folders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFolders();
  }, []);

  const filteredFolders = folders.filter(
    (f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.productCategory?.toLowerCase() || "").includes(
        searchQuery.toLowerCase(),
      ),
  );

  return (
    <div className="h-full flex flex-col gap-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pt-4">
        <div className="space-y-4 flex-1">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-indigo-400">
            <Layers className="h-3 w-3" />
            <span>Workspace Architect</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-5xl font-bold tracking-tight text-white">
              Collections
            </h1>
            <p className="text-slate-400 text-base max-w-2xl leading-relaxed">
              Manage your high-fidelity product asset structures. Organize by
              campaign, category, or product line.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3.5 rounded-2xl font-bold transition-all shadow-lg shadow-indigo-600/20 active:scale-95 group"
          >
            <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform" />
            New Collection
          </button>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-card/50 border border-border px-6 py-4 rounded-2xl">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            placeholder="Search collections..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/[0.03] border border-white/5 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-600"
          />
        </div>

        <div className="flex items-center gap-2 bg-white/5 rounded-xl p-1">
          <button
            onClick={() => setViewMode("grid")}
            className={cn(
              "p-2 rounded-lg transition-all",
              viewMode === "grid"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                : "text-slate-500 hover:text-white",
            )}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "p-2 rounded-lg transition-all",
              viewMode === "list"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                : "text-slate-500 hover:text-white",
            )}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Grid View */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">
            Synchronizing Clusters...
          </p>
        </div>
      ) : filteredFolders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-border rounded-[2.5rem] bg-slate-900/20">
          <div className="p-6 bg-white/5 rounded-2xl mb-6">
            <FolderIcon className="h-10 w-10 text-slate-600" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            Initialize Your First Collection
          </h3>
          <p className="text-slate-500 max-w-sm mb-8 text-sm leading-relaxed">
            Unlock coordinated asset management by grouping your media into
            intelligent product collections.
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold border border-white/10 transition-all text-sm"
          >
            Get Started
          </button>
        </div>
      ) : (
        <div
          className={cn(
            "grid gap-6",
            viewMode === "grid"
              ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              : "grid-cols-1",
          )}
        >
          {filteredFolders.map((folder) => (
            <Link
              key={folder.id}
              href={`/folders/${folder.id}`}
              className={cn(
                "group bg-card border border-border rounded-2xl overflow-hidden hover:border-indigo-500/50 transition-all duration-300",
                viewMode === "list" && "flex items-center p-4 gap-6",
              )}
            >
              {viewMode === "grid" && (
                <div className="aspect-[16/9] bg-slate-900 relative p-4 flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-transparent group-hover:bg-indigo-600/5 transition-colors" />
                  <FolderIcon className="h-16 w-16 text-slate-800 group-hover:text-indigo-400 group-hover:scale-110 transition-all duration-500" />
                  <div className="absolute top-4 right-4 p-2 rounded-lg bg-black/40 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowUpRight className="h-4 w-4 text-white" />
                  </div>
                </div>
              )}

              {viewMode === "list" && (
                <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center shrink-0">
                  <FolderIcon className="h-6 w-6 text-slate-600 group-hover:text-indigo-400 transition-colors" />
                </div>
              )}

              <div className={cn("p-6", viewMode === "list" && "p-0 flex-1")}>
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-white group-hover:text-indigo-400 transition-colors">
                    {folder.name}
                  </h3>
                  <span className="text-[10px] font-bold text-slate-500 bg-white/5 px-2 py-0.5 rounded border border-white/5 uppercase">
                    {folder.media?.length || 0} Assets
                  </span>
                </div>
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
                  {folder.description ||
                    "No description provided for this collection."}
                </p>
                <div className="flex items-center gap-4 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3 text-indigo-400/50" />
                    <span>{folder.productCategory || "Uncategorized"}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <CreateFolderModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onFolderCreated={fetchFolders}
      />
    </div>
  );
}
