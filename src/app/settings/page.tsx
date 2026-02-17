"use client";

import { useState } from "react";
import {
  Settings,
  User,
  Shield,
  Database,
  Smartphone,
  CheckCircle2,
  Loader2,
  Save,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSettings } from "@/components/providers/SettingsProvider";
import GoogleDriveConnect from "@/components/settings/GoogleDriveConnect";

const sections = [
  {
    id: "profile",
    icon: User,
    label: "Account Profile",
    sub: "Personal identity and authentication",
  },
  {
    id: "security",
    icon: Shield,
    label: "Security",
    sub: "Encryption and access control",
  },
  {
    id: "storage",
    icon: Database,
    label: "Storage Engine",
    sub: "S3 and Cloudinary configuration",
  },
  {
    id: "app",
    icon: Smartphone,
    label: "Interface",
    sub: "Appearance and system preferences",
  },
];

export default function SettingsPage() {
  const {
    darkTheme,
    setDarkTheme,
    liquidTransitions,
    setLiquidTransitions,
    realTimeSync,
    setRealTimeSync,
  } = useSettings();

  const [activeSection, setActiveSection] = useState("storage");
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }, 1000);
  };

  const interfaceToggles = [
    {
      id: "theme",
      label: "Dark Intelligence Theme",
      desc: "Optimized for high-contrast professional editing environments",
      active: darkTheme,
      toggle: () => setDarkTheme(!darkTheme),
    },
    {
      id: "transitions",
      label: "Liquid Transitions",
      desc: "Enable motion-blur transitions between system states",
      active: liquidTransitions,
      toggle: () => setLiquidTransitions(!liquidTransitions),
    },
    {
      id: "sync",
      label: "Real-time Delta Sync",
      desc: "Sync changes across all instances via WebSocket stream",
      active: realTimeSync,
      toggle: () => setRealTimeSync(!realTimeSync),
    },
  ];

  return (
    <div className="h-full flex flex-col gap-10">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-8 right-8 z-50 animate-in slide-in-from-right duration-300">
          <div className="bg-emerald-500 text-white px-6 py-3 rounded-2xl shadow-xl shadow-emerald-500/20 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5" />
            <span className="text-sm font-bold">
              Settings updated successfully!
            </span>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col gap-4 pt-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-indigo-400">
          <Settings className="h-3 w-3" />
          <span>System Architecture</span>
        </div>

        <div className="space-y-2">
          <h1 className="text-5xl font-bold tracking-tight text-white dark:text-white lg:text-white">
            Global Settings
          </h1>
          <p className="text-slate-400 text-base max-w-2xl leading-relaxed">
            Configure your development environment, storage gateways, and
            security protocols.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 pb-20">
        {/* Navigation */}
        <nav className="lg:col-span-3 space-y-2">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={cn(
                "w-full flex flex-col items-start gap-1 p-4 rounded-2xl transition-all border text-left group",
                activeSection === section.id
                  ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400 shadow-lg shadow-indigo-500/5"
                  : "bg-transparent border-transparent text-slate-400 hover:bg-white/5 hover:text-white",
              )}
            >
              <div className="flex items-center gap-3">
                <section.icon
                  className={cn(
                    "h-4 w-4",
                    activeSection === section.id
                      ? "text-indigo-400"
                      : "text-slate-500 group-hover:text-white",
                  )}
                />
                <span className="text-sm font-bold uppercase tracking-wider">
                  {section.label}
                </span>
              </div>
              <span className="text-[10px] font-medium leading-relaxed opacity-60 px-7">
                {section.sub}
              </span>
            </button>
          ))}
        </nav>

        {/* Content Area */}
        <div className="lg:col-span-9 space-y-8">
          {activeSection === "storage" ? (
            <div className="bg-card border border-border rounded-[2.5rem] overflow-hidden animate-in fade-in zoom-in-95 duration-500">
              <div className="p-8 space-y-8">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-white tracking-tight">
                      Cloud Integration
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Manage your media storage providers and distribution
                      network.
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20 flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    GATEWAY ACTIVE
                  </span>
                </div>

                {/* Google Drive OAuth Connection */}
                <GoogleDriveConnect />

                <div className="grid gap-4">
                  {[
                    {
                      label: "Cloudinary API Key",
                      value: "********************",
                      status: "Connected",
                    },
                    {
                      label: "Cloudinary Cloud Name",
                      value: "ds-gallery-main",
                      status: "Connected",
                    },
                    {
                      label: "S3 Bucket Region",
                      value: "ap-south-1",
                      status: "Connected",
                    },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-5 bg-white/[0.02] border border-white/5 rounded-2xl group hover:border-white/10 transition-all"
                    >
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                          {item.label}
                        </p>
                        <p className="text-sm font-mono text-white/80">
                          {item.value}
                        </p>
                      </div>
                      <button className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest hover:text-white transition-colors">
                        Edit
                      </button>
                    </div>
                  ))}
                </div>

                <div className="pt-6 border-t border-white/5 flex items-center gap-4">
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                  >
                    {isSaving ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Save className="h-3 w-3" />
                    )}
                    Save Changes
                  </button>
                  <button className="flex items-center gap-2 px-6 py-2.5 bg-white/5 hover:bg-white/10 text-slate-400 rounded-xl text-xs font-bold transition-all">
                    <RotateCcw className="h-3 w-3" />
                    Discard
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-[2.5rem] p-12 flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in zoom-in-95 duration-500">
              <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center">
                <Settings className="h-8 w-8 text-slate-500" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white tracking-tight">
                  Module Under Development
                </h3>
                <p className="text-sm text-slate-500 max-w-xs">
                  The {activeSection} configuration engine is currently being
                  optimized for high-performance scale.
                </p>
              </div>
            </div>
          )}

          {/* Interface Settings */}
          <div className="bg-card border border-border rounded-[2.5rem] p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white tracking-tight leading-none mb-1">
                Interface Protocols
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Customize the visual architecture of your workspace.
              </p>
            </div>

            <div className="space-y-4">
              {interfaceToggles.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-white uppercase tracking-tight">
                      {item.label}
                    </p>
                    <p className="text-xs text-slate-500 leading-relaxed max-w-sm">
                      {item.desc}
                    </p>
                  </div>
                  <button
                    onClick={item.toggle}
                    className={cn(
                      "w-12 h-6 rounded-full transition-all relative border border-white/5",
                      item.active ? "bg-indigo-600" : "bg-slate-800",
                    )}
                  >
                    <div
                      className={cn(
                        "w-4 h-4 rounded-full bg-white absolute top-1 transition-all shadow-md",
                        item.active ? "right-1" : "left-1",
                      )}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
