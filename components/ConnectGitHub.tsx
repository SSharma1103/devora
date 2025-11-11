"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

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
    <div>
      <button
        onClick={handleConnect}
        disabled={loading}
      >
        {loading ? "Connecting..." : "Connect GitHub Account"}
      </button>
    </div>
  );
}

