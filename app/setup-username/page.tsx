"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function SetupUsername() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!username.trim()) {
      setError("Username is required");
      setLoading(false);
      return;
    }

    // Normalize and validate username
    const normalizedUsername = username.trim().toLowerCase();
    
    if (!normalizedUsername) {
      setError("Username cannot be empty");
      setLoading(false);
      return;
    }

    // Validate username format (alphanumeric and underscores, 3-20 chars)
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(normalizedUsername)) {
      setError("Username must be 3-20 characters and contain only letters, numbers, and underscores");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/user/username", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username: normalizedUsername }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to set username");
        setLoading(false);
        return;
      }

      // Update session to reflect new username
      await update();
      
      // Redirect to home page
      router.push("/");
    } catch (err) {
      setError("An error occurred. Please try again.");
      setLoading(false);
    }
  };

  if (!session) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <p>Please sign in first</p>
      </div>
    );
  }

  if (session.username) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <p>You already have a username: {session.username}</p>
        <button onClick={() => router.push("/")}>Go to Home</button>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "500px", margin: "0 auto" }}>
      <h1>Set Your Username</h1>
      <p style={{ marginBottom: "1rem", color: "#666" }}>
        Choose a unique username for your profile. This can only be set once.
      </p>
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "1rem" }}>
          <label htmlFor="username" style={{ display: "block", marginBottom: "0.5rem" }}>
            Username
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter username"
            style={{
              width: "100%",
              padding: "0.5rem",
              fontSize: "1rem",
              border: "1px solid #ccc",
              borderRadius: "4px",
            }}
            disabled={loading}
          />
          <p style={{ fontSize: "0.875rem", color: "#666", marginTop: "0.25rem" }}>
            3-20 characters, letters, numbers, and underscores only
          </p>
        </div>

        {error && (
          <div style={{ color: "red", marginBottom: "1rem" }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "0.75rem 1.5rem",
            fontSize: "1rem",
            backgroundColor: "#0070f3",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? "Setting username..." : "Set Username"}
        </button>
      </form>
    </div>
  );
}

