"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle, Trash2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "info";
  isLoading?: boolean;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  isLoading = false,
}: ConfirmModalProps) {
  const icons = {
    danger: <Trash2 className="h-6 w-6 text-rose-500" />,
    warning: <AlertTriangle className="h-6 w-6 text-amber-500" />,
    info: <AlertCircle className="h-6 w-6 text-indigo-500" />,
  };

  const colors = {
    danger: "bg-rose-500/10 border-rose-500/20",
    warning: "bg-amber-500/10 border-amber-500/20",
    info: "bg-indigo-500/10 border-indigo-500/20",
  };

  const buttonColors = {
    danger: "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20",
    warning: "bg-amber-600 hover:bg-amber-700 shadow-amber-600/20",
    info: "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20",
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
            <div className="p-8">
              <div className="flex items-start gap-5">
                <div
                  className={cn(
                    "p-3 rounded-2xl shrink-0 border",
                    colors[variant],
                  )}
                >
                  {icons[variant]}
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-white tracking-tight">
                    {title}
                  </h2>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    {message}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-10">
                <button
                  onClick={onClose}
                  disabled={isLoading}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/5 transition-all disabled:opacity-50"
                >
                  {cancelLabel}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onConfirm();
                  }}
                  disabled={isLoading}
                  className={cn(
                    "px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest text-white transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center gap-2",
                    buttonColors[variant],
                  )}
                >
                  {isLoading && (
                    <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  )}
                  {confirmLabel}
                </button>
              </div>
            </div>

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
