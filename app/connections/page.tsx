"use client";

import { useState, useEffect } from "react";
import { Search, User, Users } from "lucide-react"; // Import Users
import Sidebar from "@/components/sidebar";
import Link from "next/link";
import { useSession } from "next-auth/react"; // Import useSession
import { useRouter } from "next/navigation"; // Import useRouter

interface UserType {
  id: number;
  name: string | null;
  username: string;
  pfp?: string | null;
}

export default function ConnectionsPage() {
  const [activeTab, setActiveTab] = useState<"followers" | "following">(
    "followers"
  );
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { status } = useSession();
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  // Fetch data based on tab and query
  async function fetchConnections(
    tab: "followers" | "following",
    search?: string
  ) {
    // Don't fetch if not authenticated
    if (status !== "authenticated") {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      let endpoint = `/api/user/connections?type=${tab}`;
      if (search) {
        endpoint += `&q=${encodeURIComponent(search)}`;
      }
      const res = await fetch(endpoint);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to fetch connections");

      setUsers(data.data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }

  // Fetch data when tab changes or on initial load
  useEffect(() => {
    fetchConnections(activeTab, query || undefined);
  }, [activeTab, status, query]); // <-- Added query to dependency array

  // Developer card (re-usable)
  const DeveloperCard = ({ dev }: { dev: UserType }) => (
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

  // Show loading skeleton while checking auth
  if (status === "loading") {
    return (
      <div className="flex bg-black text-white min-h-screen">
        <Sidebar />
        <main className="flex-1 p-8 md:p-12">
          <p className="text-neutral-500">Loading...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex bg-black text-white min-h-screen">
      {/* --- Sidebar --- */}
      <Sidebar />

      {/* --- Main Content --- */}
      <main className="flex-1 relative min-h-screen p-8 md:p-12 overflow-hidden">
        {/* ... (Background Gradient Blobs) ... */}
        <div className="absolute inset-0 z-0 opacity-40">
          <div className="absolute -top-20 -left-20 w-96 h-96 bg-purple-900 rounded-full filter blur-3xl opacity-30 animate-pulse"></div>
          <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-blue-900 rounded-full filter blur-3xl opacity-30 animate-pulse [animation-delay:-3s]"></div>
        </div>

        {/* Page Content */}
        <div className="relative z-10 max-w-6xl mx-auto">
          {/* Header */}
          <h1 className="text-4xl font-bold mb-3">Your Connections</h1>
          <p className="text-lg text-neutral-400 mb-8">
            Manage your followers and the developers you follow.
          </p>

          {/* Search Bar */}
          <div className="relative w-full mb-8">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && fetchConnections(activeTab, query)
              }
              placeholder={`Search ${activeTab}...`}
              className="w-full p-4 pl-12 bg-neutral-900/50 border border-neutral-800 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
          </div>

          {/* Tabs */}
          <nav className="border-b border-neutral-800 mb-8">
            <ul className="flex gap-8">
              <li
                className={`pb-3 cursor-pointer flex items-center gap-2 ${
                  activeTab === "followers"
                    ? "text-white font-semibold border-b-2 border-white"
                    : "text-neutral-500"
                }`}
                onClick={() => {
                  setActiveTab("followers");
                  setQuery(""); // Clear search when changing tabs
                }}
              >
                <User className="w-4 h-4" />
                Followers
              </li>
              <li
                className={`pb-3 cursor-pointer flex items-center gap-2 ${
                  activeTab === "following"
                    ? "text-white font-semibold border-b-2 border-white"
                    : "text-neutral-500"
                }`}
                onClick={() => {
                  setActiveTab("following");
                  setQuery(""); // Clear search when changing tabs
                }}
              >
                <Users className="w-4 h-4" />
                Following
              </li>
            </ul>
          </nav>

          {/* Grid Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <p className="text-neutral-500">Loading...</p>
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
                No {activeTab} found{query && ' matching your search'}.
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}