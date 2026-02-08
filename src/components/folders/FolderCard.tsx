"use client";

import Link from "next/link";
import {
  Folder,
  Calendar,
  FileText,
  ArrowRight,
  Play,
  Image as ImageIcon,
} from "lucide-react";
import { Folder as FolderType } from "@/types";
import { motion } from "framer-motion";

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
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -8, scale: 1.02 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="group relative bg-white rounded-3xl border border-slate-200 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer h-full flex flex-col"
      >
        {/* Preview Area */}
        <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
          {hasMedia ? (
            <div
              className={`grid w-full h-full gap-0.5 ${
                previewMedia.length === 1
                  ? "grid-cols-1"
                  : previewMedia.length === 2
                    ? "grid-cols-2"
                    : previewMedia.length === 3
                      ? "grid-cols-2 grid-rows-2"
                      : "grid-cols-2 grid-rows-2"
              }`}
            >
              {previewMedia.map((media, index) => (
                <div
                  key={media.id}
                  className={`relative overflow-hidden group/media ${
                    previewMedia.length === 3 && index === 0 ? "row-span-2" : ""
                  }`}
                >
                  {media.fileType === "image" ? (
                    <img
                      src={media.thumbnailUrl || media.cdnUrl}
                      alt={media.fileName}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover/media:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full relative">
                      <img
                        src={media.thumbnailUrl || "/video-placeholder.png"}
                        alt={media.fileName}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover/media:scale-110"
                      />
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <div className="p-2 rounded-full bg-white/30 backdrop-blur-md">
                          <Play className="h-4 w-4 text-white fill-white" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 text-slate-300">
              <Folder className="h-16 w-16 mb-2 opacity-50" />
              <span className="text-sm font-medium">Empty Folder</span>
            </div>
          )}

          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60"></div>

          {/* Category Badge */}
          {folder.productCategory && (
            <div className="absolute top-3 right-3 z-10">
              <span className="px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/20 text-white text-[10px] font-bold uppercase tracking-wide shadow-lg">
                {folder.productCategory}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5 flex-1 flex flex-col relative bg-white">
          {/* Main Title - User Request: "show which folder it's it" */}
          <div className="mb-1">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-bold text-lg text-slate-900 group-hover:text-purple-600 transition-colors line-clamp-1">
                {folder.name}
              </h3>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity -mr-2">
                <ArrowRight className="h-5 w-5 text-purple-600" />
              </div>
            </div>
            <p className="text-sm text-slate-500 line-clamp-2 min-h-[40px]">
              {folder.description || "No description available"}
            </p>
          </div>

          {/* Tags */}
          {folder.tags && folder.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-auto pt-3">
              {folder.tags.slice(0, 3).map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-md bg-slate-50 border border-slate-100 text-slate-600 text-[10px] font-medium"
                >
                  #{tag}
                </span>
              ))}
              {folder.tags.length > 3 && (
                <span className="px-2 py-0.5 rounded-md bg-slate-50 border border-slate-100 text-slate-600 text-[10px] font-medium">
                  +{folder.tags.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Footer Stats */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-1.5 font-medium">
              <div className="flex items-center gap-1">
                <ImageIcon className="h-3 w-3" />
                <span>
                  {
                    (folder.media || []).filter((m) => m.fileType === "image")
                      .length
                  }
                </span>
              </div>
              <div className="w-px h-3 bg-slate-200 mx-1"></div>
              <div className="flex items-center gap-1">
                <Play className="h-3 w-3" />
                <span>
                  {
                    (folder.media || []).filter((m) => m.fileType === "video")
                      .length
                  }
                </span>
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
