"use client";

import { useState, useEffect } from "react";
import { 
  FolderGit2, 
  Plus, 
  Loader2, 
  Globe, 
  Github, 
  ArrowUpRight,
  LayoutGrid,
  Terminal,
  X
} from "lucide-react";

interface Project {
  id?: number;
  title: string;
  description?: string;
  link?: string;
  gitlink?: string;
  createdAt?: string;
}

interface ProjectsProps {
  projectsData?: Project[];
}

export default function Projects({ projectsData }: ProjectsProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newProject, setNewProject] = useState({
    title: "",
    description: "",
    link: "",
    gitlink: "",
  });

  useEffect(() => {
    if (projectsData) {
      setProjects(projectsData);
      setLoading(false);
      return;
    }

    const fetchProjects = async () => {
      try {
        const res = await fetch("/api/projects");
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || "Failed to fetch projects");

        setProjects(data.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [projectsData]);

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.title.trim()) {
      setError("Project title is required");
      return;
    }

    try {
      setAdding(true);
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProject),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add project");

      setProjects((prev) => [data.data, ...prev]);
      setNewProject({ title: "", description: "", link: "", gitlink: "" });
      setShowForm(false);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  };

  // --- Theme Constants ---
  const inputClasses = "w-full p-3 bg-[#0a0a0a] border border-[#E9E6D7]/20 rounded-none focus:outline-none focus:border-[#E9E6D7] focus:ring-1 focus:ring-[#E9E6D7] transition-all text-[#E9E6D7] placeholder-[#E9E6D7]/30 text-sm";
  const labelClasses = "block text-[10px] font-bold text-[#E9E6D7]/50 uppercase tracking-widest mb-1.5";

  if (loading)
    return (
      <div className="w-full h-40 bg-[#0a0a0a] border border-[#E9E6D7]/20 flex flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-[#E9E6D7]/40" size={24} />
        <span className="text-xs text-[#E9E6D7]/60 tracking-wider uppercase animate-pulse">Loading Projects...</span>
      </div>
    );

  return (
    <section id="projects" className="w-full text-[#E9E6D7]">
      
      {/* Header Section */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#E9E6D7]/10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#E9E6D7]/5 text-[#E9E6D7] rounded-sm">
            <LayoutGrid size={18} />
          </div>
          <div>
            <h2 className="text-[#E9E6D7] font-bold text-sm tracking-tight uppercase">Selected Works</h2>
            <p className="text-[10px] text-[#E9E6D7]/40 uppercase tracking-widest mt-0.5">Portfolio & Experiments</p>
          </div>
        </div>

        {/* Add Button (Only if owner) */}
        {!projectsData && (
          <button
            onClick={() => setShowForm(!showForm)}
            className={`flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all ${
              showForm 
                ? "bg-red-900/20 text-red-400 hover:bg-red-900/30" 
                : "bg-[#E9E6D7] text-black hover:bg-white"
            }`}
          >
            {showForm ? (
              <>
                <X size={12} />
                <span>Cancel</span>
              </>
            ) : (
              <>
                <Plus size={12} />
                <span>Add Project</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Add Project Form */}
      {showForm && !projectsData && (
        <div className="mb-8 bg-[#050505] border border-[#E9E6D7]/20 p-6 animate-in fade-in slide-in-from-top-4 duration-200">
           <div className="flex items-center gap-2 mb-4 text-[#E9E6D7]/60">
              <Terminal size={14} />
              <span className="text-xs font-mono">new_project_entry.json</span>
           </div>
           
           <form onSubmit={handleAddProject} className="space-y-4">
            <div>
              <label className={labelClasses}>Project Title</label>
              <input
                type="text"
                placeholder="Ex: AI Image Generator"
                className={inputClasses}
                value={newProject.title}
                onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
              />
            </div>
            
            <div>
              <label className={labelClasses}>Description</label>
              <textarea
                placeholder="What did you build? What stack did you use?"
                className={`${inputClasses} h-24 resize-none`}
                value={newProject.description}
                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClasses}>Live Demo URL</label>
                <input
                  type="text"
                  placeholder="https://..."
                  className={inputClasses}
                  value={newProject.link}
                  onChange={(e) => setNewProject({ ...newProject, link: e.target.value })}
                />
              </div>
              <div>
                <label className={labelClasses}>GitHub Repo URL</label>
                <input
                  type="text"
                  placeholder="https://github.com/..."
                  className={inputClasses}
                  value={newProject.gitlink}
                  onChange={(e) => setNewProject({ ...newProject, gitlink: e.target.value })}
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={adding}
                className="w-full flex justify-center items-center gap-2 bg-[#E9E6D7] hover:bg-white text-black py-3 text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50"
              >
                {adding ? (
                  <>
                    <Loader2 className="animate-spin" size={14} />
                    <span>Processing...</span>
                  </>
                ) : (
                  "Create Entry"
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {error && (
        <div className="mb-6 p-3 bg-red-900/10 border border-red-900/30 text-red-400 text-xs flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
          {error}
        </div>
      )}

      {/* Project Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {projects.length > 0 ? (
          projects.map((project) => (
            <div
              key={project.id}
              className="group bg-[#0a0a0a] border border-[#E9E6D7]/10 p-5 flex flex-col justify-between hover:border-[#E9E6D7]/40 transition-all hover:translate-y-0.5 duration-300"
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 bg-[#E9E6D7]/5 text-[#E9E6D7] rounded-sm group-hover:bg-[#E9E6D7] group-hover:text-black transition-colors duration-300">
                    <FolderGit2 size={18} />
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-x-2 group-hover:translate-x-0">
                    {project.link && (
                      <a 
                        href={project.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-1.5 hover:bg-[#E9E6D7] hover:text-black text-[#E9E6D7]/60 transition-colors"
                      >
                        <ArrowUpRight size={16} />
                      </a>
                    )}
                    {project.gitlink && (
                      <a 
                        href={project.gitlink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-1.5 hover:bg-[#E9E6D7] hover:text-black text-[#E9E6D7]/60 transition-colors"
                      >
                        <Github size={16} />
                      </a>
                    )}
                  </div>
                </div>

                <h3 className="text-[#E9E6D7] font-bold text-lg mb-2 group-hover:text-white transition-colors">
                  {project.title}
                </h3>
                
                {project.description && (
                  <p className="text-[#E9E6D7]/60 text-sm leading-relaxed line-clamp-3">
                    {project.description}
                  </p>
                )}
              </div>

              {/* Links Footer (Always visible version if you prefer, currently using hover icons top right) */}
              <div className="mt-5 pt-4 border-t border-[#E9E6D7]/5 flex gap-4 text-xs font-mono text-[#E9E6D7]/40">
                 {project.gitlink && (
                    <div className="flex items-center gap-1.5">
                       <Github size={12} />
                       <span>Source</span>
                    </div>
                 )}
                 {project.link && (
                    <div className="flex items-center gap-1.5">
                       <Globe size={12} />
                       <span>Live</span>
                    </div>
                 )}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full border border-dashed border-[#E9E6D7]/20 rounded-lg p-12 text-center bg-[#0a0a0a]/50">
            <p className="text-[#E9E6D7]/40 text-sm">No projects cataloged yet.</p>
            {!projectsData && (
              <button 
                onClick={() => setShowForm(true)}
                className="mt-4 text-[#E9E6D7] text-xs font-bold uppercase tracking-wider underline underline-offset-4 hover:text-white"
              >
                Initialize First Project
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}