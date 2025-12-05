//[copy:ssharma1103/devora/devora-abc49a529e9b35857e5ebd2022fe0322d0edcfe8/components/Leetcode.tsx]
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { BarChart3, Trophy, TrendingUp, Award } from "lucide-react";

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center space-y-0.5">
      <span className="text-gray-200">{value ?? 0}</span>
      <span className="text-[#E9E6D7] text-xs">{label}</span>
    </div>
  );
}

function ProgressBar({ progress }: { progress: number }) {
  return (
    <div className="flex items-center space-x-2 mt-2">
      <BarChart3 className="h-3 w-3 text-gray-500" />
      <div className="w-full bg-gray-800 rounded-full h-1.5">
        <div
          className="bg-yellow-400 h-1.5 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  );
}

interface LeetCodeProps {
  leetcodeUsername?: string | null;
}

export default function LeetCodeStatsCard({ leetcodeUsername }: LeetCodeProps) {
  const { data: session } = useSession();
  const [data, setData] = useState<any>(null);
  const [badgesData, setBadgesData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUser() {
      let username = leetcodeUsername;

      // If prop is undefined (e.g. Dashboard), fetch from logged-in user's profile via API
      if (username === undefined && session?.username) {
        try {
          const res = await fetch(`/api/user?username=${session.username}`);
          if (res.ok) {
            const json = await res.json();
            if (json.success && json.data) {
              // Fetch directly from the User model field
              username = json.data.leetcode; 
            }
          }
        } catch (err) {
          console.error("Failed to fetch user profile:", err);
        }
      }

      // If username is still missing (null prop or not in DB)
      if (!username) {
        setLoading(false);
        // If explicit null passed (profile view of user without LC), or DB empty
        if (leetcodeUsername === null) {
           // Intentionally silent or specific message if needed, but usually handled by parent
           setError("No LeetCode username found for this user.");
        } else {
           // Dashboard case but empty
           setError(null); // Just show "No data found" state (handled by !data check below)
        }
        return;
      }

      try {
        setLoading(true);
        const [profileRes, badgesRes] = await Promise.all([
          fetch(`https://backendpoint-alpha.vercel.app/${username}/profile`),
          fetch(`https://backendpoint-alpha.vercel.app/${username}/badges`),
        ]);

        if (!profileRes.ok || !badgesRes.ok)
          throw new Error("Failed to fetch data (user may not exist or API is down)");

        const profileData = await profileRes.json();
        const badgesData = await badgesRes.json();

        setData(profileData);
        setBadgesData(badgesData);
        setError(null);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    // Only run when we have a definite state for leetcodeUsername or session is loaded
    if (leetcodeUsername !== undefined || session?.username) {
        fetchUser();
    } else if (leetcodeUsername === undefined && session === null) {
        // Not logged in and no prop? Stop loading.
        setLoading(false);
    }
  }, [leetcodeUsername, session]);

  if (loading)
    return <div className="text-[#E9E6D7] text-sm p-5">Loading LeetCode stats...</div>;
  
  if (error)
    return <div className="text-red-500 text-sm p-5">{error}</div>;
  
  if (!data)
    return <div className="text-[#E9E6D7] text-sm p-5">No LeetCode data found</div>;

  // derived values
  const totalSolved = data.easySolved + data.mediumSolved + data.hardSolved;
  const easyPercent = data.totalEasy ? Math.round((data.easySolved / data.totalEasy) * 100) : 0;
  const mediumPercent = data.totalMedium ? Math.round((data.mediumSolved / data.totalMedium) * 100) : 0;
  const hardPercent = data.totalHard ? Math.round((data.hardSolved / data.totalHard) * 100) : 0;
  
  const totalQuestions = data.totalEasy + data.totalMedium + data.totalHard;
  const progressOverall = totalQuestions > 0 ? Math.min(Math.round((totalSolved / totalQuestions) * 100), 100) : 0;

  return (
    <div className="flex flex-row bg-black border border-gray-800 rounded-xl  p-3 justify-start space-x-4">
      {/* Card 1 - LeetCode Stats */}
      <div className="w-80 bg-black border border-gray-800 rounded-xl p-3 flex flex-col space-y-4 hover:border-gray-600 transition">
        <div className="flex items-center justify-between">
          <h2 className="text-gray-100 font-medium text-base">LeetCode Stats</h2>
          <Trophy className="text-yellow-400 h-4 w-4 opacity-80" />
        </div>

        <div className="text-center">
          <div className="text-3xl font-semibold text-gray-100">{totalSolved ?? 0}</div>
          <div className="text-gray-500 text-xs tracking-wide">Problems Solved</div>
        </div>

        <div className="flex justify-between text-xs text-[#E9E6D7]">
          <Stat label="Easy" value={data.easySolved} />
          <Stat label="Medium" value={data.mediumSolved} />
          <Stat label="Hard" value={data.hardSolved} />
        </div>

        <ProgressBar progress={progressOverall} />

        <div className="text-[10px] text-gray-600 text-right">
          Last updated:{" "}
          {new Date().toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </div>
      </div>

      {/* Card 2 - Ranking & Skills */}
      <div className="w-60 bg-black border border-gray-800 rounded-xl p-3 flex flex-col space-y-4 hover:border-gray-600 transition">
        <div className="flex items-center justify-between">
          <h2 className="text-gray-100 font-medium text-base">Profile Insights</h2>
          <TrendingUp className="text-green-400 h-4 w-4 opacity-80" />
        </div>

        <div className="bg-black p-2 rounded-lg border border-gray-800">
          <div className="text-xs text-[#E9E6D7]">Global Ranking</div>
          <div className="text-xl font-semibold text-gray-100">
            #{data.ranking ?? "N/A"}
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-xs text-[#E9E6D7]">Skill Stats</div>
          <SkillBar label="Algorithms" percent={Math.min(easyPercent + 20, 100)} />
          <SkillBar label="Data Structures" percent={Math.min(mediumPercent, 100)} />
          <SkillBar label="SQL" percent={Math.min(hardPercent, 100)} />
        </div>
      </div>

      {/* Card 3 - Badges (Top 9 by name only) */}
      <div className="w-64 bg-black border border-gray-800 rounded-xl p-3 flex flex-col space-y-3 hover:border-gray-600 transition">
        <div className="flex items-center justify-between">
          <h2 className="text-gray-100 font-medium text-base">Badges</h2>
          <Award className="text-purple-400 h-4 w-4 opacity-80" />
        </div>

        {badgesData?.badges && Array.isArray(badgesData.badges) ? (
          badgesData.badges.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {badgesData.badges.slice(0, 9).map((badge: any) => (
                <div
                  key={badge.id}
                  className={`flex items-center justify-center text-center bg-black border border-gray-800 px-2 py-2 rounded-md text-[11px] text-gray-300 hover:border-gray-600 transition ${
                    badgesData.activeBadge?.id === badge.id
                      ? "border-yellow-400 text-yellow-300"
                      : ""
                  }`}
                >
                  {badge.displayName}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 text-xs">No badges found</div>
          )
        ) : (
          <div className="text-gray-500 text-xs">Loading badges...</div>
        )}
      </div>
    </div>
  );
}

function SkillBar({ label, percent }: { label: string; percent: number }) {
  return (
    <>
      <div className="flex justify-between text-[11px] text-gray-300">
        <span>{label}</span>
        <span className="text-yellow-400 font-semibold">{percent}%</span>
      </div>
      <div className="w-full bg-gray-800 rounded-full h-1.5">
        <div
          className="bg-yellow-400 h-1.5 rounded-full transition-all duration-500"
          style={{ width: `${percent}%` }}
        ></div>
      </div>
    </>
  );
}