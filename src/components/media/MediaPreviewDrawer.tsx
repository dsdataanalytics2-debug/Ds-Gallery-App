"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Download,
  Share2,
  Trash2,
  Info,
  Calendar,
  Maximize2,
  FileText,
  Tag,
  ExternalLink,
  ChevronRight,
  Clock,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Settings,
  RotateCcw,
  Move,
  Edit,
  RefreshCcw,
  ShieldCheck,
  Image as ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Media } from "@/types";

interface MediaPreviewDrawerProps {
  media: Media | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function MediaPreviewDrawer({
  media,
  isOpen,
  onClose,
}: MediaPreviewDrawerProps) {
  const router = useRouter();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.play();
      else videoRef.current.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  if (!media) return null;

  const handleTogglePlay = () => setIsPlaying(!isPlaying);
  const handleToggleMute = () => setIsMuted(!isMuted);

  const handleThumbnailChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file || !media) return;

    const formData = new FormData();
    formData.append("thumbnail", file);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/media/${media.id}/thumbnail`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (res.ok) {
        router.refresh(); // Refresh to show new thumbnail
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update thumbnail");
      }
    } catch (error) {
      console.error("Error updating thumbnail:", error);
      alert("An error occurred while updating the thumbnail");
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const dur = videoRef.current.duration;
      setCurrentTime(current);
      setDuration(dur);
      setProgress((current / dur) * 100);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (videoRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = x / rect.width;
      videoRef.current.currentTime = percentage * videoRef.current.duration;
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={cn(
          "fixed right-0 top-0 h-full w-full sm:w-[500px] z-50 bg-slate-950 border-l border-white/5 shadow-2xl transition-transform duration-500 ease-out flex flex-col",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        {/* Header */}
        <div className="h-16 border-b border-white/5 flex items-center justify-between px-6 shrink-0">
          <h3 className="text-sm font-bold text-white uppercase tracking-widest">
            Asset Details
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/5 text-slate-400 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {/* Preview Area */}
          <div className="aspect-video bg-black border-b border-white/5 relative group overflow-hidden">
            {media.fileType === "video" ? (
              <div className="w-full h-full relative">
                {isLoading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 z-10">
                    <img
                      src={media.thumbnailUrl || "/video-placeholder.png"}
                      className="absolute inset-0 w-full h-full object-cover blur-sm opacity-50"
                      alt="blur"
                    />
                    <div className="relative z-20 flex flex-col items-center">
                      <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4" />
                      <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                        Loading preview...
                      </p>
                    </div>
                  </div>
                )}
                <video
                  ref={videoRef}
                  src={media.cdnUrl}
                  className="w-full h-full object-contain"
                  onLoadStart={() => setIsLoading(true)}
                  onCanPlay={() => setIsLoading(false)}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleTimeUpdate}
                  onClick={handleTogglePlay}
                />

                {/* Auto-generated Indicator */}
                {!media.isCustomThumbnail && (
                  <div className="absolute top-4 left-4 z-20">
                    <span className="px-2 py-1 rounded-md bg-black/60 backdrop-blur-md border border-white/10 text-[9px] font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="h-3 w-3" />
                      AUTO-GENERATED THUMBNAIL
                    </span>
                  </div>
                )}

                {/* Custom Controls */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                  <div className="space-y-4">
                    {/* Progress Bar */}
                    <div
                      className="h-1.5 w-full bg-white/20 rounded-full cursor-pointer relative group/progress"
                      onClick={handleSeek}
                    >
                      <div
                        className="h-full bg-indigo-500 rounded-full transition-all duration-100"
                        style={{ width: `${progress}%` }}
                      />
                      <div
                        className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover/progress:opacity-100 transition-opacity"
                        style={{ left: `${progress}%`, marginLeft: "-6px" }}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={handleTogglePlay}
                          className="text-white hover:text-indigo-400 transition-colors"
                        >
                          {isPlaying ? (
                            <Pause className="h-5 w-5 fill-white" />
                          ) : (
                            <Play className="h-5 w-5 fill-white" />
                          )}
                        </button>
                        <button
                          onClick={handleToggleMute}
                          className="text-white hover:text-indigo-400 transition-colors"
                        >
                          {isMuted ? (
                            <VolumeX className="h-5 w-5" />
                          ) : (
                            <Volume2 className="h-5 w-5" />
                          )}
                        </button>
                        <span className="text-[10px] font-bold text-white/70 tabular-nums">
                          {formatTime(currentTime)} / {formatTime(duration)}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="relative group/speed">
                          <button className="flex items-center gap-1 text-[10px] font-bold text-white/70 hover:text-white transition-colors">
                            <Settings className="h-3.5 w-3.5" />
                            {playbackSpeed}x
                          </button>
                          <div className="absolute bottom-full right-0 mb-2 p-1 bg-slate-900 border border-white/10 rounded-lg opacity-0 group-hover/speed:opacity-100 pointer-events-none group-hover/speed:pointer-events-auto transition-all translate-y-2 group-hover/speed:translate-y-0">
                            {[0.5, 1, 1.5, 2].map((speed) => (
                              <button
                                key={speed}
                                onClick={() => setPlaybackSpeed(speed)}
                                className={cn(
                                  "block w-full px-3 py-1.5 text-[10px] font-bold text-left rounded-md transition-colors",
                                  playbackSpeed === speed
                                    ? "bg-indigo-500 text-white"
                                    : "text-slate-400 hover:bg-white/5 hover:text-white",
                                )}
                              >
                                {speed}x
                              </button>
                            ))}
                          </div>
                        </div>
                        <button
                          onClick={() => videoRef.current?.requestFullscreen()}
                          className="text-white hover:text-indigo-400 transition-colors"
                        >
                          <Maximize2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <img
                  src={media.cdnUrl}
                  className="w-full h-full object-contain"
                  alt={media.fileName}
                />
                <button className="absolute bottom-4 right-4 p-2 rounded-lg bg-black/50 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-opacity border border-white/10">
                  <Maximize2 className="h-4 w-4" />
                </button>
              </>
            )}
          </div>

          {/* Content */}
          <div className="p-8 space-y-10">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {media.fileName}
                </h2>
                <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 text-[10px] font-bold uppercase tracking-wider border border-indigo-500/10">
                  {media.fileType}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                <div className="flex items-center gap-1.5 font-medium">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{(media.fileSize / (1024 * 1024)).toFixed(2)} MB</span>
                </div>
                <div className="w-1 h-1 rounded-full bg-slate-800" />
                <span className="font-medium">
                  {media.fileFormat.toUpperCase()}
                </span>
                {media.fileType === "video" && (
                  <>
                    <div className="w-1 h-1 rounded-full bg-slate-800" />
                    <span className="font-medium">1080p (FHD)</span>
                  </>
                )}
              </div>
            </div>

            {/* Action Grid */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  const link = document.createElement("a");
                  link.href = media.cdnUrl;
                  link.download = media.fileName;
                  link.click();
                }}
                className="flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/5 hover:border-indigo-500/30 text-slate-400 hover:text-white transition-all group"
              >
                <Download className="h-5 w-5 group-hover:text-indigo-400" />
                <div className="text-left">
                  <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">
                    Download
                  </p>
                  <p className="text-[9px] text-slate-600 font-bold">
                    Save to device
                  </p>
                </div>
              </button>
              <button className="flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/5 hover:border-indigo-500/30 text-slate-400 hover:text-white transition-all group">
                <Move className="h-5 w-5 group-hover:text-indigo-400" />
                <div className="text-left">
                  <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">
                    Move
                  </p>
                  <p className="text-[9px] text-slate-600 font-bold">
                    Change collection
                  </p>
                </div>
              </button>
              <button className="flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/5 hover:border-indigo-500/30 text-slate-400 hover:text-white transition-all group">
                <Edit className="h-5 w-5 group-hover:text-indigo-400" />
                <div className="text-left">
                  <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">
                    Rename
                  </p>
                  <p className="text-[9px] text-slate-600 font-bold">
                    Edit filename
                  </p>
                </div>
              </button>

              <button
                onClick={() =>
                  alert(
                    "Replace feature: This will open the upload modal for this specific asset.",
                  )
                }
                className="flex items-center gap-3 p-3.5 rounded-xl bg-indigo-500/5 border border-indigo-500/10 hover:bg-indigo-500/10 hover:border-indigo-500/20 text-indigo-400 transition-all group"
              >
                <RefreshCcw className="h-5 w-5 group-hover:rotate-180 transition-transform duration-500" />
                <div className="text-left">
                  <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">
                    Replace
                  </p>
                  <p className="text-[9px] text-indigo-500/50 font-bold">
                    Upload new version
                  </p>
                </div>
              </button>

              {media.fileType === "video" && (
                <label className="flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/5 hover:border-indigo-500/30 text-slate-400 hover:text-white transition-all group cursor-pointer">
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleThumbnailChange}
                  />
                  <ImageIcon className="h-5 w-5 group-hover:text-indigo-400" />
                  <div className="text-left">
                    <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">
                      Thumbnail
                    </p>
                    <p className="text-[9px] text-slate-600 font-bold">
                      Change preview
                    </p>
                  </div>
                </label>
              )}

              <button className="col-span-2 flex items-center justify-center gap-3 p-3.5 rounded-xl bg-red-500/5 border border-red-500/10 hover:bg-red-500/10 hover:border-red-500/20 text-red-400 transition-all group">
                <Trash2 className="h-5 w-5 group-hover:animate-bounce" />
                <div className="text-left">
                  <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">
                    Delete Asset
                  </p>
                  <p className="text-[9px] text-red-500/50 font-bold">
                    Permanent removal
                  </p>
                </div>
              </button>
            </div>

            {/* Advanced info */}
            <div className="space-y-6 pt-6 border-t border-white/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                    <Tag className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">
                      Metadata & Tags
                    </p>
                    <p className="text-[10px] font-bold text-slate-500">
                      Enhanced Searchable Data
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-600" />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                    <ExternalLink className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">
                      Origin Source
                    </p>
                    <p className="text-[10px] font-bold text-slate-500">
                      S3/Cloudinary Reference
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="h-20 border-t border-white/5 p-6 flex items-center justify-between bg-white/[0.01]">
          <button className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-white transition-colors">
            <Info className="h-4 w-4" />
            Full History
          </button>
          <button className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-lg shadow-indigo-600/20">
            Edit Metadata
          </button>
        </div>
      </div>
    </>
  );
}
