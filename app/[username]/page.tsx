//[copy:ssharma1103/devora/devora-b7321077cd9d75e6fb001acbeaa36d22b960d15c/app/[username]/page.tsx]
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Sidebar from "@/components/sidebar";
import PublicProfileHeader from "@/components/PublicProfileHeader"; // We will create this
import WorkExperience from "@/components/WorkExperience";
import Projects from "@/components/Projects";
import GitHub from "@/components/GitHub";
import LeetCodeStatsCard from "@/components/Leetcode";
import RightSidebar from "@/components/RightSidebar";
import { Loader2 } from "lucide-react";

// Define a type for the full user data we expect from the API
// Based on your prisma schema and API route
interface UserProfile {
  id: number;
  name: string | null;
  username: string;
  pfp: string | null;
  banner: string | null;
  gitdata: any; // Define this type more strictly based on Gitdata model
  pdata: any; // Define this type more strictly based on Pdata model
  projects: any[]; // Define this type more strictly based on Project model
  workExp: any[]; // Define this type more strictly based on WorkExp model
}

export default function UserProfilePage() {
  const params = useParams();
  const username = params.username as string;

  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (username) {
      const fetchUserData = async () => {
        try {
          setLoading(true);
          const res = await fetch(`/api/user?username=${encodeURIComponent(username)}`);
          const data = await res.json();

          if (!res.ok) {
            throw new Error(data.error || "User not found");
          }

          setUser(data.data);
          setError(null);
        } catch (err: any) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };

      fetchUserData();
    }
  }, [username]);

  return (
    <div className="flex bg-black text-white min-h-screen">
      <Sidebar />

      <main className="flex-1 ml-20 p-8 overflow-y-auto">
        {loading && (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="animate-spin h-8 w-8 text-gray-400" />
          </div>
        )}

        {error && (
          <div className="flex justify-center items-center h-64">
            <p className="text-red-500">{error}</p>
          </div>
        )}

        {user && (
          <div className="w-full">
            {/* 1. Profile Header (Banner, PFP, Name) */}
            <PublicProfileHeader user={user} />

            {/* 2. Main Content Area */}
            <div className="mt-20">
              <main className="flex-1 bg-black min-h-screen text-white">
                <div className="flex justify-start">
                  <div className="pt- max-w-4xl">
                    
                    {/* Render read-only components, passing fetched data as props */}
                    <section className="mt-6 w-full min-w-[850px] max-w-5xl space-y-8">
                      <WorkExperience workExpData={user.workExp} />
                      <Projects projectsData={user.projects} />
                      <GitHub gitData={user.gitdata} />
                      <LeetCodeStatsCard leetcodeUsername={user.pdata?.socials?.leetcode} />
                    </section>

                  </div>
                  <div>
                    {/* Pass pdata to RightSidebar */}
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