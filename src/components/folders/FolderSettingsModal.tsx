"use client";

import { useState, useEffect } from "react";
import {
  X,
  Settings,
  UserPlus,
  Shield,
  Trash2,
  Users,
  ArrowRightLeft,
  Mail,
  Loader2,
  Check,
  AlertCircle,
} from "lucide-react";
import { Folder } from "@/types";

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

interface FolderPermission {
  id: string;
  userId: string;
  user: User;
}

interface FolderSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  folder: Folder;
  onUpdate?: () => void;
}

export default function FolderSettingsModal({
  isOpen,
  onClose,
  folder,
  onUpdate,
}: FolderSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<"sharing" | "transfer">("sharing");
  const [users, setUsers] = useState<User[]>([]);
  const [permissions, setPermissions] = useState<FolderPermission[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isOwner, setIsOwner] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const user = JSON.parse(storedUser);
        setCurrentUserId(user.id);
        setIsAdmin(user.role === "admin");
        setIsOwner(folder.ownerId === user.id);
      }
      fetchUsers();
      fetchPermissions();
    }
  }, [isOpen, folder.id]);

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
      console.error("Failed to fetch users", err);
    }
  };

  const fetchPermissions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/folders/${folder.id}/permissions`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "x-user-data": localStorage.getItem("user") || "",
        },
      });
      if (res.ok) {
        const data = await res.json();
        setPermissions(data);
      }
    } catch (err) {
      console.error("Failed to fetch permissions", err);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async (userId: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/folders/${folder.id}/permissions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-user-data": localStorage.getItem("user") || "",
        },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        fetchPermissions();
      }
    } catch (err) {
      console.error("Failed to share", err);
    }
  };

  const handleRevoke = async (userId: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `/api/folders/${folder.id}/permissions?userId=${userId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "x-user-data": localStorage.getItem("user") || "",
          },
        },
      );
      if (res.ok) {
        fetchPermissions();
      }
    } catch (err) {
      console.error("Failed to revoke access", err);
    }
  };

  const handleTransfer = async (newOwnerId: string) => {
    if (
      !confirm(
        "Are you sure you want to transfer ownership of this collection? You may lose control over it.",
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/folders/${folder.id}/transfer`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-user-data": localStorage.getItem("user") || "",
        },
        body: JSON.stringify({ newOwnerId }),
      });
      if (res.ok) {
        alert("Ownership transferred successfully.");
        onClose();
        if (onUpdate) onUpdate();
      } else {
        const data = await res.json();
        alert(`Transfer failed: ${data.error}`);
      }
    } catch (err) {
      console.error("Failed to transfer", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const filteredUsers = users.filter(
    (u) =>
      u.id !== currentUserId &&
      (u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.name && u.name.toLowerCase().includes(searchQuery.toLowerCase()))),
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-card border border-border rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-xl">
              <Settings className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                Collection Settings
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {folder.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border bg-slate-900/30">
          <button
            onClick={() => setActiveTab("sharing")}
            className={`flex-1 px-6 py-4 text-xs font-bold uppercase tracking-widest transition-all ${
              activeTab === "sharing"
                ? "text-indigo-400 border-b-2 border-indigo-400"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Users className="h-4 w-4" />
              Sharing
            </div>
          </button>
          {(isOwner || isAdmin) && (
            <button
              onClick={() => setActiveTab("transfer")}
              className={`flex-1 px-6 py-4 text-xs font-bold uppercase tracking-widest transition-all ${
                activeTab === "transfer"
                  ? "text-indigo-400 border-b-2 border-indigo-400"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <ArrowRightLeft className="h-4 w-4" />
                Transfer
              </div>
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          {activeTab === "sharing" && (
            <div className="space-y-6">
              {/* Currently Shared With */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <Shield className="h-3.5 w-3.5" />
                  Currently Shared With
                </h3>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-indigo-500/30" />
                  </div>
                ) : permissions.length === 0 ? (
                  <div className="bg-slate-900/50 border border-dashed border-border rounded-xl p-6 text-center">
                    <p className="text-sm text-slate-500 italic">
                      This collection is private to you.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {permissions.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-xl group transition-all hover:border-indigo-500/30"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center text-indigo-400 font-bold text-xs">
                            {(p.user.name || p.user.email)
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white">
                              {p.user.name || "Unnamed User"}
                            </p>
                            <p className="text-[10px] text-slate-500 flex items-center gap-1">
                              <Mail className="h-2.5 w-2.5" />
                              {p.user.email}
                            </p>
                          </div>
                        </div>
                        {(isOwner || isAdmin) && (
                          <button
                            onClick={() => handleRevoke(p.user.id)}
                            className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add New User */}
              {(isOwner || isAdmin) && (
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <UserPlus className="h-3.5 w-3.5" />
                    Share with Someone New
                  </h3>
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Search users by name or email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-900 border border-border rounded-xl p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                    />

                    {searchQuery && (
                      <div className="border border-border rounded-xl overflow-hidden divide-y divide-border">
                        {filteredUsers.length === 0 ? (
                          <div className="p-4 text-center text-xs text-slate-500">
                            No users found
                          </div>
                        ) : (
                          filteredUsers.map((user) => {
                            const isShared = permissions.some(
                              (p) => p.userId === user.id,
                            );
                            return (
                              <div
                                key={user.id}
                                className="flex items-center justify-between p-3 bg-slate-900/50 hover:bg-slate-900 transition-colors"
                              >
                                <div className="flex items-center gap-3 text-left">
                                  <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 font-bold text-xs">
                                    {(user.name || user.email)
                                      .charAt(0)
                                      .toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="text-xs font-bold text-white">
                                      {user.name || "Unnamed User"}
                                    </p>
                                    <p className="text-[10px] text-slate-500 font-medium">
                                      {user.email}
                                    </p>
                                  </div>
                                </div>
                                <button
                                  disabled={isShared}
                                  onClick={() => handleShare(user.id)}
                                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                                    isShared
                                      ? "bg-emerald-500/10 text-emerald-500 cursor-default"
                                      : "bg-indigo-600 text-white hover:bg-indigo-700"
                                  }`}
                                >
                                  {isShared ? (
                                    <span className="flex items-center gap-1">
                                      <Check className="h-3 w-3" /> Shared
                                    </span>
                                  ) : (
                                    "Add"
                                  )}
                                </button>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "transfer" && (
            <div className="space-y-6">
              <div className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-6 flex gap-4">
                <AlertCircle className="h-6 w-6 text-rose-400 shrink-0" />
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-rose-400">
                    Ownership Transfer
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Giving ownership to another user means they will have total
                    control over this collection and its assets. You will no
                    longer be the primary owner but will remain on the shared
                    list.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Select a new owner..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-border rounded-xl p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 transition-all"
                />

                {searchQuery && (
                  <div className="border border-border rounded-xl overflow-hidden divide-y divide-border">
                    {filteredUsers.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-500">
                        No matching users
                      </div>
                    ) : (
                      filteredUsers.map((user) => (
                        <button
                          key={user.id}
                          onClick={() => handleTransfer(user.id)}
                          className="w-full flex items-center justify-between p-3 bg-slate-900/50 hover:bg-rose-500/5 transition-colors group"
                        >
                          <div className="flex items-center gap-3 text-left">
                            <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 font-bold text-xs group-hover:text-rose-400">
                              {(user.name || user.email)
                                .charAt(0)
                                .toUpperCase()}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-white group-hover:text-rose-400 transition-colors uppercase tracking-tight">
                                {user.name || "Unnamed User"}
                              </p>
                              <p className="text-[10px] text-slate-500 font-medium">
                                {user.email}
                              </p>
                            </div>
                          </div>
                          <div className="px-3 py-1.5 bg-white/5 rounded-lg text-slate-400 opacity-0 group-hover:opacity-100 transition-all">
                            <ArrowRightLeft className="h-3 w-3" />
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-900/50 border-t border-border flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold border border-white/5 transition-all text-xs uppercase tracking-widest"
          >
            Close Settings
          </button>
        </div>
      </div>
    </div>
  );
}
