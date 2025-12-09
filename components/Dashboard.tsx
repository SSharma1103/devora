"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import UpdateProfileForm from "./UpdateProfileForm";
import DashboardContent from "./DashboardContent";
import { Pencil } from "lucide-react";
import UpdateNameModal from "./UpdateNameModal";

export default function Dashboard() {
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);

  const { data: session, update } = useSession();

  const userName = session?.user?.name || "User";
  const username = session?.username || "username_not_set";
  const userImage = session?.user?.image || "/default-avatar.png";
  const userBanner = (session?.user as any)?.banner as string | undefined;

  const followers = session?.user?.followersCount ?? 0;
  const following = session?.user?.followingCount ?? 0;

  const handleProfileModalClose = async (needsUpdate?: boolean) => {
    setIsProfileModalOpen(false);
    if (needsUpdate) {
      await update();
    }
  };

  const handleNameModalClose = async (needsUpdate?: boolean) => {
    setIsNameModalOpen(false);
    if (needsUpdate) {
      await update();
    }
  };

  return (
    <div className="w-full">
      {/* ===== Banner + Profile Header Section ===== */}
      {/* ===== Banner Section ===== */}
<div className="relative w-full">
  {/* Banner */}
  {userBanner ? (
    <img
      src={userBanner}
      alt={`${userName}'s banner`}
      className="w-full h-48 object-cover"
    />
  ) : (
    <div className="w-full h-48 bg-linear-to-r from-gray-700 via-gray-800 to-black" />
  )}

  {/* PROFILE HEADER BLOCK */}
  <div className="absolute bottom-0 left-0 w-full px-10 pb-4 flex items-end gap-6">

    {/* Profile Picture */}
    <div className="-mb-10">
      <div className="h-28 w-28 rounded-full overflow-hidden border-4 border-gray-900 shadow-lg bg-black">
        <img
          src={userImage}
          alt={userName}
          className="h-full w-full object-cover"
        />
      </div>
    </div>

    {/* User Text Section */}
    <div className="flex flex-col">
      <div className="flex items-center gap-2">
        <h2 className="text-2xl font-bold text-[#E9E6D7]">{userName}</h2>

        <button
          onClick={() => setIsNameModalOpen(true)}
          className="text-[#E9E6D7] hover:text-white transition"
        >
          <Pencil className="w-4 h-4" />
        </button>
      </div>

      <p className="text-[#E9E6D7] text-sm">@{username}</p>

      <div className="flex gap-4 mt-1">
        <span className="text-sm text-gray-300">
          <strong className="text-[#E9E6D7]">{followers}</strong> Followers
        </span>
        <span className="text-sm text-gray-300">
          <strong className="text-[#E9E6D7]">{following}</strong> Following
        </span>
      </div>
    </div>

    {/* Edit Profile button aligned to the right */}
    <div className="ml-auto mb-2">
      <button
        onClick={() => setIsProfileModalOpen(true)}
        className="bg-[#E9E6D7] hover:bg-gray-600 text-black hover:text-white font-semibold px-4 py-2 rounded-lg shadow-md transition active:scale-95"
      >
        Edit Profile
      </button>
    </div>
  </div>
</div>


      {/* Push content down to avoid overlap with header */}
      <div className="mt-20">
        {isProfileModalOpen && (
          <UpdateProfileForm onClose={handleProfileModalClose} />
        )}

        {isNameModalOpen && (
          <UpdateNameModal onClose={handleNameModalClose} currentName={userName} />
        )}

        <DashboardContent />
      </div>
    </div>
  );
}
