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

export default function AllMediaPage() {
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "image" | "video">("all");

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append("q", searchQuery);
      if (filter !== "all") params.append("type", filter);

      const res = await fetch(`/api/media?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setMedia(data);
      }
    } catch (error) {
      console.error("Error fetching media:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMedia();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, filter]);

  return (
    <div className="space-y-10 pb-20">
      <div className="space-y-4">
        <h1 className="text-5xl font-black tracking-tighter">Media Library</h1>
        <p className="text-xl text-muted-foreground font-medium">
          Search and discover assets from across all your product collections.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by filename or tags..."
            className="w-full h-14 bg-card border rounded-2xl pl-12 pr-4 text-lg font-medium focus:ring-2 focus:ring-primary/50 shadow-sm"
          />
        </div>
        <div className="flex items-center gap-2 p-1.5 bg-card border rounded-2xl shadow-sm">
          <button
            onClick={() => setFilter("all")}
            className={`px-6 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${filter === "all" ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "hover:bg-muted text-muted-foreground"}`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("image")}
            className={`px-6 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${filter === "image" ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "hover:bg-muted text-muted-foreground"}`}
          >
            Images
          </button>
          <button
            onClick={() => setFilter("video")}
            className={`px-6 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${filter === "video" ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "hover:bg-muted text-muted-foreground"}`}
          >
            Videos
          </button>
        </div>
      </div>

      <div className="border-t pt-10">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black flex items-center gap-3">
                Results
                <span className="text-xs font-black text-primary bg-primary/10 px-3 py-1 rounded-full uppercase tracking-widest">
                  {media.length} Found
                </span>
              </h2>
            </div>
            <MediaGrid media={media} />
          </div>
        )}
      </div>
    </div>
  );
}
