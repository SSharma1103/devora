// components/UpdateNameModal.tsx
"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

// Define the props it will receive
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

    // Check if name is empty or unchanged
    if (!name.trim()) {
      setError("Name cannot be empty.");
      return;
    }
    if (name.trim() === currentName) {
      onClose(); // Just close, no update needed
      return;
    }

    setLoading(true);

    try {
      // Use the existing profile API route
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update name");
      }

      // Success! Call onClose(true) to close modal AND refresh session
      onClose(true);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/50 flex items-center justify-center z-50 p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-neutral-900 rounded-2xl w-full max-w-sm p-6 border border-neutral-700 shadow-xl relative"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={() => onClose()}
          className="absolute top-3 right-3 text-[#E9E6D7] hover:text-[#E9E6D7] text-xl"
        >
          ✕
        </button>

        <h2 className="text-xl font-semibold mb-4 text-[#E9E6D7]">
          Update Your Name
        </h2>

        <div className="space-y-2">
          <label htmlFor="name" className="text-sm text-neutral-400">
            Display Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 rounded-lg bg-black border border-neutral-700 text-[#E9E6D7]"
            disabled={loading}
          />
        </div>

        {error && <p className="text-red-500 text-sm mt-3">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-500 text-[#E9E6D7] font-semibold py-2 rounded-xl transition disabled:opacity-50 mt-5 flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? "Saving..." : "Save"}
        </button>
      </form>
    </div>
  );
}