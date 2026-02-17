"use client";

import { useState, useEffect } from "react";

export default function GoogleDriveConnect() {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkConnectionStatus();

    // Check for connection success from URL params
    const params = new URLSearchParams(window.location.search);
    if (params.get("google_drive_connected") === "true") {
      setIsConnected(true);
      // Clean up URL
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const checkConnectionStatus = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/auth/google/status", {
        headers: {
          Authorization: `Bearer ${token}`,
          "x-user-data": localStorage.getItem("user") || "",
        },
      });
      const data = await response.json();
      setIsConnected(data.connected);
    } catch (error) {
      console.error("Error checking connection status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = () => {
    // Redirect to OAuth flow
    window.location.href = "/api/auth/google";
  };

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect Google Drive?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/auth/google/disconnect", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "x-user-data": localStorage.getItem("user") || "",
        },
      });

      if (response.ok) {
        setIsConnected(false);
      } else {
        alert("Failed to disconnect Google Drive");
      }
    } catch (error) {
      console.error("Error disconnecting:", error);
      alert("Failed to disconnect Google Drive");
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 border rounded-lg bg-gray-50">
        <p className="text-sm text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-4 border rounded-lg bg-white shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Google Drive</h3>
          <p className="text-sm text-gray-600 mt-1">
            {isConnected
              ? "Connected to your Google Drive account"
              : "Connect your Google Drive to enable uploads"}
          </p>
        </div>

        <div>
          {isConnected ? (
            <div className="flex gap-2 items-center">
              <span className="flex items-center gap-2 text-sm text-green-600">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Connected
              </span>
              <button
                onClick={handleDisconnect}
                className="px-4 py-2 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={handleConnect}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition flex items-center gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.545 10.239v3.821h5.445c-.712 2.315-2.647 3.972-5.445 3.972a6.033 6.033 0 110-12.064c1.498 0 2.866.549 3.921 1.453l2.814-2.814A9.969 9.969 0 0012.545 2C7.021 2 2.543 6.477 2.543 12s4.478 10 10.002 10c8.396 0 10.249-7.85 9.426-11.748l-9.426-.013z" />
              </svg>
              Connect Google Drive
            </button>
          )}
        </div>
      </div>

      {!isConnected && (
        <div className="mt-4 p-3 bg-yellow-50 border-l-4 border-yellow-400">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-yellow-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                You need to connect Google Drive before you can upload files to
                it.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
