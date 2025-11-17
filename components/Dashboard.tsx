"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import UpdateProfileForm from "./UpdateProfileForm";
import DashboardContent from "./DashboardContent";

export default function Dashboard() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: session } = useSession();

  const userName = session?.user?.name || "User";
  const username = session?.username || "username_not_set";
  const userImage = session?.user?.image || "/default-avatar.png";

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
          <h2 className="text-2xl font-bold text-white">{userName}</h2>
          <p className="text-gray-400 text-sm">@{username}</p>
        </div>

        {/* Edit Profile Button */}
        <button
          onClick={() => setIsOpen(true)}
          className="absolute right-10 bottom-6 bg-gray-700 hover:bg-gray-600 text-white font-semibold px-4 py-2 rounded-lg shadow-md transition active:scale-95"
        >
          Edit Profile
        </button>
      </div>

      {/* Push the content down to avoid overlap */}
      <div className="mt-20">
        {isOpen && <UpdateProfileForm onClose={() => setIsOpen(false)} />}
        <DashboardContent />
      </div>
    </div>
  );
}
 