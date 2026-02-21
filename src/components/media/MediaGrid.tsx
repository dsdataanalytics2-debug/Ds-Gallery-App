"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Image as ImageIcon,
  Video,
  MoreVertical,
  Download,
  AlertTriangle,
  Loader2,
  Trash2,
  X,
  Play,
  Maximize2,
  Info,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { Media } from "@/types";
import BulkActions from "./BulkActions";
import { cn } from "@/lib/utils";

interface MediaGridProps {
  media: Media[];
  onItemClick?: (item: Media) => void;
}

export default function MediaGrid({ media, onItemClick }: MediaGridProps) {
  const router = useRouter();
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<Media | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Delete State
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const toggleSelect = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const clearSelection = () => {
    setSelectedIds([]);
  };

  const handleBulkSuccess = () => {
    clearSelection();
    router.refresh();
    // Force a re-fetch if needed (parent might need to handle this)
    window.location.reload();
  };

  const handleDeleteClick = (mediaId: string) => {
    setItemToDelete(mediaId);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/media/${itemToDelete}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "x-user-data": localStorage.getItem("user") || "",
        },
      });

      if (response.ok) {
        setItemToDelete(null);
        router.refresh();
      } else {
        const errorData = await response.json();
        alert(errorData.message || errorData.error || "Failed to delete media");
      }
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Failed to delete media.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownload = async (item: Media) => {
    try {
      const token = localStorage.getItem("token");
      const isGoogleDrive =
        item.storageType === "gdrive" || item.storageType === "google-drive";

      if (isGoogleDrive) {
        const downloadUrl = `/api/media/${item.id}/proxy?token=${token}&download=true`;
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = item.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }

      const trackRes = await fetch(`/api/media/${item.id}/download`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "x-user-data": localStorage.getItem("user") || "",
        },
      });

      if (!trackRes.ok) throw new Error("Tracking failed");
      const { url } = await trackRes.json();

      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = item.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Download failed:", error);
      alert("Failed to download file.");
    }
  };

  if (media.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4 text-center border-2 border-dashed border-border rounded-3xl bg-slate-900/50">
        <div className="p-5 rounded-2xl bg-slate-800 text-slate-500 mb-6">
          <ImageIcon className="h-10 w-10" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">
          No media assets found
        </h3>
        <p className="text-slate-500 max-w-sm mx-auto text-sm">
          Try adjusting your filters or search query to find the assets
          you&apos;re looking for.
        </p>
      </div>
    );
  }

  const allSelected = media.length > 0 && selectedIds.length === media.length;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(media.map((item) => item.id));
    }
  };

  return (
    <>
      <div className="mb-6 flex items-center justify-between bg-slate-900/40 border border-white/5 rounded-2xl p-4 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSelectAll}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all",
              allSelected
                ? "bg-indigo-500 text-white"
                : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white",
            )}
          >
            {allSelected ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Deselect All
              </>
            ) : (
              <>
                <Circle className="h-4 w-4" />
                Select All
              </>
            )}
          </button>
          {selectedIds.length > 0 && (
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] animate-pulse">
              {selectedIds.length} Assets Selected
            </span>
          )}
        </div>
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest hidden sm:block">
          Grid View • {media.length} Items Total
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-7 gap-4">
        {media.map((item) => {
          const isSelected = selectedIds.includes(item.id);
          return (
            <div
              key={item.id}
              onMouseEnter={() => setHoveredId(item.id)}
              onMouseLeave={() => {
                setHoveredId(null);
                setOpenMenuId(null);
              }}
              onClick={() => onItemClick?.(item)}
              className={`group relative flex flex-col bg-card rounded-2xl overflow-hidden border transition-all duration-300 shadow-sm cursor-pointer ${
                isSelected
                  ? "border-indigo-500 ring-2 ring-indigo-500/20"
                  : "border-border hover:border-indigo-500/50 hover:shadow-indigo-500/10"
              }`}
            >
              {/* Selection Checkbox */}
              <div
                className={`absolute top-2 left-2 z-30 transition-opacity duration-200 ${
                  hoveredId === item.id || isSelected
                    ? "opacity-100"
                    : "opacity-0"
                }`}
                onClick={(e) => toggleSelect(e, item.id)}
              >
                {isSelected ? (
                  <div className="p-1 rounded-full bg-indigo-500 text-white shadow-lg">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                ) : (
                  <div className="p-1 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white/70 hover:text-white shadow-lg">
                    <Circle className="h-4 w-4" />
                  </div>
                )}
              </div>

              {/* Content Preview */}
              <div className="relative aspect-[4/5] overflow-hidden bg-slate-900 border-b border-white/5">
                {item.fileType === "image" ? (
                  <img
                    src={
                      item.storageType === "gdrive" ||
                      item.storageType === "google-drive" ||
                      (item.cdnUrl && item.cdnUrl.includes("drive.google.com"))
                        ? `/api/media/${item.id}/proxy?token=${localStorage.getItem("token")}`
                        : item.thumbnailUrl || item.cdnUrl
                    }
                    alt={item.fileName}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full relative">
                    {hoveredId === item.id ? (
                      <video
                        src={
                          item.storageType === "gdrive" ||
                          item.storageType === "google-drive" ||
                          (item.cdnUrl &&
                            item.cdnUrl.includes("drive.google.com"))
                            ? `/api/media/${item.id}/proxy?token=${localStorage.getItem("token")}`
                            : item.cdnUrl
                        }
                        muted
                        autoPlay
                        loop
                        playsInline
                        className="w-full h-full object-cover animate-in fade-in duration-500"
                      />
                    ) : item.storageType === "gdrive" ||
                      item.storageType === "google-drive" ? (
                      <img
                        src={`/api/media/${item.id}/proxy?type=thumbnail&token=${localStorage.getItem("token")}`}
                        alt={item.fileName}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : item.thumbnailUrl ? (
                      <img
                        src={item.thumbnailUrl}
                        alt={item.fileName}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-950 flex items-center justify-center transition-transform duration-700 group-hover:scale-105">
                        <div className="p-4 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
                          <Play className="h-8 w-8 text-indigo-400/50 fill-indigo-400/10" />
                        </div>
                      </div>
                    )}

                    {/* Video-Specific Label */}
                    <div className="absolute top-2 right-2 z-10">
                      <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-indigo-600 text-[10px] font-black uppercase tracking-tighter text-white shadow-lg border border-indigo-400/30">
                        <Video className="h-3 w-3" />
                        Video
                      </span>
                    </div>

                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                      <div className="w-14 h-14 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/20 group-hover:scale-110 group-hover:bg-indigo-500/20 group-hover:border-indigo-500/50 transition-all duration-500 shadow-2xl">
                        <Play className="h-6 w-6 text-white fill-white group-hover:text-indigo-400 group-hover:fill-indigo-400 transition-colors" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Overlay Actions */}
                <div
                  className={`absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 transition-opacity duration-300 flex flex-col justify-between p-3 ${
                    hoveredId === item.id || openMenuId === item.id
                      ? "opacity-100"
                      : "opacity-0"
                  }`}
                >
                  <div className="flex justify-end items-start">
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(
                            openMenuId === item.id ? null : item.id,
                          );
                        }}
                        className="p-2 rounded-xl bg-white/20 backdrop-blur-md border border-white/20 text-white hover:bg-white/30 transition-colors shadow-lg"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>

                      {openMenuId === item.id && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setOpenMenuId(null)}
                          />
                          <div className="absolute right-0 mt-2 w-48 bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 p-1.5 z-20 animate-in fade-in zoom-in-95 duration-200">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownload(item);
                                setOpenMenuId(null);
                              }}
                              className="w-full px-3 py-2.5 rounded-xl text-left text-sm font-semibold text-slate-700 hover:bg-purple-50 hover:text-purple-600 transition-colors flex items-center gap-2"
                            >
                              <Download className="h-4 w-4" /> Download
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuId(null);
                              }}
                              className="w-full px-3 py-2.5 rounded-xl text-left text-sm font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center gap-2"
                            >
                              <Info className="h-4 w-4" /> Details
                            </button>
                            <div className="h-px bg-slate-100 my-1" />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick(item.id);
                                setOpenMenuId(null);
                              }}
                              className="w-full px-3 py-2.5 rounded-xl text-left text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                            >
                              <Trash2 className="h-4 w-4" /> Delete
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(item);
                      }}
                      className="p-2 rounded-xl bg-white/20 backdrop-blur-md border border-white/20 text-white hover:bg-white/30 transition-colors shadow-lg"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    {item.fileType === "image" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const url =
                            item.storageType === "gdrive" ||
                            item.storageType === "google-drive"
                              ? `/api/media/${item.id}/proxy?token=${localStorage.getItem("token")}`
                              : item.cdnUrl;
                          window.open(url, "_blank");
                        }}
                        className="p-2 rounded-xl bg-white/20 backdrop-blur-md border border-white/20 text-white hover:bg-white/30 transition-colors shadow-lg"
                      >
                        <Maximize2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="p-3 bg-card relative z-10 border-t border-border">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className="font-bold text-white text-xs truncate group-hover:text-indigo-400 transition-colors">
                    {item.fileName}
                  </h4>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">
                    {(item.fileSize / (1024 * 1024)).toFixed(1)} MB •{" "}
                    {item.fileFormat}
                  </span>
                  <div
                    className={`h-1.5 w-1.5 rounded-full ${isSelected ? "bg-indigo-500 scale-125 shadow-[0_0_8px_rgba(99,102,241,0.8)]" : "bg-slate-700"}`}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bulk Actions Floating Toolbar */}
      <BulkActions
        selectedIds={selectedIds}
        onClear={clearSelection}
        onSuccess={handleBulkSuccess}
      />

      {/* Delete Confirmation Modal (Same as before) */}
      {itemToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 shadow-2xl backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden border border-slate-100 p-6 flex flex-col items-center text-center space-y-4">
            <div className="p-4 rounded-full bg-red-50 text-red-500 mb-2">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-900">Delete File?</h3>
              <p className="text-slate-500 text-sm">
                Are you sure? This action cannot be undone.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 w-full pt-4">
              <button
                onClick={() => setItemToDelete(null)}
                className="px-4 py-3 rounded-xl border font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-4 py-3 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Player Modal (Same as before but simplified for readability) */}
      {selectedVideo && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedVideo(null)}
        >
          <div
            className="relative w-full max-w-6xl aspect-video rounded-3xl overflow-hidden bg-black border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <video
              src={
                selectedVideo.storageType === "gdrive" ||
                selectedVideo.storageType === "google-drive"
                  ? `/api/media/${selectedVideo.id}/proxy?token=${localStorage.getItem("token")}`
                  : selectedVideo.cdnUrl
              }
              controls
              autoPlay
              className="w-full h-full"
            />
            <button
              onClick={() => setSelectedVideo(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/40 text-white hover:bg-black/60"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
