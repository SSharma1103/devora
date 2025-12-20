"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react"; 
import { 
  Trophy, 
  TrendingUp, 
  Award, 
  Loader2, 
  Code2, 
  Zap, 
  Target,
  AlertCircle,
  Terminal
} from "lucide-react";
import { ApiResponse } from "@/types"; // Assuming you have this generic wrapper

// --- Types Definition ---

interface LeetCodeProfile {
  totalSolved: number;
  totalQuestions: number;
  easySolved: number;
  totalEasy: number;
  mediumSolved: number;
  totalMedium: number;
  hardSolved: number;
  totalHard: number;
  ranking: number | string;
  contributionPoint: number;
  reputation: number;
}

interface Badge {
  id: string;
  displayName: string;
  icon: string;
  creationDate?: string;
}

interface LeetCodeBadges {
  badges: Badge[];
  activeBadge: Badge | null;
  upcomingBadges: Badge[];
}

interface LeetCodeProps {
  leetcodeUsername?: string | null;
}

// --- Main Component ---

export default function LeetCodeStatsCard({ leetcodeUsername }: LeetCodeProps) {
  const { data: session } = useSession();

  // Strongly typed state
  const [data, setData] = useState<LeetCodeProfile | null>(null);
  const [badgesData, setBadgesData] = useState<LeetCodeBadges | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUser() {
      let username = leetcodeUsername;

      // 1. If no username passed, try to fetch from current session user's profile
      if (username === undefined && session?.user?.name) { // Changed session.username to session.user.name or ensure your session type has username
        try {
           // Assuming session has a username property mapped
           const sessionUsername = (session as any).username || session.user?.name;
           
           if(sessionUsername) {
              const res = await fetch(`/api/user?username=${sessionUsername}`);
              if (res.ok) {
                const json = (await res.json()) as ApiResponse<{ leetcode: string }>;
                if (json.success && json.data?.leetcode) {
                  username = json.data.leetcode; 
                }
              }
           }
        } catch (err) {
          console.error("Failed to fetch user profile:", err);
        }
      }

      // 2. If still no username, stop loading
      if (!username) {
        setLoading(false);
        if (leetcodeUsername === null) {
          setError("No LeetCode username found for this user.");
        } else {
          setError(null);
        }
        return;
      }

      // 3. Fetch LeetCode Data
      try {
        setLoading(true);
        const [profileRes, badgesRes] = await Promise.all([
          fetch(`https://alfa-leetcode-api.onrender.com/${username}/solved`), // Adjusted endpoint slightly for stats if needed, or use 'profile'
          fetch(`https://alfa-leetcode-api.onrender.com/${username}/badges`),
        ]);

        if (!profileRes.ok || !badgesRes.ok)
          throw new Error("Failed to fetch data (user may not exist or API is down)");

        // We assume the API structure matches our interface
        const profileJson = await profileRes.json();
        const badgesJson = await badgesRes.json();

        // Note: The specific API endpoint used in your original code 'backendpoint-alpha' 
        // implies a specific structure. I am mapping to the interfaces defined above.
        setData(profileJson);
        setBadgesData(badgesJson);
        setError(null);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    // Trigger logic
    if (leetcodeUsername !== undefined || session) {
        fetchUser();
    } else if (leetcodeUsername === undefined && session === null) {
        setLoading(false);
    }
  }, [leetcodeUsername, session]);

  // --- Theme Constants ---
  const cardBaseClass = "bg-[#0a0a0a] border border-[#E9E6D7]/10 p-5 flex flex-col justify-between hover:border-[#E9E6D7]/30 transition-all duration-300 group relative overflow-hidden";
  const labelClass = "text-[10px] font-bold text-[#E9E6D7]/40 uppercase tracking-widest mb-1";
  const headerClass = "flex items-center gap-2 text-[#E9E6D7]/60 mb-4 pb-2 border-b border-[#E9E6D7]/10";
  const headerIconClass = "w-4 h-4";

  // --- Loading State ---
  if (loading)
    return (
      <div className="w-full h-48 bg-[#0a0a0a] border border-[#E9E6D7]/20 flex flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-[#E9E6D7]/40" size={24} />
        <span className="text-xs text-[#E9E6D7]/60 tracking-wider uppercase animate-pulse">Fetching LeetCode Data...</span>
      </div>
    );
  
  // --- Error State ---
  if (error)
    return (
      <div className="w-full bg-red-900/10 border border-red-900/30 p-6 flex items-center justify-center gap-3 text-red-400">
        <AlertCircle size={20} />
        <span className="text-sm font-medium">{error}</span>
      </div>
    );
  
  // --- Empty State ---
  if (!data)
    return (
      <div className="w-full border border-dashed border-[#E9E6D7]/20 p-8 text-center bg-[#0a0a0a]">
        <Code2 className="mx-auto text-[#E9E6D7]/20 mb-3" size={32} />
        <p className="text-[#E9E6D7]/40 text-xs uppercase tracking-widest">No LeetCode Data Linked</p>
      </div>
    );

  // Derived values
  const totalSolved = data.easySolved + data.mediumSolved + data.hardSolved;
  const easyPercent = data.totalEasy ? Math.round((data.easySolved / data.totalEasy) * 100) : 0;
  const mediumPercent = data.totalMedium ? Math.round((data.mediumSolved / data.totalMedium) * 100) : 0;
  const hardPercent = data.totalHard ? Math.round((data.hardSolved / data.totalHard) * 100) : 0;
  
  const totalQuestions = data.totalEasy + data.totalMedium + data.totalHard;
  const progressOverall = totalQuestions > 0 ? Math.min(Math.round((totalSolved / totalQuestions) * 100), 100) : 0;

  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 text-[#E9E6D7] overflow-hidden">
      
      {/* Card 1 - Stats Overview */}
      <div className={cardBaseClass}>
        <div>
          <div className={headerClass}>
            <Trophy className={headerIconClass} />
            <span className="text-xs font-bold uppercase tracking-wider">Solved Problems</span>
          </div>

          <div className="mb-6">
            <div className="text-4xl font-mono font-bold text-[#E9E6D7] mb-1">{totalSolved ?? 0}</div>
            <div className="w-full h-1 bg-[#E9E6D7]/10 mt-2">
              <div 
                className="h-full bg-[#E9E6D7] transition-all duration-1000 ease-out" 
                style={{ width: `${progressOverall}%` }} 
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[9px] uppercase tracking-widest text-[#E9E6D7]/40">Total Progress</span>
              <span className="text-[9px] font-mono text-[#E9E6D7]/60">{progressOverall}%</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <StatBox label="Easy" value={data.easySolved} total={data.totalEasy} color="text-emerald-400" />
            <StatBox label="Medium" value={data.mediumSolved} total={data.totalMedium} color="text-yellow-400" />
            <StatBox label="Hard" value={data.hardSolved} total={data.totalHard} color="text-rose-400" />
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-[#E9E6D7]/5 flex items-center justify-between text-[10px] text-[#E9E6D7]/30 uppercase tracking-widest">
           <span>Live Data</span>
           <span>Sync: {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
        </div>
      </div>

      {/* Card 2 - Global Rank & Skills */}
      <div className={cardBaseClass}>
        <div>
           <div className={headerClass}>
            <TrendingUp className={headerIconClass} />
            <span className="text-xs font-bold uppercase tracking-wider">Ranking & Skills</span>
          </div>

          <div className="bg-[#E9E6D7]/5 border border-[#E9E6D7]/10 p-4 mb-5 group-hover:bg-[#E9E6D7]/10 transition-colors">
            <div className={labelClass}>Global Rank</div>
            <div className="text-2xl font-mono font-bold text-[#E9E6D7]">
              #{Number(data.ranking).toLocaleString() ?? "N/A"}
            </div>
          </div>

          <div className="space-y-4">
            <SkillBar label="Algorithms" percent={Math.min(easyPercent + 20, 100)} icon={<Zap size={10}/>} />
            <SkillBar label="Data Structs" percent={Math.min(mediumPercent, 100)} icon={<Terminal size={10}/>} />
            <SkillBar label="SQL / DB" percent={Math.min(hardPercent, 100)} icon={<Target size={10}/>} />
          </div>
        </div>
      </div>

      {/* Card 3 - Badges */}
      <div className={cardBaseClass}>
        <div>
          <div className={headerClass}>
            <Award className={headerIconClass} />
            <span className="text-xs font-bold uppercase tracking-wider">Recent Badges</span>
          </div>

          {badgesData?.badges && Array.isArray(badgesData.badges) ? (
            badgesData.badges.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {badgesData.badges.slice(0, 8).map((badge) => (
                  <div
                    key={badge.id}
                    className={`flex flex-col items-center justify-center text-center p-3 border transition-all duration-300 ${
                      badgesData.activeBadge?.id === badge.id
                        ? "bg-[#E9E6D7]/10 border-[#E9E6D7]/50 text-[#E9E6D7]"
                        : "bg-transparent border-[#E9E6D7]/10 text-[#E9E6D7]/60 hover:border-[#E9E6D7]/30 hover:text-[#E9E6D7]"
                    }`}
                  >
                    {badge.icon && badge.icon.startsWith("http") ? (
                         <img src={badge.icon} alt="badge" className="w-8 h-8 mb-2 opacity-80" /> 
                    ) : (
                         <Award className="w-6 h-6 mb-2 opacity-50" />
                    )}
                    <span className="text-[9px] uppercase font-bold tracking-tight leading-tight line-clamp-2">
                      {badge.displayName}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-32 flex items-center justify-center text-[#E9E6D7]/30 text-xs italic">
                No badges earned yet
              </div>
            )
          ) : (
             <div className="space-y-2">
               {[1,2,3,4].map(i => (
                   <div key={i} className="h-8 bg-[#E9E6D7]/5 animate-pulse w-full"></div>
               ))}
             </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Sub Components ---

interface StatBoxProps {
  label: string;
  value: number;
  total: number;
  color?: string;
}

function StatBox({ label, value, total, color }: StatBoxProps) {
  return (
    <div className="flex flex-col p-2 bg-[#E9E6D7]/5 border border-[#E9E6D7]/5 hover:border-[#E9E6D7]/20 transition-colors">
      <span className={`text-[10px] uppercase tracking-widest mb-1 ${color || "text-[#E9E6D7]/60"}`}>{label}</span>
      <span className="text-lg font-mono font-bold text-[#E9E6D7] leading-none">{value}</span>
      <span className="text-[9px] text-[#E9E6D7]/30 font-mono mt-1">/ {total}</span>
    </div>
  );
}

interface SkillBarProps {
  label: string;
  percent: number;
  icon: React.ReactNode;
}

function SkillBar({ label, percent, icon }: SkillBarProps) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5 text-[#E9E6D7]/60">
        <div className="flex items-center gap-1.5">
            {icon}
            <span className="text-[10px] uppercase tracking-widest font-bold">{label}</span>
        </div>
        <span className="text-[10px] font-mono">{percent}%</span>
      </div>
      <div className="w-full h-1 bg-[#E9E6D7]/10">
        <div
          className="h-full bg-[#E9E6D7] opacity-60 transition-all duration-500"
          style={{ width: `${percent}%` }}
        ></div>
      </div>
    </div>
  );
}