"use client";

import { useState, useEffect } from "react";

interface Project {
  id: number;
  title: string;
  link?: string | null;
  description?: string | null;
  gitlink?: string | null;
}

export default function ProjectsManager() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    link: "",
    description: "",
    gitlink: "",
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/projects");
      const result = await response.json();
      if (result.success) {
        setProjects(result.data);
      } else {
        setError(result.error || "Failed to fetch projects");
      }
    } catch{
      setError("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.title.trim()) {
      setError("Title is required");
      return;
    }

    setLoading(true);
    try {
      const url = editingProject
        ? `/api/projects/${editingProject.id}`
        : "/api/projects";
      const method = editingProject ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      if (result.success) {
        await fetchProjects();
        setShowForm(false);
        setEditingProject(null);
        setFormData({ title: "", link: "", description: "", gitlink: "" });
      } else {
        setError(result.error || "Failed to save project");
      }
    } catch {
      setError("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setFormData({
      title: project.title,
      link: project.link || "",
      description: project.description || "",
      gitlink: project.gitlink || "",
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this project?")) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();
      if (result.success) {
        await fetchProjects();
      } else {
        setError(result.error || "Failed to delete project");
      }
    } catch  {
      setError( "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div>
        <div>
          <button
            onClick={() => {
              setShowForm(!showForm);
              setEditingProject(null);
              setFormData({ title: "", link: "", description: "", gitlink: "" });
            }}
          >
            {showForm ? "Cancel" : "Add Project"}
          </button>
        </div>

        {error && <div>{error}</div>}

        {showForm && (
          <form onSubmit={handleSubmit}>
            <div>
              <label style={{ display: "block", marginBottom: "0.25rem" }}>Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div style={{ marginBottom: "0.5rem" }}>
              <label>Link</label>
              <input
                type="url"
                value={formData.link}
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
              />
            </div>
            <div style={{ marginBottom: "0.5rem" }}>
              <label style={{ display: "block", marginBottom: "0.25rem" }}>GitHub Link</label>
              <input
                type="url"
                value={formData.gitlink}
                onChange={(e) => setFormData({ ...formData, gitlink: e.target.value })}
              />
            </div>
            <div style={{ marginBottom: "0.5rem" }}>
              <label style={{ display: "block", marginBottom: "0.25rem" }}>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                style={{ width: "100%", padding: "0.5rem", minHeight: "80px" }}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "0.5rem 1rem",
                backgroundColor: "#0070f3",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Saving..." : editingProject ? "Update" : "Create"}
            </button>
          </form>
        )}

        {loading && !showForm && <div>Loading projects...</div>}

        <div>
          {projects.length === 0 ? (
            <p>No projects yet. Add your first project!</p>
          ) : (
            projects.map((project) => (
              <div
                key={project.id}
                style={{
                  padding: "1rem",
                  marginBottom: "0.5rem",
                  backgroundColor: "#f9f9f9",
                  borderRadius: "4px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "start",
                }}
              >
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: "0 0 0.5rem 0" }}>{project.title}</h4>
                  {project.description && <p style={{ margin: "0 0 0.5rem 0", color: "#666" }}>{project.description}</p>}
                  <div style={{ display: "flex", gap: "1rem", fontSize: "0.875rem" }}>
                    {project.link && (
                      <a href={project.link} target="_blank" rel="noopener noreferrer">
                        View Project
                      </a>
                    )}
                    {project.gitlink && (
                      <a href={project.gitlink} target="_blank" rel="noopener noreferrer">
                        GitHub
                      </a>
                    )}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    onClick={() => handleEdit(project)}
                    style={{
                      padding: "0.25rem 0.5rem",
                      backgroundColor: "#666",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "0.875rem",
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(project.id)}
                    style={{
                      padding: "0.25rem 0.5rem",
                      backgroundColor: "#dc3545",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "0.875rem",
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

