"use client";

import { useState, useEffect } from "react";
import { Briefcase, Plus, Loader2 } from "lucide-react";

interface WorkExp {
  id?: number;
  title: string;
  duration?: string;
  description?: string;
  companyName?: string;
  image?: string;
  createdAt?: string;
}

export default function Experience() {
  const [experiences, setExperiences] = useState<WorkExp[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newExp, setNewExp] = useState({
    title: "",
    duration: "",
    companyName: "",
    description: "",
    image: "",
  });

  // Fetch experiences on mount
  useEffect(() => {
    const fetchExperience = async () => {
      try {
        const res = await fetch("/api/workexp");
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || "Failed to fetch work experience");

        setExperiences(data.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchExperience();
  }, []);

  // Handle add new experience
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExp.title.trim()) {
      setError("Title is required");
      return;
    }

    try {
      setAdding(true);
      const res = await fetch("/api/workexp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newExp),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add work experience");

      setExperiences((prev) => [data.data, ...prev]);
      setNewExp({ title: "", duration: "", companyName: "", description: "", image: "" });
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
        <Loader2 className="animate-spin h-5 w-5 mr-2" /> Loading work experience...
      </div>
    );

  return (
    <section id="experience" className="w-full max-w-5xl mx-auto text-white">
      {/* Header with + Add */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Work Experience</h2>
        <button
          onClick={() => {
            const form = document.getElementById("add-exp-form");
            form?.classList.toggle("hidden");
          }}
          className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg text-sm text-gray-200 transition"
        >
          <Plus className="h-4 w-4" /> Add Experience
        </button>
      </div>

      {/* Add Experience Form */}
      <form
        id="add-exp-form"
        onSubmit={handleAdd}
        className="hidden mb-6 bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3"
      >
        <input
          type="text"
          placeholder="Job Title"
          className="w-full p-2 bg-black border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={newExp.title}
          onChange={(e) => setNewExp({ ...newExp, title: e.target.value })}
        />
        <input
          type="text"
          placeholder="Company Name"
          className="w-full p-2 bg-black border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={newExp.companyName}
          onChange={(e) => setNewExp({ ...newExp, companyName: e.target.value })}
        />
        <input
          type="text"
          placeholder="Duration (e.g., 2022 - Present)"
          className="w-full p-2 bg-black border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={newExp.duration}
          onChange={(e) => setNewExp({ ...newExp, duration: e.target.value })}
        />
        <textarea
          placeholder="Description"
          className="w-full p-2 bg-black border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={newExp.description}
          onChange={(e) => setNewExp({ ...newExp, description: e.target.value })}
        />
        <input
          type="text"
          placeholder="Image URL (optional)"
          className="w-full p-2 bg-black border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={newExp.image}
          onChange={(e) => setNewExp({ ...newExp, image: e.target.value })}
        />

        <button
          type="submit"
          disabled={adding}
          className="w-full flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg transition"
        >
          {adding && <Loader2 className="animate-spin h-4 w-4" />}
          {adding ? "Adding..." : "Add Experience"}
        </button>
      </form>

      {error && (
        <div className="text-red-400 text-sm mb-4 border border-red-700 bg-red-900/20 rounded-lg p-3">
          {error}
        </div>
      )}

      {/* Experience List */}
      <div className="grid grid-cols-1 gap-6">
        {experiences.length > 0 ? (
          experiences.map((exp) => (
            <div
              key={exp.id}
              className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 transition-all"
            >
              <div className="grid grid-cols-[1fr_auto] gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="bg-neutral-800 p-2 rounded-lg">
                      <Briefcase className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {exp.title}
                      </h3>
                      <p className="text-xs text-neutral-500">
                        {exp.companyName} {exp.duration && `• ${exp.duration}`}
                      </p>
                    </div>
                  </div>
                  {exp.description && (
                    <p className="mt-3 text-sm text-neutral-300 leading-relaxed">
                      {exp.description}
                    </p>
                  )}
                </div>

                {exp.image && (
                  <div className="hidden sm:block">
                    <img
                      src={exp.image}
                      alt={exp.title}
                      className="w-28 h-full rounded-lg object-cover border border-neutral-700"
                    />
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-gray-500 text-center py-8 border border-gray-800 rounded-lg">
            No work experience added yet. Add one above!
          </div>
        )}
      </div>
    </section>
  );
}
