"use client";

import { useState } from "react";
import { Loader2, X, User, Terminal, Check } from "lucide-react";

interface UpdateNameModalProps {
  currentName: string;
  onClose: (needsUpdate?: boolean) => void;
}

export default function UpdateNameModal({ currentName, onClose }: UpdateNameModalProps) {
  const [name, setName] = useState(currentName);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Name cannot be empty.");
      return;
    }
    if (name.trim() === currentName) {
      onClose();
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update name");
      }

      onClose(true);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- Theme Constants ---
  const offWhite = "#E9E6D7";
  const inputClasses = "w-full p-3 bg-[#0a0a0a] border border-[#E9E6D7]/20 rounded-none focus:outline-none focus:border-[#E9E6D7] focus:ring-1 focus:ring-[#E9E6D7] transition-all text-[#E9E6D7] placeholder-[#E9E6D7]/30 text-sm";
  const labelClasses = "block text-[10px] font-bold text-[#E9E6D7]/50 uppercase tracking-widest mb-1.5";

  return (
    <div className="fixed inset-0 backdrop-blur-xl bg-black/80 flex items-center justify-center z-60 p-4 animate-in fade-in duration-200">
      <form
        onSubmit={handleSubmit}
        className="bg-[#050505] w-full max-w-md border border-[#E9E6D7]/20 shadow-2xl relative flex flex-col"
        style={{ boxShadow: '0 0 40px -10px rgba(233, 230, 215, 0.1)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E9E6D7]/10 px-5 py-3 bg-[#050505]/95 backdrop-blur-md">
           <div className="flex items-center gap-2">
              <Terminal size={14} className="text-[#E9E6D7]/60" />
              <h2 className="text-sm font-bold tracking-tight text-[#E9E6D7]">
                UPDATE IDENTITY
              </h2>
           </div>
           <button
            type="button"
            onClick={() => onClose()}
            className="text-[#E9E6D7]/60 hover:text-[#E9E6D7] transition-colors p-1"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-1">
             <div className="flex items-center gap-2 mb-4 text-[#E9E6D7]/40 text-xs font-mono">
                <span>user_config.json</span>
                <span>/</span>
                <span>display_name</span>
             </div>

            <div className="relative group">
               <div className="absolute top-3 left-3 text-[#E9E6D7]/40 group-focus-within:text-[#E9E6D7] transition-colors">
                  <User size={16} />
               </div>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`${inputClasses} pl-10`}
                placeholder="Enter new display name"
                disabled={loading}
                autoFocus
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-900/10 border border-red-900/30 text-red-400 p-3 text-xs flex items-center gap-2">
              <span className="w-1 h-1 bg-red-500 rounded-full animate-pulse"/>
              {error}
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 flex items-center justify-center gap-2 text-black font-bold text-xs tracking-wider uppercase disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.01] active:scale-[0.99]"
              style={{ backgroundColor: offWhite }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Confirm Changes</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}