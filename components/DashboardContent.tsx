"use client";

import { useState, useEffect } from "react";
import WorkExperience from "./WorkExperience";
import Projects from "./Projects";
import GitHub from "./GitHub";
import LeetCodeStatsCard from "./Leetcode";
import RightSidebar from "./RightSidebar";
import OpenSourceSection from "./OpenSourceSection"; // <-- Import the new section
import { useSession } from "next-auth/react";

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

export default function DashboardContent() {
  // Add "opensource" to the tab type
  const [activeTab, setActiveTab] = useState<
    "work" | "projects" | "github" | "opensource" | "leetcode"
  >("work");
  
  const { data: session } = useSession();
  const leetuser = session?.user?.leetcode;

  const [pdata, setPdata] = useState<Pdata | null>(null);
  const [loadingPdata, setLoadingPdata] = useState(true);

  useEffect(() => {
    async function fetchPdata() {
      try {
        const res = await fetch("/api/pdata");
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
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case "work":
        return <WorkExperience />;
      case "projects":
        return <Projects />;
      case "github":
        return <GitHub />;
      case "opensource": // <-- New Case
        return <OpenSourceSection />;
      case "leetcode":
        if (loadingPdata) {
          return <div>Loading LeetCode data...</div>;
        }
        return <LeetCodeStatsCard leetcodeUsername={leetuser} />;
      default:
        return null;
    }
  };

  return (
    <main className="flex-1 bg-black min-h-screen text-[#E9E6D7]">
      <div className="flex justify-start">
        <div className="max-w-4xl w-full">
          {/* Tabs */}
          <nav className="border-b border-neutral-800">
            <ul className="flex gap-8 overflow-x-auto pb-1">
              <li
                className={`pb-3 cursor-pointer whitespace-nowrap ${
                  activeTab === "work"
                    ? "text-[#E9E6D7] font-semibold border-b-2 border-white"
                    : "text-neutral-500 hover:text-[#E9E6D7]/70"
                }`}
                onClick={() => setActiveTab("work")}
              >
                Work Experience
              </li>
              <li
                className={`pb-3 cursor-pointer whitespace-nowrap ${
                  activeTab === "projects"
                    ? "text-[#E9E6D7] font-semibold border-b-2 border-white"
                    : "text-neutral-500 hover:text-[#E9E6D7]/70"
                }`}
                onClick={() => setActiveTab("projects")}
              >
                Projects
              </li>
              <li
                className={`pb-3 cursor-pointer whitespace-nowrap ${
                  activeTab === "github"
                    ? "text-[#E9E6D7] font-semibold border-b-2 border-white"
                    : "text-neutral-500 hover:text-[#E9E6D7]/70"
                }`}
                onClick={() => setActiveTab("github")}
              >
                GitHub
              </li>
              {/* New Tab */}
              <li
                className={`pb-3 cursor-pointer whitespace-nowrap ${
                  activeTab === "opensource"
                    ? "text-[#E9E6D7] font-semibold border-b-2 border-white"
                    : "text-neutral-500 hover:text-[#E9E6D7]/70"
                }`}
                onClick={() => setActiveTab("opensource")}
              >
                Open Source
              </li>
              <li
                className={`pb-3 cursor-pointer whitespace-nowrap ${
                  activeTab === "leetcode"
                    ? "text-[#E9E6D7] font-semibold border-b-2 border-white"
                    : "text-neutral-500 hover:text-[#E9E6D7]/70"
                }`}
                onClick={() => setActiveTab("leetcode")}
              >
                Leetcode
              </li>
            </ul>
          </nav>

          {/* Render selected content */}
          <section className="mt-6 w-full">
            {renderContent()}
          </section>
        </div>
        <div>
          <RightSidebar pdata={pdata} />
        </div>
      </div>
    </main>
  );
}