// components/UpdateProfileForm.tsx
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
    leetcode: string; // <-- 1. Added leetcode
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
    socials: {
      github: "",
      linkedin: "",
      twitter: "",
      portfolio: "",
      leetcode: "", // <-- 2. Initialized leetcode
    },
  });

  // --- New State for Image Uploads ---
  const [pfpFile, setPfpFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);

  // Store the URLs after upload
  const [pfpUrl, setPfpUrl] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);

  // State for upload progress
  const [uploading, setUploading] = useState(false);

  // Fetch existing pdata on mount
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/pdata");
        if (!res.ok) throw new Error("Failed to load personal data");
        const data = await res.json();

        if (data?.data) {
          // 3. Updated to merge existing socials with the full default object
          setFormData({
            about: data.data.about || "",
            devstats: data.data.devstats || "",
            stack: data.data.stack || "",
            socials: {
              github: "",
              linkedin: "",
              twitter: "",
              portfolio: "",
              leetcode: "",
              ...(data.data.socials || {}), // Spread existing socials to override defaults
            },
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

  // --- Updated: Handle File Upload to Cloudinary ---
  const handleFileUpload = async (file: File): Promise<string | null> => {
    try {
      // 1. Get signature from our new API route
      const timestamp = Math.round(new Date().getTime() / 1000);
      const paramsToSign = {
        timestamp: timestamp,
        upload_preset: "devora_uploads", // This must match your preset
      };

      const sigRes = await fetch("/api/upload-signature", {
        method: "POST",
        body: JSON.stringify({ paramsToSign }),
      });
      const { signature } = await sigRes.json();

      // 2. Prepare FormData for Cloudinary
      const formData = new FormData();
      formData.append("file", file);
      formData.append("timestamp", timestamp.toString());
      formData.append("signature", signature);
      formData.append("upload_preset", "devora_uploads"); // Must match preset used for signing
      
      // ❗️ FIX: The api_key is required for signed uploads
      formData.append("api_key", process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY as string); 


      // 3. Make the upload POST to Cloudinary
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME as string;
      const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

      const uploadRes = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        // Log the error response from Cloudinary for debugging
        const errorData = await uploadRes.json();
        console.error("Cloudinary upload failed:", errorData);
        throw new Error(`Cloudinary upload failed: ${errorData.error.message}`);
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
      
      // If an upload failed, handleFileUpload will set the error and return null.
      // We should stop submission if an error occurred during upload.
      if ((pfpFile && !newPfpUrl) || (bannerFile && !newBannerUrl)) {
          throw new Error(error || "Image upload failed. Please try again.");
      }

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

  return (
  <div className="fixed inset-0 backdrop-blur-md bg-black/40 flex items-center justify-center z-50 p-2">
    <div className="bg-black rounded-2xl w-full max-w-6xl p-6 border border-gray-800 shadow-xl relative">

      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-3 right-3 text-gray-400 hover:text-white text-xl"
      >
        ✕
      </button>

      <h2 className="text-2xl font-semibold mb-6 text-center">
        Update Profile
      </h2>

      {/* === NEW: 3 COLUMN GRID === */}
      <form onSubmit={handleSubmit} className="grid grid-cols-3 gap-4">

        {/* COLUMN 1 — Images */}
        <div className="space-y-4">
          <div className="p-4 border border-gray-800 rounded-xl bg-black/40">
            <h3 className="text-gray-300 font-medium mb-3 text-base">Images</h3>

            <label className="block mb-1 text-sm text-gray-400">Profile Picture</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setPfpFile(e.target.files ? e.target.files[0] : null)}
              className="w-full text-sm text-gray-300 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-gray-700 hover:file:bg-gray-600"
            />

            <label className="block mt-4 mb-1 text-sm text-gray-400">Banner Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setBannerFile(e.target.files ? e.target.files[0] : null)}
              className="w-full text-sm text-gray-300 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-gray-700 hover:file:bg-gray-600"
            />
          </div>

          {/* Tech Stack */}
          <div className="p-4 border border-gray-800 rounded-xl bg-black/40">
            <h3 className="text-gray-300 font-medium mb-3 text-base">Tech Stack</h3>
            <textarea
              name="stack"
              value={formData.stack}
              onChange={handleChange}
              className="w-full p-2 rounded-lg bg-black border border-gray-700"
              placeholder="Next.js, TS, Prisma, TailwindCSS"
              rows={4}
            />
          </div>
        </div>

        {/* COLUMN 2 — About + DevStats */}
        <div className="space-y-4">
          <div className="p-4 border border-gray-800 rounded-xl bg-black/40">
            <h3 className="text-gray-300 text-base font-medium mb-3">About You</h3>
            <textarea
              name="about"
              value={formData.about}
              onChange={handleChange}
              className="w-full p-2 rounded-lg bg-black border border-gray-700 resize-none"
              rows={4}
            />
          </div>

          <div className="p-4 border border-gray-800 rounded-xl bg-black/40">
            <h3 className="text-gray-300 text-base font-medium mb-3">Developer Stats</h3>
            <textarea
              name="devstats"
              value={formData.devstats}
              onChange={handleChange}
              className="w-full p-2 rounded-lg bg-black border border-gray-700 resize-none"
              rows={4}
            />
          </div>
        </div>

        {/* COLUMN 3 — Socials + Submit */}
        <div className="space-y-4">
          <div className="p-4 border border-gray-800 rounded-xl bg-black/40">
            <h3 className="text-gray-300 font-medium mb-3 text-base">Social Profiles</h3>

            <div className="space-y-2">
              <input
                type="url"
                name="github"
                value={formData.socials.github}
                onChange={handleSocialChange}
                placeholder="GitHub URL"
                className="w-full p-2 rounded-lg bg-black border border-gray-700"
              />
              <input
                type="url"
                name="linkedin"
                value={formData.socials.linkedin}
                onChange={handleSocialChange}
                placeholder="LinkedIn URL"
                className="w-full p-2 rounded-lg bg-black border border-gray-700"
              />
              <input
                type="url"
                name="twitter"
                value={formData.socials.twitter}
                onChange={handleSocialChange}
                placeholder="Twitter URL"
                className="w-full p-2 rounded-lg bg-black border border-gray-700"
              />
              <input
                type="url"
                name="portfolio"
                value={formData.socials.portfolio}
                onChange={handleSocialChange}
                placeholder="Portfolio URL"
                className="w-full p-2 rounded-lg bg-black border border-gray-700"
              />
              {/* 4. Added LeetCode Input */}
              <input
                type="text"
                name="leetcode"
                value={formData.socials.leetcode}
                onChange={handleSocialChange}
                placeholder="LeetCode Username or URL"
                className="w-full p-2 rounded-lg bg-black border border-gray-700"
              />
            </div>
          </div>

          {/* Status / Submit */}
          <div className=" mt-full space-y-1">
            {error && <p className="text-red-500 text-sm">{error}</p>}
            {success && <p className="text-green-500 text-sm">Profile updated successfully!</p>}
            {uploading && <p className="text-blue-400 text-sm">Uploading images...</p>}

            <button
              type="submit"
              disabled={loading || uploading}
              className="w-full bg-gray-600 hover:bg-blue-500 text-white font-semibold py-2 rounded-xl transition disabled:opacity-50"
            >
              {loading ? "Saving..." : "Update Profile"}
            </button>
          </div>
        </div>

      </form>
    </div>
  </div>
);
}