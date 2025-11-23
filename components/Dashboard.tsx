"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import UpdateProfileForm from "./UpdateProfileForm";
import DashboardContent from "./DashboardContent";
import { Pencil } from "lucide-react";
import UpdateNameModal from "./UpdateNameModal"; // 1. Import the new modal

export default function Dashboard() {
  // State for the main, large "Edit Profile" modal
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  
  // 2. State for the new, small "Update Name" modal
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);

  const { data: session, update } = useSession();

  const userName = session?.user?.name || "User";
  const username = session?.username || "username_not_set";
  const userImage = session?.user?.image || "/default-avatar.png";

  // This function will close the main modal
  const handleProfileModalClose = async (needsUpdate?: boolean) => {
    setIsProfileModalOpen(false);
    if (needsUpdate) {
      await update(); // This refreshes the session data
    }
  };

  // 3. This function will close the new name modal
  const handleNameModalClose = async (needsUpdate?: boolean) => {
    setIsNameModalOpen(false);
    if (needsUpdate) {
      await update(); // This refreshes the session data
    }
  };

  return (
    <div className="w-full">
      {/* ===== Banner + Profile Header Section ===== */}
      <div className="relative w-full">
        {/* Banner */}
        <div className="w-full h-40 bg-linear-to-r from-gray-700 via-gray-800 to-black" />

        {/* Profile Picture */}
        <div className="absolute left-10 -bottom-10">
          <div className="h-28 w-28 rounded-full overflow-hidden border-4 border-gray-900 shadow-lg bg-black">
            <img
              src={userImage}
              alt={userName}
              className="h-full w-full object-cover"
            />
          </div>
        </div>

        {/* User Info */}
        <div className="absolute left-44 bottom-4 flex flex-col">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-white">{userName}</h2>
            {/* 4. Pencil button now controls the new modal */}
            <button
              onClick={() => setIsNameModalOpen(true)}
              title="Edit Name"
              className="text-gray-400 hover:text-white transition"
            >
              <Pencil className="w-4 h-4" />
            </button>
          </div>
          <p className="text-gray-400 text-sm">@{username}</p>
        </div>

        {/* Edit Profile Button (controls the main modal) */}
        <button
          onClick={() => setIsProfileModalOpen(true)}
          className="absolute right-10 bottom-6 bg-gray-700 hover:bg-gray-600 text-white font-semibold px-4 py-2 rounded-lg shadow-md transition active:scale-95"
        >
          Edit Profile
        </button>
      </div>

      {/* Push the content down to avoid overlap */}
      <div className="mt-20">
        {/* 5. Render BOTH modals, each controlled by its own state */}
        
        {/* The main "Edit Profile" modal */}
        {isProfileModalOpen && (
          <UpdateProfileForm
            onClose={handleProfileModalClose}
            currentName={userName}
          />
        )}

        {/* The new "Update Name" modal */}
        {isNameModalOpen && (
          <UpdateNameModal
            onClose={handleNameModalClose}
            currentName={userName}
          />
        )}

        <DashboardContent />
      </div>
    </div>
  );
}