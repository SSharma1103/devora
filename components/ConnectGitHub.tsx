"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { FaGithub } from "react-icons/fa";
import { Loader2 } from "lucide-react";

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
          className="shrink-0 flex items-center justify-center gap-2 bg-[#E9E6D7] hover:bg-[#E9E6D7] text-[#E9E6D7] font-semibold py-2.5 px-6 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-900/20 active:scale-95"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin h-5 w-5" />
              <span>Connecting...</span>
            </>
          ) : (
            <>
              <FaGithub className="text-xl bg-black" />
              <span className="bg-black"> Connect GitHub</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}