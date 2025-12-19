"use client";

import { useState } from "react";
import { 
  Briefcase, 
  Plus, 
  Loader2, 
  Terminal, 
  X,
  Calendar,
  Building2,
  Trash2,
  AlertTriangle
} from "lucide-react";
import { WorkExp, CreateWorkExpReq } from "@/types";
import { useResurceManager } from "@/hooks/useResourceManager";

interface ExperienceProps {
  workExpData?: WorkExp[];
}

export default function Experience({ workExpData }: ExperienceProps) {

  const {
    items: experiences,
    loading,
    processing: adding,
    error,
    seterror: setError,
    additem,
    deleteitem
  } = useResurceManager<WorkExp>("/api/workexp", workExpData);

  const [showForm, setShowForm] = useState(false);
  
  // State for the delete confirmation modal
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [newExp, setNewExp] = useState<CreateWorkExpReq>({
    title: "",
    duration: "",
    companyName: "",
    description: "",
    image: "",
  });

  const handleAdd = async(e: React.FormEvent) => {
    e.preventDefault();
    if (!newExp.title.trim()) {
      setError("Title is required");
      return;
    }

    const success = await additem(newExp);
    if (success) {
      setNewExp({ title: "", duration: "", companyName: "", description: "", image: "" });
      setShowForm(false);
    }
  }

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

  // --- Theme Constants ---
  const inputClasses = "w-full p-3 bg-[#0a0a0a] border border-[#E9E6D7]/20 rounded-none focus:outline-none focus:border-[#E9E6D7] focus:ring-1 focus:ring-[#E9E6D7] transition-all text-[#E9E6D7] placeholder-[#E9E6D7]/30 text-sm";
  const labelClasses = "block text-[10px] font-bold text-[#E9E6D7]/50 uppercase tracking-widest mb-1.5";

  if (loading)
    return (
      <div className="w-full h-40 bg-[#0a0a0a] border border-[#E9E6D7]/20 flex flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-[#E9E6D7]/40" size={24} />
        <span className="text-xs text-[#E9E6D7]/60 tracking-wider uppercase animate-pulse">Loading History...</span>
      </div>
    );

  return (
    <section id="experience" className="w-full text-[#E9E6D7] relative">
      
      {/* Header Section */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#E9E6D7]/10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#E9E6D7]/5 text-[#E9E6D7] rounded-sm">
            <Briefcase size={18} />
          </div>
          <div>
            <h2 className="text-[#E9E6D7] font-bold text-sm tracking-tight uppercase">Career History</h2>
            <p className="text-[10px] text-[#E9E6D7]/40 uppercase tracking-widest mt-0.5">Professional Timeline</p>
          </div>
        </div>

        {/* Add Button */}
        {!workExpData && (
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
                <span>Add Role</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Add Experience Form */}
      {showForm && !workExpData && (
        <div className="mb-8 bg-[#050505] border border-[#E9E6D7]/20 p-6 animate-in fade-in slide-in-from-top-4 duration-200">
           <div className="flex items-center gap-2 mb-4 text-[#E9E6D7]/60">
              <Terminal size={14} />
              <span className="text-xs font-mono">new_position_entry.json</span>
           </div>
           
           <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClasses}>Job Title</label>
                <input
                  type="text"
                  placeholder="Ex: Senior Engineer"
                  className={inputClasses}
                  value={newExp.title || ""}
                  onChange={(e) => setNewExp({ ...newExp, title: e.target.value })}
                />
              </div>
              <div>
                <label className={labelClasses}>Company Name</label>
                <input
                  type="text"
                  placeholder="Ex: Acme Corp"
                  className={inputClasses}
                  value={newExp.companyName || ""}
                  onChange={(e) => setNewExp({ ...newExp, companyName: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className={labelClasses}>Duration</label>
              <input
                type="text"
                placeholder="Ex: Jan 2023 - Present"
                className={inputClasses}
                value={newExp.duration || ""}
                onChange={(e) => setNewExp({ ...newExp, duration: e.target.value })}
              />
            </div>
            
            <div>
              <label className={labelClasses}>Description</label>
              <textarea
                placeholder="Key responsibilities and achievements..."
                className={`${inputClasses} h-24 resize-none`}
                value={newExp.description || ""}
                onChange={(e) => setNewExp({ ...newExp, description: e.target.value })}
              />
            </div>

            <div>
              <label className={labelClasses}>Company Logo URL (Optional)</label>
              <input
                type="text"
                placeholder="https://..."
                className={inputClasses}
                value={newExp.image || ""}
                onChange={(e) => setNewExp({ ...newExp, image: e.target.value })}
              />
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
                  "Add Position"
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

      {/* Experience List */}
      <div className="flex flex-col gap-4">
        {experiences.length > 0 ? (
          experiences.map((exp) => (
            <div
              key={exp.id}
              className="group bg-[#0a0a0a] border border-[#E9E6D7]/10 p-5 hover:border-[#E9E6D7]/40 transition-all duration-300 relative"
            >
              <div className="flex flex-col sm:flex-row gap-5 justify-between items-start">
                
                {/* Main Content */}
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono text-[#E9E6D7]/50 uppercase tracking-wider mb-1">
                    {exp.companyName && (
                      <span className="flex items-center gap-1.5 text-[#E9E6D7]">
                        <Building2 size={10} />
                        {exp.companyName}
                      </span>
                    )}
                    {exp.duration && (
                      <>
                        <span className="text-[#E9E6D7]/20">•</span>
                        <span className="flex items-center gap-1.5">
                          <Calendar size={10} />
                          {exp.duration}
                        </span>
                      </>
                    )}
                  </div>

                  <h3 className="text-[#E9E6D7] font-bold text-lg group-hover:text-white transition-colors">
                    {exp.title}
                  </h3>
                  
                  {exp.description && (
                    <p className="text-[#E9E6D7]/60 text-sm leading-relaxed max-w-2xl">
                      {exp.description}
                    </p>
                  )}
                </div>

                {/* Right Side: Image + Delete Button */}
                <div className="flex items-start gap-4">
                  {/* Optional Image */}
                  {exp.image && (
                    <div className="hidden sm:block shrink-0">
                      <img
                        src={exp.image}
                        alt={exp.title}
                        className="w-16 h-16 object-contain rounded-sm border border-[#E9E6D7]/10 bg-white/5 p-1"
                      />
                    </div>
                  )}

                  {/* DELETE BUTTON */}
                  {!workExpData && (
                    <button
                      onClick={() => promptDelete(exp.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-900/20 text-red-400/60 hover:text-red-400 rounded-sm"
                      title="Delete Position"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

              </div>
            </div>
          ))
        ) : (
          <div className="border border-dashed border-[#E9E6D7]/20 rounded-lg p-12 text-center bg-[#0a0a0a]/50">
            <p className="text-[#E9E6D7]/40 text-sm">No professional history recorded.</p>
            {!workExpData && (
              <button 
                onClick={() => setShowForm(true)}
                className="mt-4 text-[#E9E6D7] text-xs font-bold uppercase tracking-wider underline underline-offset-4 hover:text-white"
              >
                Add First Role
              </button>
            )}
          </div>
        )}
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
                 <span>exec delete_entry.sh</span>
              </div>
              
              <p className="text-[#E9E6D7]/80 text-sm leading-relaxed mb-6">
                Are you sure you want to remove this position? This action cannot be undone and will be removed from your timeline.
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