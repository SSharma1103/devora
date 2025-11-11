"use client";

import { useState, useEffect } from "react";

interface WorkExp {
  id: number;
  title: string;
  duration?: string | null;
  description?: string | null;
  companyName?: string | null;
  image?: string | null;
}

export default function WorkExpManager() {
  const [workExp, setWorkExp] = useState<WorkExp[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingWorkExp, setEditingWorkExp] = useState<WorkExp | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    duration: "",
    description: "",
    companyName: "",
    image: "",
  });

  useEffect(() => {
    fetchWorkExp();
  }, []);

  const fetchWorkExp = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/workexp");
      const result = await response.json();
      if (result.success) {
        setWorkExp(result.data);
      } else {
        setError(result.error || "Failed to fetch work experience");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
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
      const url = editingWorkExp
        ? `/api/workexp/${editingWorkExp.id}`
        : "/api/workexp";
      const method = editingWorkExp ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      if (result.success) {
        await fetchWorkExp();
        setShowForm(false);
        setEditingWorkExp(null);
        setFormData({ title: "", duration: "", description: "", companyName: "", image: "" });
      } else {
        setError(result.error || "Failed to save work experience");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (exp: WorkExp) => {
    setEditingWorkExp(exp);
    setFormData({
      title: exp.title,
      duration: exp.duration || "",
      description: exp.description || "",
      companyName: exp.companyName || "",
      image: exp.image || "",
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this work experience?")) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/workexp/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();
      if (result.success) {
        await fetchWorkExp();
      } else {
        setError(result.error || "Failed to delete work experience");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "1rem", border: "1px solid #ccc", borderRadius: "8px", marginBottom: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h3 style={{ margin: 0 }}>Work Experience</h3>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingWorkExp(null);
            setFormData({ title: "", duration: "", description: "", companyName: "", image: "" });
          }}
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: "#0070f3",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          {showForm ? "Cancel" : "Add Work Experience"}
        </button>
      </div>

      {error && <div style={{ color: "red", marginBottom: "1rem" }}>{error}</div>}

      {showForm && (
        <form onSubmit={handleSubmit} style={{ marginBottom: "1rem", padding: "1rem", backgroundColor: "#f5f5f5", borderRadius: "4px" }}>
          <div style={{ marginBottom: "0.5rem" }}>
            <label style={{ display: "block", marginBottom: "0.25rem" }}>Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              style={{ width: "100%", padding: "0.5rem" }}
              required
            />
          </div>
          <div style={{ marginBottom: "0.5rem" }}>
            <label style={{ display: "block", marginBottom: "0.25rem" }}>Company Name</label>
            <input
              type="text"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              style={{ width: "100%", padding: "0.5rem" }}
            />
          </div>
          <div style={{ marginBottom: "0.5rem" }}>
            <label style={{ display: "block", marginBottom: "0.25rem" }}>Duration</label>
            <input
              type="text"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              placeholder="e.g., Jan 2020 - Present"
              style={{ width: "100%", padding: "0.5rem" }}
            />
          </div>
          <div style={{ marginBottom: "0.5rem" }}>
            <label style={{ display: "block", marginBottom: "0.25rem" }}>Image URL</label>
            <input
              type="url"
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              style={{ width: "100%", padding: "0.5rem" }}
            />
          </div>
          <div style={{ marginBottom: "0.5rem" }}>
            <label style={{ display: "block", marginBottom: "0.25rem" }}>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              style={{ width: "100%", padding: "0.5rem", minHeight: "100px" }}
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
            {loading ? "Saving..." : editingWorkExp ? "Update" : "Create"}
          </button>
        </form>
      )}

      {loading && !showForm && <div>Loading work experience...</div>}

      <div>
        {workExp.length === 0 ? (
          <p>No work experience yet. Add your first work experience!</p>
        ) : (
          workExp.map((exp) => (
            <div
              key={exp.id}
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
              <div style={{ flex: 1, display: "flex", gap: "1rem" }}>
                {exp.image && (
                  <img
                    src={exp.image}
                    alt={exp.companyName || exp.title}
                    style={{ width: "60px", height: "60px", objectFit: "cover", borderRadius: "4px" }}
                  />
                )}
                <div>
                  <h4 style={{ margin: "0 0 0.25rem 0" }}>{exp.title}</h4>
                  {exp.companyName && (
                    <p style={{ margin: "0 0 0.25rem 0", fontWeight: "bold", color: "#333" }}>
                      {exp.companyName}
                    </p>
                  )}
                  {exp.duration && (
                    <p style={{ margin: "0 0 0.5rem 0", color: "#666", fontSize: "0.875rem" }}>
                      {exp.duration}
                    </p>
                  )}
                  {exp.description && (
                    <p style={{ margin: 0, color: "#666", fontSize: "0.875rem" }}>{exp.description}</p>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  onClick={() => handleEdit(exp)}
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
                  onClick={() => handleDelete(exp.id)}
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
  );
}

