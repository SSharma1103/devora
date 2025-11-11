"use client";

import SyncGitHubData from "./SyncGitHubData";
import ProjectsManager from "./ProjectsManager";
import WorkExpManager from "./WorkExpManager";

export default function Dashboard() {
  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <h1 style={{ marginBottom: "2rem" }}>Dashboard</h1>
      
      <SyncGitHubData />
      <ProjectsManager />
      <WorkExpManager />
    </div>
  );
}