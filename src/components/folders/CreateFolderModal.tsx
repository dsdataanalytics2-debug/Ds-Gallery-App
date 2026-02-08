"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface CreateFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateFolderModal({
  isOpen,
  onClose,
}: CreateFolderModalProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    productCategory: "",
    tags: "",
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          tags: formData.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean),
        }),
      });

      if (res.ok) {
        onClose();
        setFormData({
          name: "",
          description: "",
          productCategory: "",
          tags: "",
        });
        router.refresh();
      }
    } catch (error) {
      console.error("Error creating folder:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-background border rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold">Create New Folder</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Folder Name *</label>
            <input
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g. Summer Collection 2026"
              className="w-full bg-muted border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Category</label>
            <select
              value={formData.productCategory}
              onChange={(e) =>
                setFormData({ ...formData, productCategory: e.target.value })
              }
              className="w-full bg-muted border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary/50 cursor-pointer"
            >
              <option value="">Select a category</option>
              <option value="NatureCure">NatureCure</option>
              <option value="E_harb">E_harb</option>
              <option value="AliShop">AliShop</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="What's inside this folder?"
              className="w-full bg-muted border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary/50 min-h-[100px] resize-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Tags (comma separated)
            </label>
            <input
              value={formData.tags}
              onChange={(e) =>
                setFormData({ ...formData, tags: e.target.value })
              }
              placeholder="e.g. marketing, web, high-res"
              className="w-full bg-muted border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary/50"
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
