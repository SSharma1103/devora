"use client";

import { useState, FormEvent } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Terminal,
  User,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Cpu,
} from "lucide-react";
// Import the shared generic type
import { ApiResponse } from "@/types";

// Define the specific data expected from this API call
interface SetUsernameResponse {
  username: string;
}

export default function SetupUsername() {
  // --- Real hooks ---
  const { data: session, status, update } = useSession();
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Stable Sys.Id per mount, not per render
  const [sysId] = useState(() =>
    Math.random().toString(36).substring(7).toUpperCase()
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!username.trim()) {
      setError("Username is required");
      setLoading(false);
      return;
    }

    const normalizedUsername = username.trim().toLowerCase();

    if (!normalizedUsername) {
      setError("Username cannot be empty");
      setLoading(false);
      return;
    }

    if (!/^[a-zA-Z0-9_]{3,20}$/.test(normalizedUsername)) {
      setError("Use 3-20 characters: letters, numbers, or underscores.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/user/username", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username: normalizedUsername }),
      });

      // === TYPE SAFETY APPLIED HERE ===
      const data = (await response.json()) as ApiResponse<SetUsernameResponse>;

      if (!response.ok || !data.success) {
        setError(data.error || "Failed to set username");
        setLoading(false);
        return;
      }

      // Refresh session with new username
      await update();

      // Redirect to home page
      router.push("/");
    } catch (err) {
      setError("Connection refused. Please retry.");
      setLoading(false);
    }
  };

  const inputClasses =
    "w-full p-4 pl-12 bg-[#0a0a0a] border border-[#E9E6D7]/20 rounded-none focus:outline-none focus:border-[#E9E6D7] focus:ring-1 focus:ring-[#E9E6D7] transition-all text-[#E9E6D7] placeholder-[#E9E6D7]/20 font-mono text-sm";
  const labelClasses =
    "block text-[10px] font-bold text-[#E9E6D7]/50 uppercase tracking-widest mb-2";

  // --- Session loading state ---
  if (status === "loading") {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-[#E9E6D7]">
        <div className="p-4 border border-dashed border-[#E9E6D7]/20 bg-[#0a0a0a] flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-[#E9E6D7]/60" size={20} />
          <span className="text-xs uppercase tracking-widest font-mono">
            Checking session…
          </span>
        </div>
      </div>
    );
  }

  // --- Not signed in ---
  if (!session) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-[#E9E6D7]">
        <div className="p-4 border border-dashed border-[#E9E6D7]/20 bg-[#0a0a0a] flex flex-col items-center gap-3">
          <AlertCircle className="text-[#E9E6D7]/40" size={24} />
          <span className="text-xs uppercase tracking-widest font-mono">
            Authentication Required
          </span>
        </div>
      </div>
    );
  }

  // Try both shapes: session.user.username and session.username (if customized)
  const existingUsername =
    (session.user as any)?.username ?? (session as any)?.username ?? null;

  // --- Already has username ---
  if (existingUsername) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#050505] border border-[#E9E6D7]/20 p-8 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-[#E9E6D7]/20" />
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-[#E9E6D7] rounded-full text-black">
              <CheckCircle2 size={24} />
            </div>
          </div>
          <h2 className="text-xl font-bold text-[#E9E6D7] mb-2">
            Identity Established
          </h2>
          <p className="text-[#E9E6D7]/60 text-sm mb-6 font-mono">
            Username:{" "}
            <span className="text-[#E9E6D7]">{existingUsername}</span>
          </p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-2 bg-[#E9E6D7]/10 hover:bg-[#E9E6D7] hover:text-black border border-[#E9E6D7]/20 text-[#E9E6D7] text-xs font-bold uppercase tracking-widest transition-all"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  // --- Main Form ---
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-lg bg-[#050505] border border-[#E9E6D7]/20 shadow-[0_0_50px_-10px_rgba(233,230,215,0.05)] relative flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Header */}
        <div className="border-b border-[#E9E6D7]/10 p-6 bg-[#0a0a0a]">
          <div className="flex items-center gap-2 mb-2 text-[#E9E6D7]/60">
            <Terminal size={16} />
            <span className="text-xs font-mono">init_profile.sh</span>
          </div>
          <h1 className="text-2xl font-bold text-[#E9E6D7] tracking-tight">
            CLAIM USERNAME
          </h1>
          <p className="text-[#E9E6D7]/50 text-xs mt-1 leading-relaxed max-w-sm">
            Establish your unique handle on the network. This identifier is
            permanent and cannot be altered later.
          </p>
        </div>

        <div className="p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="username" className={labelClasses}>
                Desired Handle
              </label>
              <div className="relative group">
                <div className="absolute top-4 left-4 text-[#E9E6D7]/30 group-focus-within:text-[#E9E6D7] transition-colors">
                  <User size={18} />
                </div>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="enter_username"
                  className={inputClasses}
                  disabled={loading}
                  autoComplete="off"
                  autoFocus
                />
                <div className="absolute right-4 top-4">
                  {username.length > 0 && username.length < 3 ? (
                    <div className="text-red-500 text-[10px] font-mono">
                      TOO_SHORT
                    </div>
                  ) : username.length > 0 ? (
                    <div className="text-green-500/50 text-[10px] font-mono">
                      VALID_FMT
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="flex items-start gap-2 mt-2 px-1">
                <div className="mt-0.5 text-[#E9E6D7]/40">
                  <Cpu size={10} />
                </div>
                <p className="text-[10px] text-[#E9E6D7]/40 leading-tight">
                  Requirements: 3-20 characters. Alphanumeric & underscores
                  only.
                </p>
              </div>
            </div>

            {error && (
              <div className="bg-red-900/10 border border-red-900/30 p-3 flex items-start gap-3 animate-in slide-in-from-top-2 fade-in">
                <AlertCircle
                  className="text-red-400 shrink-0 mt-0.5"
                  size={16}
                />
                <div className="space-y-1">
                  <p className="text-red-400 text-xs font-bold uppercase tracking-wide">
                    Error
                  </p>
                  <p className="text-red-300/80 text-xs font-mono">{error}</p>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full group relative overflow-hidden bg-[#E9E6D7] hover:bg-white text-black h-12 flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  <span className="text-xs font-bold uppercase tracking-widest">
                    Registering...
                  </span>
                </>
              ) : (
                <>
                  <span className="text-xs font-bold uppercase tracking-widest">
                    Confirm Handle
                  </span>
                  <ArrowRight
                    size={16}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer decoration */}
        <div className="bg-[#0a0a0a] border-t border-[#E9E6D7]/10 p-3 flex justify-between items-center text-[9px] text-[#E9E6D7]/20 uppercase tracking-widest font-mono">
          <span>Sys.Id: {sysId}</span>
          <span>Secure_Mode: ON</span>
        </div>
      </div>
    </div>
  );
}