"use client";

import { useState, useEffect, useRef } from "react";
import { 
  X, 
  Upload, 
  Github, 
  Linkedin, 
  Twitter, 
  Globe, 
  Code2, 
  User, 
  Cpu, 
  Loader2 
} from "lucide-react";

interface UpdateProfileFormProps {
  onClose: () => void;
}

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

  // State for User Schema fields
  const [leetcodeUsername, setLeetcodeUsername] = useState("");

  // File Upload State
  const [pfpFile, setPfpFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [pfpUrl, setPfpUrl] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Refs for custom file triggers
  const pfpInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/pdata");
        if (res.ok) {
          const data = await res.json();
          if (data?.data) {
            setFormData({
              about: data.data.about || "",
              devstats: data.data.devstats || "",
              stack: data.data.stack || "",
              socials: data.data.socials || { github: "", linkedin: "", twitter: "", portfolio: "" },
            });
          }
        }
        const userRes = await fetch("/api/user/profile");
        if (userRes.ok) {
          const userData = await userRes.json();
          if (userData?.data?.leetcode) {
            setLeetcodeUsername(userData.data.leetcode);
          }
        }
      } catch (err: any) {
        setError(err.message || "Failed to load data");
      }
    }
    fetchData();
  }, []);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  function handleSocialChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      socials: { ...prev.socials, [name]: value },
    }));
  }

  const handleFileUpload = async (file: File): Promise<string | null> => {
    try {
      const timestamp = Math.round(new Date().getTime() / 1000);
      const paramsToSign = {
        timestamp: timestamp,
        upload_preset: "devora_uploads",
      };

      const sigRes = await fetch("/api/upload-signature", {
        method: "POST",
        body: JSON.stringify({ paramsToSign }),
      });
      const { signature } = await sigRes.json();

      const formData = new FormData();
      formData.append("file", file);
      formData.append("timestamp", timestamp.toString());
      formData.append("signature", signature);
      formData.append("upload_preset", "devora_uploads");
      formData.append("api_key", process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY as string);

      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME as string;
      const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

      const uploadRes = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        const errorData = await uploadRes.json();
        throw new Error(`Cloudinary upload failed: ${errorData.error.message}`);
      }

      const uploadData = await uploadRes.json();
      return uploadData.secure_url;
    } catch (err: any) {
      console.error("File upload error:", err);
      setError(err.message || "Failed to upload image");
      return null;
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setUploading(false);
    setError(null);

    let newPfpUrl = null;
    let newBannerUrl = null;

    try {
      setUploading(true);
      if (pfpFile) {
        newPfpUrl = await handleFileUpload(pfpFile);
        if (newPfpUrl) setPfpUrl(newPfpUrl);
      }
      if (bannerFile) {
        newBannerUrl = await handleFileUpload(bannerFile);
        if (newBannerUrl) setBannerUrl(newBannerUrl);
      }
      setUploading(false);

      if ((pfpFile && !newPfpUrl) || (bannerFile && !newBannerUrl)) {
        throw new Error(error || "Image upload failed. Please try again.");
      }

      const pdataRes = await fetch("/api/pdata", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const pdataData = await pdataRes.json();
      if (!pdataRes.ok) throw new Error(pdataData.error || "Failed to update personal data");

      const profileUpdateData: { pfp?: string; banner?: string; leetcode?: string } = {};
      if (newPfpUrl) profileUpdateData.pfp = newPfpUrl;
      if (newBannerUrl) profileUpdateData.banner = newBannerUrl;
      if (leetcodeUsername !== undefined) {
        profileUpdateData.leetcode = leetcodeUsername;
      }

      if (Object.keys(profileUpdateData).length > 0) {
        const userRes = await fetch("/api/user/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(profileUpdateData),
        });
        const userData = await userRes.json();
        if (!userRes.ok) throw new Error(userData.error || "Failed to update user profile");
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
        window.location.reload();
      }, 1000);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setUploading(false);
    }
  }

  // --- Styles ---
  const offWhite = "#E9E6D7";
  // Reduced padding (p-2.5) and smaller text for compact feel
  const inputBaseClasses = "w-full p-2.5 pl-9 bg-[#0a0a0a] border border-[#E9E6D7]/20 rounded-none focus:outline-none focus:border-[#E9E6D7] focus:ring-1 focus:ring-[#E9E6D7] transition-all text-[#E9E6D7] placeholder-[#E9E6D7]/30 text-sm";
  const textareaClasses = "w-full p-2.5 bg-[#0a0a0a] border border-[#E9E6D7]/20 rounded-none focus:outline-none focus:border-[#E9E6D7] focus:ring-1 focus:ring-[#E9E6D7] transition-all text-[#E9E6D7] placeholder-[#E9E6D7]/30 text-sm resize-none";
  const labelClasses = "block text-[10px] font-bold text-[#E9E6D7]/60 mb-1.5 uppercase tracking-wider";
  
  return (
    <div className="fixed inset-0 backdrop-blur-xl bg-black/80 flex items-center justify-center z-50 p-2 animate-in fade-in duration-200">
      <div 
        className="bg-[#050505] w-full max-w-5xl max-h-[95vh] overflow-y-auto border border-[#E9E6D7]/20 shadow-2xl relative flex flex-col"
        style={{ boxShadow: '0 0 40px -10px rgba(233, 230, 215, 0.1)' }}
      >
        
        {/* Compact Header */}
        <div className="sticky top-0 z-10 bg-[#050505]/95 backdrop-blur-md border-b border-[#E9E6D7]/10 px-5 py-3 flex items-center justify-between">
          <div className="flex items-baseline gap-3">
            <h2 className="text-lg font-bold tracking-tight" style={{ color: offWhite }}>
              Edit Profile
            </h2>
            <p className="text-[10px] text-[#E9E6D7]/50 uppercase tracking-widest hidden sm:block">Update Persona</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-[#E9E6D7]/10 rounded-full transition-colors text-[#E9E6D7]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Compact Body - Reduced padding and gaps */}
        <form onSubmit={handleSubmit} className="flex-1 p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            
            {/* COLUMN 1: Visual Assets & Stack */}
            <div className="space-y-5">
              
              {/* Image Uploaders - Now Side by Side */}
              <div>
                <h3 className={labelClasses}>Visual Assets</h3>
                <div className="flex gap-3">
                  {/* PFP Upload */}
                  <div 
                    onClick={() => pfpInputRef.current?.click()}
                    className="group relative flex-1 h-24 border border-dashed border-[#E9E6D7]/30 hover:border-[#E9E6D7] transition-all cursor-pointer bg-[#0a0a0a] flex flex-col items-center justify-center gap-1.5"
                  >
                     <input
                      ref={pfpInputRef}
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={(e) => setPfpFile(e.target.files ? e.target.files[0] : null)}
                    />
                    <div className="p-1.5 bg-[#E9E6D7]/5 rounded-full group-hover:bg-[#E9E6D7] group-hover:text-black transition-colors text-[#E9E6D7]">
                      <User size={16} />
                    </div>
                    <span className="text-[10px] text-[#E9E6D7]/60 group-hover:text-[#E9E6D7] truncate max-w-20">
                      {pfpFile ? "Selected" : "Avatar"}
                    </span>
                  </div>

                  {/* Banner Upload */}
                  <div 
                    onClick={() => bannerInputRef.current?.click()}
                    className="group relative flex-2 h-24 border border-dashed border-[#E9E6D7]/30 hover:border-[#E9E6D7] transition-all cursor-pointer bg-[#0a0a0a] flex flex-col items-center justify-center gap-1.5"
                  >
                    <input
                      ref={bannerInputRef}
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={(e) => setBannerFile(e.target.files ? e.target.files[0] : null)}
                    />
                    <div className="flex items-center gap-1.5 text-[#E9E6D7]/60 group-hover:text-[#E9E6D7] transition-colors">
                      <Upload size={14} />
                      <span className="text-[10px]">{bannerFile ? "Image Selected" : "Upload Banner"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stack */}
              <div>
                <h3 className={labelClasses}>Tech Stack</h3>
                <div className="relative">
                  <div className="absolute top-2.5 left-2.5 text-[#E9E6D7]/40">
                    <Cpu size={14} />
                  </div>
                  <textarea
                    name="stack"
                    value={formData.stack}
                    onChange={handleChange}
                    className={`${textareaClasses} pl-9 h-24`}
                    placeholder="Next.js, TS, Rust..."
                  />
                </div>
              </div>
            </div>

            {/* COLUMN 2: Details */}
            <div className="space-y-5">
              <div>
                <h3 className={labelClasses}>About You</h3>
                <div className="relative">
                  {/* Reduced height from h-64 to h-32/h-40 */}
                  <textarea
                    name="about"
                    value={formData.about}
                    onChange={handleChange}
                    className={`${textareaClasses} h-54`} 
                    placeholder="Tell your story. What are you building?"
                  />
                </div>
              </div>

              <div>
                <h3 className={labelClasses}>Developer Stats</h3>
                <div className="relative">
                  <textarea
                    name="devstats"
                    value={formData.devstats}
                    onChange={handleChange}
                    className={`${textareaClasses} h-20 font-mono text-xs leading-relaxed`}
                    placeholder={"Exp: 4 Years\nShipped: 12"}
                  />
                </div>
              </div>
            </div>

            {/* COLUMN 3: Presence */}
            <div className="space-y-5 flex flex-col h-full">
              <div>
                <h3 className={labelClasses}>Social Presence</h3>
                <div className="space-y-2.5">
                  
                  {/* LeetCode */}
                  <div className="relative group">
                    <div className="absolute top-2.5 left-2.5 text-[#E9E6D7]/40 group-focus-within:text-[#E9E6D7] transition-colors">
                      <Code2 size={14} />
                    </div>
                    <input
                      type="text"
                      value={leetcodeUsername}
                      onChange={(e) => setLeetcodeUsername(e.target.value)}
                      placeholder="LeetCode User"
                      className={inputBaseClasses}
                    />
                  </div>

                  {/* GitHub */}
                  <div className="relative group">
                    <div className="absolute top-2.5 left-2.5 text-[#E9E6D7]/40 group-focus-within:text-[#E9E6D7] transition-colors">
                      <Github size={14} />
                    </div>
                    <input
                      type="url"
                      name="github"
                      value={formData.socials.github}
                      onChange={handleSocialChange}
                      placeholder="GitHub URL"
                      className={inputBaseClasses}
                    />
                  </div>

                  {/* LinkedIn */}
                  <div className="relative group">
                    <div className="absolute top-2.5 left-2.5 text-[#E9E6D7]/40 group-focus-within:text-[#E9E6D7] transition-colors">
                      <Linkedin size={14} />
                    </div>
                    <input
                      type="url"
                      name="linkedin"
                      value={formData.socials.linkedin}
                      onChange={handleSocialChange}
                      placeholder="LinkedIn URL"
                      className={inputBaseClasses}
                    />
                  </div>

                  {/* Twitter */}
                  <div className="relative group">
                    <div className="absolute top-2.5 left-2.5 text-[#E9E6D7]/40 group-focus-within:text-[#E9E6D7] transition-colors">
                      <Twitter size={14} />
                    </div>
                    <input
                      type="url"
                      name="twitter"
                      value={formData.socials.twitter}
                      onChange={handleSocialChange}
                      placeholder="Twitter URL"
                      className={inputBaseClasses}
                    />
                  </div>

                  {/* Portfolio */}
                  <div className="relative group">
                    <div className="absolute top-2.5 left-2.5 text-[#E9E6D7]/40 group-focus-within:text-[#E9E6D7] transition-colors">
                      <Globe size={14} />
                    </div>
                    <input
                      type="url"
                      name="portfolio"
                      value={formData.socials.portfolio}
                      onChange={handleSocialChange}
                      placeholder="Portfolio URL"
                      className={inputBaseClasses}
                    />
                  </div>
                </div>
              </div>

              <div className="flex-1"></div>

              {/* Messages & Actions */}
              <div className="space-y-2 pt-4 border-t border-[#E9E6D7]/10">
                {error && (
                  <div className="bg-red-900/10 border border-red-900/30 text-red-400 p-2 text-xs flex items-center gap-2">
                     <span className="w-1 h-1 bg-red-500 rounded-full animate-pulse"/>
                     {error}
                  </div>
                )}
                {success && (
                  <div className="bg-[#E9E6D7]/10 border border-[#E9E6D7]/20 text-[#E9E6D7] p-2 text-xs flex items-center gap-2">
                    <span className="w-1 h-1 bg-[#E9E6D7] rounded-full"/>
                    Updated successfully.
                  </div>
                )}
                
                <button
                  type="submit"
                  disabled={loading || uploading}
                  className="w-full h-10 flex items-center justify-center gap-2 text-black font-bold text-xs tracking-wider uppercase disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.01] active:scale-[0.99]"
                  style={{ backgroundColor: offWhite }}
                >
                  {(loading || uploading) ? (
                    <>
                      <Loader2 className="animate-spin" size={14} />
                      {uploading ? "Uploading..." : "Saving..."}
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}