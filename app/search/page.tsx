"use client";

import { useState } from "react";
import { Search, User, FolderGit2, Code } from "lucide-react";
import Sidebar from "@/components/sidebar";
import Link from "next/link"; 
import { ApiResponse, UserType } from "@/types";
// 1. Import the hook
import { useResurceManager } from "@/hooks/useResourceManager";

export default function DiscoverPage() {
  const [activeTab, setActiveTab] = useState<"developers" | "projects">("developers");
  const [query, setQuery] = useState("");
  
  // 2. State to control the hook's endpoint
  // Changing this string automatically triggers the hook to re-fetch
  const [endpoint, setEndpoint] = useState("/api/user");

  // 3. Initialize the hook with the dynamic endpoint
  const {
    items: users,
    loading,
    error,
  } = useResurceManager<UserType>(endpoint);

  // 4. Handle Search: Update the endpoint state to trigger the hook
  const handleSearch = () => {
    const newEndpoint = query.trim()
      ? `/api/user?q=${encodeURIComponent(query.trim())}`
      : "/api/user";
    
    // Only update if changed to prevent unnecessary re-renders
    if (newEndpoint !== endpoint) {
      setEndpoint(newEndpoint);
    }
  };

  // ... (static projectData remains the same) ...
  const projectData = [
    {
      title: "AI Code Assistant",
      description: "An AI-powered assistant that reviews and suggests code.",
      tech: ["OpenAI API", "Next.js", "Tailwind CSS"],
    },
    {
      title: "Decentralized Identity System",
      description: "A blockchain-based identity verification protocol.",
      tech: ["Rust", "Solidity", "Web3.js"],
    },
  ];

  // Developer card (live data)
  const DeveloperCard = ({ dev }: { dev: UserType }) => (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 transition-all hover:border-[#E9E6D7] cursor-pointer">
      <div className="flex items-center gap-4">
        {dev.pfp ? (
          <img
            src={dev.pfp}
            alt={dev.username}
            className="w-12 h-12 rounded-full border border-neutral-700 object-cover"
          />
        ) : (
          <div className="shrink-0 w-12 h-12 bg-neutral-800 rounded-full flex items-center justify-center border border-neutral-700">
            <span className="text-xl font-semibold text-[#E9E6D7]">
              {dev.name?.charAt(0) || dev.username.charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        <div>
          <h3 className="text-lg font-semibold text-[#E9E6D7]">
            {dev.name || "Unnamed Developer"}
          </h3>
          <p className="text-sm text-neutral-400">@{dev.username}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex bg-black text-[#E9E6D7] min-h-screen">
      {/* --- Sidebar --- */}
      <Sidebar />

      {/* --- Main Discover Content --- */}
      <main className="flex-1 relative min-h-screen p-8 md:p-12 overflow-hidden">
        {/* ... (Background Gradient Blobs) ... */}
        <div className="absolute inset-0 z-0 opacity-40">
          <div className="absolute -top-20 -left-20 w-96 h-96 bg-purple-900 rounded-full filter blur-3xl opacity-30 animate-pulse"></div>
          <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-blue-900 rounded-full filter blur-3xl opacity-30 animate-pulse [animation-delay:-3s]"></div>
        </div>

        {/* Page Content */}
        <div className="relative z-10 max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-3">Discover</h1>
          <p className="text-lg text-neutral-400 mb-8">
           find talented developers, and get inspired.
          </p>

          <div className="relative w-full mb-8">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              // 5. Call handleSearch on Enter
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search for developers by name or username..."
              className="w-full p-4 pl-12 bg-neutral-900/50 border border-neutral-800 rounded-lg text-[#E9E6D7] placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#E9E6D7]"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
          </div>

          <nav className="border-b border-neutral-800 mb-8">
            <ul className="flex gap-8">
              <li
                className={`pb-3 cursor-pointer flex items-center gap-2 ${
                  activeTab === "developers"
                    ? "text-[#E9E6D7] font-semibold border-b-2 border-white"
                    : "text-neutral-500"
                }`}
                onClick={() => setActiveTab("developers")}
              >
                <User className="w-4 h-4" />
                Developers
              </li>
            </ul>
          </nav>

          {/* Grid Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeTab === "developers" && (
              <>
                {loading ? (
                  <p className="text-neutral-500">Loading developers...</p>
                ) : error ? (
                  <p className="text-red-500">{error}</p>
                ) : users.length > 0 ? (
                  users.map((dev) => (
                    <Link href={`/${dev.username}`} key={dev.id}>
                      <DeveloperCard dev={dev} />
                    </Link>
                  ))
                ) : (
                  <p className="text-neutral-500 col-span-full text-center">
                    No developers found.
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}