"use client";

import { useSession } from "next-auth/react";
import LoginButton from "./components/LoginButton";
import LogoutButton from "./components/LogoutButton";

export default function Home() {
  const { data: session } = useSession();

  return (
    <div style={{ padding: "2rem" }}>
      {session ? (
        <>
          <p>Signed in as {session.user?.name}</p>
          <LogoutButton />
        </>
      ) : (
        <LoginButton />
      )}
    </div>
  );
}
