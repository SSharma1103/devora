//[copy:ssharma1103/devora/devora-89e6923eb581ed1218c56442af4adcaf8e62979a/components/PublicProfileHeader.tsx]
"use client";

import { useState } from "react";
import { useSession } from "next-auth/react"; // Import useSession
import { Loader2 } from "lucide-react";

// 1. Update props
interface Props {
  user: {
    id: number; // We need the ID to follow/unfollow
    name: string | null;
    username: string;
    pfp: string | null;
    banner: string | null;
  };
  isFollowedByCurrentUser: boolean;
  isCurrentUser: boolean;
  followerCount: number;
  followingCount: number;
}

export default function PublicProfileHeader({
  user,
  isFollowedByCurrentUser,
  isCurrentUser,
  followerCount,
  followingCount,
}: Props) {
  const { data: session, status } = useSession(); // Get current user's session
  const [isFollowing, setIsFollowing] = useState(isFollowedByCurrentUser);
  const [isLoading, setIsLoading] = useState(false);
  const [currentFollowerCount, setCurrentFollowerCount] = useState(followerCount);

  const userName = user.name || "User";
  const username = user.username || "username_not_set";
  const userImage = user.pfp || "/default-avatar.png";
  const userBanner = user.banner;

  const handleFollow = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/user/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: user.id }),
      });
      if (!res.ok) throw new Error("Failed to follow");
      setIsFollowing(true);
      setCurrentFollowerCount((c) => c + 1);
    } catch (error) {
      console.error(error);
    }
    setIsLoading(false);
  };

  const handleUnfollow = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/user/follow", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: user.id }),
      });
      if (!res.ok) throw new Error("Failed to unfollow");
      setIsFollowing(false);
      setCurrentFollowerCount((c) => c - 1);
    } catch (error) {
      console.error(error);
    }
    setIsLoading(false);
  };

  const renderFollowButton = () => {
    // Don't show button if:
    // 1. We are checking the session
    // 2. The user is not logged in
    // 3. This is the current user's own profile
    if (status === "loading" || !session || isCurrentUser) {
      return null;
    }

    // Show loading spinner if action is in progress
    if (isLoading) {
      return (
        <button
          className="absolute right-10 bottom-6 bg-gray-700 text-white font-semibold px-4 py-2 rounded-lg shadow-md transition flex items-center gap-2"
          disabled
        >
          <Loader2 className="animate-spin h-4 w-4" />
          Processing...
        </button>
      );
    }

    // Show Unfollow button
    if (isFollowing) {
      return (
        <button
          onClick={handleUnfollow}
          className="absolute right-10 bottom-6 bg-gray-700 hover:bg-gray-600 text-white font-semibold px-4 py-2 rounded-lg shadow-md transition active:scale-95"
        >
          Unfollow
        </button>
      );
    }

    // Show Follow button
    return (
      <button
        onClick={handleFollow}
        className="absolute right-10 bottom-6 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2 rounded-lg shadow-md transition active:scale-95"
      >
        Follow
      </button>
    );
  };

  return (
    <div className="relative w-full">
      {/* Banner */}
      {userBanner ? (
        <img
          src={userBanner}
          alt={`${userName}'s banner`}
          className="w-full h-40 object-cover"
        />
      ) : (
        <div className="w-full h-40 bg-linear-to-r from-gray-700 via-gray-800 to-black" />
      )}

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

      {/* User Info & Follow Stats */}
      <div className="absolute left-44 bottom-2 flex flex-col">
        <h2 className="text-2xl font-bold text-white">{userName}</h2>
        <p className="text-gray-400 text-sm">@{username}</p>
        <div className="flex gap-4 mt-1">
          <span className="text-sm text-gray-300">
            <strong className="text-white">{currentFollowerCount}</strong> Followers
          </span>
          <span className="text-sm text-gray-300">
            <strong className="text-white">{followingCount}</strong> Following
          </span>
        </div>
      </div>

      {/* Follow/Unfollow Button */}
      {renderFollowButton()}
    </div>
  );
}