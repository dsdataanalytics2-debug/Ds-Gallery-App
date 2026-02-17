"use client";

import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import {
  X,
  Upload,
  File as FileIcon,
  ImageIcon,
  Film,
  Loader2,
  CheckCircle2,
  FolderOpen,
  Search,
  Plus,
  ArrowRight,
  ShieldCheck,
  Cloud,
  FileText,
  Play,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Folder } from "@/types";
import { cn } from "@/lib/utils";

interface UploadModalProps {
  folderId?: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function UploadModal({
  folderId,
  isOpen,
  onClose,
}: UploadModalProps) {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSpeed, setUploadSpeed] = useState<number>(0);
  const [estimatedTime, setEstimatedTime] = useState<number | null>(null);
  const [storageType, setStorageType] = useState<"local" | "google-drive">(
    "local",
  );

  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolderIds, setSelectedFolderIds] = useState<string[]>([]);
  const [loadingFolders, setLoadingFolders] = useState(false);
  const [customFileNames, setCustomFileNames] = useState<{
    [key: string]: string;
  }>({});
  const [folderSearchQuery, setFolderSearchQuery] = useState("");
  const [thumbnails, setThumbnails] = useState<{ [key: string]: Blob | File }>(
    {},
  );
  const [isCustomThumb, setIsCustomThumb] = useState<{
    [key: string]: boolean;
  }>({});

  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  const getFileKey = (file: File | Blob | undefined | null) => {
    if (!file) return "";
    const isFile = "name" in file && "lastModified" in file;
    return isFile
      ? `${(file as any).name}-${file.size}-${(file as any).lastModified}`
      : `blob-${file.size}`;
  };

  const closePreview = () => {
    setPreviewFile(null);
    setIsPreviewLoading(false);
  };

  const handleRemoveFromPreview = (file: File) => {
    setFiles((prev) => prev.filter((f) => f !== file));
    closePreview();
  };
  const [objectUrls, setObjectUrls] = useState<{ [key: string]: string }>({});

  // Unified ObjectURL generator/cache
  const getFileUrl = (
    file: File | Blob | undefined | null,
    prefix?: string,
  ) => {
    if (!file) return null;
    const isFile = "name" in file && "lastModified" in file;
    const key = prefix
      ? `${prefix}-${file.size}`
      : isFile
        ? `${(file as any).name}-${file.size}-${(file as any).lastModified}`
        : `blob-${file.size}`;

    return objectUrls[key] || null;
  };

  useEffect(() => {
    const newUrls: { [key: string]: string } = { ...objectUrls };
    let changed = false;

    // Track main files
    files.forEach((file) => {
      const key = `${file.name}-${file.size}-${file.lastModified}`;
      if (!newUrls[key]) {
        newUrls[key] = URL.createObjectURL(file);
        changed = true;
      }
    });

    // Track thumbnails
    Object.entries(thumbnails).forEach(([fileKey, thumb]) => {
      if (thumb) {
        // Match the prefixed key logic in getFileUrl
        const thumbKey = `thumb-${fileKey}-${thumb.size}`;
        if (!newUrls[thumbKey]) {
          newUrls[thumbKey] = URL.createObjectURL(thumb);
          changed = true;
        }
      }
    });

    if (changed) {
      setObjectUrls(newUrls);
    }
  }, [files, thumbnails]);

  useEffect(() => {
    return () => {
      Object.values(objectUrls).forEach((url) => URL.revokeObjectURL(url));
    };
  }, []); // Only on unmount

  const filteredFolders = folders.filter(
    (folder) =>
      folder.name.toLowerCase().includes(folderSearchQuery.toLowerCase()) ||
      (folder.productCategory?.toLowerCase() || "").includes(
        folderSearchQuery.toLowerCase(),
      ),
  );

  useEffect(() => {
    if (isOpen) {
      fetchFolders();
      if (folderId) setSelectedFolderIds([folderId]);
    }
  }, [isOpen, folderId]);

  // Capture thumbnails when videos are added
  useEffect(() => {
    const generateThumbs = async () => {
      const newThumbs = { ...thumbnails };
      let changed = false;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const key = getFileKey(file);
        if (file.type.startsWith("video") && !newThumbs[key]) {
          try {
            const { captureVideoFrame } = await import("@/lib/media-utils");
            const blob = await captureVideoFrame(file);
            newThumbs[key] = blob;
            changed = true;
          } catch (error) {
            console.error("Failed to capture frame:", error);
          }
        }
      }

      if (changed) {
        setThumbnails(newThumbs);
      }
    };
    generateThumbs();
  }, [files]);

  const fetchFolders = async () => {
    setLoadingFolders(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/folders?limit=100&recursive=true", {
        headers: {
          Authorization: `Bearer ${token}`,
          "x-user-data": localStorage.getItem("user") || "",
        },
      });
      const result = await response.json();
      if (result && Array.isArray(result.data)) {
        setFolders(result.data);
      } else {
        setFolders([]);
      }
    } catch (error) {
      console.error("Failed to fetch folders:", error);
      setFolders([]);
    } finally {
      setLoadingFolders(false);
    }
  };

  const toggleFolder = (id: string) => {
    setSelectedFolderIds((prev) =>
      prev.includes(id) ? prev.filter((fid) => fid !== id) : [...prev, id],
    );
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles((prev) => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"],
      "video/*": [".mp4", ".mov", ".avi", ".webm"],
    },
  });

  const handleCustomThumbUpload = (
    fileKey: string,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnails((prev) => ({ ...prev, [fileKey]: file }));
      setIsCustomThumb((prev) => ({ ...prev, [fileKey]: true }));
    }
  };

  const handleUpload = async () => {
    if (files.length === 0 || selectedFolderIds.length === 0) return;
    setIsUploading(true);
    setUploadProgress(0);
    setUploadSpeed(0);
    setEstimatedTime(null);

    try {
      const uploadedFiles = [];
      const token = localStorage.getItem("token");
      const userData = localStorage.getItem("user") || "";

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const key = getFileKey(file);
        const formData = new FormData();
        formData.append("file", file);
        formData.append("fileName", customFileNames[key] || file.name);
        formData.append(
          "fileType",
          file.type.startsWith("image") ? "image" : "video",
        );
        formData.append("storageType", storageType);

        if (thumbnails[key]) {
          const thumb = thumbnails[key];
          const thumbFile =
            thumb instanceof Blob
              ? new (window as any).File([thumb], "thumbnail.jpg", {
                  type: "image/jpeg",
                })
              : (thumb as File);
          formData.append("thumbnail", thumbFile);
        }

        const uploadSingleFile = () => {
          return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            const startTime = Date.now();
            let lastLoaded = 0;
            let lastTime = startTime;

            xhr.upload.onprogress = (event) => {
              if (event.lengthComputable) {
                const currentTime = Date.now();
                const elapsed = (currentTime - lastTime) / 1000;

                if (elapsed >= 0.5) {
                  // Update speed every 500ms
                  const bytesSent = event.loaded - lastLoaded;
                  const currentSpeed = bytesSent / elapsed; // bytes per second
                  setUploadSpeed(currentSpeed);

                  const remainingBytes = event.total - event.loaded;
                  setEstimatedTime(remainingBytes / currentSpeed);

                  lastLoaded = event.loaded;
                  lastTime = currentTime;
                }

                // File progress is 0-90% of the total, the rest is DB entry
                const fileProgress = (event.loaded / event.total) * 90;
                const overallProgress =
                  (i / files.length) * 100 + fileProgress / files.length;
                setUploadProgress(overallProgress);
              }
            };

            xhr.onload = () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                resolve(JSON.parse(xhr.responseText));
              } else {
                try {
                  const errorData = JSON.parse(xhr.responseText);
                  reject(
                    new Error(
                      errorData.error || `Upload failed for ${file.name}`,
                    ),
                  );
                } catch {
                  reject(new Error(`Upload failed for ${file.name}`));
                }
              }
            };

            xhr.onerror = () =>
              reject(new Error("Network connection error during upload"));

            xhr.open("POST", "/api/upload");
            xhr.setRequestHeader("Authorization", `Bearer ${token}`);
            xhr.setRequestHeader("x-user-data", userData);
            xhr.send(formData);
          });
        };

        const data: any = await uploadSingleFile();
        uploadedFiles.push({
          ...data,
          index: i,
          file,
          isCustomThumbnail: isCustomThumb[getFileKey(file)] || false,
          thumbnailPublicId: data.thumbnailPublicId,
        });
      }

      // Phase 2: Create Media Entries (DB)
      for (const uploadedFile of uploadedFiles) {
        for (const targetFolderId of selectedFolderIds) {
          const res = await fetch("/api/media", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
              "x-user-data": userData,
            },
            body: JSON.stringify({
              folderId: targetFolderId,
              fileName:
                customFileNames[uploadedFile.index] || uploadedFile.file.name,
              fileType: uploadedFile.file.type.startsWith("image")
                ? "image"
                : "video",
              fileFormat: uploadedFile.file.name.split(".").pop(),
              fileSize: uploadedFile.file.size,
              storageType: storageType,
              publicId: uploadedFile.publicId,
              cdnUrl: uploadedFile.cdnUrl,
              storagePath: uploadedFile.cdnUrl,
              thumbnailUrl: uploadedFile.thumbnailUrl,
              isCustomThumbnail: uploadedFile.isCustomThumbnail,
              metadata: {
                thumbnailPublicId: uploadedFile.thumbnailPublicId,
              },
            }),
          });

          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || "Failed to create media entry");
          }
        }
      }
      router.refresh();
      onClose();
      setFiles([]);
      setThumbnails({});
      setIsCustomThumb({});
    } catch (error) {
      console.error("Upload error:", error);
      alert(
        error instanceof Error
          ? error.message
          : "An unknown error occurred during upload",
      );
    } finally {
      setIsUploading(false);
      // Clean up object URLs on success
      Object.values(objectUrls).forEach((url) => URL.revokeObjectURL(url));
      setObjectUrls({});
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-slate-950/50 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
            <Cloud className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-widest">
              Media Uploader
            </h2>
            <p className="text-[10px] font-bold text-slate-500">
              Secure Cloud Storage Gateway
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {files.length > 0 && (
            <span className="text-xs font-bold text-indigo-400">
              {files.length} {files.length === 1 ? "file" : "files"} ready
            </span>
          )}
          <button
            onClick={() => {
              onClose();
              // Explicitly clean up URLs when closing
              Object.values(objectUrls).forEach((url) =>
                URL.revokeObjectURL(url),
              );
              setObjectUrls({});
            }}
            className="p-2 rounded-full hover:bg-white/5 text-slate-400 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Dropzone & Queue */}
        <div className="flex-1 overflow-y-auto p-12 custom-scrollbar border-r border-white/5">
          <div className="max-w-3xl mx-auto space-y-12">
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-white tracking-tight">
                Upload Assets
              </h3>
              <p className="text-slate-400">
                Drag and drop your project media files below. We support
                high-resolution images and 4K video formats.
              </p>
            </div>

            <div
              {...getRootProps()}
              className={cn(
                "relative aspect-video rounded-3xl border-2 border-dashed transition-all duration-500 flex flex-col items-center justify-center p-12 group cursor-pointer",
                isDragActive
                  ? "border-indigo-500 bg-indigo-500/5 scale-[0.99]"
                  : "border-white/10 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/20",
              )}
            >
              <input {...getInputProps()} />
              <div className="p-6 rounded-2xl bg-white/5 mb-6 group-hover:scale-110 group-hover:bg-indigo-500/10 group-hover:text-indigo-400 transition-all duration-500">
                <Upload className="h-10 w-10 text-slate-400" />
              </div>
              <div className="text-center space-y-2">
                <p className="text-lg font-bold text-white">
                  Select pieces of art
                </p>
                <p className="text-sm text-slate-500">
                  Drop files anywhere or{" "}
                  <span className="text-indigo-400">browse folders</span>
                </p>
              </div>

              {/* Visual Decoration */}
              <div className="absolute bottom-6 left-6 right-6 flex justify-between items-center opacity-40">
                <div className="flex gap-2">
                  <div className="w-8 h-1 bg-white/10 rounded-full" />
                  <div className="w-4 h-1 bg-white/10 rounded-full" />
                </div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <ShieldCheck className="h-3 w-3" />
                  Encrypted Upload
                </div>
              </div>
            </div>

            {files.length > 0 && (
              <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <FileText className="h-4 w-4 text-indigo-400" />
                    Upload Queue
                  </h4>
                  <button
                    onClick={() => setFiles([])}
                    className="text-xs font-bold text-slate-500 hover:text-white transition-colors"
                  >
                    Reset Queue
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {files.map((file, i) => {
                    const fileKey = getFileKey(file);
                    const thumbnail = thumbnails[fileKey];
                    return (
                      <div
                        key={fileKey}
                        className="group flex flex-col gap-3 p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div
                            onClick={() => {
                              setPreviewFile(file);
                              setIsPreviewLoading(true);
                            }}
                            className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center shrink-0 overflow-hidden border border-white/5 cursor-pointer hover:border-indigo-500/50 transition-all relative group/thumb"
                          >
                            {file.type.startsWith("image") ? (
                              (() => {
                                const url = getFileUrl(file);
                                return url ? (
                                  <img
                                    src={url}
                                    className="w-full h-full object-cover"
                                    alt="preview"
                                  />
                                ) : (
                                  <ImageIcon className="h-6 w-6 text-indigo-400" />
                                );
                              })()
                            ) : (
                              <>
                                {(() => {
                                  const url = getFileUrl(
                                    thumbnail,
                                    `thumb-${fileKey}`,
                                  );
                                  return url ? (
                                    <img
                                      src={url}
                                      className="w-full h-full object-cover"
                                      alt="thumb"
                                    />
                                  ) : (
                                    <Film className="h-6 w-6 text-indigo-400" />
                                  );
                                })()}
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity">
                                  <Play className="h-4 w-4 text-white fill-white" />
                                </div>
                              </>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <input
                              className="bg-transparent border-none text-sm font-bold text-white w-full focus:ring-0 p-0"
                              value={customFileNames[fileKey] || file.name}
                              onChange={(e) =>
                                setCustomFileNames((prev) => ({
                                  ...prev,
                                  [fileKey]: e.target.value,
                                }))
                              }
                            />
                            <p className="text-[10px] font-bold text-slate-500 uppercase">
                              {(file.size / (1024 * 1024)).toFixed(2)} MB •{" "}
                              {file.type.split("/")[1]}
                            </p>
                          </div>
                          <button
                            onClick={() =>
                              setFiles(files.filter((_, idx) => idx !== i))
                            }
                            className="p-2 opacity-0 group-hover:opacity-100 hover:bg-white/5 rounded-lg text-slate-500 hover:text-red-400 transition-all"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>

                        {file.type.startsWith("video") && (
                          <div className="flex items-center justify-between pl-16">
                            <div className="flex items-center gap-2">
                              <span
                                className={cn(
                                  "text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded",
                                  isCustomThumb[fileKey]
                                    ? "bg-amber-500/10 text-amber-500"
                                    : "bg-indigo-500/10 text-indigo-400",
                                )}
                              >
                                {isCustomThumb[fileKey]
                                  ? "Custom Thumbnail"
                                  : "Auto-generated"}
                              </span>
                            </div>
                            <label className="cursor-pointer">
                              <input
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={(e) =>
                                  handleCustomThumbUpload(fileKey, e)
                                }
                              />
                              <span className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1">
                                <Plus className="h-3 w-3" />
                                {isCustomThumb[fileKey]
                                  ? "Change Image"
                                  : "Upload Custom"}
                              </span>
                            </label>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Configuration & Destination */}
        <div className="w-96 bg-slate-950 p-10 flex flex-col space-y-8 h-full">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Destination</h3>
              <div className="flex bg-white/5 p-1 rounded-lg">
                <button
                  onClick={() => setStorageType("local")}
                  className={cn(
                    "px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all",
                    storageType === "local"
                      ? "bg-indigo-600 text-white shadow-lg"
                      : "text-slate-500 hover:text-white",
                  )}
                >
                  Local
                </button>
                <button
                  onClick={() => setStorageType("google-drive")}
                  className={cn(
                    "px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all",
                    storageType === "google-drive"
                      ? "bg-indigo-600 text-white shadow-lg"
                      : "text-slate-500 hover:text-white",
                  )}
                >
                  Drive
                </button>
              </div>
            </div>
            <p className="text-xs text-slate-500">
              Choose where to route these assets.
            </p>
          </div>

          <div className="space-y-4 flex-1 flex flex-col min-h-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                placeholder="Search collections..."
                className="w-full bg-white/[0.03] border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all"
                value={folderSearchQuery}
                onChange={(e) => setFolderSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-2">
              {filteredFolders.map((folder) => (
                <div
                  key={folder.id}
                  onClick={() => toggleFolder(folder.id)}
                  className={cn(
                    "p-4 rounded-2xl border transition-all cursor-pointer group",
                    selectedFolderIds.includes(folder.id)
                      ? "bg-indigo-500/10 border-indigo-500/50"
                      : "bg-white/[0.02] border-white/5 hover:border-white/10",
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          "text-xs font-bold transition-colors",
                          selectedFolderIds.includes(folder.id)
                            ? "text-indigo-400"
                            : "text-white",
                        )}
                      >
                        {folder.name}
                      </p>
                      <p className="text-[10px] font-bold text-slate-500 uppercase">
                        {folder.productCategory || "Product"}
                      </p>
                    </div>
                    <div
                      className={cn(
                        "w-4 h-4 rounded-full border-2 transition-all flex items-center justify-center",
                        selectedFolderIds.includes(folder.id)
                          ? "bg-indigo-500 border-indigo-500"
                          : "border-white/10",
                      )}
                    >
                      {selectedFolderIds.includes(folder.id) && (
                        <CheckCircle2 className="h-2.5 w-2.5 text-white" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-6 border-t border-white/5 space-y-6">
            {isUploading ? (
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-white uppercase tracking-widest">
                      Processing Stream
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-indigo-400">
                        {(uploadSpeed / (1024 * 1024)).toFixed(2)} MB/s
                      </span>
                      <div className="w-1 h-1 rounded-full bg-slate-800" />
                      <span className="text-[10px] font-bold text-slate-500">
                        {estimatedTime !== null
                          ? estimatedTime > 60
                            ? `${Math.floor(estimatedTime / 60)}m ${Math.round(estimatedTime % 60)}s remaining`
                            : `${Math.round(estimatedTime)}s remaining`
                          : "Calculating..."}
                      </span>
                    </div>
                  </div>
                  <span className="text-2xl font-black text-indigo-500 tabular-nums">
                    {Math.round(uploadProgress)}%
                  </span>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-full transition-all duration-300 relative"
                    style={{ width: `${uploadProgress}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20 animate-pulse" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  <span>Targets</span>
                  <span>{selectedFolderIds.length} Selections</span>
                </div>
                <button
                  disabled={
                    files.length === 0 || selectedFolderIds.length === 0
                  }
                  onClick={handleUpload}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:grayscale text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all group lg:text-base"
                >
                  <span>Initiate Upload</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </button>
                <p className="text-[10px] text-center text-slate-500 leading-relaxed font-medium">
                  By initiating upload, you agree to our{" "}
                  <span className="underline">Terms of Service</span> and{" "}
                  <span className="underline">Media Management Policy</span>.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Preview Modal Overlay */}
      {previewFile && (
        <div className="fixed inset-0 z-[110] bg-black/95 flex flex-col items-center justify-center p-8 animate-in fade-in duration-300">
          <div className="absolute top-8 right-8 flex items-center gap-3 z-[120]">
            <button
              onClick={() => handleRemoveFromPreview(previewFile)}
              className="p-3 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all border border-red-500/20"
              title="Remove from queue"
            >
              <Trash2 className="h-6 w-6" />
            </button>
            <button
              onClick={closePreview}
              className="p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="max-w-5xl w-full aspect-video flex items-center justify-center relative bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-white/10">
            {isPreviewLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 z-10">
                <Loader2 className="h-12 w-12 text-indigo-500 animate-spin mb-4" />
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                  Loading Preview...
                </p>
              </div>
            )}

            {(() => {
              const url = getFileUrl(previewFile);
              if (!url) return null;

              return previewFile.type.startsWith("video") ? (
                <video
                  key={`${previewFile.name}-${previewFile.size}`}
                  src={url}
                  className="w-full h-full object-contain"
                  controls
                  autoPlay
                  onCanPlay={() => setIsPreviewLoading(false)}
                  onLoadedData={() => setIsPreviewLoading(false)}
                  onError={() => setIsPreviewLoading(false)}
                />
              ) : (
                <img
                  key={`${previewFile.name}-${previewFile.size}`}
                  src={url}
                  className="max-w-full max-h-full object-contain"
                  alt="Preview"
                  onLoad={() => setIsPreviewLoading(false)}
                  onError={() => setIsPreviewLoading(false)}
                />
              );
            })()}
          </div>

          <div className="mt-8 text-center space-y-2">
            <h3 className="text-2xl font-bold text-white tracking-tight">
              {previewFile.name}
            </h3>
            <p className="text-xs text-slate-500 uppercase font-black tracking-widest flex items-center justify-center gap-3">
              <span>{(previewFile.size / (1024 * 1024)).toFixed(2)} MB</span>
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              <span>Pre-upload Review</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
