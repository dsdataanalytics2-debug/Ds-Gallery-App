"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Media } from "@/types";
import MediaGrid from "@/components/media/MediaGrid";
import FilterPanel from "@/components/media/FilterPanel";
import MediaPreviewDrawer from "@/components/media/MediaPreviewDrawer";
import Pagination from "@/components/ui/Pagination";

export default function AllMediaPage() {
  const [media, setMedia] = useState<Media[]>([]);
  const [counts, setCounts] = useState({ all: 0, images: 0, videos: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "image" | "video">("all");
  const [activeCollections, setActiveCollections] = useState<string[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<Media | null>(null);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [totalPages, setTotalPages] = useState(1);

  const fetchGlobalStats = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/analytics", {
        headers: {
          Authorization: `Bearer ${token}`,
          "x-user-data": localStorage.getItem("user") || "",
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
  }, []);

  const fetchMedia = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append("q", searchQuery);
      if (filter !== "all") params.append("type", filter);
      if (activeCollections.length > 0)
        params.append("folderIds", activeCollections.join(","));

      params.append("page", page.toString());
      params.append("limit", pageSize.toString());

      const token = localStorage.getItem("token");
      const res = await fetch(`/api/media?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "x-user-data": localStorage.getItem("user") || "",
        },
      });
      if (res.ok) {
        const result = await res.json();
        setMedia(result.data);
        setTotalPages(result.pagination.totalPages);
      } else {
        console.error("Media Library: Failed to fetch media:", res.status);
      }
    } catch (error) {
      console.error("Error fetching media:", error);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, searchQuery, filter, activeCollections]);

  useEffect(() => {
    fetchGlobalStats();
  }, [fetchGlobalStats]);

  useEffect(() => {
    fetchMedia();
  }, [page, pageSize, fetchMedia]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (page !== 1) setPage(1);
      else fetchMedia();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, filter, activeCollections, page, fetchMedia]);

  const handleCollectionToggle = (collectionId: string) => {
    setActiveCollections((prev) =>
      prev.includes(collectionId)
        ? prev.filter((id) => id !== collectionId)
        : [...prev, collectionId],
    );
  };

  return (
    <div className="h-full flex flex-col gap-6 md:gap-8">
      {/* Page Header */}
      <div className="flex flex-col gap-3 pt-2 md:pt-0">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-bold border border-indigo-500/20 w-fit">
          <img src="/logo-v2.jpg" className="h-3 w-3 object-contain" alt="" />
          <span>Centralized Asset Intelligence</span>
        </div>
        <div className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white leading-tight">
            Media Library
          </h1>
          <p className="text-slate-400 text-sm md:text-base max-w-2xl leading-relaxed">
            Search, filter, and manage all your digital assets across
            collections in one unified workspace.
          </p>
        </div>
      </div>

      <div className="flex-1 flex gap-8 items-start min-h-0">
        {/* Mobile Filter Trigger */}
        <button
          onClick={() => setIsFilterDrawerOpen(true)}
          className="lg:hidden fixed bottom-6 right-6 z-40 flex items-center gap-2 px-6 py-4 bg-indigo-600 text-white rounded-2xl shadow-2xl shadow-indigo-600/40 font-bold active:scale-95 transition-all"
        >
          <SlidersHorizontal className="h-5 w-5" />
          Filters
        </button>

        {/* Left Sidebar: Filters (Desktop) */}
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

        {/* Mobile Filter Drawer */}
        {isFilterDrawerOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
              onClick={() => setIsFilterDrawerOpen(false)}
            />
            <div className="absolute right-0 inset-y-0 w-full sm:w-[320px] bg-sidebar border-l border-border animate-in slide-in-from-right duration-300 ease-out shadow-2xl flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h3 className="font-bold text-white">Advanced Search</h3>
                <button
                  onClick={() => setIsFilterDrawerOpen(false)}
                  className="p-2 text-slate-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <FilterPanel
                  counts={counts}
                  activeFilter={filter}
                  onFilterChange={(f) => {
                    setFilter(f);
                    if (window.innerWidth < 640) setIsFilterDrawerOpen(false);
                  }}
                  activeCollections={activeCollections}
                  onCollectionToggle={handleCollectionToggle}
                  searchValue={searchQuery}
                  onSearchChange={setSearchQuery}
                />
              </div>
              <div className="p-4 border-t border-border">
                <button
                  onClick={() => setIsFilterDrawerOpen(false)}
                  className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content: Grid */}
        <div className="flex-1 space-y-4 md:space-y-6 overflow-y-auto custom-scrollbar pr-1 md:pr-2 h-full pb-20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card/50 border border-border px-4 md:px-6 py-4 rounded-2xl">
            <h2 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-3">
              {loading ? "Re-indexing..." : "Asset Stream"}
              {!loading && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {media.length} Results
                </span>
              )}
            </h2>

            <div className="relative w-full sm:w-64">
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
            <>
              <MediaGrid
                media={media}
                onItemClick={(item) => setSelectedAsset(item)}
              />
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
