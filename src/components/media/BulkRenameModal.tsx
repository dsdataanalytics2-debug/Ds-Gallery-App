"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Edit3, Loader2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface BulkRenameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (baseName: string) => Promise<void>;
  selectedCount: number;
  isProcessing: boolean;
}

export default function BulkRenameModal({
  isOpen,
  onClose,
  onConfirm,
  selectedCount,
  isProcessing,
}: BulkRenameModalProps) {
  const [baseName, setBaseName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!baseName.trim() || isProcessing) return;
    await onConfirm(baseName.trim());
    setBaseName("");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden shadow-black/50"
          >
            <form onSubmit={handleSubmit}>
              <div className="p-8">
                {/* Header Icon */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                    <Edit3 className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white tracking-tight">
                      Bulk Rename
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">
                      Renaming {selectedCount} selected assets
                    </p>
                  </div>
                </div>

                {/* Input Section */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">
                      New Base Name
                    </label>
                    <input
                      autoFocus
                      type="text"
                      value={baseName}
                      onChange={(e) => setBaseName(e.target.value)}
                      placeholder="e.g. vacation_2024"
                      className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 px-5 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-medium"
                      required
                    />
                  </div>

                  {/* Preview Section */}
                  {baseName && (
                    <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-2xl p-4 space-y-2">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
                        <Info className="h-3 w-3" />
                        Pattern Preview
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-slate-400 font-mono">
                          {baseName}_1.jpg
                        </p>
                        <p className="text-xs text-slate-400 font-mono">
                          {baseName}_2.png
                        </p>
                        {selectedCount > 2 && (
                          <p className="text-xs text-slate-600 font-mono italic">
                            ... and {selectedCount - 2} more
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {!baseName && (
                    <p className="text-xs text-slate-500 italic px-1 leading-relaxed">
                      Sequential numbers will be automatically added to the base
                      name for each file.
                    </p>
                  )}
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-3 mt-10">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isProcessing}
                    className="px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isProcessing || !baseName.trim()}
                    className="px-8 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-widest transition-all shadow-lg shadow-indigo-600/20 active:scale-95 disabled:opacity-50 flex items-center gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Renaming...
                      </>
                    ) : (
                      "Rename Assets"
                    )}
                  </button>
                </div>
              </div>
            </form>

            {/* Close Button */}
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
