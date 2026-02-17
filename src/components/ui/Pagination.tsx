"use client";

import { useState, useRef, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
  onPageChange: (page: number) => void;
  className?: string;
}

export default function Pagination({
  currentPage,
  totalPages,
  pageSize,
  onPageSizeChange,
  onPageChange,
  className,
}: PaginationProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getPages = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, "...", totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(
          1,
          "...",
          totalPages - 4,
          totalPages - 3,
          totalPages - 2,
          totalPages - 1,
          totalPages,
        );
      } else {
        pages.push(
          1,
          "...",
          currentPage - 1,
          currentPage,
          currentPage + 1,
          "...",
          totalPages,
        );
      }
    }
    return pages;
  };

  const PAGE_SIZES = [12, 24, 48, 96];

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-center justify-between gap-6 mt-8 w-full px-2",
        className,
      )}
    >
      <div className="flex items-center gap-3 order-2 sm:order-1">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          Show
        </span>
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl border border-white/10 text-[11px] font-bold text-white hover:bg-white/10 transition-all min-w-[80px] justify-between shadow-sm active:scale-95"
          >
            {pageSize}
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 text-slate-500 transition-transform",
                isDropdownOpen && "rotate-180",
              )}
            />
          </button>

          {isDropdownOpen && (
            <div className="absolute bottom-full left-0 mb-2 w-full bg-slate-900 border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-2 duration-200 backdrop-blur-xl">
              {PAGE_SIZES.map((size) => (
                <button
                  key={size}
                  onClick={() => {
                    onPageSizeChange?.(size);
                    setIsDropdownOpen(false);
                  }}
                  className={cn(
                    "w-full px-4 py-2.5 text-[11px] font-bold text-left transition-colors hover:bg-white/5",
                    pageSize === size ? "text-indigo-400" : "text-slate-400",
                  )}
                >
                  {size}
                </button>
              ))}
            </div>
          )}
        </div>
        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
          Per Page
        </span>
      </div>

      <div className="flex items-center gap-2 order-1 sm:order-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-xl bg-white/5 border border-white/5 text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 transition-all"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-1">
          {getPages().map((page, i) => (
            <div key={i}>
              {page === "..." ? (
                <div className="w-10 h-10 flex items-center justify-center text-slate-600">
                  <MoreHorizontal className="h-4 w-4" />
                </div>
              ) : (
                <button
                  onClick={() => onPageChange(page as number)}
                  className={cn(
                    "w-10 h-10 rounded-xl font-bold text-sm transition-all border",
                    currentPage === page
                      ? "bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/20"
                      : "bg-white/5 text-slate-400 border-white/5 hover:text-white hover:bg-white/10",
                  )}
                >
                  {page}
                </button>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || totalPages === 0}
          className="p-2 rounded-xl bg-white/5 border border-white/5 text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 transition-all"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
