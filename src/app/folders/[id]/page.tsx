"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Upload,
  Grid,
  List as ListIcon,
  Trash2,
  Loader2,
  Search,
} from "lucide-react";
import { Folder } from "@/types";
import MediaGrid from "@/components/media/MediaGrid";
import UploadModal from "@/components/media/UploadModal";

export default function FolderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [folder, setFolder] = useState<Folder | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchFolder = async () => {
    try {
      const res = await fetch(`/api/folders/${id}`);
      if (res.ok) {
        const data = await res.json();
        setFolder(data);
      }
    } catch (error) {
      console.error("Error fetching folder:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFolder();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-lg font-semibold text-slate-700">
            Loading folder...
          </p>
        </div>
      </div>
    );
  }

  if (!folder) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex flex-col items-center justify-center py-20 text-center px-4">
        <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-12 shadow-2xl border border-white/50 max-w-md">
          <div className="p-6 rounded-2xl bg-red-50 mb-6 inline-block">
            <Trash2 className="h-12 w-12 text-red-500" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-3">
            Folder not found
          </h2>
          <p className="text-slate-600 mb-8 leading-relaxed">
            The folder you're looking for doesn't exist or has been removed.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:shadow-xl transition-all hover:scale-105"
          >
            <ArrowLeft className="h-4 w-4" /> Back to My Folders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-8 max-w-7xl relative z-10">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
          <Link href="/" className="hover:text-purple-600 transition-colors">
            Workspace
          </Link>
          <span>/</span>
          <span className="text-purple-600">{folder.name}</span>
        </div>

        {/* Header Section - Premium Card */}
        <div className="relative bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5"></div>

          <div className="p-8 md:p-12 relative z-10">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8">
              <div className="space-y-5 flex-1">
                <h1 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 tracking-tight leading-tight">
                  {folder.name}
                </h1>
                <p className="text-xl text-slate-700 max-w-2xl font-medium leading-relaxed">
                  {folder.description ||
                    "Organize and manage your product media assets with ease."}
                </p>

                {/* Tags & Category */}
                <div className="flex flex-wrap gap-2">
                  {folder.productCategory && (
                    <span className="px-5 py-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-bold uppercase tracking-wider shadow-lg shadow-blue-500/30">
                      {folder.productCategory}
                    </span>
                  )}
                  {folder.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-slate-200 text-slate-700 text-sm font-semibold shadow-sm hover:shadow-md transition-shadow"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <button
                  className="p-4 rounded-2xl bg-red-50 hover:bg-red-100 text-red-600 transition-all hover:scale-105 active:scale-95 shadow-lg border border-red-100"
                  title="Delete Collection"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setIsUploadOpen(true)}
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-2xl font-black transition-all hover:shadow-2xl hover:scale-105 active:scale-95 shadow-xl shadow-blue-500/30"
                >
                  <Upload className="h-5 w-5" />
                  Upload Assets
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="mt-6">
              <div className="relative max-w-2xl mx-auto">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by filename..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-20 py-3 rounded-2xl bg-white/80 backdrop-blur-sm border border-slate-200 shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-slate-700 font-medium placeholder:text-slate-400 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 text-sm font-semibold"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Gallery Section - Premium Card */}
        <div className="relative bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5"></div>

          <div className="p-8 md:p-12 relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-10 gap-4">
              <div className="space-y-2">
                <h2 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                  Gallery Content
                  <span className="text-sm font-bold text-white bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-1.5 rounded-full uppercase tracking-wider shadow-lg">
                    {folder.media?.length || 0} Files
                  </span>
                </h2>
                <p className="text-base text-slate-600 font-medium">
                  Browse through your high-quality product assets.
                </p>
              </div>
              <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm p-1.5 rounded-2xl border border-slate-200 shadow-lg self-start">
                <button className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/30 transition-all hover:scale-105">
                  <Grid className="h-4 w-4" />
                </button>
                <button className="p-3 rounded-xl hover:bg-slate-100 text-slate-600 transition-all hover:scale-105">
                  <ListIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            <MediaGrid
              media={
                searchQuery
                  ? (folder.media || []).filter((item) =>
                      item.fileName
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase()),
                    )
                  : folder.media || []
              }
            />
          </div>
        </div>
      </div>

      <UploadModal
        folderId={folder.id}
        isOpen={isUploadOpen}
        onClose={() => {
          setIsUploadOpen(false);
          fetchFolder();
        }}
      />
    </div>
  );
}
