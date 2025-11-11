"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import LoginButton from "../components/LoginButton";
import LogoutButton from "../components/LogoutButton";
import Dashboard from "@/components/Dashboard";
import ConnectGitHub from "@/components/ConnectGitHub";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Redirect to username setup if user is logged in but doesn't have a username
    if (status === "authenticated" && session && !session.username) {
      router.push("/setup-username");
    }
  }, [session, status, router]);

  if (status === "loading") {
    return (
      <div style={{ padding: "2rem" }}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem" }}>
      {session ? (
        <>
          <p>Signed in as {session.user?.name}</p>
          {session.username && <p>Username: {session.username}</p>}
          {!session.hasGitHub && <ConnectGitHub />}
          <LogoutButton />
          <Dashboard/>
        </>
      ) : (
        <LoginButton />
      )}
    </div>
  );
}
