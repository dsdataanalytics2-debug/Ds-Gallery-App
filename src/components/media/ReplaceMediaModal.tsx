"use client";

import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Upload,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  FileText,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Media } from "@/types";

interface ReplaceMediaModalProps {
  media: Media;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReplaceMediaModal({
  media,
  isOpen,
  onClose,
  onSuccess,
}: ReplaceMediaModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"],
      "video/*": [".mp4", ".mov", ".avi", ".webm"],
    },
    multiple: false,
  });

  const handleReplace = async () => {
    if (!file) return;

    setIsUploading(true);
    setProgress(0);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      const userData = localStorage.getItem("user") || "";

      // Step 1: Upload the file
      const formData = new FormData();
      formData.append("file", file);
      formData.append(
        "storageType",
        media.storageType === "gdrive" ? "gdrive" : "local",
      );
      formData.append("folderId", media.folderId);

      const xhr = new XMLHttpRequest();

      const uploadPromise = new Promise((resolve, reject) => {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            setProgress((event.loaded / event.total) * 100);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(new Error("Upload failed"));
          }
        };

        xhr.onerror = () => reject(new Error("Network error"));

        xhr.open("POST", "/api/upload");
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        xhr.setRequestHeader("x-user-data", userData);
        xhr.send(formData);
      });

      const uploadData = (await uploadPromise) as any;

      // Step 2: Update the DB record (Replace)
      const patchRes = await fetch(`/api/media/${media.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-user-data": userData,
        },
        body: JSON.stringify({
          cdnUrl: uploadData.cdnUrl,
          storageFileId: uploadData.publicId,
          storageType: uploadData.storageType,
          fileSize: file.size,
          fileFormat: file.name.split(".").pop(),
          thumbnailUrl: uploadData.thumbnailUrl,
        }),
      });

      if (patchRes.ok) {
        onSuccess();
        onClose();
      } else {
        throw new Error("Failed to update asset record");
      }
    } catch (err: any) {
      console.error("Replacement failed:", err);
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsUploading(false);
    }
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
            className="relative w-full max-w-2xl bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden shadow-black/50"
          >
            <div className="p-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                    <Upload className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white tracking-tight">
                      Replace Asset
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">
                      Swapping version for "{media.fileName}"
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg text-slate-600 hover:text-white hover:bg-white/5 transition-all"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Comparison View */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                {/* Current Version */}
                <div className="space-y-3">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">
                    Current Version
                  </p>
                  <div className="aspect-video rounded-2xl bg-slate-950 border border-white/5 overflow-hidden group relative">
                    <img
                      src={media.thumbnailUrl || media.cdnUrl}
                      className="w-full h-full object-cover opacity-50 grayscale"
                      alt="Current"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-bold text-white uppercase tracking-wider">
                        Existing
                      </div>
                    </div>
                  </div>
                  <div className="px-1 text-[10px] text-slate-500 font-medium">
                    {media.fileFormat?.toUpperCase()} •{" "}
                    {(media.fileSize / (1024 * 1024)).toFixed(2)} MB
                  </div>
                </div>

                {/* New Selection */}
                <div className="space-y-3">
                  <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest ml-1">
                    New Selection
                  </p>
                  <div
                    {...getRootProps()}
                    className={cn(
                      "aspect-video rounded-2xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center p-4 cursor-pointer overflow-hidden",
                      isDragActive
                        ? "border-indigo-500 bg-indigo-500/5"
                        : "border-white/10 hover:border-indigo-500/30 hover:bg-white/[0.02]",
                      file && "border-indigo-500 bg-indigo-500/5 border-solid",
                    )}
                  >
                    <input {...getInputProps()} />
                    {file ? (
                      <div className="text-center space-y-2">
                        <div className="p-3 rounded-xl bg-indigo-500 text-white w-fit mx-auto mb-2 animate-bounce">
                          <CheckCircle2 className="h-6 w-6" />
                        </div>
                        <p className="text-sm font-bold text-white truncate px-2">
                          {file.name}
                        </p>
                        <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">
                          Ready to swap
                        </p>
                      </div>
                    ) : (
                      <div className="text-center space-y-2">
                        <Upload className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                        <p className="text-xs font-bold text-slate-400">
                          Click or drag to replace
                        </p>
                      </div>
                    )}
                  </div>
                  {file && (
                    <div className="px-1 text-[10px] text-slate-500 font-medium text-right transition-all">
                      {file.name.split(".").pop()?.toUpperCase()} •{" "}
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </div>
                  )}
                </div>
              </div>

              {/* Warnings / Error */}
              {error && (
                <div className="mb-8 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex gap-3 text-red-400">
                  <AlertTriangle className="h-5 w-5 shrink-0" />
                  <p className="text-sm font-medium">{error}</p>
                </div>
              )}

              {!error && !file && (
                <div className="mb-8 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex gap-3 text-amber-400">
                  <AlertTriangle className="h-5 w-5 shrink-0" />
                  <p className="text-xs leading-relaxed font-medium">
                    Replacing will permanently delete the current file from
                    storage. This action cannot be undone.
                  </p>
                </div>
              )}

              {/* Progress UI */}
              {isUploading && (
                <div className="mb-8 space-y-3">
                  <div className="flex justify-between text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">
                    <span>Uploading new version</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 p-0.5">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isUploading}
                  className="px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-white transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReplace}
                  disabled={isUploading || !file}
                  className="px-8 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-widest transition-all shadow-lg shadow-indigo-600/20 active:scale-95 disabled:opacity-50 flex items-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Replacing...
                    </>
                  ) : (
                    <>
                      Replace Current Version
                      <ArrowRight className="h-3 w-3" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
