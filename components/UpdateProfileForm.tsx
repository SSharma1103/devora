// In components/UpdateProfileForm.tsx
"use client";

import { useState, useEffect } from "react";

interface UpdateProfileFormProps {
  onClose: () => void;
}

// Define the type for Pdata to match your form
interface PdataForm {
  about: string;
  devstats: string;
  stack: string;
  socials: {
    github: string;
    linkedin: string;
    twitter: string;
    portfolio: string;
  };
}

export default function UpdateProfileForm({ onClose }: UpdateProfileFormProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State for Pdata fields
  const [formData, setFormData] = useState<PdataForm>({
    about: "",
    devstats: "",
    stack: "",
    socials: { github: "", linkedin: "", twitter: "", portfolio: "" },
  });

  // --- New State for Image Uploads ---
  const [pfpFile, setPfpFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);

  // Store the URLs after upload
  const [pfpUrl, setPfpUrl] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);

  // State for upload progress
  const [uploading, setUploading] = useState(false);


  // Fetch existing pdata on mount (as you already do)
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
            socials: data.data.socials || { github: "", linkedin: "", twitter: "", portfolio: "" },
          });
        }
      } catch (err: any) {
        setError(err.message);
      }
    }
    fetchData();
  }, []);

  // Handle standard form field change
  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  // Handle socials change
  function handleSocialChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      socials: { ...prev.socials, [name]: value },
    }));
  }

  // --- New Function: Handle File Upload to Cloudinary ---
  const handleFileUpload = async (file: File): Promise<string | null> => {
    try {
      // 1. Get signature from our new API route
      const timestamp = Math.round(new Date().getTime() / 1000);
      const paramsToSign = {
        timestamp: timestamp,
        upload_preset: "devora_uploads", // Create an "unsigned" preset in Cloudinary
      };

      const sigRes = await fetch("/api/upload-signature", {
        method: "POST",
        body: JSON.stringify({ paramsToSign }),
      });
      const { signature } = await sigRes.json();

      // 2. Prepare FormData for Cloudinary
      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY as string); // Note: Use NEXT_PUBLIC_ for client-side env var
      formData.append("timestamp", timestamp.toString());
      formData.append("signature", signature);
      formData.append("upload_preset", "YOUR_UPLOAD_PRESET"); // Must match preset used for signing

      // 3. Make the upload POST to Cloudinary
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME as string;
      const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

      const uploadRes = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        throw new Error("Cloudinary upload failed");
      }

      const uploadData = await uploadRes.json();
      return uploadData.secure_url; // The URL of the uploaded image

    } catch (err: any) {
      console.error("File upload error:", err);
      setError(err.message || "Failed to upload image");
      return null;
    }
  };

  // --- Modified Submit Handler ---
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setUploading(false);
    setError(null);

    let newPfpUrl = null;
    let newBannerUrl = null;

    try {
      // --- 1. Handle File Uploads First ---
      setUploading(true);
      if (pfpFile) {
        newPfpUrl = await handleFileUpload(pfpFile);
        if (newPfpUrl) setPfpUrl(newPfpUrl); // Save for the next step
      }
      if (bannerFile) {
        newBannerUrl = await handleFileUpload(bannerFile);
        if (newBannerUrl) setBannerUrl(newBannerUrl); // Save for the next step
      }
      setUploading(false);

      // --- 2. Update Pdata (About, Socials, etc.) ---
      const pdataRes = await fetch("/api/pdata", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const pdataData = await pdataRes.json();
      if (!pdataRes.ok) throw new Error(pdataData.error || "Failed to update personal data");

      // --- 3. Update User (pfp, banner) ---
      const profileUpdateData: { pfp?: string; banner?: string } = {};
      if (newPfpUrl) profileUpdateData.pfp = newPfpUrl;
      if (newBannerUrl) profileUpdateData.banner = newBannerUrl;

      if (Object.keys(profileUpdateData).length > 0) {
        const userRes = await fetch("/api/user/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(profileUpdateData),
        });
        const userData = await userRes.json();
        if (!userRes.ok) throw new Error(userData.error || "Failed to update profile image");
      }

      // --- 4. Success ---
      setSuccess(true);
      setTimeout(() => {
        onClose();
        window.location.reload(); // Refresh page to see changes
      }, 1000);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setUploading(false);
    }
  }

  // --- Add .env variables for client-side ---
  // You must create a .env.local file with these *public* variables
  // NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="YOUR_CLOUD_NAME"
  // NEXT_PUBLIC_CLOUDINARY_API_KEY="YOUR_API_KEY"

  return (
    <div className="fixed inset-0 backdrop-blur-md bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-black rounded-2xl w-full max-w-md p-8 border border-gray-800 shadow-lg relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-white text-xl"
        >
          ✕
        </button>

        <h2 className="text-2xl font-semibold mb-6 text-center">
          Update Profile
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* --- New File Inputs --- */}
          <div className="mb-4">
            <label htmlFor="pfp" className="block mb-2 text-sm text-gray-300">
              Profile Picture
            </label>
            <input
              type="file"
              id="pfp"
              accept="image/*"
              onChange={(e) => setPfpFile(e.target.files ? e.target.files[0] : null)}
              className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gray-700 file:text-white hover:file:bg-gray-600"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="banner" className="block mb-2 text-sm text-gray-300">
              Banner Image
            </label>
            <input
              type="file"
              id="banner"
              accept="image/*"
              onChange={(e) => setBannerFile(e.target.files ? e.target.files[0] : null)}
              className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gray-700 file:text-white hover:file:bg-gray-600"
            />
          </div>

          {/* --- Existing Fields --- */}
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
              <input type="url" name="github" value={formData.socials.github} onChange={handleSocialChange} placeholder="GitHub URL" className="w-full p-3 rounded-lg bg-black border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input type="url" name="linkedin" value={formData.socials.linkedin} onChange={handleSocialChange} placeholder="LinkedIn URL" className="w-full p-3 rounded-lg bg-black border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input type="url" name="twitter" value={formData.socials.twitter} onChange={handleSocialChange} placeholder="Twitter URL" className="w-full p-3 rounded-lg bg-black border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input type="url" name="portfolio" value={formData.socials.portfolio} onChange={handleSocialChange} placeholder="Portfolio URL" className="w-full p-3 rounded-lg bg-black border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>


          {/* Status Messages */}
          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
          {success && (
            <p className="text-green-500 text-sm mb-3">
              Profile updated successfully!
            </p>
          )}
          {uploading && (
            <p className="text-blue-400 text-sm mb-3">
              Uploading images...
            </p>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || uploading}
            className="w-full bg-gray-600 hover:bg-gray-500 text-white font-semibold py-3 rounded-lg transition active:scale-95 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Update Info"}
          </button>
        </form>
      </div>
    </div>
  );
}