"use client";

import {
  ShieldAlert,
  ShieldCheck,
  User as UserIcon,
  CheckCircle2,
  Lock,
} from "lucide-react";

export default function SystemRolesPage() {
  const roles = [
    {
      id: "admin",
      name: "Administrator",
      icon: ShieldCheck,
      color: "text-indigo-400",
      bg: "bg-indigo-400/10",
      border: "border-indigo-400/20",
      description:
        "Full system access with high-level administrative privileges.",
      capabilities: [
        "Manage all digital assets (Upload, Delete, View)",
        "Create and manage folder collections",
        "Full User Management (Add, Edit, Delete users)",
        "Access to advanced System Analytics",
        "Configure System Settings",
        "View Activity History and Audit Logs",
      ],
    },
    {
      id: "user",
      name: "Standard User",
      icon: UserIcon,
      color: "text-slate-400",
      bg: "bg-slate-400/10",
      border: "border-slate-400/20",
      description:
        "Standard access for viewing and organizing personal assets.",
      capabilities: [
        "View authorized digital assets",
        "Create personal folder collections",
        "Standard asset ingestion (Upload)",
        "View shared analytics overview",
        "Update personal settings",
      ],
    },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3 italic tracking-tight">
          <ShieldAlert className="h-8 w-8 text-indigo-500" />
          SYSTEM ROLES & PERMISSIONS
        </h1>
        <p className="text-slate-400 max-w-2xl">
          Define and manage the fundamental access control tiers within the DS
          Gallery ecosystem. Roles determine visibility and operational
          capabilities for every user.
        </p>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {roles.map((role) => (
          <div
            key={role.id}
            className={`bg-card border ${role.border} rounded-[2rem] p-8 flex flex-col space-y-8 relative overflow-hidden group hover:border-white/20 transition-all duration-300`}
          >
            {/* Background Accent */}
            <div
              className={`absolute -right-10 -top-10 w-40 h-40 ${role.bg} rounded-full blur-3xl group-hover:bg-opacity-20 transition-all`}
            />

            <div className="flex items-center gap-5">
              <div className={`${role.bg} p-4 rounded-2xl`}>
                <role.icon className={`h-8 w-8 ${role.color}`} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">
                  {role.name}
                </h2>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Internal Type: {role.id}
                </span>
              </div>
            </div>

            <p className="text-slate-400 text-sm leading-relaxed">
              {role.description}
            </p>

            <div className="space-y-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                Permitted Operations
              </h3>
              <ul className="grid grid-cols-1 gap-3">
                {role.capabilities.map((cap, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-3 text-sm text-slate-500 group-hover:text-slate-300 transition-colors"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                    {cap}
                  </li>
                ))}
              </ul>
            </div>

            <div
              className={`mt-auto pt-6 border-t ${role.border} flex items-center justify-between`}
            >
              <div className="flex items-center gap-2">
                <Lock className="h-3 w-3 text-slate-600" />
                <span className="text-[10px] font-bold text-slate-600 uppercase">
                  Immutable Policy
                </span>
              </div>
              <div
                className={`px-3 py-1 rounded-full ${role.bg} ${role.color} text-[10px] font-bold uppercase`}
              >
                Active
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Info Section */}
      <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-2xl p-6 flex items-start gap-4">
        <div className="p-2 rounded-lg bg-indigo-500/10 shrink-0">
          <ShieldAlert className="h-5 w-5 text-indigo-400" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-white mb-1 uppercase tracking-tight">
            Access Control Note
          </h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            System roles are currently hardcoded for stability. Future updates
            will introduce custom role definitions and granular attribute-based
            access control (ABAC). For now, role assignments can be managed in
            the
            <a
              href="/admin/users"
              className="text-indigo-400 hover:text-indigo-300 ml-1 font-bold underline decoration-indigo-400/30"
            >
              User Management
            </a>{" "}
            section.
          </p>
        </div>
      </div>
    </div>
  );
}
