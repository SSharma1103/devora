"use client";

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
import { UserProfile } from "@/types";
import OpenSource from "@/components/OpenSource";
// 1. Import the hook
import { useResurceManager } from "@/hooks/useResourceManager";

export default function UserProfilePage() {
  const params = useParams();

  // Safely derive a string username from params
  const rawUsername = params.username;
  const username =
    (Array.isArray(rawUsername) ? rawUsername[0] : rawUsername) ?? "";

  // 2. Use the hook to fetch user data
  // Note: The API returns a single object for this endpoint, but the hook is typed for arrays.
  // We use the hook for its loading/error logic and cast the result below.
  const {
    items: userRaw,
    loading,
    error,
  } = useResurceManager<UserProfile>(
    username ? `/api/user?username=${encodeURIComponent(username)}` : ""
  );

  // 3. Cast the result: The runtime value will be the User object, not an array.
  // We treat the "items" state as the single user profile.
  const user = userRaw as unknown as UserProfile | null;

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

        {/* 4. Check if we have valid user data (and ensure it's not the initial empty array from the hook) */}
        {user && !Array.isArray(user) && !loading && !error && (
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

                      <OpenSource data={user.gitdata.osContributions} />

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