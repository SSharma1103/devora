"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Search, Home, User, FolderGit2 } from "lucide-react"; // icons
import LogoutButton from "@/components/LogoutButton";

export default function Sidebar() {
  const router = useRouter();

  return (
    <div className="fixed left-0 top-0 h-full w-20 bg-black border-r border-gray-800 flex flex-col justify-between items-center py-4 z-50">
      {/* --- Top Section --- */}
      <div className="flex flex-col items-center space-y-4">
        {/* Logo */}
        <button
          onClick={() => router.push("/")}
          className="flex items-center justify-center h-16 w-16 bg-zinc-900 rounded-xl hover:bg-zinc-800 active:scale-95 transition"
        >
          <Image
            src="/download.jpg"
            alt="Logo"
            width={50}
            height={50}
            className="rounded-lg opacity-80"
          />
        </button>

        {/* Home */}
        <button
          onClick={() => router.push("/")}
          className="h-12 w-12 flex items-center justify-center bg-zinc-900 rounded-xl hover:bg-zinc-800 active:scale-95 transition border border-zinc-700"
        >
          <Home className="w-5 h-5 text-gray-300" />
        </button>

        {/* Search / User Directory */}
        <button
          onClick={() => router.push("/search")}
          className="h-12 w-12 flex items-center justify-center bg-zinc-900 rounded-xl hover:bg-blue-900 active:scale-95 transition border border-zinc-700"
          title="Search Users"
        >
          <Search className="w-5 h-5 text-blue-400" />
        </button>

        {/* Profile */}
        <button
          onClick={() => router.push("/connections")}
          className="h-12 w-12 flex items-center justify-center bg-zinc-900 rounded-xl hover:bg-zinc-800 active:scale-95 transition border border-zinc-700"
          title="Profile"
        >
          <User className="w-5 h-5 text-gray-300" />
        </button>

        {/* Projects */}
        <button
          onClick={() => router.push("/timeline")}
          className="h-12 w-12 flex items-center justify-center bg-zinc-900 rounded-xl hover:bg-zinc-800 active:scale-95 transition border border-zinc-700"
          title="Projects"
        >
          <FolderGit2 className="w-5 h-5 text-gray-300" />
        </button>
      </div>

      {/* --- Bottom Section: Logout --- */}
      <div className="pb-3">
        <LogoutButton />
      </div>
    </div>
  );
}

