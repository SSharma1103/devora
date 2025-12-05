"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";
import Image from "next/image";
import LogoutButton from "../components/LogoutButton";
import Dashboard from "@/components/Dashboard";
import ConnectGitHub from "@/components/ConnectGitHub";
import Sidebar from "@/components/sidebar";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Redirect to username setup if logged in but missing username
  useEffect(() => {
    if (status === "authenticated" && session && !session.username) {
      router.push("/setup-username");
    }
  }, [session, status, router]);

  // Handle OAuth sign-in
  const handleSignIn = async (provider: "google" | "github") => {
    try {
      setLoading(true);
      await signIn(provider, { callbackUrl: "/" });
    } catch (err) {
      console.error("Login failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // Loading screen
  if (status === "loading") {
    return (
      <div className="flex justify-center items-center h-screen text-[#E9E6D7]">
        Loading...
      </div>
    );
  }

  // -------------------------------
  // 👇 Not Logged In — Show Login Split Layout
  // -------------------------------
  if (!session) {
    return (
      <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
        {/* Left Side: Background Image */}
        <div className="relative hidden md:block">
          <Image
            src="/download.jpg"
            alt="Abstract background"
            layout="fill"
            objectFit="cover"
            priority
          />
        </div>

        {/* Right Side: Login UI */}
        <div className="flex items-center justify-center bg-black text-[#E9E6D7] px-6">
          <div className="w-full max-w-md bg-black rounded-2xl border border-gray-800 p-8 shadow-lg backdrop-blur-md bg-opacity-60">
            <h2 className="text-3xl font-semibold mb-6 text-center">
              Welcome Back
            </h2>

            <p className="text-[#E9E6D7] text-center mb-8">
              Login to continue to your account
            </p>

            {/* OAuth Login Buttons */}
            <div className="flex flex-col space-y-4">
              <button
                onClick={() => handleSignIn("google")}
                disabled={loading}
                className="flex items-center justify-center space-x-3 bg-gray-900 hover:bg-gray-800 text-[#E9E6D7] font-semibold py-3 rounded-lg border border-gray-700 transition active:scale-95"
              >
                <FcGoogle className="text-2xl" />
                <span>{loading ? "Signing in..." : "Continue with Google"}</span>
              </button>

              <button
                onClick={() => handleSignIn("github")}
                disabled={loading}
                className="flex items-center justify-center space-x-3 bg-gray-900 hover:bg-gray-800 text-[#E9E6D7] font-semibold py-3 rounded-lg border border-gray-700 transition active:scale-95"
              >
                <FaGithub className="text-xl" />
                <span>{loading ? "Signing in..." : "Continue with GitHub"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------
  // 👇 Logged In — Show Sidebar + Dashboard
  // -------------------------------
  return (
    <div className="flex bg-black text-[#E9E6D7] min-h-screen">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Dashboard Area */}
      <div className="flex-1 ml-20 p-8 overflow-y-auto">
       

        {!session.hasGitHub && <ConnectGitHub />}

        
        <Dashboard />
      </div>
    </div>
  );
}
