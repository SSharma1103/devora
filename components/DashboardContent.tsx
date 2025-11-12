"use client";

import React, { useState } from "react";
import WorkExperience from "./WorkExperience";
import Projects from "./Projects";
import GitHub from "./GitHub";
import LeetCodeStatsCard from "./Leetcode";
import RightSidebar from "./RightSidebar"

export default function DashboardContent() {
  const [activeTab, setActiveTab] = useState<
    "work" | "projects" | "github" | "leetcode"
  >("work");

  const renderContent = () => {
    switch (activeTab) {
      case "work":
        return <WorkExperience />;
      case "projects":
        return <Projects />;
      case "github":
        return (<div>
        <GitHub /><div className="h-2"></div><GitHub/></div>);
      case "leetcode":
        return <LeetCodeStatsCard />;
      default:
        return null;
    }
  };

  return (
    <main className="flex-1 bg-black min-h-screen text-white">
      <div className="flex justify-start">
      <div className="pt-  max-w-4xl">
        {/* Profile info */}
        

        {/* Tabs */}
        <nav className="border-b border-neutral-800 ">
          <ul className="flex gap-8">
            <li
              className={`pb-3 cursor-pointer ${
                activeTab === "work"
                  ? "text-white font-semibold border-b-2 border-white"
                  : "text-neutral-500"
              }`}
              onClick={() => setActiveTab("work")}
            >
              Work Experience
            </li>
            <li
              className={`pb-3 cursor-pointer ${
                activeTab === "projects"
                  ? "text-white font-semibold border-b-2 border-white"
                  : "text-neutral-500"
              }`}
              onClick={() => setActiveTab("projects")}
            >
              Projects
            </li>
            <li
              className={`pb-3 cursor-pointer ${
                activeTab === "github"
                  ? "text-white font-semibold border-b-2 border-white"
                  : "text-neutral-500"
              }`}
              onClick={() => setActiveTab("github")}
            >
              GitHub
            </li>
            <li
              className={`pb-3 cursor-pointer ${
                activeTab === "leetcode"
                  ? "text-white font-semibold border-b-2 border-white"
                  : "text-neutral-500"
              }`}
              onClick={() => setActiveTab("leetcode")}
            >
              Leetcode
            </li>
          </ul>
        </nav>

        {/* Render selected content */}
        <section className="mt-6 w-full min-w-[850px] max-w-5xl">{renderContent()}</section>
      </div>
      <div><RightSidebar/></div>
      </div>
    </main>
  );
}
