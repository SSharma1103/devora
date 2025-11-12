"use client";

import { useState, useEffect } from "react";

interface UpdateProfileFormProps {
  onClose: () => void;
}

export default function UpdateProfileForm({ onClose }: UpdateProfileFormProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    about: "",
    devstats: "",
    stack: "",
    socials: {
      github: "",
      linkedin: "",
      twitter: "",
      portfolio: "",
    },
  });

  // ✅ Fetch current pdata on mount
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/pdata");
        if (!res.ok) throw new Error("Failed to load personal data");
        const data = await res.json();

        if (data?.data) {
          setFormData({
            about: data.data.about || "",
            devstats: data.data.devstats || "",
            stack: data.data.stack || "",
            socials: {
              github: data.data.socials?.github || "",
              linkedin: data.data.socials?.linkedin || "",
              twitter: data.data.socials?.twitter || "",
              portfolio: data.data.socials?.portfolio || "",
            },
          });
        }
      } catch (err: any) {
        setError(err.message);
      }
    }

    fetchData();
  }, []);

  // ✅ Handle form field change
  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  // ✅ Handle socials change separately
  function handleSocialChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      socials: { ...prev.socials, [name]: value },
    }));
  }

  // ✅ Submit handler -> PATCH /api/pdata
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/pdata", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update data");

      setSuccess(true);
      setTimeout(() => {
        onClose();
        window.location.reload(); // optional: refresh sidebar/profile
      }, 1000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 backdrop-blur-md bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-black rounded-2xl w-full max-w-md p-8 border border-gray-800 shadow-lg relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-white text-xl"
        >
          ✕
        </button>

        <h2 className="text-2xl font-semibold mb-6 text-center">
          Update Personal Info
        </h2>

        <form onSubmit={handleSubmit}>
          {/* About */}
          <div className="mb-4">
            <label htmlFor="about" className="block mb-2 text-sm text-gray-300">
              About You
            </label>
            <textarea
              name="about"
              id="about"
              value={formData.about}
              onChange={handleChange}
              className="w-full p-3 rounded-lg bg-black border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
              placeholder="Write a short bio..."
            />
          </div>

          {/* Developer Stats */}
          <div className="mb-4">
            <label
              htmlFor="devstats"
              className="block mb-2 text-sm text-gray-300"
            >
              Developer Stats
            </label>
            <textarea
              name="devstats"
              id="devstats"
              value={formData.devstats}
              onChange={handleChange}
              className="w-full p-3 rounded-lg bg-black border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
              placeholder="e.g., 🚀 25+ Projects | 💻 2000+ Commits | 🌟 100+ Stars"
            />
          </div>

          {/* Tech Stack */}
          <div className="mb-4">
            <label htmlFor="stack" className="block mb-2 text-sm text-gray-300">
              Tech Stack
            </label>
            <input
              type="text"
              name="stack"
              id="stack"
              value={formData.stack}
              onChange={handleChange}
              className="w-full p-3 rounded-lg bg-black border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Next.js, TypeScript, Prisma, TailwindCSS"
            />
          </div>

          {/* Social Links */}
          <div className="mb-6">
            <label className="block mb-2 text-sm text-gray-300">
              Social Links
            </label>
            <div className="space-y-2">
              <input
                type="url"
                name="github"
                value={formData.socials.github}
                onChange={handleSocialChange}
                placeholder="GitHub URL"
                className="w-full p-3 rounded-lg bg-black border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="url"
                name="linkedin"
                value={formData.socials.linkedin}
                onChange={handleSocialChange}
                placeholder="LinkedIn URL"
                className="w-full p-3 rounded-lg bg-black border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="url"
                name="twitter"
                value={formData.socials.twitter}
                onChange={handleSocialChange}
                placeholder="Twitter URL"
                className="w-full p-3 rounded-lg bg-black border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="url"
                name="portfolio"
                value={formData.socials.portfolio}
                onChange={handleSocialChange}
                placeholder="Portfolio URL"
                className="w-full p-3 rounded-lg bg-black border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Status Messages */}
          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
          {success && (
            <p className="text-green-500 text-sm mb-3">
              Profile updated successfully!
            </p>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-600 hover:bg-gray-500 text-white font-semibold py-3 rounded-lg transition active:scale-95 disabled:opacity-50"
          >
            {loading ? "Updating..." : "Update Info"}
          </button>
        </form>
      </div>
    </div>
  );
}
