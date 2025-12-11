"use client";

import { GitPullRequest, Star, ExternalLink } from "lucide-react";

interface RepoContribution {
  name: string;
  owner: string;
  stars: number;
  desc: string;
  url: string;
  prCount: number;
  primaryLanguage: { name: string; color: string } | null;
}

export default function OpenSource({ data }: { data: RepoContribution[] }) {

  return (
    <div className="w-full bg-[#0a0a0a] border border-[#E9E6D7]/10 p-6 mt-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-purple-500/10 text-purple-400 rounded-sm">
          <GitPullRequest size={20} />
        </div>
        <div>
          <h2 className="text-[#E9E6D7] font-bold text-lg">Open Source</h2>
          <p className="text-[10px] text-[#E9E6D7]/40 uppercase tracking-widest">
            Contributions to Public Repositories
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.map((repo) => (
          <a 
            key={`${repo.owner}/${repo.name}`}
            href={repo.url}
            target="_blank"
            className="group block bg-black border border-[#E9E6D7]/10 p-4 hover:border-[#E9E6D7]/40 transition-all"
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-[#E9E6D7] font-mono text-sm font-bold group-hover:text-purple-400 transition-colors">
                {repo.owner} / {repo.name}
              </span>
              <div className="flex items-center gap-1 text-[#E9E6D7]/40 text-xs">
                <Star size={12} />
                {repo.stars.toLocaleString()}
              </div>
            </div>
            
            <p className="text-[#E9E6D7]/60 text-xs line-clamp-2 mb-4 h-8">
              {repo.desc}
            </p>

            <div className="flex items-center justify-between pt-3 border-t border-[#E9E6D7]/5">
              <div className="flex items-center gap-2">
                {repo.primaryLanguage && (
                  <span className="flex items-center gap-1.5 text-[10px] text-[#E9E6D7]/60">
                    <span 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: repo.primaryLanguage.color }}
                    />
                    {repo.primaryLanguage.name}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-bold bg-[#E9E6D7]/10 text-[#E9E6D7] px-2 py-1 rounded">
                {repo.prCount} PR{repo.prCount > 1 ? 's' : ''}
              </span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}