"use client";

// 1. Import React hooks
import React, { useState, useEffect } from "react";
import WorkExperience from "./WorkExperience";
import Projects from "./Projects";
import GitHub from "./GitHub";
import LeetCodeStatsCard from "./Leetcode";
import RightSidebar from "./RightSidebar";

// 2. Define a type for pdata (can be expanded if needed)
interface Pdata {
  about?: string;
  devstats?: string;
  stack?: string;
  socials?: {
    github?: string;
    linkedin?: string;
    twitter?: string;
    portfolio?: string;
    email?: string;
    leetcode?: string | null;
  };
}

// 3. Add a helper function to extract username from URL or direct username
function extractLeetCodeUsername(input: string | null | undefined): string | null {
  if (!input) {
    return null;
  }
  try {
    // Check if it's a full URL
    if (input.includes("leetcode.com")) {
      const url = new URL(input);
      // Get the pathname (e.g., "/username/") and split it
      const pathParts = url.pathname.split('/').filter(part => part.length > 0);
      // The username is usually the first part of the path
      return pathParts[0] || null;
    }
    // Otherwise, assume it's just the username
    return input.trim();
  } catch (e) {
    // If URL parsing fails (e.g., just "username"), return it
    return input.trim();
  }
}

export default function DashboardContent() {
  const [activeTab, setActiveTab] = useState<
    "work" | "projects" | "github" | "leetcode"
  >("work");

  // 4. Add state to hold pdata
  const [pdata, setPdata] = useState<Pdata | null>(null);
  const [loadingPdata, setLoadingPdata] = useState(true);

  // 5. Add useEffect to fetch pdata for the logged-in user
  useEffect(() => {
    async function fetchPdata() {
      try {
        const res = await fetch("/api/pdata"); // API route from your files
        if (!res.ok) throw new Error("Failed to fetch personal data");
        const json = await res.json();
        setPdata(json.data);
      } catch (err: any) {
        console.error(err.message);
      } finally {
        setLoadingPdata(false);
      }
    }
    fetchPdata();
  }, []); // Runs once on component mount

  const renderContent = () => {
    switch (activeTab) {
      case "work":
        return <WorkExperience />;
      case "projects":
        return <Projects />;
      case "github":
        return (
          <div>
            <GitHub />
          </div>
        );
      case "leetcode":
        // 6. Extract and pass the username prop
        if (loadingPdata) {
          return <div>Loading LeetCode data...</div>;
        }
        const leetcodeUsername = extractLeetCodeUsername(pdata?.socials?.leetcode);
        return <LeetCodeStatsCard leetcodeUsername={leetcodeUsername} />; // Pass the prop
      default:
        return null;
    }
  };

  return (
    <main className="flex-1 bg-black min-h-screen text-[#E9E6D7]">
      <div className="flex justify-start">
        <div className="pt-  max-w-4xl">
          {/* Profile info */}

          {/* Tabs */}
          <nav className="border-b border-neutral-800 ">
            <ul className="flex gap-8">
              <li
                className={`pb-3 cursor-pointer ${
                  activeTab === "work"
                    ? "text-[#E9E6D7] font-semibold border-b-2 border-white"
                    : "text-neutral-500"
                }`}
                onClick={() => setActiveTab("work")}
              >
                Work Experience
              </li>
              <li
                className={`pb-3 cursor-pointer ${
                  activeTab === "projects"
                    ? "text-[#E9E6D7] font-semibold border-b-2 border-white"
                    : "text-neutral-500"
                }`}
                onClick={() => setActiveTab("projects")}
              >
                Projects
              </li>
              <li
                className={`pb-3 cursor-pointer ${
                  activeTab === "github"
                    ? "text-[#E9E6D7] font-semibold border-b-2 border-white"
                    : "text-neutral-500"
                }`}
                onClick={() => setActiveTab("github")}
              >
                GitHub
              </li>
              <li
                className={`pb-3 cursor-pointer ${
                  activeTab === "leetcode"
                    ? "text-[#E9E6D7] font-semibold border-b-2 border-white"
                    : "text-neutral-500"
                }`}
                onClick={() => setActiveTab("leetcode")}
              >
                Leetcode
              </li>
            </ul>
          </nav>

          {/* Render selected content */}
          <section className="mt-6 w-full min-w-[850px] max-w-5xl">
            {renderContent()}
          </section>
        </div>
        <div>
          {/* 7. Pass the fetched pdata to RightSidebar */}
          <RightSidebar pdata={pdata} />
        </div>
      </div>
    </main>
  );
}