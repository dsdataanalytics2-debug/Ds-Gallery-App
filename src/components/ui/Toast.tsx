"use client";

import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2, AlertCircle, Info, XCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error" | "info" | "warning";

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
}

const toastConfig = {
  success: {
    icon: <CheckCircle2 className="h-5 w-5 text-emerald-400" />,
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    accent: "bg-emerald-500",
    text: "text-emerald-400",
    title: "Success",
  },
  error: {
    icon: <XCircle className="h-5 w-5 text-rose-400" />,
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
    accent: "bg-rose-500",
    text: "text-rose-400",
    title: "Error",
  },
  warning: {
    icon: <AlertCircle className="h-5 w-5 text-amber-400" />,
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    accent: "bg-amber-500",
    text: "text-amber-400",
    title: "Warning",
  },
  info: {
    icon: <Info className="h-5 w-5 text-indigo-400" />,
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/20",
    accent: "bg-indigo-500",
    text: "text-indigo-400",
    title: "Tip",
  },
};

export function Toast({ message, type, onClose }: ToastProps) {
  const config = toastConfig[type];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className={cn(
        "pointer-events-auto flex items-center gap-4 p-4 min-w-[320px] max-w-md",
        "bg-slate-900 border backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden",
        config.border,
      )}
    >
      {/* Accent Bar */}
      <div
        className={cn("absolute left-0 top-0 bottom-0 w-1", config.accent)}
      />

      {/* Icon Area */}
      <div className={cn("p-2 rounded-xl shrink-0", config.bg)}>
        {config.icon}
      </div>

      {/* Content */}
      <div className="flex-1 space-y-0.5">
        <h4
          className={cn(
            "text-[10px] font-black uppercase tracking-widest",
            config.text,
          )}
        >
          {config.title}
        </h4>
        <p className="text-sm font-medium text-slate-200">{message}</p>
      </div>

      {/* Close Button */}
      <button
        onClick={onClose}
        className="p-1 rounded-lg hover:bg-white/5 text-slate-500 hover:text-white transition-all"
      >
        <X className="h-4 w-4" />
      </button>

      {/* Loading Progress Bar Animation */}
      <motion.div
        className={cn("absolute bottom-0 left-0 h-0.5", config.accent)}
        initial={{ width: "100%" }}
        animate={{ width: "0%" }}
        transition={{ duration: 4, ease: "linear" }}
      />
    </motion.div>
  );
}
