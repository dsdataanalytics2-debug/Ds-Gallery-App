"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Upload,
  Grid,
  List as ListIcon,
  Trash2,
  Loader2,
  Search,
  FolderPlus,
  Settings,
  Users,
  Shield,
  Mail,
} from "lucide-react";
import { Folder } from "@/types";
import MediaGrid from "@/components/media/MediaGrid";
import UploadModal from "@/components/media/UploadModal";
import MediaPreviewDrawer from "@/components/media/MediaPreviewDrawer";
import FolderCard from "@/components/folders/FolderCard";
import CreateFolderModal from "@/components/folders/CreateFolderModal";
import FolderSettingsModal from "@/components/folders/FolderSettingsModal";
import { Sparkles, LayoutGrid } from "lucide-react";
import Pagination from "@/components/ui/Pagination";
import { Media } from "@/types";

export default function FolderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const [folder, setFolder] = useState<Folder | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAsset, setSelectedAsset] = useState<Media | null>(null);
  const [media, setMedia] = useState<Media[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [totalPages, setTotalPages] = useState(1);
  const [mediaCount, setMediaCount] = useState(0);

  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showAccessList, setShowAccessList] = useState(false);

  const fetchFolder = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/folders/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "x-user-data": localStorage.getItem("user") || "",
        },
      });
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

  const fetchMedia = async () => {
    setMediaLoading(true);
    try {
      const params = new URLSearchParams({
        folderIds: id,
        page: page.toString(),
        limit: pageSize.toString(),
      });
      if (searchQuery) params.append("q", searchQuery);

      const token = localStorage.getItem("token");
      const res = await fetch(`/api/media?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "x-user-data": localStorage.getItem("user") || "",
        },
      });
      if (res.ok) {
        const result = await res.json();
        setMedia(result.data);
        setTotalPages(result.pagination.totalPages);
        setMediaCount(result.pagination.total);
      }
    } catch (error) {
      console.error("Error fetching folder media:", error);
    } finally {
      setMediaLoading(false);
    }
  };

  useEffect(() => {
    fetchFolder();
  }, [id]);

  useEffect(() => {
    fetchMedia();
  }, [id, page, pageSize]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (page !== 1) setPage(1);
      else fetchMedia();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const getInitials = (nameOrEmail: string) => {
    if (!nameOrEmail) return "??";
    const parts = nameOrEmail.split(/[ @._-]/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }
    return nameOrEmail.substring(0, 2).toUpperCase();
  };

  const handleDeleteFolder = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this collection? All digital assets inside will be unassigned but preserved in the system.",
      )
    ) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/folders/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "x-user-data": localStorage.getItem("user") || "",
        },
      });

      if (res.ok) {
        router.push("/folders");
      } else {
        const errorData = await res.json();
        alert(`Failed to delete collection: ${errorData.error}`);
      }
    } catch (error) {
      console.error("Error deleting folder:", error);
      alert("An unexpected error occurred while deleting the collection.");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
        <p className="text-slate-500 text-sm font-bold uppercase tracking-widest leading-relaxed">
          Decrypting Collection...
        </p>
      </div>
    );
  }

  if (!folder) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center px-4">
        <div className="bg-card border border-border rounded-3xl p-12 max-w-md shadow-2xl">
          <div className="p-6 rounded-2xl bg-red-500/10 mb-6 inline-block">
            <Trash2 className="h-12 w-12 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Collection Disappeared
          </h2>
          <p className="text-slate-400 mb-8 leading-relaxed text-sm">
            This collection seems to have been archived or removed from the
            system.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all"
          >
            <ArrowLeft className="h-4 w-4" /> Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-10 pb-20">
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pt-4">
        <div className="space-y-4 flex-1">
          <div className="flex items-center gap-4">
            <Link
              href={
                folder.parentId ? `/folders/${folder.parentId}` : "/folders"
              }
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all border border-white/5"
              title={folder.parentId ? "Back to Parent" : "Back to Collections"}
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500">
              <Link
                href="/"
                className="hover:text-indigo-400 transition-colors"
              >
                Workspace
              </Link>
              <span className="text-slate-800">/</span>
              {folder.parent && (
                <>
                  <Link
                    href={`/folders/${folder.parentId}`}
                    className="hover:text-indigo-400 transition-colors"
                  >
                    {folder.parent.name}
                  </Link>
                  <span className="text-slate-800">/</span>
                </>
              )}
              <span className="text-indigo-400">Collections</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
                {folder.name}
              </h1>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
                  <Shield className="h-3 w-3" />
                  Owner: {folder.owner?.name || folder.owner?.email}
                </div>

                {folder.permissions && folder.permissions.length > 0 && (
                  <div className="flex items-center gap-2 relative">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 ml-2">
                      <Users className="h-3 w-3" />
                      Shared With:
                    </span>
                    <div className="relative">
                      <button
                        onClick={() => setShowAccessList(!showAccessList)}
                        className="flex items-center -space-x-2 group hover:opacity-80 transition-opacity"
                        title="Show Access List"
                      >
                        {folder.permissions.map((p) => (
                          <div
                            key={p.id}
                            title={`${p.user.name || p.user.email} (${p.user.role})`}
                            className="h-6 w-6 rounded-full bg-slate-800 border-2 border-background flex items-center justify-center text-[8px] font-bold text-indigo-400 group-hover:border-indigo-500/50 transition-colors"
                          >
                            {getInitials(p.user.name || p.user.email)}
                          </div>
                        ))}
                        {folder.permissions.length > 3 && (
                          <div className="h-6 w-6 rounded-full bg-slate-700 border-2 border-background flex items-center justify-center text-[10px] font-bold text-slate-300">
                            +{folder.permissions.length - 3}
                          </div>
                        )}
                      </button>

                      {showAccessList && (
                        <div className="absolute top-full left-0 mt-2 w-64 bg-slate-900 border border-border rounded-xl shadow-2xl z-[110] p-2 animate-in fade-in zoom-in-95 duration-200">
                          <div className="space-y-1">
                            <div className="px-2 py-1.5 mb-1 border-b border-white/5 flex items-center justify-between">
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                Authorized Users
                              </span>
                              <button
                                onClick={() => setIsSettingsOpen(true)}
                                className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
                              >
                                <Settings className="h-3 w-3" />
                                Manage
                              </button>
                            </div>
                            {folder.permissions.map((p) => (
                              <div
                                key={p.id}
                                className="flex flex-col p-2 hover:bg-white/5 rounded-lg transition-colors group"
                              >
                                <span className="text-xs font-bold text-white flex items-center gap-2">
                                  {p.user.name || "Unnamed User"}
                                  {p.user.role === "admin" && (
                                    <Shield className="h-2.5 w-2.5 text-amber-500" />
                                  )}
                                </span>
                                <span className="text-[10px] text-slate-500 flex items-center gap-1">
                                  <Mail className="h-2.5 w-2.5" />
                                  {p.user.email}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <p className="text-slate-400 text-base max-w-2xl leading-relaxed">
              {folder.description ||
                "Comprehensive asset overview for this product collection."}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {folder.productCategory && (
              <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-bold uppercase tracking-widest border border-indigo-500/20">
                {folder.productCategory}
              </span>
            )}
            {folder.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 rounded-full bg-white/5 text-slate-400 text-[10px] font-bold uppercase tracking-widest border border-white/5"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/5 transition-all active:scale-95"
            title="Collection Settings"
          >
            <Settings className="h-5 w-5" />
          </button>
          <button
            onClick={() => setIsCreateFolderOpen(true)}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-6 py-3.5 rounded-2xl font-bold transition-all border border-slate-700 active:scale-95"
          >
            <FolderPlus className="h-4 w-4" />
            New Folder
          </button>
          <button
            onClick={() => setIsUploadOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3.5 rounded-2xl font-bold transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
          >
            <Upload className="h-4 w-4" />
            Import Assets
          </button>
          <button
            onClick={handleDeleteFolder}
            className="p-3.5 rounded-2xl bg-red-500/5 hover:bg-red-500/10 text-red-500 border border-red-500/10 transition-all active:scale-95"
            title="Delete Collection"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Subfolders Section */}
      {folder.children && folder.children.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-3">
            Sub-Collections
            <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-slate-500 border border-white/5">
              {folder.children.length}
            </span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
            {folder.children.map((child) => (
              <FolderCard key={child.id} folder={child} />
            ))}
          </div>
        </div>
      )}

      {/* Media Interaction Zone */}
      <div className="bg-card/30 border border-border rounded-[2rem] overflow-hidden">
        <div className="p-8 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-3">
                Asset Stream
                <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-slate-500 border border-white/5">
                  {mediaCount} Total
                </span>
              </h2>
              <div className="h-4 w-px bg-white/10 hidden sm:block"></div>
              <div className="relative hidden md:block w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  placeholder="Filter by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/5 rounded-xl py-2 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 p-1 bg-white/5 rounded-xl self-start">
              <button className="p-2 rounded-lg bg-indigo-600 text-white shadow-lg shadow-indigo-600/20">
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button className="p-2 rounded-lg text-slate-500 hover:text-white transition-colors">
                <ListIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          {mediaLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500/50" />
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                Updating Stream...
              </p>
            </div>
          ) : (
            <>
              <MediaGrid
                media={media}
                onItemClick={(item) => setSelectedAsset(item)}
              />
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                pageSize={pageSize}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setPage(1);
                }}
                onPageChange={setPage}
              />
            </>
          )}
        </div>
      </div>

      <CreateFolderModal
        isOpen={isCreateFolderOpen}
        onClose={() => setIsCreateFolderOpen(false)}
        parentId={folder.id}
        onFolderCreated={fetchFolder}
      />

      <FolderSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        folder={folder}
        onUpdate={fetchFolder}
      />

      <UploadModal
        folderId={folder.id}
        isOpen={isUploadOpen}
        onClose={() => {
          setIsUploadOpen(false);
          fetchFolder();
        }}
      />

      <MediaPreviewDrawer
        media={selectedAsset}
        isOpen={!!selectedAsset}
        onClose={() => setSelectedAsset(null)}
      />
    </div>
  );
}
