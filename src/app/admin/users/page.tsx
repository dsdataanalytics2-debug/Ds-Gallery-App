"use client";

import { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  Shield,
  User as UserIcon,
  Trash2,
  Mail,
  MoreVertical,
  Search,
  X,
  AlertCircle,
} from "lucide-react";

import AddUserModal from "@/components/admin/AddUserModal";

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: string;
  _count?: {
    ownedFolders: number;
    permissions: number;
  };
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user") || "{}");

      const response = await fetch("/api/users", {
        headers: {
          Authorization: `Bearer ${token}`,
          "x-user-role": user.role,
          "x-user-data": localStorage.getItem("user") || "",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch users");
      const data = await response.json();
      setUsers(data);
    } catch {
      setError(
        "Could not load users. Please ensure you have admin permissions.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUserAdded = (newUser: User) => {
    setUsers((prev) => [newUser, ...prev]);
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      const token = localStorage.getItem("token");
      const adminUser = JSON.parse(localStorage.getItem("user") || "{}");

      const response = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-user-role": adminUser.role,
          "x-user-data": localStorage.getItem("user") || "",
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (response.ok) {
        setUsers(
          users.map((u) => (u.id === userId ? { ...u, role: newRole } : u)),
        );
        setEditingUserId(null);
      }
    } catch {
      console.error("Failed to update role");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this user? This action cannot be undone.",
      )
    )
      return;

    try {
      const token = localStorage.getItem("token");
      const adminUser = JSON.parse(localStorage.getItem("user") || "{}");

      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "x-user-role": adminUser.role,
          "x-user-data": localStorage.getItem("user") || "",
        },
      });

      if (response.ok) {
        setUsers(users.filter((u) => u.id !== userId));
      }
    } catch {
      console.error("Failed to delete user");
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.name &&
        user.name.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Modals */}
      <AddUserModal
        isOpen={isAddingUser}
        onClose={() => setIsAddingUser(false)}
        onUserAdded={handleUserAdded}
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3 italic tracking-tight">
            <Users className="h-8 w-8 text-indigo-500" />
            USER MANAGEMENT
          </h1>
          <p className="text-slate-400 mt-1">
            Manage access control and user permissions
          </p>
        </div>

        <button
          onClick={() => setIsAddingUser(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/20 active:scale-95 whitespace-nowrap"
        >
          <UserPlus className="h-5 w-5" />
          Add New User
        </button>
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            label: "Total Users",
            value: users.length,
            icon: Users,
            color: "text-blue-400",
            bg: "bg-blue-400/10",
          },
          {
            label: "Administrators",
            value: users.filter((u) => u.role === "admin").length,
            icon: Shield,
            color: "text-indigo-400",
            bg: "bg-indigo-400/10",
          },
          {
            label: "Standard Users",
            value: users.filter((u) => u.role === "user").length,
            icon: UserIcon,
            color: "text-slate-400",
            bg: "bg-slate-400/10",
          },
        ].map((stat, i) => (
          <div
            key={i}
            className="bg-card border border-border p-6 rounded-2xl flex items-center gap-5"
          >
            <div className={`${stat.bg} p-4 rounded-xl`}>
              <stat.icon className={`h-6 w-6 ${stat.color}`} />
            </div>
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">
                {stat.label}
              </p>
              <p className="text-3xl font-bold text-white mt-0.5">
                {stat.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters & Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xl">
        <div className="p-6 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/50 border border-border rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase">
              Sort:
            </span>
            <select className="bg-slate-900/50 border border-border rounded-lg px-3 py-1.5 text-xs font-medium text-slate-300 focus:outline-none">
              <option>Newest First</option>
              <option>Role (Admin first)</option>
              <option>Name (A-Z)</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-900/50">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                  User
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Role
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Collections
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Shared
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-left">
                  Joined Date
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center">
                    <div className="inline-block h-8 w-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                    <p className="mt-4 text-slate-500 font-medium">
                      Loading user database...
                    </p>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center">
                    <AlertCircle className="h-10 w-10 text-slate-600 mx-auto" />
                    <p className="mt-4 text-slate-500 font-medium">
                      No users found matching your search.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-indigo-500/5 transition-colors group"
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
                          {user.name
                            ? user.name.charAt(0).toUpperCase()
                            : user.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white leading-none">
                            {user.name || "Unnamed User"}
                          </p>
                          <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1.5">
                            <Mail className="h-3 w-3" />
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      {editingUserId === user.id ? (
                        <div className="flex items-center gap-2">
                          <select
                            value={user.role}
                            onChange={(e) =>
                              handleUpdateRole(user.id, e.target.value)
                            }
                            className="bg-slate-900 border border-indigo-500 rounded px-2 py-1 text-xs text-white"
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                          <button
                            onClick={() => setEditingUserId(null)}
                            className="text-rose-400 hover:text-rose-300"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              user.role === "admin"
                                ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                                : "bg-slate-500/10 text-slate-500 border border-slate-500/20"
                            }`}
                          >
                            {user.role}
                          </span>
                          <button
                            onClick={() => setEditingUserId(user.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-indigo-400 transition-all font-bold text-[10px]"
                          >
                            EDIT
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-5 text-sm text-slate-400 font-medium whitespace-nowrap">
                      {user._count?.ownedFolders || 0}
                    </td>
                    <td className="px-6 py-5 text-sm text-slate-400 font-medium whitespace-nowrap">
                      {user._count?.permissions || 0}
                    </td>
                    <td className="px-6 py-5 text-sm text-slate-400 font-medium whitespace-nowrap">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-2 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </button>
                        <button className="p-2 text-slate-500 hover:text-white hover:bg-slate-700 rounded-lg transition-all">
                          <MoreVertical className="h-4.5 w-4.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
