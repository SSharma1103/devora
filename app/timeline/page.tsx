"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Briefcase,
  FolderGit2,
  ExternalLink,
  Github,
  Clock,
  Terminal,
  Activity,
  AlertCircle,
  Search,
  ArrowLeft,
} from "lucide-react";
// 1. Import Shared Types
import { 
  FeedItem, 
  ProjectItem, 
  WorkExpItem, 
  FeedUser, 
  ApiResponse 
} from "@/types";

export default function TimelinePage() {
  // 2. Use the imported FeedItem type for state
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
      return;
    }

    if (status !== "authenticated") return;

    const fetchFeed = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/feed"); // Assuming this is the correct endpoint path
        
        // 3. Type the API Response
        const data = (await res.json()) as ApiResponse<FeedItem[]>;
        
        if (!res.ok || !data.success) {
           throw new Error(data.error || "Failed to fetch feed");
        }

        setFeed(data.data || []);
        setError(null);
      } catch (err: any) {
        setError(err.message || "Failed to fetch feed");
        setFeed([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFeed();
  }, [status, router]);

  const pageBg = "bg-black";

  const renderFeed = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <Loader2 className="animate-spin text-[#E9E6D7]/40" size={32} />
          <div className="flex items-center gap-2 text-[#E9E6D7]/40 text-xs font-mono uppercase tracking-widest animate-pulse">
            <Activity size={12} />
            <span>Syncing Network Activity...</span>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-900/10 border border-red-900/30 p-6 flex flex-col items-center gap-3 text-red-400 max-w-lg mx-auto">
          <AlertCircle size={24} />
          <p className="text-sm font-bold uppercase tracking-wide">
            Connection Error
          </p>
          <p className="text-xs font-mono opacity-70">{error}</p>
        </div>
      );
    }

    if (feed.length === 0) {
      return (
        <div className="border border-dashed border-[#E9E6D7]/20 p-12 text-center bg-[#0a0a0a] max-w-2xl mx-auto mt-8">
          <div className="flex justify-center mb-4 text-[#E9E6D7]/20">
            <Terminal size={48} strokeWidth={1} />
          </div>
          <h3 className="text-[#E9E6D7] font-bold text-sm uppercase tracking-widest mb-2">
            Timeline Empty
          </h3>
          <p className="text-[#E9E6D7]/50 text-xs max-w-xs mx-auto mb-6 leading-relaxed">
            Follow other developers to populate your stream with their latest
            projects and career updates.
          </p>
          <Link href="/search">
            <button className="flex items-center gap-2 mx-auto px-5 py-2.5 bg-[#E9E6D7] hover:bg-white text-black text-xs font-bold uppercase tracking-wider transition-all hover:scale-[1.02]">
              <Search size={14} />
              <span>Explore Network</span>
            </button>
          </Link>
        </div>
      );
    }

    return (
      <div className="space-y-8 relative max-w-3xl mx-auto">
        <div className="absolute left-6 top-0 bottom-0 w-px bg-[#E9E6D7]/10 md:left-8 z-0"></div>

        {feed.map((feedItem, index) => {
          const isProject = feedItem.type === "project";
          const key = isProject
            ? `proj-${feedItem.item.id}`
            : `work-${feedItem.item.id}`;

          return (
            <div
              key={key}
              className="relative z-10 pl-16 md:pl-20 animate-in fade-in slide-in-from-bottom-4 duration-500"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="absolute left-4 md:left-6 top-6 -translate-x-1/2 w-4 h-4 bg-[#0a0a0a] border border-[#E9E6D7]/30 flex items-center justify-center rounded-sm shadow-[0_0_10px_rgba(233,230,215,0.1)]">
                <div
                  className={`w-1.5 h-1.5 ${
                    isProject ? "bg-blue-400" : "bg-emerald-400"
                  }`}
                ></div>
              </div>

              {/* 4. Pass Correctly Typed Items */}
              {isProject ? (
                <TimelineProjectCard project={feedItem.item} />
              ) : (
                <TimelineWorkExpCard workExp={feedItem.item} />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  if (status === "loading") {
    return (
      <div
        className={`flex flex-col ${pageBg} text-[#E9E6D7] min-h-screen items-center justify-center`}
      >
        <Loader2 className="animate-spin opacity-20" size={32} />
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen ${pageBg} text-[#E9E6D7] font-sans selection:bg-[#E9E6D7]/20`}
    >
      <main className="relative min-h-screen p-6 md:p-12 overflow-x-hidden">
        <div
          className="fixed inset-0 z-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, #E9E6D7 1px, transparent 0)",
            backgroundSize: "40px 40px",
          }}
        ></div>

        <header className="relative z-20 max-w-4xl mx-auto mb-12 flex items-center justify-between border-b border-[#E9E6D7]/10 pb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Link
                href="/"
                className="p-2 -ml-2 hover:bg-[#E9E6D7]/10 rounded-full transition-colors text-[#E9E6D7]/60 hover:text-[#E9E6D7]"
              >
                <ArrowLeft size={20} />
              </Link>
              <h1 className="text-3xl font-bold tracking-tight text-[#E9E6D7]">
                ACTIVITY FEED
              </h1>
            </div>
            <p className="text-[#E9E6D7]/40 text-xs font-mono pl-12">
              Network Updates • <span className="text-blue-400">Live</span>
            </p>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#E9E6D7]/60">
                System Status
              </span>
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-mono text-emerald-400">
                  ONLINE
                </span>
              </div>
            </div>
          </div>
        </header>

        <div className="relative z-10 max-w-4xl mx-auto">{renderFeed()}</div>
      </main>
    </div>
  );
}

// --- Feed Item Card Components ---

// 5. Use ProjectItem['item'] because our shared type wraps it
function TimelineProjectCard({ project }: { project: ProjectItem['item'] }) {
  return (
    <div className="bg-[#050505] border border-[#E9E6D7]/10 p-6 group hover:border-[#E9E6D7]/30 transition-all duration-300 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-[#E9E6D7]/5 to-transparent pointer-events-none"></div>

      <CardHeader 
        user={project.user} 
        timestamp={project.createdAt.toString()} 
        type="Project" 
      />

      <div className="mt-5 pl-11">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <h3 className="text-xl font-bold text-[#E9E6D7] group-hover:text-white transition-colors tracking-tight">
              {project.title}
            </h3>
            <div className="flex items-center gap-2 mt-1.5 text-blue-400/80 text-[10px] font-bold uppercase tracking-wider">
              <FolderGit2 size={12} />
              <span>New Project</span>
            </div>
          </div>
        </div>

        {project.description && (
          <p className="text-sm text-[#E9E6D7]/60 leading-relaxed mb-5 font-light max-w-2xl">
            {project.description}
          </p>
        )}

        <div className="flex flex-wrap gap-3 pt-5 border-t border-[#E9E6D7]/5">
          {project.link && (
            <a
              href={project.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-[#E9E6D7]/5 hover:bg-[#E9E6D7] hover:text-black border border-[#E9E6D7]/10 text-[#E9E6D7]/80 text-[10px] font-bold uppercase tracking-wider transition-all"
            >
              <ExternalLink size={12} />
              <span>Live Demo</span>
            </a>
          )}
          {project.gitlink && (
            <a
              href={project.gitlink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-[#E9E6D7]/5 hover:bg-[#E9E6D7] hover:text-black border border-[#E9E6D7]/10 text-[#E9E6D7]/80 text-[10px] font-bold uppercase tracking-wider transition-all"
            >
              <Github size={12} />
              <span>Source Code</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// 6. Use WorkExpItem['item']
function TimelineWorkExpCard({ workExp }: { workExp: WorkExpItem['item'] }) {
  return (
    <div className="bg-[#050505] border border-[#E9E6D7]/10 p-6 group hover:border-[#E9E6D7]/30 transition-all duration-300 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-[#E9E6D7]/5 to-transparent pointer-events-none"></div>

      <CardHeader
        user={workExp.user}
        timestamp={workExp.createdAt.toString()}
        type="Experience"
      />

      <div className="mt-5 pl-11 flex flex-col md:flex-row gap-6">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-[#E9E6D7] group-hover:text-white transition-colors tracking-tight">
            {workExp.title}
          </h3>

          <div className="flex items-center gap-2 mt-1.5 mb-4 text-emerald-400/80 text-[10px] font-bold uppercase tracking-wider">
            <Briefcase size={12} />
            <span>Career Update</span>
            <span className="text-[#E9E6D7]/20">•</span>
            <span className="text-[#E9E6D7]/60">{workExp.companyName}</span>
          </div>

          {workExp.duration && (
            <p className="text-[10px] font-mono text-[#E9E6D7]/40 mb-4 bg-[#E9E6D7]/5 inline-block px-2 py-1 border border-[#E9E6D7]/5">
              {workExp.duration}
            </p>
          )}

          {workExp.description && (
            <p className="text-sm text-[#E9E6D7]/60 leading-relaxed font-light max-w-2xl">
              {workExp.description}
            </p>
          )}
        </div>

        {workExp.image && (
          <div className="shrink-0 hidden sm:block">
            <img
              src={workExp.image}
              alt={workExp.companyName || workExp.title}
              className="w-20 h-20 rounded-sm object-cover border border-[#E9E6D7]/10 bg-white/5 grayscale group-hover:grayscale-0 transition-all duration-500"
            />
          </div>
        )}
      </div>
    </div>
  );
}

// 7. Use the shared FeedUser type
function CardHeader({
  user,
  timestamp,
}: {
  user: FeedUser;
  timestamp: string;
  type: string;
}) {
  const timeAgo = (date: string) => {
    const seconds = Math.floor(
      (new Date().getTime() - new Date(date).getTime()) / 1000
    );
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "Y";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "MO";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "D";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "H";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "M";
    return "<1M";
  };

  const userImage = user.pfp || "/default-avatar.png";
  const userFirstInitial =
    user.name?.charAt(0) || user.username?.charAt(0).toUpperCase() || "?";

  return (
    <div className="flex items-start justify-between">
      <Link href={`/${user.username}`} className="no-underline">
        <div className="flex items-center gap-3 group/user cursor-pointer">
          {user.pfp ? (
            <img
              src={userImage}
              alt={user.username || "User"}
              className="w-9 h-9 rounded-sm border border-[#E9E6D7]/20 object-cover group-hover/user:border-[#E9E6D7] transition-all"
            />
          ) : (
            <div className="shrink-0 w-9 h-9 bg-[#E9E6D7]/5 rounded-sm flex items-center justify-center border border-[#E9E6D7]/20 group-hover/user:bg-[#E9E6D7] group-hover/user:text-black transition-all">
              <span className="text-xs font-bold font-mono">
                {userFirstInitial}
              </span>
            </div>
          )}

          <div className="flex flex-col">
            <h4 className="text-xs font-bold text-[#E9E6D7] group-hover/user:underline decoration-[#E9E6D7]/40 underline-offset-4 mb-0.5">
              {user.name || user.username}
            </h4>
            <span className="text-[10px] text-[#E9E6D7]/40 font-mono">
              @{user.username}
            </span>
          </div>
        </div>
      </Link>

      <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#E9E6D7]/30 uppercase tracking-widest bg-[#E9E6D7]/5 px-2 py-1 rounded-sm">
        <Clock size={10} />
        <span>{timeAgo(timestamp)} AGO</span>
      </div>
    </div>
  );
}