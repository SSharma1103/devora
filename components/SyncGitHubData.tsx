"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";

export default function SyncGitHubData() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [data, setData] = useState<any>(null);
  const { data: session } = useSession();

  const handleSync = async () => {
    setLoading(true);
    setError("");
    setSuccess(false);
    setData(null);

    try {
      const response = await fetch("/api/gitdata/sync", {
        method: "POST",
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Failed to sync GitHub data");
        return;
      }

      setSuccess(true);
      setData(result.data);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (!session?.hasGitHub) {
    return null;
  }

  return (
    <div style={{ padding: "1rem", border: "1px solid #ccc", borderRadius: "8px", marginBottom: "1rem" }}>
      <h3 style={{ marginTop: 0 }}>GitHub Data Sync</h3>
      <button
        onClick={handleSync}
        disabled={loading}
        style={{
          padding: "0.5rem 1rem",
          backgroundColor: "#0070f3",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? "Syncing..." : "Sync GitHub Data"}
      </button>

      {error && (
        <div style={{ color: "red", marginTop: "0.5rem" }}>{error}</div>
      )}

      {success && (
        <div style={{ color: "green", marginTop: "0.5rem" }}>
          GitHub data synced successfully!
        </div>
      )}

      {data && (
        <div style={{ marginTop: "1rem", padding: "0.5rem", backgroundColor: "#f5f5f5", borderRadius: "4px" }}>
          <h4>Synced Data:</h4>
          <ul style={{ margin: 0, paddingLeft: "1.5rem" }}>
            <li>Repos: {data.repos}</li>
            <li>Private Repos: {data.privateRepos}</li>
            <li>Commits: {data.commits}</li>
            <li>Stars: {data.stars}</li>
            <li>Followers: {data.followers}</li>
            <li>Following: {data.following}</li>
            <li>Total Contributions: {data.totalContributions}</li>
            <li>Contributions This Year: {data.contributionsThisYear}</li>
            <li>Contributions Not Owned: {data.contributionsNotOwned}</li>
            <li>Account Age: {data.accountAge} days</li>
            {data.lastSynced && (
              <li>Last Synced: {new Date(data.lastSynced).toLocaleString()}</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

