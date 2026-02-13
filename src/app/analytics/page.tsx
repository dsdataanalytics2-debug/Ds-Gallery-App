"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BarChart3,
  TrendingUp,
  PieChart,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  HardDrive,
  Image as ImageIcon,
  Film,
  Zap,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch("/api/analytics");
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (error) {
        console.error("Analytics fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
          Compiling Intelligence...
        </p>
      </div>
    );
  }

  const summary = data?.summary || {
    totalMedia: 0,
    imageCount: 0,
    videoCount: 0,
    totalSizeBytes: 0,
    growthRate: "0",
  };

  const statsList = [
    {
      label: "Library Growth",
      value: `${summary.growthRate}%`,
      trend: parseFloat(summary.growthRate) >= 0 ? "up" : "down",
      desc: "This month v.s. previous",
      icon: TrendingUp,
    },
    {
      label: "Storage Used",
      value: formatSize(summary.totalSizeBytes),
      trend: "neutral",
      desc: "Total bytes in system",
      icon: HardDrive,
    },
    {
      label: "Asset Volume",
      value: summary.totalMedia.toLocaleString(),
      trend: "up",
      desc: "Total managed objects",
      icon: Layers,
    },
    {
      label: "Images/Videos",
      value: `${summary.imageCount} / ${summary.videoCount}`,
      trend: "neutral",
      desc: "Composition split",
      icon: Activity,
    },
  ];

  return (
    <div className="h-full flex flex-col gap-10">
      {/* Header Section */}
      <div className="flex flex-col gap-4 pt-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-indigo-400">
          <BarChart3 className="h-3 w-3" />
          <span>System Intelligence</span>
        </div>

        <div className="space-y-2">
          <h1 className="text-5xl font-bold tracking-tight text-white">
            Advanced Analytics
          </h1>
          <p className="text-slate-400 text-base max-w-2xl leading-relaxed">
            Real-time data visualization of your asset ecosystem. Monitor
            performance, storage, and ingestion trends.
          </p>
        </div>
      </div>

      {/* High-Level Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsList.map((stat, i) => (
          <div
            key={i}
            className="bg-card border border-border p-6 rounded-3xl group hover:border-white/20 transition-all duration-300 relative overflow-hidden"
          >
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/[0.02] rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-colors" />

            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-xl bg-white/5 text-slate-400 transition-colors group-hover:bg-indigo-500/10 group-hover:text-indigo-400">
                <stat.icon className="h-5 w-5" />
              </div>
              <div
                className={cn(
                  "flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full",
                  stat.trend === "up"
                    ? "bg-emerald-500/10 text-emerald-400"
                    : stat.trend === "down"
                      ? "bg-red-500/10 text-red-400"
                      : "bg-slate-500/10 text-slate-400",
                )}
              >
                {stat.trend === "up" ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : stat.trend === "down" ? (
                  <ArrowDownRight className="h-3 w-3" />
                ) : null}
                {stat.trend.toUpperCase()}
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-2xl font-bold text-white tracking-tight">
                {stat.value}
              </p>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                {stat.label}
              </p>
            </div>
            <p className="text-[10px] text-slate-600 font-bold mt-4">
              {stat.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
        {/* Storage Distribution */}
        <div className="lg:col-span-1 bg-card border border-border rounded-[2.5rem] p-8 space-y-8 flex flex-col">
          <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-3">
            Asset Composition
            <PieChart className="h-4 w-4 text-indigo-400" />
          </h3>

          <div className="flex-1 flex flex-col justify-center items-center py-10 relative">
            <div className="w-48 h-48 rounded-full border-[12px] border-slate-900 flex items-center justify-center relative">
              <div
                className="absolute inset-0 border-[12px] border-indigo-500 border-r-transparent border-b-transparent rounded-full rotate-45"
                style={{
                  clipPath: `polygon(0 0, 100% 0, 100% ${summary.totalMedia > 0 ? (summary.imageCount / summary.totalMedia) * 100 : 0}%, 0 ${summary.totalMedia > 0 ? (summary.imageCount / summary.totalMedia) * 100 : 0}%)`,
                }}
              />
              <div className="text-center">
                <p className="text-3xl font-black text-white">
                  {summary.totalMedia}
                </p>
                <p className="text-[10px] font-bold text-slate-500 uppercase">
                  Assets
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/5 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded bg-indigo-500" />
                <span className="text-xs font-bold text-white uppercase">
                  Still Images
                </span>
              </div>
              <span className="text-xs font-bold text-slate-500">
                {summary.totalMedia > 0
                  ? Math.round((summary.imageCount / summary.totalMedia) * 100)
                  : 0}
                %
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/5 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded bg-emerald-400" />
                <span className="text-xs font-bold text-white uppercase">
                  Motion Assets
                </span>
              </div>
              <span className="text-xs font-bold text-slate-500">
                {summary.totalMedia > 0
                  ? Math.round((summary.videoCount / summary.totalMedia) * 100)
                  : 0}
                %
              </span>
            </div>
          </div>
        </div>

        {/* Activity Log */}
        <div className="lg:col-span-2 bg-card border border-border rounded-[2.5rem] p-8 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-3">
              Recent Ingestion Stream
              <Activity className="h-4 w-4 text-emerald-400" />
            </h3>
            <Link
              href="/media"
              className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest hover:text-white transition-colors"
            >
              View All Events
            </Link>
          </div>

          <div className="space-y-4 flex-1">
            {data?.recentActivity?.map((item: any, i: number) => (
              <div
                key={item.id}
                className="flex items-center gap-6 p-4 rounded-2xl hover:bg-white/[0.02] transition-all border border-transparent hover:border-white/5 group"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center shrink-0 border border-white/5 group-hover:border-indigo-500/30 transition-all">
                  {item.fileType === "image" ? (
                    <ImageIcon className="h-4 w-4 text-indigo-400" />
                  ) : (
                    <Film className="h-4 w-4 text-emerald-400" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-white">
                    {item.fileName}
                  </p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    In {item.folder.name} •{" "}
                    {new Date(item.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-indigo-400">
                    {formatSize(item.fileSize)}
                  </p>
                </div>
              </div>
            ))}
            {!data?.recentActivity?.length && (
              <div className="flex flex-col items-center justify-center h-full text-slate-600">
                <p className="text-xs font-bold uppercase tracking-widest">
                  No activity recorded
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
