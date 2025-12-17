// app/[username]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Sidebar from "@/components/sidebar";
import PublicProfileHeader from "@/components/PublicProfileHeader";
import WorkExperience from "@/components/WorkExperience";
import Projects from "@/components/Projects";
import GitHub from "@/components/GitHub";
import LeetCodeStatsCard from "@/components/Leetcode";
import RightSidebar from "@/components/RightSidebar";
import GithubPublic from "@/components/PublicGitData";
import { Loader2 } from "lucide-react";
import {UserProfile,User, ApiResponse} from "@/types"


export default function UserProfilePage() {
  const params = useParams();

  // Safely derive a string username from params
  const rawUsername = params.username;
  const username =
    (Array.isArray(rawUsername) ? rawUsername[0] : rawUsername) ?? "";

  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!username) return;

    const fetchUserData = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `/api/user?username=${encodeURIComponent(username)}`
        );
        const data = (await res.json())as ApiResponse<UserProfile>;

        if (!res.ok) {
          throw new Error(data.error || "User not found");
        }

        if(data.data)setUser(data.data);
        setError(null);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [username]);

  return (
    <div className="flex bg-black text-[#E9E6D7] min-h-screen">
      <Sidebar />

      <main className="flex-1 ml-20 p-8 overflow-y-auto">
        {loading && (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="animate-spin h-8 w-8 text-[#E9E6D7]" />
          </div>
        )}

        {error && !loading && (
          <div className="flex justify-center items-center h-64">
            <p className="text-red-500">{error}</p>
          </div>
        )}

        {user && !loading && !error && (
          <div className="w-full">
            <PublicProfileHeader
              user={user}
              isFollowedByCurrentUser={user.isFollowedByCurrentUser}
              isCurrentUser={user.isCurrentUser}
              followerCount={user._count.followers}
              followingCount={user._count.following}
            />

            {/* Main Content Area */}
            <div className="mt-20">
              <main className="flex-1 bg-black min-h-screen text-[#E9E6D7]">
                <div className="flex justify-start">
                  <div className="max-w-4xl">
                    <section className="mt-6 w-full min-w-[850px] max-w-5xl space-y-8">
                      <WorkExperience workExpData={user.workExp} />
                      <Projects projectsData={user.projects} />

                      {/* Public GitHub card – username is guaranteed string here */}
                      <GithubPublic username={username} />

                      <LeetCodeStatsCard
                        leetcodeUsername={user.pdata?.socials?.leetcode}
                      />
                    </section>
                  </div>
                  <div>
                    <RightSidebar pdata={user.pdata} />
                  </div>
                </div>
              </main>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
