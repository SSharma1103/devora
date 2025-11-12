//[copy:ssharma1103/devora/devora-b7321077cd9d75e6fb001acbeaa36d22b960d15c/components/PublicProfileHeader.tsx]
"use client";

// Simple prop type, add more fields from your User model as needed
interface Props {
  user: {
    name: string | null;
    username: string;
    pfp: string | null;
    banner: string | null; // Assuming you have a banner field on your User model
  };
}

export default function PublicProfileHeader({ user }: Props) {
  const userName = user.name || "User";
  const username = user.username || "username_not_set";
  const userImage = user.pfp || "/default-avatar.png"; // Use a default avatar
  const userBanner = user.banner; // Add a default banner if you want

  return (
    <div className="relative w-full">
      {/* Banner */}
      {userBanner ? (
         <img src={userBanner} alt={`${userName}'s banner`} className="w-full h-40 object-cover" />
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

      {/* User Info */}
      <div className="absolute left-44 bottom-4 flex flex-col">
        <h2 className="text-2xl font-bold text-white">{userName}</h2>
        <p className="text-gray-400 text-sm">@{username}</p>
      </div>

      {/* No "Edit Profile" button here, this is public! */}
    </div>
  );
}