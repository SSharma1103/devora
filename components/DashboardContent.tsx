"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { JsonValue } from "@prisma/client/runtime/library";

import WorkExperience from "./WorkExperience";
import Projects from "./Projects";
import GitHub from "./GitHub";
import LeetCodeStatsCard from "./Leetcode";
import RightSidebar from "./RightSidebar";
import OpenSourceSection from "./OpenSourceSection";

// ✅ EXACT Prisma-aligned type
interface Pdata {
  id: number;
  userId: number | null;
  about: string | null;
  devstats: string | null;
  stack: string | null;
  socials: JsonValue;
}

export default function DashboardContent() {
  const [activeTab, setActiveTab] = useState<
    "work" | "projects" | "github" | "opensource" | "leetcode"
  >("work");

  const { data: session } = useSession();
  const leetuser = session?.user?.leetcode ?? null;
  console.log(leetuser)

  const [pdata, setPdata] = useState<Pdata | null>(null);
  const [loadingPdata, setLoadingPdata] = useState(true);

  useEffect(() => {
    async function fetchPdata() {
      try {
        const res = await fetch("/api/pdata");
        if (!res.ok) throw new Error("Failed to fetch personal data");

        const json = await res.json();
        const data = json.data;

        // ✅ Normalize API response (NO undefined allowed)
        setPdata({
          id: data.id,
          userId: data.userId ?? null,
          about: data.about ?? null,
          devstats: data.devstats ?? null,
          stack: data.stack ?? null,
          socials: data.socials ?? null,
        });
      } catch (err) {
        console.error("Pdata fetch error:", err);
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

      case "opensource":
        return <OpenSourceSection />;

      case "leetcode":
        if (loadingPdata) {
          return <div className="text-neutral-400">Loading LeetCode data...</div>;
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
              {[
                ["work", "Work Experience"],
                ["projects", "Projects"],
                ["github", "GitHub"],
                ["opensource", "Open Source"],
                ["leetcode", "Leetcode"],
              ].map(([key, label]) => (
                <li
                  key={key}
                  className={`pb-3 cursor-pointer whitespace-nowrap ${
                    activeTab === key
                      ? "text-[#E9E6D7] font-semibold border-b-2 border-white"
                      : "text-neutral-500 hover:text-[#E9E6D7]/70"
                  }`}
                  onClick={() => setActiveTab(key as any)}
                >
                  {label}
                </li>
              ))}
            </ul>
          </nav>

          {/* Content */}
          <section className="mt-6 w-full">{renderContent()}</section>
        </div>

        {/* Sidebar */}
        <div>
          <RightSidebar pdata={pdata} />
        </div>
      </div>
    </main>
  );
}
