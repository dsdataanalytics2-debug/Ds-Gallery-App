"use client";

import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import {
  X,
  Upload,
  File,
  ImageIcon,
  Film,
  Loader2,
  CheckCircle2,
  FolderOpen,
  Search,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Folder } from "@/types";

interface UploadModalProps {
  folderId?: string; // Make optional since we now let users select
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

  // Folder selection state
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolderIds, setSelectedFolderIds] = useState<string[]>([]);
  const [loadingFolders, setLoadingFolders] = useState(false);

  // Custom filename state - maps file index to custom name
  const [customFileNames, setCustomFileNames] = useState<{
    [key: number]: string;
  }>({});

  // Search state
  const [folderSearchQuery, setFolderSearchQuery] = useState("");

  const filteredFolders = folders.filter(
    (folder) =>
      folder.name.toLowerCase().includes(folderSearchQuery.toLowerCase()) ||
      folder.productCategory
        .toLowerCase()
        .includes(folderSearchQuery.toLowerCase()),
  );

  // Fetch folders when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchFolders();
      // If folderId is provided, pre-select it
      if (folderId) {
        setSelectedFolderIds([folderId]);
      }
    }
  }, [isOpen, folderId]);

  const fetchFolders = async () => {
    setLoadingFolders(true);
    try {
      const response = await fetch("/api/folders");
      const data = await response.json();
      setFolders(data);
    } catch (error) {
      console.error("Failed to fetch folders:", error);
    } finally {
      setLoadingFolders(false);
    }
  };

  const toggleFolder = (id: string) => {
    setSelectedFolderIds((prev) =>
      prev.includes(id) ? prev.filter((fid) => fid !== id) : [...prev, id],
    );
  };

  const selectAll = () => {
    setSelectedFolderIds(folders.map((f) => f.id));
  };

  const deselectAll = () => {
    setSelectedFolderIds([]);
  };

  const updateFileName = (index: number, newName: string) => {
    setCustomFileNames((prev) => ({
      ...prev,
      [index]: newName,
    }));
  };

  const getFileName = (file: File, index: number): string => {
    return customFileNames[index] || file.name;
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

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0 || selectedFolderIds.length === 0) return;
    setIsUploading(true);
    setUploadProgress(10);

    try {
      const totalUploads = files.length * selectedFolderIds.length;
      let completedUploads = 0;

      // First, upload all files and get their URLs
      const uploadedFiles: {
        file: File;
        index: number;
        cdnUrl: string;
        fileName: string;
      }[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        let customName = getFileName(file, i);

        // Ensure file extension is preserved
        const extension = file.name.split(".").pop() || "";
        if (extension && !customName.endsWith(`.${extension}`)) {
          customName = `${customName}.${extension}`;
        }

        // Upload file to server
        const formData = new FormData();
        formData.append("file", file);
        formData.append("fileName", customName);
        formData.append(
          "fileType",
          file.type.startsWith("image") ? "image" : "video",
        );

        try {
          const uploadResponse = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });

          if (!uploadResponse.ok) {
            throw new Error("Upload failed");
          }

          const uploadResult = await uploadResponse.json();

          uploadedFiles.push({
            file,
            index: i,
            cdnUrl: uploadResult.cdnUrl,
            fileName: customName,
          });

          setUploadProgress(10 + (30 * (i + 1)) / files.length); // 10-40% for file uploads
        } catch (error) {
          console.error(`Failed to upload ${customName}:`, error);
          throw error;
        }
      }

      // Now save metadata to database for each folder
      for (const uploadedFile of uploadedFiles) {
        const fileType = uploadedFile.file.type.startsWith("image")
          ? "image"
          : "video";

        for (const targetFolderId of selectedFolderIds) {
          const mediaData = {
            folderId: targetFolderId,
            fileName: uploadedFile.fileName,
            fileType,
            fileFormat: uploadedFile.file.name.split(".").pop() || "unknown",
            fileSize: uploadedFile.file.size,
            storagePath: uploadedFile.cdnUrl,
            cdnUrl: uploadedFile.cdnUrl,
            thumbnailUrl: fileType === "image" ? uploadedFile.cdnUrl : null,
            tags: [],
            metadata: {
              name: uploadedFile.fileName,
              lastModified: uploadedFile.file.lastModified,
            },
          };

          await fetch("/api/media", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(mediaData),
          });

          completedUploads++;
          setUploadProgress(40 + (60 * completedUploads) / totalUploads); // 40-100% for database saves
        }
      }

      router.refresh();
      onClose();
      setFiles([]);
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-background border rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Upload className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-extrabold">Upload Media</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${isDragActive ? "border-primary bg-primary/5 scale-[0.99]" : "border-muted hover:border-primary/50"}`}
          >
            <input {...getInputProps()} />
            <div className="p-4 rounded-full bg-muted mb-4 group-hover:scale-110 transition-transform">
              <Upload className="h-8 w-8 text-primary" />
            </div>
            <p className="text-lg font-bold">Drag & drop files here</p>
            <p className="text-sm text-muted-foreground mt-1">
              Supports Images and Videos (up to 100MB)
            </p>
            <button className="mt-4 px-4 py-2 bg-secondary rounded-lg text-sm font-bold border hover:bg-muted transition-colors">
              Browse Files
            </button>
          </div>

          {/* Folder Selection Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-primary" />
                <h3 className="text-sm font-bold uppercase tracking-wider">
                  Select Destination Folders
                </h3>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={selectAll}
                  className="text-xs font-bold text-primary hover:underline"
                  type="button"
                >
                  Select All
                </button>
                <span className="text-muted-foreground">|</span>
                <button
                  onClick={deselectAll}
                  className="text-xs font-bold text-muted-foreground hover:text-foreground hover:underline"
                  type="button"
                >
                  Deselect All
                </button>
              </div>
            </div>

            {/* Folder Search */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-muted-foreground" />
              </div>
              <input
                type="text"
                value={folderSearchQuery}
                onChange={(e) => setFolderSearchQuery(e.target.value)}
                placeholder="Search folders..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border bg-background text-sm font-medium focus:ring-2 focus:ring-primary/50 outline-none"
              />
            </div>

            {loadingFolders ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : folders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">
                  No folders found. Create a folder first.
                </p>
              </div>
            ) : (
              <div className="max-h-[200px] overflow-y-auto space-y-2 pr-2 border-2 border-dashed rounded-xl p-4 custom-scrollbar">
                {filteredFolders.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    No folders match your search.
                  </div>
                ) : (
                  filteredFolders.map((folder) => (
                    <label
                      key={folder.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border hover:border-primary/30 cursor-pointer transition-all group"
                    >
                      <input
                        type="checkbox"
                        checked={selectedFolderIds.includes(folder.id)}
                        onChange={() => toggleFolder(folder.id)}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-bold group-hover:text-primary transition-colors">
                          {folder.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {folder.productCategory} • {folder._count?.media || 0}{" "}
                          files
                        </p>
                      </div>
                    </label>
                  ))
                )}
              </div>
            )}
          </div>

          {files.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  Queued Files ({files.length})
                </h3>
                <button
                  onClick={() => setFiles([])}
                  className="text-xs font-bold text-destructive hover:underline"
                >
                  Clear All
                </button>
              </div>
              <div className="max-h-[200px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                {files.map((file, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border group hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 overflow-hidden flex-1">
                      {file.type.startsWith("image") ? (
                        <ImageIcon className="h-5 w-5 text-blue-500 shrink-0" />
                      ) : (
                        <Film className="h-5 w-5 text-purple-500 shrink-0" />
                      )}
                      <div className="overflow-hidden flex-1">
                        <input
                          type="text"
                          value={getFileName(file, i)}
                          onChange={(e) => updateFileName(i, e.target.value)}
                          placeholder="Enter filename"
                          className="text-sm font-bold truncate w-full bg-transparent border-none outline-none focus:ring-2 focus:ring-primary/30 rounded px-1 py-0.5"
                        />
                        <p className="text-[10px] text-muted-foreground uppercase">
                          {(file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(i)}
                      className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm font-bold">
                <span>Uploading...</span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              disabled={isUploading}
              className="flex-1 px-4 py-3 rounded-xl border font-bold hover:bg-muted transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={
                files.length === 0 ||
                selectedFolderIds.length === 0 ||
                isUploading
              }
              className="flex-1 bg-primary text-primary-foreground px-4 py-3 rounded-xl font-extrabold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Uploading to {selectedFolderIds.length}{" "}
                  {selectedFolderIds.length === 1 ? "Folder" : "Folders"}...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5" />
                  Upload to{" "}
                  {selectedFolderIds.length === 0
                    ? "Folder"
                    : `${selectedFolderIds.length} ${selectedFolderIds.length === 1 ? "Folder" : "Folders"}`}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
