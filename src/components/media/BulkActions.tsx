"use client";

import { useState } from "react";
import { Download, Trash2, X, Edit, Loader2 } from "lucide-react";
import ConfirmModal from "@/components/ui/ConfirmModal";
import BulkRenameModal from "./BulkRenameModal";

interface BulkActionsProps {
  selectedIds: string[];
  onClear: () => void;
  onSuccess: () => void;
}

export default function BulkActions({
  selectedIds,
  onClear,
  onSuccess,
}: BulkActionsProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [action, setAction] = useState<string | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const handleDownload = async () => {
    setIsProcessing(true);
    setAction("downloading");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/media/download-multiple", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-user-data": localStorage.getItem("user") || "",
        },
        body: JSON.stringify({ mediaIds: selectedIds }),
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `gallery_export_${Date.now()}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        alert("Download failed");
      }
    } catch (error) {
      console.error("Bulk download error:", error);
    } finally {
      setIsProcessing(false);
      setAction(null);
    }
  };

  const handleDelete = () => {
    setIsDeleteConfirmOpen(true);
  };

  const executeDelete = async () => {
    setIsDeleteConfirmOpen(false);

    setIsProcessing(true);
    setAction("deleting");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/media/delete-multiple", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-user-data": localStorage.getItem("user") || "",
        },
        body: JSON.stringify({ mediaIds: selectedIds }),
      });

      if (res.ok) {
        onSuccess();
      } else {
        alert("Delete failed");
      }
    } catch (error) {
      console.error("Bulk delete error:", error);
    } finally {
      setIsProcessing(false);
      setAction(null);
    }
  };

  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);

  const handleRename = () => {
    setIsRenameModalOpen(true);
  };

  const executeRename = async (baseName: string) => {
    setIsProcessing(true);
    setAction("renaming");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/media/rename-multiple", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-user-data": localStorage.getItem("user") || "",
        },
        body: JSON.stringify({ mediaIds: selectedIds, baseName }),
      });

      if (res.ok) {
        setIsRenameModalOpen(false);
        onSuccess();
      } else {
        const errorData = await res.json();
        alert(
          `Rename failed: ${errorData.error || errorData.message || "Unknown error"}`,
        );
      }
    } catch (error) {
      console.error("Bulk rename error:", error);
    } finally {
      setIsProcessing(false);
      setAction(null);
    }
  };

  if (selectedIds.length === 0) return null;

  return (
    <>
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-8 duration-500">
        <div className="bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-2 pr-6 flex items-center gap-4 shadow-2xl shadow-indigo-500/20 ring-1 ring-white/10">
          <div className="flex items-center gap-2 pl-4 pr-4 border-r border-white/10">
            <div className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-black">
              {selectedIds.length}
            </div>
            <span className="text-white text-xs font-bold uppercase tracking-widest hidden sm:inline">
              Selected
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleDownload}
              disabled={isProcessing}
              className="p-3 rounded-2xl text-slate-400 hover:text-white hover:bg-white/5 transition-all flex items-center gap-2 disabled:opacity-50"
              title="Download as ZIP"
            >
              {action === "downloading" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              <span className="text-xs font-bold hidden md:inline uppercase">
                Download
              </span>
            </button>

            <button
              onClick={handleRename}
              disabled={isProcessing}
              className="p-3 rounded-2xl text-slate-400 hover:text-white hover:bg-white/5 transition-all flex items-center gap-2 disabled:opacity-50"
              title="Rename selected"
            >
              {action === "renaming" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Edit className="h-4 w-4" />
              )}
              <span className="text-xs font-bold hidden md:inline uppercase">
                Rename
              </span>
            </button>

            <button
              onClick={handleDelete}
              disabled={isProcessing}
              className="p-3 rounded-2xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all flex items-center gap-2 disabled:opacity-50"
              title="Delete selected"
            >
              {action === "deleting" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              <span className="text-xs font-bold hidden md:inline uppercase">
                Delete
              </span>
            </button>
          </div>

          <div className="w-px h-8 bg-white/10" />

          <button
            onClick={onClear}
            disabled={isProcessing}
            className="p-2 rounded-xl text-slate-500 hover:text-white hover:bg-white/5 transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <ConfirmModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={executeDelete}
        title="Batch Delete"
        message={`Are you sure you want to delete ${selectedIds.length} selected assets? This action cannot be undone.`}
        confirmLabel="Delete Assets"
        isLoading={isProcessing}
      />
      <BulkRenameModal
        isOpen={isRenameModalOpen}
        onClose={() => setIsRenameModalOpen(false)}
        onConfirm={executeRename}
        selectedCount={selectedIds.length}
        isProcessing={isProcessing && action === "renaming"}
      />
    </>
  );
}
