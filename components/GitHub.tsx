"use client";

import { useEffect, useState } from "react";
import { GitMerge, GitBranch, User, CheckCircle2, RefreshCw, Plus } from "lucide-react";

export default function Github() {
  const [gitData, setGitData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/gitdata/sync", { method: "GET" });
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || "Failed to fetch data");

        setGitData(data.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle manual sync
  const handleSync = async () => {
    try {
      setSyncing(true);
      const res = await fetch("/api/gitdata/sync", { method: "POST" });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to sync data");

      setGitData(data.data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSyncing(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center text-gray-400 h-40">
        Loading GitHub data...
      </div>
    );

  if (error)
    return (
      <div className="bg-red-900/30 border border-red-700 rounded-xl p-4 text-red-400 text-sm flex flex-col items-center">
        <span>{error}</span>
        <button
          onClick={handleSync}
          className="mt-2 px-3 py-1 bg-red-700 hover:bg-red-600 rounded-md text-white text-sm transition"
        >
          Retry
        </button>
      </div>
    );

  if (!gitData)
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 text-center text-gray-400">
        No GitHub data found.  
        <button
          onClick={handleSync}
          className="mt-3 flex items-center justify-center gap-1 px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-lg text-white text-sm transition"
        >
          <Plus className="h-4 w-4" />
          <span>Sync Now</span>
        </button>
      </div>
    );

  // Destructure what you need
  const { repos, followers, following, totalContributions, stars } = gitData;

  return (
    <div className="w-full bg-[#0d1117] border border-gray-700 rounded-xl p-4 flex flex-col space-y-3 hover:border-gray-500 transition relative">
      {/* Top Bar */}
      <div className="flex justify-between items-center">
        <h2 className="text-gray-100 font-semibold text-lg">GitHub Overview</h2>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center gap-1 px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-300 transition"
        >
          {syncing ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Syncing...</span>
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              <span>Sync</span>
            </>
          )}
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-3">
          <div className="text-gray-400 text-sm">Repos</div>
          <div className="text-gray-100 font-bold text-xl">{repos ?? 0}</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-3">
          <div className="text-gray-400 text-sm">Followers</div>
          <div className="text-gray-100 font-bold text-xl">{followers ?? 0}</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-3">
          <div className="text-gray-400 text-sm">Following</div>
          <div className="text-gray-100 font-bold text-xl">{following ?? 0}</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-3">
          <div className="text-gray-400 text-sm">Stars</div>
          <div className="text-gray-100 font-bold text-xl">{stars ?? 0}</div>
        </div>
      </div>

      {/* Contribution Info */}
      <div className="flex items-center justify-between text-sm text-gray-400 border-t border-gray-800 pt-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="text-green-500 h-4 w-4" />
          <span>Total Contributions: {totalContributions ?? 0}</span>
        </div>
        <div className="flex items-center gap-1 text-purple-400">
          <GitMerge className="h-4 w-4" />
          <span>Last synced just now</span>
        </div>
      </div>
    </div>
  );
}
