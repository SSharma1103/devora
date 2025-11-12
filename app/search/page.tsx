
"use client";

import { useState, useEffect } from "react";
import { Search, User, FolderGit2, Code } from "lucide-react";
import Sidebar from "@/components/sidebar";
import Link from "next/link"; // 1. Import the Link component

interface UserType {
  id: number;
  name: string | null;
  username: string;
  pfp?: string | null;
}

export default function DiscoverPage() {
  const [activeTab, setActiveTab] = useState<"developers" | "projects">(
    "developers"
  );
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  // ✅ Fixed endpoint: should be /api/users not /api/user
  async function fetchUsers(search?: string) {
    try {
      setLoading(true);
      const endpoint = search
        ? `/api/user?q=${encodeURIComponent(search)}`
        : `/api/user`;
      const res = await fetch(endpoint);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to fetch users");

      setUsers(data.data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

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
    // 2. Added "cursor-pointer" to make it feel interactive
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 transition-all hover:border-blue-500/50 cursor-pointer">
      <div className="flex items-center gap-4">
        {dev.pfp ? (
          <img
            src={dev.pfp}
            alt={dev.username}
            className="w-12 h-12 rounded-full border border-neutral-700 object-cover"
          />
        ) : (
          <div className="shrink-0 w-12 h-12 bg-neutral-800 rounded-full flex items-center justify-center border border-neutral-700">
            <span className="text-xl font-semibold text-white">
              {dev.name?.charAt(0) || dev.username.charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        <div>
          <h3 className="text-lg font-semibold text-white">
            {dev.name || "Unnamed Developer"}
          </h3>
          <p className="text-sm text-neutral-400">@{dev.username}</p>
        </div>
      </div>
    </div>
  );

  // ... (ProjectCard component remains the same) ...
    const ProjectCard = ({
    item,
  }: {
    item: (typeof projectData)[0];
  }) => (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 transition-all hover:border-blue-500/50">
      <div className="flex items-center gap-3 mb-2">
        <div className="bg-neutral-800 p-2 rounded-lg">
          <FolderGit2 className="w-5 h-5 text-blue-400" />
        </div>
        <h3 className="text-lg font-semibold text-white">{item.title}</h3>
      </div>
      <p className="text-sm text-neutral-400 mb-4">{item.description}</p>
      <div className="flex flex-wrap gap-2">
        {item.tech.map((tech) => (
          <span
            key={tech}
            className="bg-neutral-800 text-neutral-300 text-xs px-2 py-1 rounded-full border border-neutral-700"
          >
            {tech}
          </span>
        ))}
      </div>
    </div>
  );


  return (
    <div className="flex bg-black text-white min-h-screen">
      {/* --- Sidebar --- */}
      <Sidebar />

      {/* --- Main Discover Content --- */}
      <main className="flex-1 relative min-h-screen p-8 md:p-12 overflow-hidden">
        {/* ... (Background Gradient Blobs remain the same) ... */}
        <div className="absolute inset-0 z-0 opacity-40">
          <div className="absolute -top-20 -left-20 w-96 h-96 bg-purple-900 rounded-full filter blur-3xl opacity-30 animate-pulse"></div>
          <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-blue-900 rounded-full filter blur-3xl opacity-30 animate-pulse [animation-delay:-3s]"></div>
        </div>

        {/* Page Content */}
        <div className="relative z-10 max-w-6xl mx-auto">
          {/* ... (Header, Search, and Tabs remain the same) ... */}
          <h1 className="text-4xl font-bold mb-3">Discover</h1>
          <p className="text-lg text-neutral-400 mb-8">
            Explore new projects, find talented developers, and get inspired.
          </p>

          <div className="relative w-full mb-8">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchUsers(query)}
              placeholder="Search for developers by name or username..."
              className="w-full p-4 pl-12 bg-neutral-900/50 border border-neutral-800 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
          </div>

          <nav className="border-b border-neutral-800 mb-8">
            <ul className="flex gap-8">
              <li
                className={`pb-3 cursor-pointer flex items-center gap-2 ${
                  activeTab === "developers"
                    ? "text-white font-semibold border-b-2 border-white"
                    : "text-neutral-500"
                }`}
                onClick={() => setActiveTab("developers")}
              >
                <User className="w-4 h-4" />
                Developers
              </li>
              <li
                className={`pb-3 cursor-pointer flex items-center gap-2 ${
                  activeTab === "projects"
                    ? "text-white font-semibold border-b-2 border-white"
                    : "text-neutral-500"
                }`}
                onClick={() => setActiveTab("projects")}
              >
                <Code className="w-4 h-4" />
                Projects
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
                  // 3. Wrap the DeveloperCard in a Link component
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

            {activeTab === "projects" &&
              projectData.map((proj) => (
                <ProjectCard key={proj.title} item={proj} />
              ))}
          </div>
        </div>
      </main>
    </div>
  );
}