"use client";

import Link from "next/link";
import {
  Folder,
  Calendar,
  FileText,
  ArrowRight,
  Play,
  Image as ImageIcon,
  MoreHorizontal,
} from "lucide-react";
import { Folder as FolderType } from "@/types";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface FolderCardProps {
  folder: FolderType;
}

export default function FolderCard({ folder }: FolderCardProps) {
  // Get first 4 media items for preview if available
  const previewMedia = folder.media?.slice(0, 4) || [];
  const hasMedia = previewMedia.length > 0;

  return (
    <Link href={`/folders/${folder.id}`}>
      <motion.div
        whileHover={{ y: -4 }}
        className="group bg-card border border-border hover:border-indigo-500/50 rounded-2xl overflow-hidden transition-all duration-300 flex flex-col h-full"
      >
        {/* Collage Preview Area */}
        <div className="aspect-[16/10] bg-slate-900 overflow-hidden relative">
          {hasMedia ? (
            <div className="grid grid-cols-2 grid-rows-2 w-full h-full gap-0.5">
              {previewMedia.slice(0, 4).map((media, index) => (
                <div key={media.id} className="relative overflow-hidden">
                  <img
                    src={media.thumbnailUrl || media.cdnUrl}
                    alt=""
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  {media.fileType === "video" && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <Play className="h-4 w-4 text-white fill-current" />
                    </div>
                  )}
                </div>
              ))}
              {/* Fill remaining slots if < 4 items */}
              {Array.from({ length: Math.max(0, 4 - previewMedia.length) }).map(
                (_, i) => (
                  <div
                    key={i}
                    className="bg-slate-800/50 flex items-center justify-center"
                  >
                    <Folder className="h-4 w-4 text-slate-700" />
                  </div>
                ),
              )}
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 border-b border-border">
              <Folder className="h-10 w-10 text-slate-700" />
            </div>
          )}

          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button className="p-1.5 rounded-lg bg-black/50 backdrop-blur-md text-white border border-white/10">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-4 flex flex-col flex-1">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-bold text-white group-hover:text-indigo-400 transition-colors truncate">
              {folder.name}
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400">
              {folder.productCategory || "Uncategorized"}
            </span>
          </div>

          <p className="text-xs text-slate-500 line-clamp-2 mb-4 flex-1">
            {folder.description ||
              "No description provided for this collection."}
          </p>

          <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <ImageIcon className="h-3 w-3" />
                <span>{(folder.media || []).length} Items</span>
              </div>
            </div>
            <span>
              {new Date(folder.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
