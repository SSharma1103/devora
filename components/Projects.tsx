"use client";

import { useState, useEffect } from "react";
import { FolderGit2, Plus, Loader2 } from "lucide-react";

interface Project {
  id?: number;
  title: string;
  description?: string;
  link?: string;
  gitlink?: string;
  createdAt?: string;
}

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newProject, setNewProject] = useState({
    title: "",
    description: "",
    link: "",
    gitlink: "",
  });

  // Fetch user projects
  useEffect(() => {
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
  }, []);

  // Add new project
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
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-40 text-gray-400">
        <Loader2 className="animate-spin h-5 w-5 mr-2" /> Loading projects...
      </div>
    );

  return (
    <section id="projects" className="w-full max-w-5xl mx-auto text-white">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Projects</h2>
        <button
          onClick={() => {
            const form = document.getElementById("add-project-form");
            form?.classList.toggle("hidden");
          }}
          className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg text-sm text-gray-200 transition"
        >
          <Plus className="h-4 w-4" /> Add Project
        </button>
      </div>

      {/* Add Project Form */}
      <form
        id="add-project-form"
        onSubmit={handleAddProject}
        className="hidden mb-6 bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3"
      >
        <input
          type="text"
          placeholder="Project Title"
          className="w-full p-2 bg-black border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={newProject.title}
          onChange={(e) =>
            setNewProject({ ...newProject, title: e.target.value })
          }
        />
        <textarea
          placeholder="Project Description"
          className="w-full p-2 bg-black border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={newProject.description}
          onChange={(e) =>
            setNewProject({ ...newProject, description: e.target.value })
          }
        />
        <input
          type="text"
          placeholder="Live Link (optional)"
          className="w-full p-2 bg-black border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={newProject.link}
          onChange={(e) =>
            setNewProject({ ...newProject, link: e.target.value })
          }
        />
        <input
          type="text"
          placeholder="GitHub Link (optional)"
          className="w-full p-2 bg-black border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={newProject.gitlink}
          onChange={(e) =>
            setNewProject({ ...newProject, gitlink: e.target.value })
          }
        />

        <button
          type="submit"
          disabled={adding}
          className="w-full flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg transition"
        >
          {adding && <Loader2 className="animate-spin h-4 w-4" />}
          {adding ? "Adding..." : "Add Project"}
        </button>
      </form>

      {error && (
        <div className="text-red-400 text-sm mb-4 border border-red-700 bg-red-900/20 rounded-lg p-3">
          {error}
        </div>
      )}

      {/* Project List */}
      <div className="grid grid-cols-1 gap-6">
        {projects.length > 0 ? (
          projects.map((project) => (
            <div
              key={project.id}
              className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <FolderGit2 className="w-5 h-5 text-blue-400" />
                    <h3 className="text-lg font-semibold">{project.title}</h3>
                  </div>
                  {project.description && (
                    <p className="text-sm text-neutral-400 mt-1">
                      {project.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-3 text-sm">
                {project.link && (
                  <a
                    href={project.link}
                    target="_blank"
                    className="text-blue-400 hover:underline"
                    rel="noopener noreferrer"
                  >
                    Live →
                  </a>
                )}
                {project.gitlink && (
                  <a
                    href={project.gitlink}
                    target="_blank"
                    className="text-gray-400 hover:text-blue-400 transition"
                    rel="noopener noreferrer"
                  >
                    GitHub →
                  </a>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-gray-500 text-center py-8 border border-gray-800 rounded-lg">
            No projects yet. Add one with the button above!
          </div>
        )}
      </div>
    </section>
  );
}
