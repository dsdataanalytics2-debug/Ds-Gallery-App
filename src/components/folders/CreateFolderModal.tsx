"use client";

import { useState, useEffect } from "react";
import { X, Loader2, User as UserIcon } from "lucide-react";
import { useRouter } from "next/navigation";

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
  });
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
        body: JSON.stringify(payload),
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
        });
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-bold text-white">Create Collection</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
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

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Category
            </label>
            <select
              value={formData.productCategory}
              onChange={(e) =>
                setFormData({ ...formData, productCategory: e.target.value })
              }
              className="w-full bg-slate-900 border border-border rounded-xl p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all cursor-pointer"
            >
              <option value="">Select a category</option>
              <option value="NatureCure">NatureCure</option>
              <option value="E_harb">E_harb</option>
              <option value="AliShop">AliShop</option>
            </select>
          </div>

          {isAdmin && (
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <UserIcon className="h-3 w-3" />
                Assign Owner (Admin Only)
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
                Leave as default to own this collection yourself.
              </p>
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

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border font-medium hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              disabled={isSubmitting}
              className="flex-1 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Folder
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
