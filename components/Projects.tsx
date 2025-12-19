"use client";

import { useState } from "react";
import {
  FolderGit2,
  Plus,
  Loader2,
  Globe,
  Github,
  ArrowUpRight,
  LayoutGrid,
  Terminal,
  X,
  Trash2,
  AlertTriangle // Imported for the modal
} from "lucide-react";
import { Project } from "@/types";
import { useResurceManager } from "@/hooks/useResourceManager";

/* 🔒 Form DTO (NO nulls allowed)
  Forms should always use empty strings
*/
interface CreateProjectForm {
  title: string;
  description: string;
  link: string;
  gitlink: string;
}

interface ProjectsProps {
  projectsData?: Project[];
}

export default function Projects({ projectsData }: ProjectsProps) {
  const {
    items: projects,
    loading,
    additem,
    processing: isProcessing,
    error,
    seterror: setError,
    deleteitem,
  } = useResurceManager<Project>("/api/projects", projectsData);

  const [showForm, setShowForm] = useState(false);

  // State for the delete confirmation modal
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [newProject, setNewProject] = useState<CreateProjectForm>({
    title: "",
    description: "",
    link: "",
    gitlink: "",
  });

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newProject.title.trim()) {
      setError("Title is required");
      return;
    }

    const success = await additem({
      ...newProject,
      description: newProject.description || undefined,
      link: newProject.link || undefined,
      gitlink: newProject.gitlink || undefined,
    });

    if (success) {
      setNewProject({
        title: "",
        description: "",
        link: "",
        gitlink: "",
      });
      setShowForm(false);
    }
  };

  // Trigger the confirmation modal
  const promptDelete = (id: number) => {
    setItemToDelete(id);
  }

  // Cancel deletion
  const cancelDelete = () => {
    setItemToDelete(null);
  }

  // Execute deletion
  const confirmDelete = async () => {
    if (itemToDelete === null) return;
    
    setIsDeleting(true);
    await deleteitem(itemToDelete);
    setIsDeleting(false);
    setItemToDelete(null);
  }

  const inputClasses =
    "w-full p-3 bg-[#0a0a0a] border border-[#E9E6D7]/20 focus:outline-none focus:border-[#E9E6D7] focus:ring-1 focus:ring-[#E9E6D7] text-[#E9E6D7] placeholder-[#E9E6D7]/30 text-sm";

  const labelClasses =
    "block text-[10px] font-bold text-[#E9E6D7]/50 uppercase tracking-widest mb-1.5";

  if (loading) {
    return (
      <div className="w-full h-40 border border-[#E9E6D7]/20 flex flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-[#E9E6D7]/40" />
        <span className="text-xs text-[#E9E6D7]/60 uppercase">
          Loading projects...
        </span>
      </div>
    );
  }

  return (
    <section id="projects" className="w-full text-[#E9E6D7] relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#E9E6D7]/10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#E9E6D7]/5">
            <LayoutGrid size={18} />
          </div>
          <div>
            <h2 className="font-bold text-sm uppercase">Selected Works</h2>
            <p className="text-[10px] text-[#E9E6D7]/40 uppercase tracking-widest">
              Portfolio & Experiments
            </p>
          </div>
        </div>

        {!projectsData && (
          <button
            onClick={() => setShowForm(!showForm)}
            className={`flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold uppercase ${
              showForm
                ? "bg-red-900/20 text-red-400"
                : "bg-[#E9E6D7] text-black"
            }`}
          >
            {showForm ? <X size={12} /> : <Plus size={12} />}
            {showForm ? "Cancel" : "Add Project"}
          </button>
        )}
      </div>

      {/* Create Form */}
      {showForm && !projectsData && (
        <div className="mb-8 border border-[#E9E6D7]/20 p-6 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex items-center gap-2 mb-4 text-[#E9E6D7]/60">
            <Terminal size={14} />
            <span className="text-xs font-mono">new_project.json</span>
          </div>

          <form onSubmit={handleAddProject} className="space-y-4">
            <div>
              <label className={labelClasses}>Project Title</label>
              <input
                className={inputClasses}
                value={newProject.title}
                onChange={(e) =>
                  setNewProject({ ...newProject, title: e.target.value })
                }
              />
            </div>

            <div>
              <label className={labelClasses}>Description</label>
              <textarea
                className={`${inputClasses} h-24 resize-none`}
                value={newProject.description}
                onChange={(e) =>
                  setNewProject({
                    ...newProject,
                    description: e.target.value,
                  })
                }
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className={labelClasses}>Live Demo URL</label>
                <input
                  className={inputClasses}
                  value={newProject.link}
                  onChange={(e) =>
                    setNewProject({ ...newProject, link: e.target.value })
                  }
                />
              </div>

              <div>
                <label className={labelClasses}>GitHub Repo URL</label>
                <input
                  className={inputClasses}
                  value={newProject.gitlink}
                  onChange={(e) =>
                    setNewProject({ ...newProject, gitlink: e.target.value })
                  }
                />
              </div>
            </div>

            <button
              disabled={isProcessing}
              className="w-full bg-[#E9E6D7] text-black py-3 text-xs font-bold uppercase disabled:opacity-50"
            >
              {isProcessing ? "Saving..." : "Create Project"}
            </button>
          </form>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-6 p-3 text-red-400 text-xs border border-red-900/30">
          {error}
        </div>
      )}

      {/* Project Cards */}
      <div className="grid md:grid-cols-2 gap-5">
        {projects.map((project) => (
          <div
            key={project.id}
            className="group border border-[#E9E6D7]/10 p-5 hover:border-[#E9E6D7]/40 transition relative"
          >
            <div className="flex justify-between mb-3">
              <FolderGit2 size={18} />

              <div className="flex gap-2">
                {project.link && (
                  <a href={project.link} target="_blank">
                    <ArrowUpRight size={16} />
                  </a>
                )}
                {project.gitlink && (
                  <a href={project.gitlink} target="_blank">
                    <Github size={16} />
                  </a>
                )}
                {!projectsData && (
                  <button
                    onClick={() => promptDelete(project.id)}
                    disabled={isProcessing}
                    className="p-1.5 bg-red-900/20 text-red-400 hover:bg-red-900/40"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>

            <h3 className="font-bold text-lg">{project.title}</h3>

            {project.description && (
              <p className="text-sm text-[#E9E6D7]/60 mt-2">
                {project.description}
              </p>
            )}

            <div className="mt-4 flex gap-4 text-xs text-[#E9E6D7]/40">
              {project.gitlink && <span>Source</span>}
              {project.link && <span>Live</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      {itemToDelete !== null && (
        <div className="fixed inset-0 backdrop-blur-xl bg-black/80 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div 
            className="bg-[#050505] w-full max-w-sm border border-[#E9E6D7]/20 shadow-2xl relative flex flex-col"
            style={{ boxShadow: '0 0 40px -10px rgba(220, 38, 38, 0.1)' }} // Slight red glow
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#E9E6D7]/10 px-5 py-3 bg-[#050505]/95 backdrop-blur-md">
              <div className="flex items-center gap-2 text-red-400">
                <AlertTriangle size={14} />
                <h2 className="text-sm font-bold tracking-tight uppercase">Confirm Deletion</h2>
              </div>
              <button
                onClick={cancelDelete}
                className="text-[#E9E6D7]/40 hover:text-[#E9E6D7] transition-colors p-1"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4 text-[#E9E6D7]/40 text-xs font-mono">
                 <Terminal size={12} />
                 <span>exec delete_project.sh</span>
              </div>
              
              <p className="text-[#E9E6D7]/80 text-sm leading-relaxed mb-6">
                Are you sure you want to remove this project? This action cannot be undone and will be removed from your portfolio.
              </p>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={cancelDelete}
                  disabled={isDeleting}
                  className="flex-1 py-2.5 text-[10px] font-bold uppercase tracking-wider border border-[#E9E6D7]/20 text-[#E9E6D7] hover:bg-[#E9E6D7]/5 hover:border-[#E9E6D7]/40 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="flex-1 py-2.5 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-wider bg-red-900/20 text-red-400 border border-red-900/30 hover:bg-red-900/40 transition-all disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="animate-spin" size={12} />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 size={12} />
                      <span>Delete</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </section>
  );
}