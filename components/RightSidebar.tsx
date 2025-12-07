"use client";

import { useEffect, useState } from "react";
import { 
  Github, 
  Linkedin, 
  Twitter, 
  Globe, 
  Mail, 
  Terminal, 
  Cpu, 
  Network, 
  User, 
  Loader2,
  AlertCircle 
} from "lucide-react";

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

interface SidebarProps {
  pdata?: Pdata | null;
}

export default function RightSidebar({ pdata: pdataProp }: SidebarProps) {
  const [pdata, setPdata] = useState<Pdata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (pdataProp) {
      setPdata(pdataProp);
      setLoading(false);
      return;
    }

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
  }, [pdataProp]);

  // --- Theme Constants ---
  const cardClass = "bg-[#0a0a0a] border border-[#E9E6D7]/10 p-5 hover:border-[#E9E6D7]/30 transition-colors group";
  const headerClass = "text-[10px] font-bold text-[#E9E6D7]/50 uppercase tracking-widest mb-3 flex items-center gap-2";
  const textClass = "text-[#E9E6D7]/80 text-sm leading-relaxed font-light";

  if (loading)
    return (
      <aside className="hidden lg:flex w-80 flex-col gap-4 ml-8 sticky top-24">
        <div className={`${cardClass} h-40 flex flex-col items-center justify-center gap-3 animate-pulse`}>
           <Loader2 className="animate-spin text-[#E9E6D7]/20" size={24} />
           <span className="text-[10px] text-[#E9E6D7]/40 uppercase tracking-widest">Loading Bio...</span>
        </div>
      </aside>
    );

  if (error)
    return (
      <aside className="hidden lg:block w-80 ml-8 sticky top-24">
        <div className="bg-red-900/10 border border-red-900/30 p-4 flex items-center gap-3 text-red-400">
           <AlertCircle size={18} />
           <span className="text-xs">Failed to load profile.</span>
        </div>
      </aside>
    );

  if (!pdata)
    return (
      <aside className="hidden lg:block w-80 ml-8 sticky top-24">
         <div className="border border-dashed border-[#E9E6D7]/20 p-8 text-center">
            <p className="text-[#E9E6D7]/40 text-xs uppercase tracking-widest">No Profile Data</p>
         </div>
      </aside>
    );

  const socials = pdata.socials || {};

  return (
    <aside className="hidden lg:flex w-80 flex-col gap-5 ml-8 sticky top-24 h-fit pb-10">
      
      {/* About Section */}
      <div className={cardClass}>
        <div className={headerClass}>
          <User size={12} />
          <span>About</span>
        </div>
        <div className="relative">
            <div className="absolute -left-3 top-0 bottom-0 w-1px bg-[#E9E6D7]/10"></div>
            <p className={textClass}>
            {pdata.about || "No biography available."}
            </p>
        </div>
      </div>

      {/* Developer Stats */}
      {pdata.devstats && (
        <div className={cardClass}>
          <div className={headerClass}>
            <Terminal size={12} />
            <span>Dev Stats</span>
          </div>
          <div className="bg-[#050505] border border-[#E9E6D7]/10 p-3 font-mono text-xs text-[#E9E6D7]/70 whitespace-pre-line leading-relaxed">
            {pdata.devstats}
          </div>
        </div>
      )}

      {/* Tech Stack */}
      {pdata.stack && (
        <div className={cardClass}>
          <div className={headerClass}>
            <Cpu size={12} />
            <span>Tech Stack</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {pdata.stack.split(",").map((tech) => (
              <span
                key={tech.trim()}
                className="bg-[#E9E6D7]/5 border border-[#E9E6D7]/10 text-[#E9E6D7]/80 text-[10px] uppercase font-bold px-2 py-1 tracking-wider hover:bg-[#E9E6D7] hover:text-black transition-colors cursor-default"
              >
                {tech.trim()}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Social Links */}
      <div className={cardClass}>
        <div className={headerClass}>
          <Network size={12} />
          <span>Connect</span>
        </div>
        <div className="flex flex-col gap-1">
          {socials.github && (
            <SocialLink icon={<Github size={14} />} label="GitHub" url={socials.github} />
          )}
          {socials.twitter && (
            <SocialLink icon={<Twitter size={14} />} label="Twitter" url={socials.twitter} />
          )}
          {socials.linkedin && (
            <SocialLink icon={<Linkedin size={14} />} label="LinkedIn" url={socials.linkedin} />
          )}
          {socials.portfolio && (
            <SocialLink icon={<Globe size={14} />} label="Portfolio" url={socials.portfolio} />
          )}
          {socials.email && (
            <SocialLink icon={<Mail size={14} />} label="Email" url={`mailto:${socials.email}`} />
          )}
          
          {/* Fallback if empty */}
          {!socials.github && !socials.twitter && !socials.linkedin && !socials.portfolio && !socials.email && (
             <span className="text-[#E9E6D7]/30 text-xs italic">No social links added.</span>
          )}
        </div>
      </div>

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
      className="group/link flex items-center justify-between p-2 hover:bg-[#E9E6D7] hover:text-black transition-all text-[#E9E6D7]/60"
    >
      <div className="flex items-center gap-3">
         {icon}
         <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
      </div>
      <span className="opacity-0 group-hover/link:opacity-100 -translate-x-2 group-hover/link:translate-x-0 transition-all text-[10px]">
         →
      </span>
    </a>
  );
}