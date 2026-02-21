"use client";

import { useState, useEffect } from "react";
import {
  Search,
  LayoutGrid,
  Plus,
  Folder as FolderIcon,
  Layers,
} from "lucide-react";
import Link from "next/link";
import { Folder } from "@/types";
import { cn } from "@/lib/utils";
import CreateFolderModal from "@/components/folders/CreateFolderModal";
import FolderCard from "@/components/folders/FolderCard";
import Pagination from "@/components/ui/Pagination";

export default function FoldersPage() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [totalPages, setTotalPages] = useState(1);

  const fetchFolders = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
      });
      if (searchQuery) params.append("q", searchQuery);

      const res = await fetch(`/api/folders?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "x-user-data": localStorage.getItem("user") || "",
        },
      });
      if (res.ok) {
        const result = await res.json();
        setFolders(result.data);
        setTotalPages(result.pagination.totalPages);
      }
    } catch (error) {
      console.error("Failed to fetch folders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFolders();
  }, [page, pageSize]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (page !== 1) setPage(1);
      else fetchFolders();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

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

        <div className="flex items-center gap-2 bg-indigo-600/10 text-indigo-400 rounded-xl px-3 py-2 border border-indigo-500/20">
          <LayoutGrid className="h-4 w-4" />
          <span className="text-xs font-bold uppercase tracking-wider">
            Grid View
          </span>
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
      ) : folders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-border rounded-[2.5rem] bg-slate-900/20">
          <div className="p-6 bg-white/5 rounded-2xl mb-6">
            <FolderIcon className="h-10 w-10 text-slate-600" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            {searchQuery
              ? "No Results Found"
              : "Initialize Your First Collection"}
          </h3>
          <p className="text-slate-500 max-w-sm mb-8 text-sm leading-relaxed">
            {searchQuery
              ? `We couldn't find any collections matching "${searchQuery}".`
              : "Unlock coordinated asset management by grouping your media into intelligent product collections."}
          </p>
          {!searchQuery && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold border border-white/10 transition-all text-sm"
            >
              Get Started
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-7">
            {folders.map((folder) => (
              <FolderCard
                key={folder.id}
                folder={folder}
                onUpdate={fetchFolders}
              />
            ))}
          </div>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            pageSize={pageSize}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
            onPageChange={setPage}
          />
        </>
      )}

      <CreateFolderModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onFolderCreated={fetchFolders}
      />
    </div>
  );
}
