"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { Github, Loader2, GitPullRequest, Plus } from "lucide-react";
import OpenSource from "./OpenSource";
import { ApiResponse, Gitdata } from "@/types";
import { useResurceManager } from "@/hooks/useResourceManager";

export default function OpenSourceSection() {
  const { 
    items: gitDataRaw, 
    loading, 
    fetchItems 
  } = useResurceManager<any>("/api/gitdata/sync");

  const [syncing, setSyncing] = useState(false);

  const gitData = Array.isArray(gitDataRaw) ? null : (gitDataRaw as Gitdata);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/gitdata/sync", { method: "POST" });
      const data = (await res.json()) as ApiResponse<Gitdata>;
      
      if (res.ok && data.success) {
        await fetchItems();
      }
    } catch (err) {
      console.error(err);
    }
    setSyncing(false);
  };

  if (loading) {
    return (
      <div className="w-full h-48 bg-[#0a0a0a] border border-[#E9E6D7]/20 flex flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-[#E9E6D7]/40" size={24} />
        <span className="text-xs text-[#E9E6D7]/60 tracking-wider uppercase">Loading Open Source Data...</span>
      </div>
    );
  }

  if (!gitData) {
    return (
      <div className="w-full bg-[#0a0a0a] border border-[#E9E6D7]/20 p-10 flex flex-col items-center justify-center gap-5 text-center">
        <div className="p-3 bg-[#E9E6D7]/5 rounded-full">
          <Github size={32} className="text-[#E9E6D7]/40" />
        </div>
        <div className="space-y-1">
          <h3 className="text-[#E9E6D7] font-bold">Connect GitHub</h3>
          <p className="text-xs text-[#E9E6D7]/50 max-w-sm">
            Link your account to analyze your open source contributions and impact.
          </p>
        </div>
        <button
          onClick={() => signIn("github", { callbackUrl: window.location.href })}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#E9E6D7] hover:bg-white text-black text-xs font-bold uppercase tracking-wider transition-all"
        >
          <Github size={16} />
          <span>Connect Account</span>
        </button>
      </div>
    );
  }

  const contributions = (gitData.osContributions as unknown as any[]) || [];

  if (contributions.length === 0) {
    return (
      <div className="w-full bg-[#0a0a0a] border border-[#E9E6D7]/20 p-10 flex flex-col items-center justify-center gap-4 text-center">
        <GitPullRequest size={32} className="text-[#E9E6D7]/20" />
        <div className="space-y-1">
          <p className="text-[#E9E6D7] font-medium">No External Contributions</p>
          <p className="text-xs text-[#E9E6D7]/50">
            We couldn't find any contributions to public repositories not owned by you.
          </p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="mt-2 flex items-center gap-2 px-4 py-2 bg-[#E9E6D7]/10 hover:bg-[#E9E6D7] hover:text-black text-[#E9E6D7] text-xs font-bold uppercase tracking-wider transition-all"
        >
          {syncing ? <Loader2 className="animate-spin" size={14}/> : <Plus size={14} />}
          <span>Resync Data</span>
        </button>
      </div>
    );
  }

  return <OpenSource data={contributions} />;
}