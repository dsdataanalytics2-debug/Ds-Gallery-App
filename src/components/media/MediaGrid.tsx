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
  ArrowLeft,
  FileIcon,
  Maximize2,
  Info,
} from "lucide-react";
import { Media } from "@/types";

interface MediaGridProps {
  media: Media[];
}

export default function MediaGrid({ media }: MediaGridProps) {
  const router = useRouter();
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<Media | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Delete State
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = (mediaId: string) => {
    setItemToDelete(mediaId); // Open custom modal
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/media/${itemToDelete}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setItemToDelete(null);
        router.refresh(); // Refresh data without reload
      } else {
        const errorData = await response.json();
        alert(errorData.message || errorData.error || "Failed to delete media");
      }
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Failed to delete media. Check console for details.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownload = async (item: Media) => {
    try {
      const response = await fetch(item.cdnUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = item.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  if (media.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 px-4 text-center">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-full blur-2xl opacity-20 animate-pulse"></div>
          <div className="relative bg-white p-6 rounded-3xl shadow-xl shadow-purple-500/10 border border-white/50">
            <ImageIcon className="h-12 w-12 text-purple-500" />
            <div className="absolute -bottom-2 -right-2 bg-blue-500 text-white p-2 rounded-xl shadow-lg">
              <Video className="h-5 w-5" />
            </div>
          </div>
        </div>
        <h3 className="text-2xl font-black text-slate-800 mb-3 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">
          No media files found
        </h3>
        <p className="text-slate-500 max-w-sm mx-auto leading-relaxed">
          Upload your high-quality images and videos to start building your
          gallery.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
        {media.map((item) => (
          <div
            key={item.id}
            onMouseEnter={() => setHoveredId(item.id)}
            onMouseLeave={() => {
              setHoveredId(null);
              setOpenMenuId(null);
            }}
            className="group relative flex flex-col bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 hover:-translate-y-2 border border-slate-100"
          >
            {/* Image/Video Container */}
            <div className="relative aspect-[4/5] overflow-hidden bg-slate-100 cursor-pointer">
              {item.fileType === "image" ? (
                <img
                  src={item.thumbnailUrl || item.cdnUrl}
                  alt={item.fileName}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
              ) : (
                <div
                  className="w-full h-full relative"
                  onClick={() => setSelectedVideo(item)}
                >
                  <img
                    src={item.thumbnailUrl || "/video-placeholder.png"}
                    alt={item.fileName}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <div className="w-14 h-14 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-md border border-white/40 shadow-xl group-hover:scale-110 transition-transform duration-300">
                      <Play className="h-6 w-6 text-white fill-white ml-1" />
                    </div>
                  </div>
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/50 backdrop-blur-md border border-white/10">
                    <span className="text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <Video className="h-3 w-3" />
                      Video
                    </span>
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
                {/* Top Actions */}
                <div className="flex justify-between items-start">
                  <span className="px-2.5 py-1 rounded-lg bg-black/40 backdrop-blur-md border border-white/10 text-white text-[10px] font-bold uppercase tracking-wider">
                    {item.fileType === "image"
                      ? item.fileFormat
                      : item.fileFormat.toUpperCase()}
                  </span>

                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(openMenuId === item.id ? null : item.id);
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
                            <Download className="h-4 w-4" />
                            Download
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // Add rename functionality later
                              setOpenMenuId(null);
                            }}
                            className="w-full px-3 py-2.5 rounded-xl text-left text-sm font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center gap-2"
                          >
                            <Info className="h-4 w-4" />
                            Details
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
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="flex justify-end gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(item);
                    }}
                    className="p-2 rounded-xl bg-white/20 backdrop-blur-md border border-white/20 text-white hover:bg-white/30 transition-colors shadow-lg"
                    title="Download"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  {item.fileType === "image" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(item.cdnUrl, "_blank");
                      }}
                      className="p-2 rounded-xl bg-white/20 backdrop-blur-md border border-white/20 text-white hover:bg-white/30 transition-colors shadow-lg"
                      title="View Full Size"
                    >
                      <Maximize2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Info Footer */}
            <div className="p-4 bg-white relative z-10">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h4
                  className="font-bold text-slate-800 text-sm truncate leading-snug group-hover:text-purple-600 transition-colors"
                  title={item.fileName}
                >
                  {item.fileName}
                </h4>
                {item.folder && (
                  <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                    {item.folder.name}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                  <FileIcon className="h-3 w-3" />
                  <span>{(item.fileSize / (1024 * 1024)).toFixed(1)} MB</span>
                </div>
                <div className="h-1.5 w-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div
            className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 flex flex-col items-center text-center space-y-4">
              <div className="p-4 rounded-full bg-red-50 text-red-500 mb-2">
                <AlertTriangle className="h-8 w-8" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-900">
                  Delete File?
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Are you sure you want to delete this file? This action cannot
                  be undone.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 w-full pt-4">
                <button
                  onClick={() => setItemToDelete(null)}
                  disabled={isDeleting}
                  className="px-4 py-3 rounded-xl border font-bold hover:bg-slate-50 transition-colors text-slate-700 disabled:opacity-50"
                  type="button"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="px-4 py-3 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30 flex items-center justify-center gap-2 disabled:opacity-50"
                  type="button"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Video Player Modal */}
      {selectedVideo && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-300"
          onClick={() => setSelectedVideo(null)}
        >
          <div
            className="relative w-full h-full flex flex-col items-center justify-center p-4 md:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Bar */}
            <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between z-50 bg-gradient-to-b from-black/80 to-transparent">
              <button
                onClick={() => setSelectedVideo(null)}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-white/20 transition-all border border-white/10"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="text-sm font-bold">Back to Gallery</span>
              </button>

              <div className="flex items-center gap-3">
                <button className="p-3 rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-white/20 transition-all border border-white/10">
                  <Info className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setSelectedVideo(null)}
                  className="p-3 rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-red-500/80 hover:border-red-500/50 transition-all border border-white/10"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Video Container */}
            <div className="relative w-full max-w-6xl aspect-video rounded-3xl overflow-hidden shadow-2xl shadow-purple-500/20 border border-white/10 bg-black">
              <video
                src={selectedVideo.cdnUrl}
                controls
                autoPlay
                className="w-full h-full object-contain"
              >
                Your browser does not support the video tag.
              </video>
            </div>

            {/* Bottom Info Bar */}
            <div className="absolute bottom-10 left-0 right-0 flex justify-center pointer-events-none">
              <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex items-center gap-6 pointer-events-auto shadow-2xl transform translate-y-0 opacity-100 transition-all">
                <div className="flex flex-col">
                  <span className="text-white font-bold text-lg">
                    {selectedVideo.fileName}
                  </span>
                  <span className="text-white/60 text-xs font-medium uppercase tracking-wider">
                    {selectedVideo.fileFormat.toUpperCase()} •{" "}
                    {(selectedVideo.fileSize / (1024 * 1024)).toFixed(2)} MB
                  </span>
                </div>
                <div className="h-10 w-px bg-white/10"></div>
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    handleDownload(selectedVideo);
                  }}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold hover:shadow-lg hover:shadow-purple-500/40 hover:scale-105 transition-all"
                >
                  <Download className="h-4 w-4" />
                  Download
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
