"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Loader2,
  Image as ImageIcon,
  Video,
  Calendar,
  Folder as FolderIcon,
} from "lucide-react";
import { Media } from "@/types";
import MediaGrid from "@/components/media/MediaGrid";
import FilterPanel from "@/components/media/FilterPanel";
import MediaPreviewDrawer from "@/components/media/MediaPreviewDrawer";
import { Sparkles } from "lucide-react";

export default function AllMediaPage() {
  const [media, setMedia] = useState<Media[]>([]);
  const [counts, setCounts] = useState({ all: 0, images: 0, videos: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "image" | "video">("all");
  const [activeCollections, setActiveCollections] = useState<string[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<Media | null>(null);

  const fetchGlobalStats = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/analytics", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setCounts({
          all: data.summary?.totalMedia || 0,
          images: data.summary?.imageCount || 0,
          videos: data.summary?.videoCount || 0,
        });
      } else {
        console.error("Media Library: Failed to fetch analytics:", res.status);
      }
    } catch (error) {
      console.error("Failed to fetch global stats:", error);
    }
  };

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append("q", searchQuery);
      if (filter !== "all") params.append("type", filter);
      if (activeCollections.length > 0)
        params.append("folderIds", activeCollections.join(","));

      const token = localStorage.getItem("token");
      const res = await fetch(`/api/media?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setMedia(data);
      } else {
        console.error("Media Library: Failed to fetch media:", res.status);
      }
    } catch (error) {
      console.error("Error fetching media:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGlobalStats();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMedia();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, filter, activeCollections]);

  const handleCollectionToggle = (collectionId: string) => {
    setActiveCollections((prev) =>
      prev.includes(collectionId)
        ? prev.filter((id) => id !== collectionId)
        : [...prev, collectionId],
    );
  };

  return (
    <div className="h-full flex flex-col gap-8">
      {/* Page Header */}
      <div className="flex flex-col gap-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-bold border border-indigo-500/20 w-fit">
          <Sparkles className="h-3 w-3" />
          <span>Centralized Asset Intelligence</span>
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-white">
          Media Library
        </h1>
        <p className="text-slate-400 text-sm max-w-2xl">
          Search, filter, and manage all your digital assets across collections
          in one unified workspace.
        </p>
      </div>

      <div className="flex-1 flex gap-8 items-start min-h-0">
        {/* Left Sidebar: Filters */}
        <aside className="w-72 shrink-0 bg-card border border-border rounded-2xl sticky top-0 hidden lg:block overflow-y-auto">
          <FilterPanel
            counts={counts}
            activeFilter={filter}
            onFilterChange={(f) => setFilter(f)}
            activeCollections={activeCollections}
            onCollectionToggle={handleCollectionToggle}
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
          />
        </aside>

        {/* Main Content: Grid */}
        <div className="flex-1 space-y-6 overflow-y-auto custom-scrollbar pr-2 h-full pb-20">
          <div className="flex items-center justify-between bg-card/50 border border-border px-6 py-4 rounded-2xl">
            <div className="flex items-center gap-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-3">
                {loading ? "Re-indexing..." : "Asset Stream"}
                {!loading && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    {media.length} Results
                  </span>
                )}
              </h2>
            </div>

            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                placeholder="Quick search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/5 rounded-xl py-2 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
              <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">
                Hydrating Media Library...
              </p>
            </div>
          ) : (
            <MediaGrid
              media={media}
              onItemClick={(item) => setSelectedAsset(item)}
            />
          )}
        </div>
      </div>

      <MediaPreviewDrawer
        media={selectedAsset}
        isOpen={!!selectedAsset}
        onClose={() => setSelectedAsset(null)}
      />
    </div>
  );
}
