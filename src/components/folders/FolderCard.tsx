"use client";

import Link from "next/link";
import {
  Folder as FolderIcon,
  MoreHorizontal,
  Trash2,
  Settings,
  Loader2,
} from "lucide-react";
import { Folder as FolderType } from "@/types";
import { motion } from "framer-motion";
import { useState } from "react";
import ConfirmModal from "@/components/ui/ConfirmModal";

interface FolderCardProps {
  folder: FolderType;
  onUpdate?: () => void;
}

export default function FolderCard({ folder, onUpdate }: FolderCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // CRITICAL FIX #1: Cover Image Priority - thumbnailUrl → cdnUrl → null
  // NEVER use raw cdnUrl for videos, always use thumbnailUrl
  const coverImage =
    folder.media?.[0]?.thumbnailUrl || folder.media?.[0]?.cdnUrl || null;

  const handleDeleteTrigger = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    setIsConfirmOpen(false);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/folders/${folder.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "x-user-data": localStorage.getItem("user") || "",
        },
      });

      if (res.ok) {
        if (onUpdate) onUpdate();
      } else {
        const errorData = await res.json();
        alert(`Failed to delete: ${errorData.error}`);
      }
    } catch (error) {
      console.error("Error deleting folder:", error);
      alert("An unexpected error occurred.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Link href={`/folders/${folder.id}`}>
      <motion.div
        whileHover={{ y: -2 }}
        className="group relative bg-card border border-border hover:border-indigo-500/50 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg max-w-[180px] w-full"
      >
        {/* CRITICAL FIX #5 & #6: Cover Preview Area - 80px height (h-20) for ultra-compact design */}
        <div className="relative h-20 w-full overflow-hidden">
          {coverImage ? (
            <>
              {/* CRITICAL FIX #2 & #3: Image with error handling */}
              <img
                src={coverImage}
                alt={folder.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                onError={(e) => {
                  // CRITICAL FIX #3: Graceful fallback on image load failure
                  e.currentTarget.style.display = "none";
                }}
              />
              {/* CRITICAL FIX #7: Dark overlay on hover */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300" />
            </>
          ) : (
            // CRITICAL FIX #6: Professional empty state with gradient
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800/50 to-slate-900">
              <FolderIcon className="h-8 w-8 text-slate-700" />
            </div>
          )}

          {/* Quick Actions Overlay */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-10">
            <button
              onClick={handleDeleteTrigger}
              disabled={isDeleting}
              className="p-2 rounded-lg bg-red-500 hover:bg-red-600 text-white shadow-lg transition-all hover:scale-110 active:scale-95 disabled:opacity-50"
              title="Delete Collection"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </button>
          </div>

          {/* CRITICAL FIX #7: Menu button - fade in on hover */}
          <div className="absolute top-1 right-1 z-20">
            <div className="p-1 rounded-md bg-black/50 backdrop-blur-md text-white border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreHorizontal className="h-3 w-3" />
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-2">
          {/* Folder icon badge + name */}
          <div className="flex items-center gap-1.5 mb-1.5">
            <div className="bg-blue-500/10 text-blue-500 p-1 rounded-md shrink-0">
              <FolderIcon className="h-3 w-3" />
            </div>
            <h3 className="font-semibold text-white text-xs truncate flex-1 group-hover:text-indigo-400 transition-colors">
              {folder.name}
            </h3>
          </div>

          {/* Description */}
          <p className="text-[10px] text-slate-500 mb-2 truncate">
            {folder.description || "No description"}
          </p>

          {/* CRITICAL FIX #4: Metadata - Separate image/video counts */}
          <div className="flex items-center justify-between text-[10px]">
            <div className="flex gap-2 text-slate-400">
              <span className="flex items-center gap-0.5">
                🖼 {folder.imageCount || 0}
              </span>
              <span className="flex items-center gap-0.5">
                🎥 {folder.videoCount || 0}
              </span>
            </div>

            {/* Date */}
            <span className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">
              {new Date(folder.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
        </div>
      </motion.div>

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Collection"
        message={`Are you sure you want to delete "${folder.name}"? All assets inside will be unassigned but preserved.`}
        confirmLabel="Delete Collection"
        isLoading={isDeleting}
      />
    </Link>
  );
}
