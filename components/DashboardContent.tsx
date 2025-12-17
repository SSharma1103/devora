"use client";

// 1. Import React hooks
import React, { useState, useEffect } from "react";
import WorkExperience from "./WorkExperience";
import Projects from "./Projects";
import GitHub from "./GitHub";
import LeetCodeStatsCard from "./Leetcode";
import RightSidebar from "./RightSidebar";
import { useSession } from "next-auth/react";
import { Pdata,ApiResponse } from "@/types";
import { useResurceManager } from "@/hooks/useResourceManager";


export default function DashboardContent() {
  const [activeTab, setActiveTab] = useState<
    "work" | "projects" | "github" | "leetcode"
  >("work");
  const {data:session}= useSession()
  const leetuser = session?.user?.leetcode
  const {
    items:pdataList,
    loading:loadingPdata,
  }=useResurceManager<Pdata>("/api/pdata",)

  const pdata = pdataList[0] || null;
 
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
        
        return <LeetCodeStatsCard leetcodeUsername={leetuser} />; // Pass the prop
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