"use client";

import { useState, useEffect } from "react";
import { X, Loader2, User as UserIcon, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

interface CreateFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFolderCreated?: () => void;
  parentId?: string;
}

export default function CreateFolderModal({
  isOpen,
  onClose,
  onFolderCreated,
  parentId,
}: CreateFolderModalProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    productCategory: "",
    tags: "",
    ownerId: "",
    isPublic: false,
  });
  const [customCategory, setCustomCategory] = useState("");
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setIsAdmin(user.role === "admin");

      if (user.role === "admin") {
        fetchUsers();
      }
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const res = await fetch("/api/users", {
        headers: {
          Authorization: `Bearer ${token}`,
          "x-user-role": user.role,
          "x-user-data": localStorage.getItem("user") || "",
        },
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      const userData = localStorage.getItem("user");

      if (!token || !userData) {
        throw new Error("Authentication data missing. Please log in again.");
      }

      const payload = {
        ...formData,
        productCategory:
          formData.productCategory === "Other"
            ? customCategory
            : formData.productCategory,
        parentId: parentId || null,
        tags: formData.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      };

      console.log("CreateFolderModal Payload:", payload);

      const res = await fetch("/api/folders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-user-data": userData,
        },
        body: JSON.stringify({
          ...payload,
          isPublic: isAdmin ? formData.isPublic : false,
        }),
      });

      console.log("CreateFolderModal Status:", res.status, res.statusText);

      const responseText = await res.text();
      console.log("CreateFolderModal Raw Response:", responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        data = { error: "Invalid JSON response from server" };
      }

      if (res.ok) {
        onClose();
        setFormData({
          name: "",
          description: "",
          productCategory: "",
          tags: "",
          ownerId: "",
          isPublic: false,
        });
        setCustomCategory("");
        setShowCustomCategory(false);
        if (onFolderCreated) onFolderCreated();
        router.refresh();
      } else {
        const errorMsg =
          data.message || data.error || `Server error (${res.status})`;
        setError(errorMsg);

        // If it's a 401, it might be the stale ID issue
        if (res.status === 401 && data.error === "Session data mismatch") {
          console.warn(
            "Detected stale session data. User needs to login again.",
          );
        }
      }
    } catch (error: any) {
      console.error("Error creating folder:", error);
      setError(error.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-card border border-border rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col h-full overflow-hidden"
        >
          <div className="flex items-center justify-between p-6 border-b border-white/5 bg-slate-900 shrink-0 z-10">
            <h2 className="text-xl font-bold text-white">
              {parentId ? "Create Sub-Folder" : "Create Collection"}
            </h2>
            <button
              onClick={onClose}
              type="button"
              className="p-2 rounded-xl text-white bg-white/10 hover:bg-red-500 transition-all border border-white/20 shadow-xl group/close"
              aria-label="Close modal"
            >
              <X className="h-6 w-6 group-hover:rotate-90 transition-transform duration-300" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold animate-in fade-in slide-in-from-top-2">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Collection Name *
              </label>
              <input
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g. Summer Assets 2026"
                className="w-full bg-slate-900 border border-border rounded-xl p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
              />
            </div>

            {!parentId && (
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Category
                </label>
                <select
                  value={formData.productCategory}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData({ ...formData, productCategory: val });
                    setShowCustomCategory(val === "Other");
                  }}
                  className="w-full bg-slate-900 border border-border rounded-xl p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all cursor-pointer"
                >
                  <option value="">Select a category</option>
                  <option value="NatureCure">NatureCure</option>
                  <option value="E_harb">E_harb</option>
                  <option value="AliShop">AliShop</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            )}

            {showCustomCategory && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Custom Category Name *
                </label>
                <input
                  required
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="Enter custom category name"
                  className="w-full bg-slate-900 border border-border rounded-xl p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                />
              </div>
            )}

            {isAdmin && (
              <div className="space-y-4 p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
                      <Sparkles className="h-3 w-3" />
                      Common Collection
                    </label>
                    <p className="text-[10px] text-slate-500 font-medium">
                      Visible to all users in the system.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, isPublic: !formData.isPublic })
                    }
                    className={cn(
                      "relative inline-flex h-5 w-10 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus:outline-none ring-1 ring-white/10",
                      formData.isPublic ? "bg-indigo-600" : "bg-slate-800",
                    )}
                  >
                    <span
                      className={cn(
                        "inline-block h-3 w-3 transform rounded-full bg-white transition duration-200 ease-in-out",
                        formData.isPublic ? "translate-x-6" : "translate-x-1",
                      )}
                    />
                  </button>
                </div>

                {!formData.isPublic && (
                  <div className="space-y-2 pt-2 border-t border-indigo-500/10 animate-in fade-in duration-300">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                      <UserIcon className="h-3 w-3" />
                      Assign Owner (Optional)
                    </label>
                    <select
                      value={formData.ownerId}
                      onChange={(e) =>
                        setFormData({ ...formData, ownerId: e.target.value })
                      }
                      className="w-full bg-slate-900 border border-border rounded-xl p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all cursor-pointer"
                    >
                      <option value="">Default (Me)</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name || u.email} ({u.role})
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-slate-500 font-medium">
                      Leave empty to own this collection yourself.
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Brief description of this collection..."
                className="w-full bg-slate-900 border border-border rounded-xl p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all min-h-[100px] resize-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Tags (comma separated)
              </label>
              <input
                value={formData.tags}
                onChange={(e) =>
                  setFormData({ ...formData, tags: e.target.value })
                }
                placeholder="e.g. social, ads, high-res"
                className="w-full bg-slate-900 border border-border rounded-xl p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          <div className="p-6 border-t border-white/5 bg-slate-900 shrink-0 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg border border-white/10 bg-white/5 font-bold text-white hover:bg-red-500 transition-all flex items-center justify-center gap-2"
            >
              <X className="h-4 w-4" />
              Discard
            </button>
            <button
              disabled={isSubmitting}
              type="submit"
              className="flex-1 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSubmitting
                ? "Creating..."
                : parentId
                  ? "Create Folder"
                  : "Create Collection"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
