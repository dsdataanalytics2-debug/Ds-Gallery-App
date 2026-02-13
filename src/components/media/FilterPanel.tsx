"use client";

import { useState, useEffect } from "react";
import {
  Search,
  LayoutGrid,
  List,
  Filter,
  ChevronDown,
  Calendar,
  Image as ImageIcon,
  Film,
  Folder,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FilterPanelProps {
  className?: string;
  counts?: { all: number; images: number; videos: number };
  activeFilter?: string;
  onFilterChange?: (filter: any) => void;
  activeCollections?: string[];
  onCollectionToggle?: (collectionId: string) => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
}

export default function FilterPanel({
  className,
  counts = { all: 0, images: 0, videos: 0 },
  activeFilter = "all",
  onFilterChange,
  activeCollections = [],
  onCollectionToggle,
  searchValue = "",
  onSearchChange,
}: FilterPanelProps) {
  const [folders, setFolders] = useState<any[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch("/api/folders", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setFolders(data);
        } else {
          console.error("Expected folders array but got:", data);
          setFolders([]);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch folders:", err);
        setFolders([]);
      });
  }, []);

  return (
    <div className={cn("flex flex-col gap-6 p-6", className)}>
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">
          Search Assets
        </h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            placeholder="Search by name, tag..."
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="w-full bg-white/[0.03] border border-white/5 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-600"
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">
          Asset Type
        </h3>
        <div className="space-y-2">
          {[
            {
              id: "all",
              label: "All Assets",
              icon: LayoutGrid,
              count: counts.all,
            },
            {
              id: "image",
              label: "Images",
              icon: ImageIcon,
              count: counts.images,
            },
            { id: "video", label: "Videos", icon: Film, count: counts.videos },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => onFilterChange?.(item.id)}
              className={cn(
                "w-full flex items-center justify-between p-2.5 rounded-xl transition-all group text-sm",
                activeFilter === item.id
                  ? "bg-indigo-500/10 text-indigo-400 font-bold"
                  : "text-slate-400 hover:bg-white/[0.03] hover:text-white",
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon
                  className={cn(
                    "h-4 w-4",
                    activeFilter === item.id
                      ? "text-indigo-400"
                      : "text-slate-500 group-hover:text-white",
                  )}
                />
                <span>{item.label}</span>
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/5 text-slate-500">
                {item.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">
          Collections
        </h3>
        <div className="space-y-1 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
          {folders.map((folder: any) => (
            <label
              key={folder.id}
              className="flex items-center gap-3 p-2 group cursor-pointer"
            >
              <input
                type="checkbox"
                className="hidden"
                checked={activeCollections.includes(folder.id)}
                onChange={() => onCollectionToggle?.(folder.id)}
              />
              <div
                className={cn(
                  "w-4 h-4 rounded border flex items-center justify-center transition-all",
                  activeCollections.includes(folder.id)
                    ? "bg-indigo-500 border-indigo-500"
                    : "border-white/10 group-hover:border-indigo-500/50",
                )}
              >
                {activeCollections.includes(folder.id) && (
                  <div className="w-1.5 h-1.5 rounded-sm bg-white" />
                )}
              </div>
              <span
                className={cn(
                  "text-sm transition-colors",
                  activeCollections.includes(folder.id)
                    ? "text-white font-medium"
                    : "text-slate-400 group-hover:text-white",
                )}
              >
                {folder.name}
              </span>
            </label>
          ))}
          {folders.length === 0 && (
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest p-2">
              No collections found
            </p>
          )}
        </div>
      </div>

      <div className="mt-auto pt-6">
        <button
          onClick={() => {
            onFilterChange?.("all");
            // Also reset collections if needed
          }}
          className="w-full p-3 rounded-xl bg-white/5 text-slate-400 text-xs font-bold hover:bg-white/10 hover:text-white transition-all"
        >
          Clear All Filters
        </button>
      </div>
    </div>
  );
}
