"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { FaGithub } from "react-icons/fa";
import { Loader2 ,Github} from "lucide-react";

export default function ConnectGitHub() {
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    setLoading(true);
    try {
      // Set cookie to indicate account linking intent (if user is logged in)
      try {
        await fetch("/api/auth/link-github");
      } catch (error) {
        // If this fails, we'll fall back to email matching
        console.log(error + "Could not set linking cookie, will use email matching");
      }
      
      // Sign in with GitHub - the auth callback will link the account
      // After OAuth, NextAuth will redirect back and session will be updated
      await signIn("github", { 
        callbackUrl: window.location.href,
        redirect: true 
      });
    } catch (error) {
      console.error("Error connecting GitHub:", error);
      setLoading(false);
    }
  };

  return (
    <div className="p-6 border border-gray-800 rounded-xl bg-black/40 mb-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="text-[#E9E6D7] font-semibold text-lg mb-1">GitHub Integration</h3>
          <p className="text-sm text-[#E9E6D7] max-w-xl">
            Link your GitHub account to automatically display your repositories, contribution graphs, and developer statistics on your profile.
          </p>
        </div>

        <button
          onClick={handleConnect}
          disabled={loading}
          className="shrink-0 flex items-center justify-center gap-3 bg-[#E9E6D7] hover:bg-white text-black px-6 py-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed group/btn hover:scale-[1.01] min-w-[180px]"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              <span className="text-xs font-bold uppercase tracking-wider">Syncing...</span>
            </>
          ) : (
            <>
              <Github size={18} className="fill-current" />
              <span className="text-xs font-bold uppercase tracking-wider">Connect Account</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}