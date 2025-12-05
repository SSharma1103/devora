"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/sidebar"; // <-- Corrected import path
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Briefcase,
  FolderGit2,
  ExternalLink,
  Github,
} from "lucide-react";

// --- Types ---
interface UserInfo {
  name: string | null;
  username: string;
  pfp: string | null;
}

interface ProjectItem {
  id: number;
  title: string;
  description: string | null;
  link: string | null;
  gitlink: string | null;
  createdAt: string;
  user: UserInfo;
}

interface WorkExpItem {
  id: number;
  title: string;
  companyName: string | null;
  description: string | null;
  duration: string | null;
  image: string | null;
  createdAt: string;
  user: UserInfo;
}

type FeedItem =
  | { type: "project"; item: ProjectItem }
  | { type: "workexp"; item: WorkExpItem };

// --- Main Page Component ---
export default function TimelinePage() {
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { status } = useSession();
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
    if (status === "authenticated") {
      fetchFeed();
    }
  }, [status, router]);

  // Fetch the timeline feed
  async function fetchFeed() {
    try {
      setLoading(true);
      const res = await fetch("/api/timeline");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch feed");
      setFeed(data.data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      setFeed([]);
    } finally {
      setLoading(false);
    }
  }

  // --- Render Functions ---

  const renderFeed = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="animate-spin h-8 w-8 text-[#E9E6D7]" />
        </div>
      );
    }

    if (error) {
      return <p className="text-red-500 text-center">{error}</p>;
    }

    if (feed.length === 0) {
      return (
        <div className="text-center text-neutral-500 py-16">
          <h3 className="text-lg font-semibold">Your timeline is empty</h3>
          <p>Follow developers to see their latest projects and work experience.</p>
          <Link href="/search">
            <button className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-[#E9E6D7] font-semibold">
              Find Developers
            </button>
          </Link>
        </div>
      );
    }

    return (
      <div className="space-y-8">
        {feed.map((feedItem) => {
          if (feedItem.type === "project") {
            return (
              <TimelineProjectCard
                key={`proj-${feedItem.item.id}`}
                project={feedItem.item}
              />
            );
          }
          if (feedItem.type === "workexp") {
            return (
              <TimelineWorkExpCard
                key={`work-${feedItem.item.id}`}
                workExp={feedItem.item}
              />
            );
          }
          return null;
        })}
      </div>
    );
  };

  if (status === "loading") {
    return (
      <div className="flex bg-black text-[#E9E6D7] min-h-screen">
        <Sidebar />
        <main className="flex-1 p-8 md:p-12">
          <p className="text-neutral-500">Loading session...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex bg-black text-[#E9E6D7] min-h-screen">
      <Sidebar />
      <main className="flex-1 relative min-h-screen p-8 md:p-12 overflow-hidden">
        {/* ... (Background Gradient Blobs) ... */}
        <div className="absolute inset-0 z-0 opacity-40">
          <div className="absolute -top-20 -left-20 w-96 h-96 bg-orange-900 rounded-full filter blur-3xl opacity-30 animate-pulse"></div>
          <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-blue-900 rounded-full filter blur-3xl opacity-30 animate-pulse [animation-delay:-3s]"></div>
        </div>

        {/* Page Content */}
        <div className="relative z-10 max-w-3xl mx-auto">
          {/* Header */}
          <h1 className="text-4xl font-bold mb-3">Timeline</h1>
          <p className="text-lg text-neutral-400 mb-10">
            See the latest updates from developers you follow.
          </p>

          {/* Feed Content */}
          {renderFeed()}
        </div>
      </main>
    </div>
  );
}

// --- Feed Item Card Components ---

function TimelineProjectCard({ project }: { project: ProjectItem }) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 hover:border-blue-500/50 transition-all">
      <CardHeader user={project.user} timestamp={project.createdAt} />
      <div className="mt-4">
        <div className="flex items-center gap-2">
          <FolderGit2 className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold">{project.title}</h3>
        </div>
        {project.description && (
          <p className="text-sm text-neutral-400 mt-2">
            {project.description}
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          {project.link && (
            <a
              href={project.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-blue-400 hover:underline"
            >
              <ExternalLink className="w-4 h-4" /> Live Demo
            </a>
          )}
          {project.gitlink && (
            <a
              href={project.gitlink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-neutral-400 hover:text-[#E9E6D7] transition"
            >
              <Github className="w-4 h-4" /> GitHub
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function TimelineWorkExpCard({ workExp }: { workExp: WorkExpItem }) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 hover:border-green-500/50 transition-all">
      <CardHeader user={workExp.user} timestamp={workExp.createdAt} />
      <div className="mt-4 flex gap-4">
        {workExp.image && (
          <img
            src={workExp.image}
            alt={workExp.companyName || workExp.title}
            className="w-16 h-16 rounded-lg object-cover border border-neutral-700"
          />
        )}
        <div>
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-green-400" />
            <h3 className="text-lg font-semibold">{workExp.title}</h3>
          </div>
          <p className="text-sm text-neutral-400">
            {workExp.companyName} {workExp.duration && `• ${workExp.duration}`}
          </p>
          {workExp.description && (
            <p className="text-sm text-neutral-300 mt-2">
              {workExp.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function CardHeader({ user, timestamp }: { user: UserInfo; timestamp: string }) {
  const timeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m";
    return Math.floor(seconds) + "s";
  };

  const userImage = user.pfp || "/default-avatar.png";
  const userFirstInitial =
    user.name?.charAt(0) || user.username.charAt(0).toUpperCase();

  return (
    <div className="flex items-center justify-between">
      <Link href={`/${user.username}`}>
        <div className="flex items-center gap-2 group">
          {user.pfp ? (
            <img
              src={userImage}
              alt={user.username}
              className="w-9 h-9 rounded-full border border-neutral-700 object-cover"
            />
          ) : (
            <div className="shrink-0 w-9 h-9 bg-neutral-800 rounded-full flex items-center justify-center border border-neutral-700">
              <span className="text-sm font-semibold text-[#E9E6D7]">
                {userFirstInitial}
              </span>
            </div>
          )}
          <div>
            <h4 className="font-semibold text-[#E9E6D7] group-hover:underline">
              {user.name || user.username}
            </h4>
            <p className="text-xs text-neutral-400">@{user.username}</p>
          </div>
        </div>
      </Link>
      <span className="text-xs text-neutral-500">{timeAgo(timestamp)}</span>
    </div>
  );
}