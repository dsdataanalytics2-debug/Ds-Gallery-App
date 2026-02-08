"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
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
} from "lucide-react";
import CreateFolderModal from "@/components/folders/CreateFolderModal";
import UploadModal from "@/components/media/UploadModal";
import FolderCard from "@/components/folders/FolderCard";
import { Folder } from "@/types";

export default function Home() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  useEffect(() => {
    fetchFolders();
  }, []);

  const fetchFolders = async () => {
    try {
      const response = await fetch("/api/folders");
      const data = await response.json();
      setFolders(data);
    } catch (error) {
      console.error("Failed to fetch folders:", error);
    } finally {
      setLoading(false);
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-8 max-w-7xl relative z-10">
        {/* Hero Section - Premium Design */}
        <div className="relative bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 overflow-hidden">
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5"></div>

          <div className="p-8 md:p-12 relative z-10">
            <div className="flex items-start justify-between mb-8">
              <div className="space-y-4 flex-1">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-bold shadow-lg shadow-blue-500/30">
                  <Sparkles className="h-4 w-4" />
                  <span>Premium Media Gallery</span>
                </div>
                <h1 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 tracking-tight leading-tight">
                  Product Assets
                </h1>
                <p className="text-xl text-slate-700 max-w-2xl font-medium leading-relaxed">
                  Organize, manage, and showcase your product media with a
                  powerful, beautifully designed gallery system.
                </p>
              </div>
            </div>

            {/* Stats Cards - Modern Glassmorphism */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10">
              <div className="group relative bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 overflow-hidden">
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm shadow-lg">
                      <FolderIcon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="text-4xl font-black text-white mb-1">
                    {totalFolders}
                  </div>
                  <p className="text-sm font-semibold text-blue-100 uppercase tracking-wider">
                    Folders
                  </p>
                </div>
              </div>

              <div className="group relative bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 overflow-hidden">
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm shadow-lg">
                      <ImageIcon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="text-4xl font-black text-white mb-1">
                    {totalImages}
                  </div>
                  <p className="text-sm font-semibold text-emerald-100 uppercase tracking-wider">
                    Images
                  </p>
                </div>
              </div>

              <div className="group relative bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 overflow-hidden">
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm shadow-lg">
                      <Film className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="text-4xl font-black text-white mb-1">
                    {totalVideos}
                  </div>
                  <p className="text-sm font-semibold text-purple-100 uppercase tracking-wider">
                    Videos
                  </p>
                </div>
              </div>

              <div className="group relative bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 overflow-hidden">
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm shadow-lg">
                      <Sparkles className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="text-4xl font-black text-white mb-1">
                    {totalMedia}
                  </div>
                  <p className="text-sm font-semibold text-orange-100 uppercase tracking-wider">
                    Total Assets
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Collections Grid */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Collections</h2>
              <p className="text-sm text-slate-500 mt-1">
                Your organized product folders
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Upload Button */}
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:scale-105 transition-all"
              >
                <Upload className="h-4 w-4" />
                <span className="hidden sm:inline">Upload Media</span>
              </button>

              <div className="hidden md:flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1 shadow-sm">
                <button className="px-4 py-2 rounded-md bg-slate-100 text-slate-900 text-xs font-semibold">
                  All
                </button>
                <button className="px-4 py-2 rounded-md text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-colors">
                  Recent
                </button>
              </div>
              <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1 shadow-sm">
                <button className="p-2 rounded-md bg-blue-500 text-white shadow-sm">
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button className="p-2 rounded-md text-slate-400 hover:bg-slate-50 transition-colors">
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {!folders || folders.length === 0 ? (
            <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 p-16 flex flex-col items-center justify-center text-center">
              <div className="p-6 rounded-2xl bg-blue-50 text-blue-500 mb-6">
                <FolderPlus className="h-12 w-12" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">
                No folders yet
              </h3>
              <p className="text-slate-500 mb-8 max-w-sm">
                Create your first folder to start organizing your product media
                assets.
              </p>
              <button className="px-8 py-3 bg-blue-500 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/30 hover:bg-blue-600 transition-colors">
                Create Folder
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {folders.map((folder) => (
                <FolderCard key={folder.id} folder={folder} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
      />
    </div>
  );
}
