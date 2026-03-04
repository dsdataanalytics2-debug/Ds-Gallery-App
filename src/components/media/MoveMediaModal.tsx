"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Move, Loader2, Folder, Search, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface MoveMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (folderId: string) => Promise<void>;
  currentFolderId: string;
  isProcessing: boolean;
}

interface FolderItem {
  id: string;
  name: string;
  parentName?: string;
}

export default function MoveMediaModal({
  isOpen,
  onClose,
  onConfirm,
  currentFolderId,
  isProcessing,
}: MoveMediaModalProps) {
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [loadingFolders, setLoadingFolders] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchFolders();
      setSelectedFolderId(currentFolderId);
    }
  }, [isOpen, currentFolderId]);

  const fetchFolders = async () => {
    setLoadingFolders(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/folders?limit=100", {
        headers: {
          Authorization: `Bearer ${token}`,
          "x-user-data": localStorage.getItem("user") || "",
        },
      });
      if (res.ok) {
        const result = await res.json();
        // Add "Unsorted" or root folder option if it doesn't exist
        const rootOption: FolderItem = { id: "null", name: "Unsorted / Root" };
        const fetchedFolders = result.data.map(
          (f: { id: string; name: string }) => ({
            id: f.id,
            name: f.name,
          }),
        );

        setFolders([rootOption, ...fetchedFolders]);
      }
    } catch (error) {
      console.error("Error fetching folders:", error);
    } finally {
      setLoadingFolders(false);
    }
  };

  const filteredFolders = folders.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleSubmit = async () => {
    if (
      !selectedFolderId ||
      isProcessing ||
      selectedFolderId === currentFolderId
    ) {
      if (selectedFolderId === currentFolderId) onClose();
      return;
    }
    // We handle "null" string as null ID
    await onConfirm(selectedFolderId === "null" ? "" : selectedFolderId);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
          >
            <div className="p-8 pb-4 shrink-0">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  <Move className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">
                    Move Asset
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Select a new collection for this file
                  </p>
                </div>
              </div>

              <div className="relative mb-4">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search collections..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-8 custom-scrollbar min-h-[200px]">
              {loadingFolders ? (
                <div className="py-20 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="h-6 w-6 text-indigo-500 animate-spin" />
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Loading collections...
                  </p>
                </div>
              ) : (
                <div className="space-y-1 py-2">
                  {filteredFolders.map((folder) => (
                    <button
                      key={folder.id}
                      onClick={() => setSelectedFolderId(folder.id)}
                      className={cn(
                        "w-full flex items-center justify-between p-3 rounded-xl transition-all group",
                        selectedFolderId === folder.id
                          ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                          : "text-slate-400 hover:bg-white/5 hover:text-white",
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Folder
                          className={cn(
                            "h-4 w-4",
                            selectedFolderId === folder.id
                              ? "text-white"
                              : "text-slate-500 group-hover:text-indigo-400",
                          )}
                        />
                        <span className="text-sm font-bold">{folder.name}</span>
                      </div>
                      {selectedFolderId === folder.id && (
                        <Check className="h-4 w-4" />
                      )}
                    </button>
                  ))}
                  {filteredFolders.length === 0 && (
                    <div className="py-10 text-center">
                      <p className="text-xs text-slate-600 font-medium italic">
                        No collections found matching &quot;{searchQuery}&quot;
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-8 pt-4 shrink-0">
              <div className="flex items-center justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isProcessing}
                  className="px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={
                    isProcessing ||
                    !selectedFolderId ||
                    selectedFolderId === currentFolderId
                  }
                  className="px-8 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-widest transition-all shadow-lg shadow-indigo-600/20 active:scale-95 disabled:opacity-50 flex items-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Moving...
                    </>
                  ) : (
                    "Move Asset"
                  )}
                </button>
              </div>
            </div>

            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-lg text-slate-600 hover:text-white hover:bg-white/5 transition-all"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
