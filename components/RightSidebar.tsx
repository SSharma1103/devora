//[copy:ssharma1103/devora/devora-b7321077cd9d75e6fb001acbeaa36d22b960d15c/components/RightSidebar.tsx]
"use client";

import { useEffect, useState } from "react";
import { Github, Linkedin, Twitter, Globe, Mail } from "lucide-react";

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
  };
}

// 1. Add Props interface
interface SidebarProps {
  pdata?: Pdata | null; // Make it optional
}

// 2. Accept props
export default function RightSidebar({ pdata: pdataProp }: SidebarProps) {
  const [pdata, setPdata] = useState<Pdata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 3. Update useEffect
  useEffect(() => {
    // If data is passed as a prop, use it directly
    if (pdataProp) {
      setPdata(pdataProp);
      setLoading(false);
      return; // Skip fetching
    }

    // If no prop, fetch data as usual (for the dashboard)
    async function fetchPdata() {
      try {
        const res = await fetch("/api/pdata");
        if (!res.ok) throw new Error("Failed to fetch personal data");
        const json = await res.json();
        setPdata(json.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchPdata();
  }, [pdataProp]); // Add prop to dependency array

  if (loading)
    return (
      <aside className="hidden lg:block w-80 p-4 text-[#E9E6D7] ml-10">
        Loading personal info...
      </aside>
    );

  if (error)
    return (
      <aside className="hidden lg:block w-80 p-4 text-red-400 ml-10">
        Failed to load profile: {error}
      </aside>
    );

  if (!pdata)
    return (
      <aside className="hidden lg:block w-80 p-4 text-[#E9E6D7] ml-10">
        No personal data found.
      </aside>
    );

  const socials = pdata.socials || {};

  return (
    <aside className="hidden lg:block w-80 p-4 text-[#E9E6D7] space-y-6 ml-10">
      {/* About section */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
        <h3 className="text-lg font-semibold mb-2">About</h3>
        <p className="text-sm text-neutral-400 leading-relaxed">
          {pdata.about || "No bio yet."}
        </p>
      </div>

      {/* Social links */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
        <h3 className="text-lg font-semibold mb-3">Connect</h3>
        <div className="flex flex-col gap-3">
          {socials.github && (
            <SocialLink icon={<Github className="w-5 h-5" />} label="GitHub" url={socials.github} />
          )}
          {socials.twitter && (
            <SocialLink icon={<Twitter className="w-5 h-5" />} label="Twitter" url={socials.twitter} />
          )}
          {socials.linkedin && (
            <SocialLink icon={<Linkedin className="w-5 h-5" />} label="LinkedIn" url={socials.linkedin} />
          )}
          {socials.portfolio && (
            <SocialLink icon={<Globe className="w-5 h-5" />} label="Portfolio" url={socials.portfolio} />
          )}
          {socials.email && (
            <SocialLink icon={<Mail className="w-5 h-5" />} label="Email" url={`mailto:${socials.email}`} />
          )}
        </div>
      </div>

      {/* Developer Stats */}
      {pdata.devstats && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
          <h3 className="text-lg font-semibold mb-3">Developer Stats</h3>
          <p className="text-sm text-neutral-400 leading-relaxed whitespace-pre-line">
            {pdata.devstats}
          </p>
        </div>
      )}

      {/* Tech Stack */}
      {pdata.stack && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
          <h3 className="text-lg font-semibold mb-3">Tech Stack</h3>
          <div className="flex flex-wrap gap-2 text-xs">
            {pdata.stack.split(",").map((tech) => (
              <span
                key={tech.trim()}
                className="bg-neutral-800 border border-neutral-700 text-neutral-300 px-2 py-1 rounded-full"
              >
                {tech.trim()}
              </span>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}

/** 🔗 Helper Component for Social Links */
function SocialLink({
  icon,
  label,
  url,
}: {
  icon: React.ReactNode;
  label: string;
  url: string;
}) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 hover:text-blue-400 transition"
    >
      {icon}
      <span>{label}</span>
    </a>
  );
}