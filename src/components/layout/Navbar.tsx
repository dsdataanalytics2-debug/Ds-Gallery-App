"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Plus, FolderOpen } from "lucide-react";
import CreateFolderModal from "@/components/folders/CreateFolderModal";

export default function Navbar() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-2 group">
                <div className="p-2 rounded-lg bg-blue-500 text-white group-hover:bg-blue-600 transition-colors">
                  <FolderOpen className="h-5 w-5" />
                </div>
                <span className="font-bold text-xl text-slate-900">
                  DS Gallery
                </span>
              </Link>
              <div className="hidden md:flex gap-6">
                <Link
                  href="/"
                  className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors"
                >
                  Folders
                </Link>
                <Link
                  href="/media"
                  className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors"
                >
                  Media
                </Link>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative hidden lg:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="search"
                  placeholder="Search assets..."
                  className="w-64 pl-10 pr-4 py-2 bg-slate-100 border-none rounded-lg text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold text-sm shadow-lg shadow-blue-500/30 hover:bg-blue-600 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">New Folder</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <CreateFolderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
