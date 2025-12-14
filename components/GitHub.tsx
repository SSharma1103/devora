"use client";

import { useEffect, useState } from "react";
import { 
  GitMerge, 
  GitBranch, 
  User, 
  CheckCircle2, 
  RefreshCw, 
  Plus, 
  Star, 
  Github as GithubIcon,
  AlertCircle
} from "lucide-react";
import {Gitdata,ApiResponse} from "@/types"

interface GithubProps {
  gitData?: Gitdata; // Optional prop for public view
}

export default function Github({ gitData: gitDataProp }: GithubProps) {
  const [gitData, setGitData] = useState<Gitdata|null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (gitDataProp) {
      setGitData(gitDataProp);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const res = await fetch("/api/gitdata/sync", { method: "GET" });
        const data = (await res.json()) as ApiResponse<Gitdata>;

        if (!res.ok) throw new Error(data.error || "Failed to fetch data");

        if (data.data) setGitData(data.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [gitDataProp]);

  const handleSync = async () => {
    try {
      setSyncing(true);
      const res = await fetch("/api/gitdata/sync", { method: "POST" });
      const data = (await res.json()) as ApiResponse<Gitdata>;

      if (!res.ok) throw new Error(data.error || "Failed to sync data");

      if (data.data) setGitData(data.data)
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSyncing(false);
    }
  };

  // --- Theme Constants ---
  const offWhite = "#E9E6D7";
  const labelClass = "text-[10px] font-bold text-[#E9E6D7]/50 uppercase tracking-widest";
  const cardClass = "bg-[#050505] border border-[#E9E6D7]/10 p-4 flex flex-col items-center justify-center gap-1 transition-all hover:border-[#E9E6D7]/30 group";
  const valueClass = "text-xl font-bold text-[#E9E6D7] font-mono group-hover:scale-105 transition-transform";

  // --- Loading State ---
  if (loading)
    return (
      <div className="w-full h-48 bg-[#0a0a0a] border border-[#E9E6D7]/20 flex flex-col items-center justify-center gap-3">
        <RefreshCw className="animate-spin text-[#E9E6D7]/40" size={24} />
        <span className="text-xs text-[#E9E6D7]/60 tracking-wider uppercase animate-pulse">
          Fetching Git Data...
        </span>
      </div>
    );

  // --- Error State ---
  if (error)
    return (
      <div className="w-full bg-[#0a0a0a] border border-red-900/30 p-6 flex flex-col items-center justify-center gap-3 text-center">
        <div className="p-2 bg-red-900/10 rounded-full text-red-400">
          <AlertCircle size={20} />
        </div>

        <span className="text-[#E9E6D7] text-sm">{error}</span>

        {/* If it's YOUR profile (no gitDataProp), show Login with GitHub */}
        {!gitDataProp && (
          <div
            
            className="mt-2 flex items-center gap-2 px-4 py-2 bg-[#E9E6D7] text-black text-xs font-bold uppercase tracking-wider transition-all "
          >
            <GithubIcon size={16} />
            <span>Login with GitHub</span>
          </div>
        )}

        {/* If viewing someone else’s public card and their fetch failed */}
        {gitDataProp && (
          <p className="text-xs text-[#E9E6D7]/50">
            GitHub data is currently unavailable.
          </p>
        )}
      </div>
    );

  // --- Empty State ---
  if (!gitData)
    return (
      <div className="w-full bg-[#0a0a0a] border border-[#E9E6D7]/20 p-8 flex flex-col items-center justify-center gap-4 text-center group hover:border-[#E9E6D7]/40 transition-colors">
        <div className="text-[#E9E6D7]/20 group-hover:text-[#E9E6D7]/40 transition-colors">
          <GithubIcon size={32} />
        </div>

        {!gitDataProp ? (
          <>
            <div className="space-y-1">
              <p className="text-[#E9E6D7] font-medium">No GitHub Data Linked</p>
              <p className="text-xs text-[#E9E6D7]/50">Sync your account to display stats.</p>
            </div>
            <button
              onClick={handleSync}
              className="flex items-center gap-2 px-4 py-2 bg-[#E9E6D7] hover:bg-white text-black text-xs font-bold uppercase tracking-wider transition-all hover:scale-[1.02]"
            >
              <Plus size={14} />
              <span>Sync Now</span>
            </button>
          </>
        ) : (
          <p className="text-[#E9E6D7]/50 text-sm">
            No GitHub data available for this user.
          </p>
        )}
      </div>
    );

  const { repos, followers, following, totalContributions, stars } = gitData;

  // --- Main UI ---
  return (
    <div className="w-full bg-[#0a0a0a] border border-[#E9E6D7]/20 p-5 flex flex-col gap-5 hover:border-[#E9E6D7]/40 transition-all relative">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#E9E6D7]/5 text-[#E9E6D7] rounded-sm">
            <GithubIcon size={18} />
          </div>
          <div>
            <h2 className="text-[#E9E6D7] font-bold text-sm tracking-tight">GITHUB ACTIVITY</h2>
            <p className="text-[10px] text-[#E9E6D7]/40 uppercase tracking-widest mt-0.5">
              Live Metrics
            </p>
          </div>
        </div>

        {/* Sync Button (Only if not viewing someone else's profile) */}
        {!gitDataProp && (
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#E9E6D7] hover:bg-white text-black text-[10px] font-bold uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {syncing ? (
              <>
                <RefreshCw size={12} className="animate-spin" />
                <span>Syncing</span>
              </>
            ) : (
              <>
                <RefreshCw size={12} />
                <span>Sync</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Repos */}
        <div className={cardClass}>
          <div className="text-[#E9E6D7]/30 mb-1">
            <GitBranch size={14} />
          </div>
          <span className={valueClass}>{repos ?? 0}</span>
          <span className={labelClass}>Repos</span>
        </div>

        {/* Stars */}
        <div className={cardClass}>
          <div className="text-[#E9E6D7]/30 mb-1">
            <Star size={14} />
          </div>
          <span className={valueClass}>{stars ?? 0}</span>
          <span className={labelClass}>Stars</span>
        </div>

        {/* Followers */}
        <div className={cardClass}>
          <div className="text-[#E9E6D7]/30 mb-1">
            <User size={14} />
          </div>
          <span className={valueClass}>{followers ?? 0}</span>
          <span className={labelClass}>Followers</span>
        </div>

        {/* Following */}
        <div className={cardClass}>
          <div className="text-[#E9E6D7]/30 mb-1">
            <User size={14} />
          </div>
          <span className={valueClass}>{following ?? 0}</span>
          <span className={labelClass}>Following</span>
        </div>
      </div>

      {/* Contribution Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-[#E9E6D7]/10">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={14} className="text-[#E9E6D7]" />
          <span className="text-xs font-medium text-[#E9E6D7]">
            {totalContributions ?? 0}{" "}
            <span className="text-[#E9E6D7]/50">Contributions</span>
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-[#E9E6D7]/30">
          <GitMerge size={12} />
          <span className="text-[10px] uppercase tracking-widest">Synced Recently</span>
        </div>
      </div>
    </div>
  );
}
