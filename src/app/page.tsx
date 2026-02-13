"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  LayoutGrid,
  List,
  Sparkles,
  FolderPlus,
  Image as ImageIcon,
  Film,
  Folder as FolderIcon,
  Plus,
  Video,
  Upload,
  ArrowUpRight,
  Clock,
  Library,
} from "lucide-react";
import CreateFolderModal from "@/components/folders/CreateFolderModal";
import UploadModal from "@/components/media/UploadModal";
import FolderCard from "@/components/folders/FolderCard";
import { Folder, Media } from "@/types";
import { formatTimeAgo } from "@/lib/utils";

export default function Home() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [recentMedia, setRecentMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  useEffect(() => {
    fetchFolders();
    fetchRecentMedia();
  }, []);

  const fetchFolders = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/folders", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (Array.isArray(data)) {
        setFolders(data);
      }
    } catch (error) {
      console.error("Failed to fetch folders:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentMedia = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/media", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (Array.isArray(data)) {
        // Just take the first 5 for the sidebar
        setRecentMedia(data.slice(0, 5));
      }
    } catch (error) {
      console.error("Failed to fetch recent media:", error);
    }
  };

  // Calculate statistics from folders
  const totalFolders = folders.length;

  let totalImages = 0;
  let totalVideos = 0;
  let totalMedia = 0;

  // Calculate statistics from actual media items with fallback
  folders.forEach((folder) => {
    // Check if we have the media array (which API now provides)
    if (folder.media && Array.isArray(folder.media)) {
      // Calculate from actual items
      folder.media.forEach((item) => {
        if (item.fileType === "image") totalImages++;
        else if (item.fileType === "video") totalVideos++;
      });
      totalMedia += folder.media.length;
    } else if (folder._count?.media) {
      // Fallback to _count if media array is missing
      totalMedia += folder._count.media;
    }
  });

  // If we have accurate counts, ensure total matches sum
  if (totalImages + totalVideos > 0) {
    totalMedia = totalImages + totalVideos;
  }

  return (
    <div className="space-y-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-bold border border-indigo-500/20">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Premium Media Management</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white">
            Dashboard
          </h1>
          <p className="text-slate-400 max-w-xl">
            Welcome back. Here's an overview of your digital assets and recent
            activity.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Upload className="h-4 w-4" />
            <span>Upload Media</span>
          </button>
        </div>
      </div>

      {/* Stats Grid - Professional SaaS Design */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            label: "Total Assets",
            value: totalMedia,
            icon: Library,
            color: "text-indigo-400",
            bg: "bg-indigo-400/10",
            trend: "+12% this week",
          },
          {
            label: "Images",
            value: totalImages,
            icon: ImageIcon,
            color: "text-emerald-400",
            bg: "bg-emerald-400/10",
            trend: "+5% this week",
          },
          {
            label: "Videos",
            value: totalVideos,
            icon: Film,
            color: "text-purple-400",
            bg: "bg-purple-400/10",
            trend: "+2% this week",
          },
          {
            label: "Collections",
            value: totalFolders,
            icon: FolderIcon,
            color: "text-amber-400",
            bg: "bg-amber-400/10",
            trend: "0% this week",
          },
        ].map((stat, i) => (
          <div
            key={i}
            className="group p-6 rounded-2xl bg-card border border-border hover:border-indigo-500/50 transition-all duration-300 shadow-sm hover:shadow-indigo-500/5"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2.5 rounded-xl ${stat.bg} ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                {stat.label}
              </span>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-3xl font-bold text-white mb-1">
                  {stat.value}
                </div>
                <div className="flex items-center gap-1 text-[11px] font-medium text-slate-400">
                  <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                  <span>{stat.trend}</span>
                </div>
              </div>
            </div>
            <div className="mt-4 h-1 w-full bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 rounded-full w-2/3" />
            </div>
          </div>
        ))}
      </div>

      {/* Content Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
        {/* Collections Overview */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <FolderIcon className="h-5 w-5 text-indigo-400" />
              Recent Collections
            </h2>
            <Link
              href="/folders"
              className="text-sm font-bold text-indigo-400 hover:text-indigo-300"
            >
              View All
            </Link>
          </div>

          {!folders || folders.length === 0 ? (
            <div className="bg-card/30 rounded-3xl border border-dashed border-border p-12 flex flex-col items-center justify-center text-center">
              <div className="p-4 rounded-xl bg-slate-800/50 text-slate-400 mb-4">
                <FolderPlus className="h-10 w-10" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                No collections yet
              </h3>
              <p className="text-slate-500 mb-6 max-w-xs text-sm">
                Create your first collection to start organizing your product
                media assets.
              </p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-6 py-2 bg-white/5 hover:bg-white/10 text-white border border-border rounded-xl font-bold transition-all"
              >
                Create Collection
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {folders.slice(0, 4).map((folder) => (
                <FolderCard key={folder.id} folder={folder} />
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity Sidebar */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Clock className="h-5 w-5 text-indigo-400" />
            Recent Uploads
          </h2>
          <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border">
            {recentMedia.length > 0 ? (
              recentMedia.map((item) => (
                <div
                  key={item.id}
                  className="p-4 hover:bg-white/5 transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center shrink-0 overflow-hidden group-hover:ring-2 group-hover:ring-indigo-500/50 transition-all">
                      {item.thumbnailUrl ? (
                        <img
                          src={item.thumbnailUrl}
                          alt={item.fileName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ImageIcon className="h-6 w-6 text-slate-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">
                        {item.fileName}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatTimeAgo(item.createdAt)} •{" "}
                        {(item.fileSize / (1024 * 1024)).toFixed(1)} MB
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center">
                <p className="text-sm text-slate-500">No recent uploads</p>
              </div>
            )}
            <Link
              href="/media"
              className="w-full block p-4 text-center text-sm font-bold text-indigo-400 hover:bg-white/5 transition-colors border-t border-border"
            >
              View Media Library
            </Link>
          </div>
        </div>
      </div>

      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
      />
      <CreateFolderModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}
