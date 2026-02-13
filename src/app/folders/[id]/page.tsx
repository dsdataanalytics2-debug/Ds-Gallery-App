"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Upload,
  Grid,
  List as ListIcon,
  Trash2,
  Loader2,
  Search,
} from "lucide-react";
import { Folder } from "@/types";
import MediaGrid from "@/components/media/MediaGrid";
import UploadModal from "@/components/media/UploadModal";
import MediaPreviewDrawer from "@/components/media/MediaPreviewDrawer";
import { Sparkles, LayoutGrid } from "lucide-react";

export default function FolderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [folder, setFolder] = useState<Folder | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAsset, setSelectedAsset] = useState<any | null>(null);

  const fetchFolder = async () => {
    try {
      const res = await fetch(`/api/folders/${id}`);
      if (res.ok) {
        const data = await res.json();
        setFolder(data);
      }
    } catch (error) {
      console.error("Error fetching folder:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFolder();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
        <p className="text-slate-500 text-sm font-bold uppercase tracking-widest leading-relaxed">
          Decrypting Collection...
        </p>
      </div>
    );
  }

  if (!folder) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center px-4">
        <div className="bg-card border border-border rounded-3xl p-12 max-w-md shadow-2xl">
          <div className="p-6 rounded-2xl bg-red-500/10 mb-6 inline-block">
            <Trash2 className="h-12 w-12 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Collection Disappeared
          </h2>
          <p className="text-slate-400 mb-8 leading-relaxed text-sm">
            This collection seems to have been archived or removed from the
            system.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all"
          >
            <ArrowLeft className="h-4 w-4" /> Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-10 pb-20">
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pt-4">
        <div className="space-y-4 flex-1">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500">
            <Link href="/" className="hover:text-indigo-400 transition-colors">
              Workspace
            </Link>
            <span className="text-slate-800">/</span>
            <span className="text-indigo-400">Collections</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-5xl font-bold tracking-tight text-white">
              {folder.name}
            </h1>
            <p className="text-slate-400 text-base max-w-2xl leading-relaxed">
              {folder.description ||
                "Comprehensive asset overview for this product collection."}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {folder.productCategory && (
              <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-bold uppercase tracking-widest border border-indigo-500/20">
                {folder.productCategory}
              </span>
            )}
            {folder.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 rounded-full bg-white/5 text-slate-400 text-[10px] font-bold uppercase tracking-widest border border-white/5"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <button
            onClick={() => setIsUploadOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3.5 rounded-2xl font-bold transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
          >
            <Upload className="h-4 w-4" />
            Import Assets
          </button>
          <button className="p-3.5 rounded-2xl bg-red-500/5 hover:bg-red-500/10 text-red-500 border border-red-500/10 transition-all active:scale-95">
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Media Interaction Zone */}
      <div className="bg-card/30 border border-border rounded-[2rem] overflow-hidden">
        <div className="p-8 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-3">
                Asset Stream
                <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-slate-500 border border-white/5">
                  {folder.media?.length || 0} Total
                </span>
              </h2>
              <div className="h-4 w-px bg-white/10 hidden sm:block"></div>
              <div className="relative hidden md:block w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  placeholder="Filter by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/5 rounded-xl py-2 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 p-1 bg-white/5 rounded-xl self-start">
              <button className="p-2 rounded-lg bg-indigo-600 text-white shadow-lg shadow-indigo-600/20">
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button className="p-2 rounded-lg text-slate-500 hover:text-white transition-colors">
                <ListIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          <MediaGrid
            media={
              searchQuery
                ? (folder.media || []).filter((item) =>
                    item.fileName
                      .toLowerCase()
                      .includes(searchQuery.toLowerCase()),
                  )
                : folder.media || []
            }
            onItemClick={(item) => setSelectedAsset(item)}
          />
        </div>
      </div>

      <UploadModal
        folderId={folder.id}
        isOpen={isUploadOpen}
        onClose={() => {
          setIsUploadOpen(false);
          fetchFolder();
        }}
      />

      <MediaPreviewDrawer
        media={selectedAsset}
        isOpen={!!selectedAsset}
        onClose={() => setSelectedAsset(null)}
      />
    </div>
  );
}
