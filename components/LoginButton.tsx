"use client";

import { signIn } from "next-auth/react";

export default function LoginButtons() {
  return (
    <div style={{ display: "flex", gap: "12px" }}>
      <button onClick={() => signIn("github")}>
        Sign in with GitHub
      </button>

      <button onClick={() => signIn("google")}>
        Sign in with Google
      </button>
    </div>
  );
}
