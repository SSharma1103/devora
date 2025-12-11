This file is a merged representation of the entire codebase, combined into a single document by Repomix.

<file_summary>
This section contains a summary of this file.

<purpose>
This file contains a packed representation of the entire repository's contents.
It is designed to be easily consumable by AI systems for analysis, code review,
or other automated processes.
</purpose>

<file_format>
The content is organized as follows:
1. This summary section
2. Repository information
3. Directory structure
4. Repository files (if enabled)
5. Multiple file entries, each consisting of:
  - File path as an attribute
  - Full contents of the file
</file_format>

<usage_guidelines>
- This file should be treated as read-only. Any changes should be made to the
  original repository files, not this packed version.
- When processing this file, use the file path to distinguish
  between different files in the repository.
- Be aware that this file may contain sensitive information. Handle it with
  the same level of security as you would the original repository.
</usage_guidelines>

<notes>
- Some files may have been excluded based on .gitignore rules and Repomix's configuration
- Binary files are not included in this packed representation. Please refer to the Repository Structure section for a complete list of file paths, including binary files
- Files matching patterns in .gitignore are excluded
- Files matching default ignore patterns are excluded
- Files are sorted by Git change count (files with more changes are at the bottom)
</notes>

</file_summary>

<directory_structure>
actions/
  getContributions.ts
app/
  [username]/
    page.tsx
  api/
    auth/
      [...nextauth]/
        route.ts
      link-github/
        route.ts
    gitdata/
      [username]/
        route.ts
      sync/
        route.ts
    pdata/
      route.ts
    projects/
      [id]/
        route.ts
      route.ts
    timeline/
      route.ts
    upload-signature/
      route.ts
    user/
      connections/
        route.ts
      follow/
        route.ts
      profile/
        route.ts
      username/
        route.ts
      route.ts
    workexp/
      [id]/
        route.ts
      route.ts
  connections/
    page.tsx
  search/
    page.tsx
  setup-username/
    page.tsx
  timeline/
    page.tsx
  favicon.ico
  globals.css
  layout.tsx
  page.tsx
  povider.tsx
components/
  ConnectGitHub.tsx
  Dashboard.tsx
  DashboardContent.tsx
  GitHub.tsx
  Leetcode.tsx
  LoginButton.tsx
  LogoutButton.tsx
  Projects.tsx
  ProjectsManager.tsx
  PublicGitData.tsx
  PublicProfileHeader.tsx
  RightSidebar.tsx
  sidebar.tsx
  SyncGitHubData.tsx
  UpdateNameModal.tsx
  UpdateProfileForm.tsx
  WorkExperience.tsx
  WorkExpManager.tsx
lib/
  queries/
    contributions.ts
    github-stats.ts
  services/
    github.ts
  auth.ts
  prisma.ts
prisma/
  migrations/
    20251108141428_initial_migration/
      migration.sql
    20251109075840_add_gitdata_fields/
      migration.sql
    20251114053647_add_follow_model/
      migration.sql
    20251114060735_add_timeline_modal/
      migration.sql
    migration_lock.toml
  schema.prisma
public/
  download.jpg
types/
  next-auth.d.ts
.gitignore
eslint.config.mjs
next.config.ts
package.json
postcss.config.mjs
prisma.config.ts
README.md
tsconfig.json
</directory_structure>

<files>
This section contains the contents of the repository's files.

<file path="actions/getContributions.ts">
"use server"

import { CONTRIBUTIONS_QUERY } from "@/lib/queries/contributions"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import axios from "axios"

export const getContributions= async (query: string , accessToken : string)=>{
    console.log("working ")
    const response = await axios.post("https://api.github.com/graphql" , {query} , {
        headers : {
            Authorization : `Bearer ${accessToken}`
        } ,
    })
    console.log(response.data)
    return response.data.data
}


export async function getGithubStats(){
    const session = await getServerSession(authOptions);
    const token = session?.accessToken 

    if (!token) throw new Error("No access token available.");

    const data = await getContributions(CONTRIBUTIONS_QUERY , token)
    return data
}
</file>

<file path="app/api/auth/link-github/route.ts">
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Store current user ID in cookie for account linking
    const cookieStore = await cookies();
    cookieStore.set("link_account_user_id", session.userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 5, // 5 minutes
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error setting link account cookie:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
</file>

<file path="app/api/gitdata/[username]/route.ts">
// app/api/gitdata/[username]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await context.params;

    if (!username) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    // 1. Find user by username
    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // 2. Get gitdata by userId
    const gitData = await prisma.gitdata.findUnique({
      where: { userId: user.id },
    });

    if (!gitData) {
      return NextResponse.json(
        { error: "Git data not found. Please sync first." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: gitData });
  } catch (error) {
    console.error("Error fetching git data by username:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to fetch git data", message: errorMessage },
      { status: 500 }
    );
  }
}
</file>

<file path="app/api/gitdata/sync/route.ts">
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { fetchGitHubStats, processGitHubStats } from "@/lib/services/github";
import { Prisma } from "@prisma/client";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.userId || !session?.accessToken) {
      return NextResponse.json(
        { error: "Unauthorized or no GitHub token available" },
        { status: 401 }
      );
    }

    if (!session.hasGitHub) {
      return NextResponse.json(
        { error: "GitHub account not linked" },
        { status: 400 }
      );
    }

    // Fetch GitHub stats
    const stats = await fetchGitHubStats(session.accessToken);
    const processedData = processGitHubStats(stats);

    // Upsert git data
    const gitData = await prisma.gitdata.upsert({
      where: { userId: parseInt(session.userId) },
      update: {
        repos: processedData.repos,
        privateRepos: processedData.privateRepos,
        commits: processedData.commits,
        followers: processedData.followers,
        following: processedData.following,
        stars: processedData.stars,
        totalContributions: processedData.totalContributions,
        contributionsThisYear: processedData.contributionsThisYear,
        contributionsNotOwned: processedData.contributionsNotOwned,
        accountAge: processedData.accountAge,
        commitHistory: processedData.commitHistory as unknown as Prisma.InputJsonValue,
      },
      create: {
        userId: parseInt(session.userId),
        repos: processedData.repos,
        privateRepos: processedData.privateRepos,
        commits: processedData.commits,
        followers: processedData.followers,
        following: processedData.following,
        stars: processedData.stars,
        totalContributions: processedData.totalContributions,
        contributionsThisYear: processedData.contributionsThisYear,
        contributionsNotOwned: processedData.contributionsNotOwned,
        accountAge: processedData.accountAge,
        commitHistory: processedData.commitHistory as unknown as Prisma.InputJsonValue,
      },
    });

    return NextResponse.json({
      success: true,
      data: gitData,
      processed: processedData,
    });
  } catch (error) {
    console.error("Error syncing git data:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        error: "Failed to sync git data",
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const gitData = await prisma.gitdata.findUnique({
      where: { userId: parseInt(session.userId) },
    });

    if (!gitData) {
      return NextResponse.json(
        { error: "Git data not found. Please sync first." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: gitData });
  } catch (error) {
    console.error("Error fetching git data:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to fetch git data", message: errorMessage },
      { status: 500 }
    );
  }
}
</file>

<file path="app/api/pdata/route.ts">
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: parseInt(session.userId) },
    });

    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    const pdata = await prisma.pdata.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id },
    });

    return NextResponse.json({ success: true, data: pdata });
  } catch (err: any) {
    console.error("Error fetching personal data:", err);
    return NextResponse.json(
      { error: "Failed to fetch personal data", message: err.message },
      { status: 500 }
    );
  }
}



export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Convert userId from string to Int for Prisma
    const userId = parseInt(session.userId);

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    const { about, devstats, stack, socials } = body;

    // Validate incoming data
    if (
      typeof about !== "string" &&
      typeof devstats !== "string" &&
      typeof stack !== "string" &&
      typeof socials !== "object"
    ) {
      return NextResponse.json(
        { error: "Invalid data format" },
        { status: 400 }
      );
    }

    // ✅ Upsert ensures the record exists or is created
    const updated = await prisma.pdata.upsert({
      where: { userId },
      update: { about, devstats, stack, socials },
      create: { userId, about, devstats, stack, socials },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    console.error("Error updating personal data:", err);
    return NextResponse.json(
      { error: "Failed to update personal data", message: err.message },
      { status: 500 }
    );
  }
}
</file>

<file path="app/api/projects/route.ts">
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const projects = await prisma.project.findMany({
      where: { userId: parseInt(session.userId) },
      orderBy: { id: "desc" },
    });

    return NextResponse.json({ success: true, data: projects });
  } catch {
    console.error("Error fetching projects:");
    return NextResponse.json(
      { error: "Failed to fetch projects"},
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, link, description, gitlink } = body;

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    const project = await prisma.project.create({
      data: {
        title,
        link: link || null,
        description: description || null,
        gitlink: gitlink || null,
        userId: parseInt(session.userId),
      },
    });

    return NextResponse.json({ success: true, data: project }, { status: 201 });
  } catch {
    console.error("Error creating project:");
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}
</file>

<file path="app/api/timeline/route.ts">
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const currentUserId = session?.userId ? parseInt(session.userId) : null;

    if (!currentUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Find all users the current user is following
    const following = await prisma.follow.findMany({
      where: { followerId: currentUserId },
      select: { followingId: true },
    });
    const followingIds = following.map((f) => f.followingId);

    // 2. Get the latest projects from those users
    const projects = await prisma.project.findMany({
      where: {
        userId: { in: followingIds },
      },
      include: {
        user: {
          select: { name: true, username: true, pfp: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 20, // Limit to 20 projects for now
    });

    // 3. Get the latest work experiences from those users
    const workExps = await prisma.workExp.findMany({
      where: {
        userId: { in: followingIds },
      },
      include: {
        user: {
          select: { name: true, username: true, pfp: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 20, // Limit to 20 work exps for now
    });

    // 4. Map them into a unified feed structure
    const mappedProjects = projects.map((project) => ({
      type: "project" as const,
      timestamp: project.createdAt,
      item: project,
    }));

    const mappedWorkExps = workExps.map((workExp) => ({
      type: "workexp" as const,
      timestamp: workExp.createdAt,
      item: workExp,
    }));

    // 5. Combine, sort, and slice the feed
    const feed = [...mappedProjects, ...mappedWorkExps]
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 30); // Take the 30 most recent items overall

    return NextResponse.json({ success: true, data: feed });
  } catch (err: any) {
    console.error("Error fetching timeline:", err);
    return NextResponse.json(
      { error: "Failed to fetch timeline", message: err.message },
      { status: 500 }
    );
  }
}
</file>

<file path="app/api/user/connections/route.ts">
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

/**
 * GET /api/user/connections
 * - Get the logged-in user's followers or following list
 * - Query params:
 * - ?type=followers
 * - ?type=following
 * - ?q= (optional search query)
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const currentUserId = session?.userId ? parseInt(session.userId) : null;

    if (!currentUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // 'followers' or 'following'
    const query = searchParams.get("q");

    let whereClause: any = {};
    if (query) {
      whereClause.OR = [
        { username: { contains: query, mode: "insensitive" } },
        { name: { contains: query, mode: "insensitive" } },
      ];
    }

    const userSelect = {
      id: true,
      name: true,
      username: true,
      pfp: true,
    };

    let users;

    if (type === "followers") {
      // Find all 'Follow' records where the user is being followed
      const follows = await prisma.follow.findMany({
        where: {
          followingId: currentUserId,
          follower: whereClause, // Apply search to the follower
        },
        include: {
          follower: {
            select: userSelect,
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
      users = follows.map((f) => f.follower);
    } else if (type === "following") {
      // Find all 'Follow' records where the user is the follower
      const follows = await prisma.follow.findMany({
        where: {
          followerId: currentUserId,
          following: whereClause, // Apply search to the person being followed
        },
        include: {
          following: {
            select: userSelect,
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
      users = follows.map((f) => f.following);
    } else {
      return NextResponse.json(
        { error: "Invalid type. Must be 'followers' or 'following'." },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, data: users });
  } catch (err: any) {
    console.error("Error fetching connections:", err);
    return NextResponse.json(
      { error: "Failed to fetch connections", message: err.message },
      { status: 500 }
    );
  }
}
</file>

<file path="app/api/user/follow/route.ts">
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// POST /api/user/follow - Follow a user
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const currentUserId = session?.userId ? parseInt(session.userId) : null;

    if (!currentUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { targetUserId } = await request.json();

    if (!targetUserId || typeof targetUserId !== 'number') {
      return NextResponse.json({ error: "targetUserId is required and must be a number" }, { status: 400 });
    }

    if (currentUserId === targetUserId) {
      return NextResponse.json({ error: "You cannot follow yourself" }, { status: 400 });
    }

    // Check if already following
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: targetUserId,
        },
      },
    });

    if (existingFollow) {
      return NextResponse.json({ error: "Already following" }, { status: 409 });
    }

    // Create the follow relationship
    await prisma.follow.create({
      data: {
        followerId: currentUserId,
        followingId: targetUserId,
      },
    });

    return NextResponse.json({ success: true, message: "Successfully followed user" }, { status: 201 });

  } catch (error) {
    console.error("Error following user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/user/follow - Unfollow a user
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const currentUserId = session?.userId ? parseInt(session.userId) : null;

    if (!currentUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { targetUserId } = await request.json();

    if (!targetUserId || typeof targetUserId !== 'number') {
      return NextResponse.json({ error: "targetUserId is required" }, { status: 400 });
    }

    // Check if the follow relationship exists
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: targetUserId,
        },
      },
    });

    if (!existingFollow) {
      return NextResponse.json({ error: "Not following" }, { status: 404 });
    }

    // Delete the follow relationship
    await prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: targetUserId,
        },
      },
    });

    return NextResponse.json({ success: true, message: "Successfully unfollowed user" });

  } catch (error) {
    console.error("Error unfollowing user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
</file>

<file path="app/api/user/username/route.ts">
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { username: rawUsername } = await request.json();

    if (!rawUsername || typeof rawUsername !== "string") {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    // Normalize username: trim and convert to lowercase
    const username = rawUsername.trim().toLowerCase();

    if (!username) {
      return NextResponse.json(
        { error: "Username cannot be empty" },
        { status: 400 }
      );
    }
    // Check if user already has a username
    const user = await prisma.user.findUnique({
      where: { id: parseInt(session.userId) },
      select: { username: true },
    });

    if (user?.username) {
      return NextResponse.json(
        { error: "Username has already been set" },
        { status: 400 }
      );
    }

    // Check if username is already taken
    const existingUser = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Username is already taken" },
        { status: 409 }
      );
    }

    // Update user with username
    await prisma.user.update({
      where: { id: parseInt(session.userId) },
      data: { username },
    });

    return NextResponse.json({ success: true, username });
  } catch (error) {
    console.error("Error setting username:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
</file>

<file path="app/api/workexp/route.ts">
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const workExp = await prisma.workExp.findMany({
      where: { userId: parseInt(session.userId) },
      orderBy: { id: "desc" },
    });

    return NextResponse.json({ success: true, data: workExp });
  } catch (error: any) {
    console.error("Error fetching work experience:", error);
    return NextResponse.json(
      { error: "Failed to fetch work experience", message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, duration, description, companyName, image } = body;

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    const workExp = await prisma.workExp.create({
      data: {
        title,
        duration: duration || null,
        description: description || null,
        companyName: companyName || null,
        image: image || null,
        userId: parseInt(session.userId),
      },
    });

    return NextResponse.json({ success: true, data: workExp }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating work experience:", error);
    return NextResponse.json(
      { error: "Failed to create work experience", message: error.message },
      { status: 500 }
    );
  }
}
</file>

<file path="app/globals.css">
@import "tailwindcss";

:root {
  --background: #ffffff;
  --foreground: #171717;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #0a0a0a;
    --foreground: #ededed;
  }
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: Arial, Helvetica, sans-serif;
}
</file>

<file path="app/povider.tsx">
"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";

interface ProvidersProps {
  children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return <SessionProvider>{children}</SessionProvider>;
}
</file>

<file path="components/LoginButton.tsx">
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
</file>

<file path="components/LogoutButton.tsx">
"use client";

import { signOut } from "next-auth/react";

export default function LogoutButton() {
  return (
    <button onClick={() => signOut()}>
      Log out
    </button>
  );
}
</file>

<file path="components/ProjectsManager.tsx">
"use client";

import { useState, useEffect } from "react";

interface Project {
  id: number;
  title: string;
  link?: string | null;
  description?: string | null;
  gitlink?: string | null;
}

export default function ProjectsManager() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    link: "",
    description: "",
    gitlink: "",
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/projects");
      const result = await response.json();
      if (result.success) {
        setProjects(result.data);
      } else {
        setError(result.error || "Failed to fetch projects");
      }
    } catch{
      setError("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.title.trim()) {
      setError("Title is required");
      return;
    }

    setLoading(true);
    try {
      const url = editingProject
        ? `/api/projects/${editingProject.id}`
        : "/api/projects";
      const method = editingProject ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      if (result.success) {
        await fetchProjects();
        setShowForm(false);
        setEditingProject(null);
        setFormData({ title: "", link: "", description: "", gitlink: "" });
      } else {
        setError(result.error || "Failed to save project");
      }
    } catch {
      setError("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setFormData({
      title: project.title,
      link: project.link || "",
      description: project.description || "",
      gitlink: project.gitlink || "",
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this project?")) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();
      if (result.success) {
        await fetchProjects();
      } else {
        setError(result.error || "Failed to delete project");
      }
    } catch  {
      setError( "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div>
        <div>
          <button
            onClick={() => {
              setShowForm(!showForm);
              setEditingProject(null);
              setFormData({ title: "", link: "", description: "", gitlink: "" });
            }}
          >
            {showForm ? "Cancel" : "Add Project"}
          </button>
        </div>

        {error && <div>{error}</div>}

        {showForm && (
          <form onSubmit={handleSubmit}>
            <div>
              <label style={{ display: "block", marginBottom: "0.25rem" }}>Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div style={{ marginBottom: "0.5rem" }}>
              <label>Link</label>
              <input
                type="url"
                value={formData.link}
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
              />
            </div>
            <div style={{ marginBottom: "0.5rem" }}>
              <label style={{ display: "block", marginBottom: "0.25rem" }}>GitHub Link</label>
              <input
                type="url"
                value={formData.gitlink}
                onChange={(e) => setFormData({ ...formData, gitlink: e.target.value })}
              />
            </div>
            <div style={{ marginBottom: "0.5rem" }}>
              <label style={{ display: "block", marginBottom: "0.25rem" }}>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                style={{ width: "100%", padding: "0.5rem", minHeight: "80px" }}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "0.5rem 1rem",
                backgroundColor: "#0070f3",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Saving..." : editingProject ? "Update" : "Create"}
            </button>
          </form>
        )}

        {loading && !showForm && <div>Loading projects...</div>}

        <div>
          {projects.length === 0 ? (
            <p>No projects yet. Add your first project!</p>
          ) : (
            projects.map((project) => (
              <div
                key={project.id}
                style={{
                  padding: "1rem",
                  marginBottom: "0.5rem",
                  backgroundColor: "#f9f9f9",
                  borderRadius: "4px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "start",
                }}
              >
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: "0 0 0.5rem 0" }}>{project.title}</h4>
                  {project.description && <p style={{ margin: "0 0 0.5rem 0", color: "#666" }}>{project.description}</p>}
                  <div style={{ display: "flex", gap: "1rem", fontSize: "0.875rem" }}>
                    {project.link && (
                      <a href={project.link} target="_blank" rel="noopener noreferrer">
                        View Project
                      </a>
                    )}
                    {project.gitlink && (
                      <a href={project.gitlink} target="_blank" rel="noopener noreferrer">
                        GitHub
                      </a>
                    )}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    onClick={() => handleEdit(project)}
                    style={{
                      padding: "0.25rem 0.5rem",
                      backgroundColor: "#666",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "0.875rem",
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(project.id)}
                    style={{
                      padding: "0.25rem 0.5rem",
                      backgroundColor: "#dc3545",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "0.875rem",
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
</file>

<file path="components/PublicGitData.tsx">
// components/PublicGitData.tsx
"use client";

import { useEffect, useState } from "react";
import { 
  GitMerge, 
  GitBranch, 
  User, 
  CheckCircle2, 
  Star, 
  Github as GithubIcon,
  AlertCircle,
  RefreshCw
} from "lucide-react";

interface GithubPublicProps {
  username: string;
}

export default function GithubPublic({ username }: GithubPublicProps) {
  const [gitData, setGitData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!username) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/gitdata/${encodeURIComponent(username)}`, {
          method: "GET",
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || "Failed to fetch data");

        setGitData(data.data);
        setError(null);
      } catch (err: any) {
        setError(err.message || "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [username]);

  // --- Theme Constants ---
  const offWhite = "#E9E6D7";
  const labelClass =
    "text-[10px] font-bold text-[#E9E6D7]/50 uppercase tracking-widest";
  const cardClass =
    "bg-[#050505] border border-[#E9E6D7]/10 p-4 flex flex-col items-center justify-center gap-1 transition-all hover:border-[#E9E6D7]/30 group";
  const valueClass =
    "text-xl font-bold text-[#E9E6D7] font-mono group-hover:scale-105 transition-transform";

  // --- Loading State ---
  if (loading)
    return (
      <div className="w-full h-48 bg-[#0a0a0a] border border-[#E9E6D7]/20 flex flex-col items-center justify-center gap-3">
        <RefreshCw className="animate-spin text-[#E9E6D7]/40" size={24} />
        <span className="text-xs text-[#E9E6D7]/60 tracking-wider uppercase animate-pulse">
          Fetching Git Data...
        </span>
      </div>
    );

  // --- Error State ---
  if (error)
    return (
      <div className="w-full bg-[#0a0a0a] border border-red-900/30 p-6 flex flex-col items-center justify-center gap-3 text-center">
        <div className="p-2 bg-red-900/10 rounded-full text-red-400">
          <AlertCircle size={20} />
        </div>

        <span className="text-[#E9E6D7] text-sm">{error}</span>

        <p className="text-xs text-[#E9E6D7]/50">
          GitHub data is currently unavailable for this user.
        </p>
      </div>
    );

  // --- Empty State ---
  if (!gitData)
    return (
      <div className="w-full bg-[#0a0a0a] border border-[#E9E6D7]/20 p-8 flex flex-col items-center justify-center gap-4 text-center group hover:border-[#E9E6D7]/40 transition-colors">
        <div className="text-[#E9E6D7]/20 group-hover:text-[#E9E6D7]/40 transition-colors">
          <GithubIcon size={32} />
        </div>
        <p className="text-[#E9E6D7]/50 text-sm">
          No GitHub data available for this user.
        </p>
      </div>
    );

  const { repos, followers, following, totalContributions, stars } = gitData;

  // --- Main UI (same as your card, minus sync button) ---
  return (
    <div className="w-full bg-[#0a0a0a] border border-[#E9E6D7]/20 p-5 flex flex-col gap-5 hover:border-[#E9E6D7]/40 transition-all relative">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#E9E6D7]/5 text-[#E9E6D7] rounded-sm">
            <GithubIcon size={18} />
          </div>
          <div>
            <h2 className="text-[#E9E6D7] font-bold text-sm tracking-tight">
              GITHUB ACTIVITY
            </h2>
            <p className="text-[10px] text-[#E9E6D7]/40 uppercase tracking-widest mt-0.5">
              Public Metrics for @{username}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Repos */}
        <div className={cardClass}>
          <div className="text-[#E9E6D7]/30 mb-1">
            <GitBranch size={14} />
          </div>
          <span className={valueClass}>{repos ?? 0}</span>
          <span className={labelClass}>Repos</span>
        </div>

        {/* Stars */}
        <div className={cardClass}>
          <div className="text-[#E9E6D7]/30 mb-1">
            <Star size={14} />
          </div>
          <span className={valueClass}>{stars ?? 0}</span>
          <span className={labelClass}>Stars</span>
        </div>

        {/* Followers */}
        <div className={cardClass}>
          <div className="text-[#E9E6D7]/30 mb-1">
            <User size={14} />
          </div>
          <span className={valueClass}>{followers ?? 0}</span>
          <span className={labelClass}>Followers</span>
        </div>

        {/* Following */}
        <div className={cardClass}>
          <div className="text-[#E9E6D7]/30 mb-1">
            <User size={14} />
          </div>
          <span className={valueClass}>{following ?? 0}</span>
          <span className={labelClass}>Following</span>
        </div>
      </div>

      {/* Contribution Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-[#E9E6D7]/10">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={14} className="text-[#E9E6D7]" />
          <span className="text-xs font-medium text-[#E9E6D7]">
            {totalContributions ?? 0}{" "}
            <span className="text-[#E9E6D7]/50">Contributions</span>
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-[#E9E6D7]/30">
          <GitMerge size={12} />
          <span className="text-[10px] uppercase tracking-widest">
            Public Snapshot
          </span>
        </div>
      </div>
    </div>
  );
}
</file>

<file path="components/SyncGitHubData.tsx">
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
</file>

<file path="components/WorkExpManager.tsx">
"use client";

import { useState, useEffect } from "react";

interface WorkExp {
  id: number;
  title: string;
  duration?: string | null;
  description?: string | null;
  companyName?: string | null;
  image?: string | null;
}

export default function WorkExpManager() {
  const [workExp, setWorkExp] = useState<WorkExp[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingWorkExp, setEditingWorkExp] = useState<WorkExp | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    duration: "",
    description: "",
    companyName: "",
    image: "",
  });

  useEffect(() => {
    fetchWorkExp();
  }, []);

  const fetchWorkExp = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/workexp");
      const result = await response.json();
      if (result.success) {
        setWorkExp(result.data);
      } else {
        setError(result.error || "Failed to fetch work experience");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.title.trim()) {
      setError("Title is required");
      return;
    }

    setLoading(true);
    try {
      const url = editingWorkExp
        ? `/api/workexp/${editingWorkExp.id}`
        : "/api/workexp";
      const method = editingWorkExp ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      if (result.success) {
        await fetchWorkExp();
        setShowForm(false);
        setEditingWorkExp(null);
        setFormData({ title: "", duration: "", description: "", companyName: "", image: "" });
      } else {
        setError(result.error || "Failed to save work experience");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (exp: WorkExp) => {
    setEditingWorkExp(exp);
    setFormData({
      title: exp.title,
      duration: exp.duration || "",
      description: exp.description || "",
      companyName: exp.companyName || "",
      image: exp.image || "",
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this work experience?")) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/workexp/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();
      if (result.success) {
        await fetchWorkExp();
      } else {
        setError(result.error || "Failed to delete work experience");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "1rem", border: "1px solid #ccc", borderRadius: "8px", marginBottom: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h3 style={{ margin: 0 }}>Work Experience</h3>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingWorkExp(null);
            setFormData({ title: "", duration: "", description: "", companyName: "", image: "" });
          }}
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: "#0070f3",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          {showForm ? "Cancel" : "Add Work Experience"}
        </button>
      </div>

      {error && <div style={{ color: "red", marginBottom: "1rem" }}>{error}</div>}

      {showForm && (
        <form onSubmit={handleSubmit} style={{ marginBottom: "1rem", padding: "1rem", backgroundColor: "#f5f5f5", borderRadius: "4px" }}>
          <div style={{ marginBottom: "0.5rem" }}>
            <label style={{ display: "block", marginBottom: "0.25rem" }}>Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              style={{ width: "100%", padding: "0.5rem" }}
              required
            />
          </div>
          <div style={{ marginBottom: "0.5rem" }}>
            <label style={{ display: "block", marginBottom: "0.25rem" }}>Company Name</label>
            <input
              type="text"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              style={{ width: "100%", padding: "0.5rem" }}
            />
          </div>
          <div style={{ marginBottom: "0.5rem" }}>
            <label style={{ display: "block", marginBottom: "0.25rem" }}>Duration</label>
            <input
              type="text"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              placeholder="e.g., Jan 2020 - Present"
              style={{ width: "100%", padding: "0.5rem" }}
            />
          </div>
          <div style={{ marginBottom: "0.5rem" }}>
            <label style={{ display: "block", marginBottom: "0.25rem" }}>Image URL</label>
            <input
              type="url"
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              style={{ width: "100%", padding: "0.5rem" }}
            />
          </div>
          <div style={{ marginBottom: "0.5rem" }}>
            <label style={{ display: "block", marginBottom: "0.25rem" }}>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              style={{ width: "100%", padding: "0.5rem", minHeight: "100px" }}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "#0070f3",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Saving..." : editingWorkExp ? "Update" : "Create"}
          </button>
        </form>
      )}

      {loading && !showForm && <div>Loading work experience...</div>}

      <div>
        {workExp.length === 0 ? (
          <p>No work experience yet. Add your first work experience!</p>
        ) : (
          workExp.map((exp) => (
            <div
              key={exp.id}
              style={{
                padding: "1rem",
                marginBottom: "0.5rem",
                backgroundColor: "#f9f9f9",
                borderRadius: "4px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "start",
              }}
            >
              <div style={{ flex: 1, display: "flex", gap: "1rem" }}>
                {exp.image && (
                  <img
                    src={exp.image}
                    alt={exp.companyName || exp.title}
                    style={{ width: "60px", height: "60px", objectFit: "cover", borderRadius: "4px" }}
                  />
                )}
                <div>
                  <h4 style={{ margin: "0 0 0.25rem 0" }}>{exp.title}</h4>
                  {exp.companyName && (
                    <p style={{ margin: "0 0 0.25rem 0", fontWeight: "bold", color: "#333" }}>
                      {exp.companyName}
                    </p>
                  )}
                  {exp.duration && (
                    <p style={{ margin: "0 0 0.5rem 0", color: "#666", fontSize: "0.875rem" }}>
                      {exp.duration}
                    </p>
                  )}
                  {exp.description && (
                    <p style={{ margin: 0, color: "#666", fontSize: "0.875rem" }}>{exp.description}</p>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  onClick={() => handleEdit(exp)}
                  style={{
                    padding: "0.25rem 0.5rem",
                    backgroundColor: "#666",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "0.875rem",
                  }}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(exp.id)}
                  style={{
                    padding: "0.25rem 0.5rem",
                    backgroundColor: "#dc3545",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "0.875rem",
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
</file>

<file path="lib/queries/contributions.ts">
export const CONTRIBUTIONS_QUERY = `
query {
  viewer {
    login

    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks {
          contributionDays {
            contributionCount
            date
          }
        }
      }

      commitContributionsByRepository(maxRepositories: 100) {
        repository {
          name
          owner { login }
          stargazerCount
        }
        contributions(first: 100) {
          nodes {
            occurredAt
            commitCount
          }
        }
      }

      pullRequestContributionsByRepository(maxRepositories: 100) {
        repository {
          name
          owner { login }
        }
        contributions(first: 100) {
          nodes {
            pullRequest {
              title
              url
              state
              merged
              mergedAt
              createdAt
              additions
              deletions
            }
          }
        }
      }

      issueContributions {
        totalCount
      }
    }
  }
}
`;
</file>

<file path="lib/queries/github-stats.ts">
export const GITHUB_STATS_QUERY = `
query {
  viewer {
    login
    createdAt
    bio
    avatarUrl
    repositories(first: 100) {
      totalCount
      nodes {
        isPrivate
        stargazerCount
        defaultBranchRef {
          target {
            ... on Commit {
              history(first: 1) {
                totalCount
              }
            }
          }
        }
      }
    }
    repositoriesContributedTo(first: 100, contributionTypes: [COMMIT, PULL_REQUEST, ISSUE]) {
      totalCount
    }
    contributionsCollection {
      totalCommitContributions
      totalIssueContributions
      totalPullRequestContributions
      totalPullRequestReviewContributions
      contributionCalendar {
        totalContributions
        weeks {
          contributionDays {
            contributionCount
            date
          }
        }
      }
      commitContributionsByRepository(maxRepositories: 100) {
        repository {
          name
          owner {
            login
          }
          isPrivate
        }
        contributions(first: 100) {
          totalCount
          nodes {
            occurredAt
            commitCount
          }
        }
      }
    }
    followers {
      totalCount
    }
    following {
      totalCount
    }
  }
}
`;

export const REPOSITORY_CONTRIBUTIONS_QUERY = `
query($cursor: String) {
  viewer {
    repositoriesContributedTo(first: 100, after: $cursor, contributionTypes: [COMMIT, PULL_REQUEST, ISSUE]) {
      totalCount
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        name
        owner {
          login
        }
        stargazerCount
      }
    }
  }
}
`;
</file>

<file path="lib/services/github.ts">
import axios from "axios";

export interface GitHubStats {
  login: string;
  createdAt: string;
  bio?: string;
  avatarUrl: string;
  repositories: {
    totalCount: number;
    nodes: Array<{
      isPrivate: boolean;
      stargazerCount: number;
      defaultBranchRef?: {
        target: {
          history: {
            totalCount: number;
          };
        };
      };
    }>;
  };
  repositoriesContributedTo: {
    totalCount: number;
  };
  contributionsCollection: {
    totalCommitContributions: number;
    totalIssueContributions: number;
    totalPullRequestContributions: number;
    totalPullRequestReviewContributions: number;
    contributionCalendar: {
      totalContributions: number;
      weeks: Array<{
        contributionDays: Array<{
          contributionCount: number;
          date: string;
        }>;
      }>;
    };
    commitContributionsByRepository: Array<{
      repository: {
        name: string;
        owner: {
          login: string;
        };
        isPrivate: boolean;
      };
      contributions: {
        totalCount: number;
        nodes: Array<{
          occurredAt: string;
          commitCount: number;
        }>;
      };
    }>;
  };
  followers: {
    totalCount: number;
  };
  following: {
    totalCount: number;
  };
}

export async function fetchGitHubStats(accessToken: string): Promise<GitHubStats> {
  const { GITHUB_STATS_QUERY } = await import("@/lib/queries/github-stats");
  
  const response = await axios.post(
    "https://api.github.com/graphql",
    { query: GITHUB_STATS_QUERY },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (response.data.errors) {
    throw new Error(`GitHub API Error: ${JSON.stringify(response.data.errors)}`);
  }

  return response.data.data.viewer;
}

export function processGitHubStats(stats: GitHubStats) {
  const now = new Date();
  const createdAt = new Date(stats.createdAt);
  const accountAge = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

  // Calculate total and private repos
  const totalRepos = stats.repositories.totalCount;
  const privateRepos = stats.repositories.nodes.filter((repo) => repo.isPrivate).length;
  const publicRepos = totalRepos - privateRepos;

  // Calculate total stars (received)
  const totalStars = stats.repositories.nodes.reduce((sum, repo) => sum + repo.stargazerCount, 0);

  // Calculate total commits (approximation from repositories)
  const totalCommits = stats.repositories.nodes.reduce((sum, repo) => {
    return sum + (repo.defaultBranchRef?.target.history.totalCount || 0);
  }, 0);

  // Total contributions this year
  const totalContributionsThisYear = stats.contributionsCollection.contributionCalendar.totalContributions;

  // Contributions in repos not owned by user
  const contributionsNotOwned = stats.repositoriesContributedTo.totalCount;

  // Total contributions (all time)
  const totalContributions =
    stats.contributionsCollection.totalCommitContributions +
    stats.contributionsCollection.totalIssueContributions +
    stats.contributionsCollection.totalPullRequestContributions +
    stats.contributionsCollection.totalPullRequestReviewContributions;

  // Process commit history (last 365 days from contribution calendar)
  const commitHistory = stats.contributionsCollection.contributionCalendar.weeks.flatMap((week) =>
    week.contributionDays.map((day) => ({
      date: day.date,
      count: day.contributionCount,
    }))
  );

  // Process contributions by repository
  const contributionsByRepo = stats.contributionsCollection.commitContributionsByRepository.map((repoContrib) => ({
    repository: `${repoContrib.repository.owner.login}/${repoContrib.repository.name}`,
    isPrivate: repoContrib.repository.isPrivate,
    contributions: repoContrib.contributions.totalCount,
    commits: repoContrib.contributions.nodes.map((node) => ({
      date: node.occurredAt,
      count: node.commitCount,
    })),
  }));

  return {
    repos: totalRepos,
    privateRepos,
    publicRepos: publicRepos, // Not stored in DB, but useful for display
    commits: totalCommits,
    followers: stats.followers.totalCount,
    following: stats.following.totalCount,
    stars: totalStars,
    totalContributions,
    contributionsThisYear: totalContributionsThisYear,
    contributionsNotOwned,
    accountAge,
    commitHistory,
    contributionsByRepo, // Not stored in DB, but useful for display
  };
}
</file>

<file path="lib/prisma.ts">
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
</file>

<file path="prisma/migrations/20251108141428_initial_migration/migration.sql">
-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "username" TEXT,
    "pfp" TEXT,
    "banner" TEXT,
    "email" TEXT,
    "github" TEXT,
    "leetcode" TEXT,
    "googleId" TEXT,
    "githubId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Gitdata" (
    "id" SERIAL NOT NULL,
    "repos" INTEGER,
    "commits" INTEGER,
    "followers" INTEGER,
    "following" INTEGER,
    "stars" INTEGER,
    "userId" INTEGER,

    CONSTRAINT "Gitdata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pdata" (
    "id" SERIAL NOT NULL,
    "about" TEXT,
    "devstats" TEXT,
    "stack" TEXT,
    "socials" JSONB,
    "userId" INTEGER,

    CONSTRAINT "Pdata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkExp" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "duration" TEXT,
    "description" TEXT,
    "companyName" TEXT,
    "image" TEXT,
    "userId" INTEGER,

    CONSTRAINT "WorkExp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "link" TEXT,
    "description" TEXT,
    "gitlink" TEXT,
    "userId" INTEGER,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "User_githubId_key" ON "User"("githubId");

-- CreateIndex
CREATE UNIQUE INDEX "Gitdata_userId_key" ON "Gitdata"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Pdata_userId_key" ON "Pdata"("userId");

-- AddForeignKey
ALTER TABLE "Gitdata" ADD CONSTRAINT "Gitdata_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pdata" ADD CONSTRAINT "Pdata_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkExp" ADD CONSTRAINT "WorkExp_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
</file>

<file path="prisma/migrations/20251109075840_add_gitdata_fields/migration.sql">
-- AlterTable
ALTER TABLE "Gitdata" ADD COLUMN     "accountAge" INTEGER,
ADD COLUMN     "commitHistory" JSONB,
ADD COLUMN     "contributionsNotOwned" INTEGER,
ADD COLUMN     "contributionsThisYear" INTEGER,
ADD COLUMN     "lastSynced" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "privateRepos" INTEGER,
ADD COLUMN     "totalContributions" INTEGER;
</file>

<file path="prisma/migrations/20251114053647_add_follow_model/migration.sql">
-- CreateTable
CREATE TABLE "Follow" (
    "followerId" INTEGER NOT NULL,
    "followingId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Follow_pkey" PRIMARY KEY ("followerId","followingId")
);

-- CreateIndex
CREATE INDEX "Follow_followerId_idx" ON "Follow"("followerId");

-- CreateIndex
CREATE INDEX "Follow_followingId_idx" ON "Follow"("followingId");

-- AddForeignKey
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
</file>

<file path="prisma/migrations/20251114060735_add_timeline_modal/migration.sql">
-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "WorkExp" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
</file>

<file path="prisma/migrations/migration_lock.toml">
# Please do not edit this file manually
# It should be added in your version-control system (e.g., Git)
provider = "postgresql"
</file>

<file path="eslint.config.mjs">
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
</file>

<file path="next.config.ts">
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
</file>

<file path="postcss.config.mjs">
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
</file>

<file path="prisma.config.ts">
import { defineConfig, env } from "prisma/config";
import "dotenv/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    url: env("DATABASE_URL"),
  },
});
</file>

<file path="README.md">
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
</file>

<file path="tsconfig.json">
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts",
    ".next/dev/types/**/*.ts",
    "**/*.mts"
  ],
  "exclude": ["node_modules"]
}
</file>

<file path="app/api/auth/[...nextauth]/route.ts">
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
</file>

<file path="app/api/projects/[id]/route.ts">
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// Helper type for the new async params
type RouteParams = { params: Promise<{ id: string }> };

export async function GET(
  request: Request,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    // Await the params here
    const { id } = await params;

    if (!session?.userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const project = await prisma.project.findFirst({
      where: {
        id: parseInt(id), // Use the awaited id
        userId: parseInt(session.userId),
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: project });
  } catch  {
    console.error("Error fetching project:");
    return NextResponse.json(
      { error: "Failed to fetch project" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params; // Await here

    if (!session?.userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, link, description, gitlink } = body;

    // Verify project belongs to user
    const existingProject = await prisma.project.findFirst({
      where: {
        id: parseInt(id), // Use the awaited id
        userId: parseInt(session.userId),
      },
    });

    if (!existingProject) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    const project = await prisma.project.update({
      where: { id: parseInt(id) },
      data: {
        ...(title !== undefined && { title }),
        ...(link !== undefined && { link }),
        ...(description !== undefined && { description }),
        ...(gitlink !== undefined && { gitlink }),
      },
    });

    return NextResponse.json({ success: true, data: project });
  } catch {
    console.error("Error updating project:");
    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params; // Await here

    if (!session?.userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify project belongs to user
    const existingProject = await prisma.project.findFirst({
      where: {
        id: parseInt(id), // Use the awaited id
        userId: parseInt(session.userId),
      },
    });

    if (!existingProject) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    await prisma.project.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true, message: "Project deleted" });
  } catch {
    console.error("Error deleting project:");
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 }
    );
  }
}
</file>

<file path="app/api/upload-signature/route.ts">
// app/api/upload-signature/route.ts
import { v2 as cloudinary } from "cloudinary";
import { NextResponse } from "next/server";

// Configure Cloudinary with your credentials
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET, // 👈 FIX #1: Use the private env variable
  secure: true,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { paramsToSign } = body;

    if (paramsToSign.upload_preset !== "devora_uploads") {
       throw new Error("Upload preset name mismatch");
    }

    // Get the signature from Cloudinary
    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET as string // 👈 FIX #2: Use the private env variable
    );

    return NextResponse.json({ signature });
  } catch (error) {
    console.error("Error generating upload signature:", error);
    return NextResponse.json(
      { error: "Failed to generate signature" },
      { status: 500 }
    );
  }
}
</file>

<file path="app/api/user/route.ts">
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth"; // Import
import { authOptions } from "@/lib/auth"; // Import

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get("username");
    const query = searchParams.get("q");

    // --- Get the current logged-in user's session (if any) ---
    const session = await getServerSession(authOptions);
    const currentUserId = session?.userId ? parseInt(session.userId) : null;

    // 🔹 If username provided → get single user
    if (username) {
      const user = await prisma.user.findUnique({
        where: { username },
        include: {
          pdata: true,
          gitdata: true,
          projects: true,
          workExp: true,
          // --- Add this to count followers/following ---
          _count: {
            select: {
              followers: true,
              following: true,
            },
          },
        },
      });

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      // --- Check follow status ---
      let isFollowedByCurrentUser = false;
      if (currentUserId && currentUserId !== user.id) {
        const follow = await prisma.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: currentUserId,
              followingId: user.id,
            },
          },
        });
        isFollowedByCurrentUser = !!follow;
      }

      const isCurrentUser = currentUserId === user.id;

      // --- Return user data with the new fields ---
      return NextResponse.json({
        success: true,
        data: {
          ...user,
          isFollowedByCurrentUser,
          isCurrentUser,
        },
      });
    }

    // 🔹 If q provided → partial search...
    if (query) {
      // ... (existing search logic) ...
      const users = await prisma.user.findMany({
        where: {
          OR: [
            { username: { contains: query, mode: "insensitive" } },
            { name: { contains: query, mode: "insensitive" } },
          ],
        },
        select: { id: true, name: true, username: true, pfp: true },
        take: 20,
      });
      return NextResponse.json({ success: true, data: users });
    }

    // 🔹 Default → return all users...
    // ... (existing all users logic) ...
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        username: true,
        pfp: true,
        createdAt: true,
      },
      orderBy: { id: "desc" },
      take: 50,
    });
    return NextResponse.json({ success: true, data: allUsers });

  } catch (err: any) {
    console.error("Error fetching users:", err);
    return NextResponse.json(
      { error: "Failed to fetch users", message: err.message },
      { status: 500 }
    );
  }
}
</file>

<file path="app/api/workexp/[id]/route.ts">
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// Define the type for the route context
type RouteParams = { params: Promise<{ id: string }> };

export async function GET(
  request: Request,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    // 1. Await the params object
    const { id } = await params;

    if (!session?.userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const workExp = await prisma.workExp.findFirst({
      where: {
        id: parseInt(id), // Use the awaited ID
        userId: parseInt(session.userId),
      },
    });

    if (!workExp) {
      return NextResponse.json(
        { error: "Work experience not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: workExp });
  } catch (error: any) {
    console.error("Error fetching work experience:", error);
    return NextResponse.json(
      { error: "Failed to fetch work experience", message: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    // 1. Await the params object
    const { id } = await params;

    if (!session?.userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, duration, description, companyName, image } = body;

    // Verify work experience belongs to user
    const existingWorkExp = await prisma.workExp.findFirst({
      where: {
        id: parseInt(id), // Use the awaited ID
        userId: parseInt(session.userId),
      },
    });

    if (!existingWorkExp) {
      return NextResponse.json(
        { error: "Work experience not found" },
        { status: 404 }
      );
    }

    const workExp = await prisma.workExp.update({
      where: { id: parseInt(id) },
      data: {
        ...(title !== undefined && { title }),
        ...(duration !== undefined && { duration }),
        ...(description !== undefined && { description }),
        ...(companyName !== undefined && { companyName }),
        ...(image !== undefined && { image }),
      },
    });

    return NextResponse.json({ success: true, data: workExp });
  } catch (error: any) {
    console.error("Error updating work experience:", error);
    return NextResponse.json(
      { error: "Failed to update work experience", message: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    // 1. Await the params object
    const { id } = await params;

    if (!session?.userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify work experience belongs to user
    const existingWorkExp = await prisma.workExp.findFirst({
      where: {
        id: parseInt(id), // Use the awaited ID
        userId: parseInt(session.userId),
      },
    });

    if (!existingWorkExp) {
      return NextResponse.json(
        { error: "Work experience not found" },
        { status: 404 }
      );
    }

    await prisma.workExp.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true, message: "Work experience deleted" });
  } catch (error: any) {
    console.error("Error deleting work experience:", error);
    return NextResponse.json(
      { error: "Failed to delete work experience", message: error.message },
      { status: 500 }
    );
  }
}
</file>

<file path="app/setup-username/page.tsx">
"use client";

import { useState, FormEvent } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Terminal,
  User,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Cpu,
} from "lucide-react";

export default function SetupUsername() {
  // --- Real hooks ---
  const { data: session, status, update } = useSession();
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  // Stable Sys.Id per mount, not per render
  const [sysId] = useState(() =>
    Math.random().toString(36).substring(7).toUpperCase()
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!username.trim()) {
      setError("Username is required");
      setLoading(false);
      return;
    }

    const normalizedUsername = username.trim().toLowerCase();

    if (!normalizedUsername) {
      setError("Username cannot be empty");
      setLoading(false);
      return;
    }

    if (!/^[a-zA-Z0-9_]{3,20}$/.test(normalizedUsername)) {
      setError("Use 3-20 characters: letters, numbers, or underscores.");
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

      // Refresh session with new username
      await update();

      // Redirect to home page
      router.push("/");
    } catch (err) {
      setError("Connection refused. Please retry.");
      setLoading(false);
    }
  };

  const inputClasses =
    "w-full p-4 pl-12 bg-[#0a0a0a] border border-[#E9E6D7]/20 rounded-none focus:outline-none focus:border-[#E9E6D7] focus:ring-1 focus:ring-[#E9E6D7] transition-all text-[#E9E6D7] placeholder-[#E9E6D7]/20 font-mono text-sm";
  const labelClasses =
    "block text-[10px] font-bold text-[#E9E6D7]/50 uppercase tracking-widest mb-2";

  // --- Session loading state ---
  if (status === "loading") {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-[#E9E6D7]">
        <div className="p-4 border border-dashed border-[#E9E6D7]/20 bg-[#0a0a0a] flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-[#E9E6D7]/60" size={20} />
          <span className="text-xs uppercase tracking-widest font-mono">
            Checking session…
          </span>
        </div>
      </div>
    );
  }

  // --- Not signed in ---
  if (!session) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-[#E9E6D7]">
        <div className="p-4 border border-dashed border-[#E9E6D7]/20 bg-[#0a0a0a] flex flex-col items-center gap-3">
          <AlertCircle className="text-[#E9E6D7]/40" size={24} />
          <span className="text-xs uppercase tracking-widest font-mono">
            Authentication Required
          </span>
        </div>
      </div>
    );
  }

  // Try both shapes: session.user.username and session.username
  const existingUsername =
    (session.user as any)?.username ?? (session as any)?.username ?? null;

  // --- Already has username ---
  if (existingUsername) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#050505] border border-[#E9E6D7]/20 p-8 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-[#E9E6D7]/20" />
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-[#E9E6D7] rounded-full text-black">
              <CheckCircle2 size={24} />
            </div>
          </div>
          <h2 className="text-xl font-bold text-[#E9E6D7] mb-2">
            Identity Established
          </h2>
          <p className="text-[#E9E6D7]/60 text-sm mb-6 font-mono">
            Username:{" "}
            <span className="text-[#E9E6D7]">{existingUsername}</span>
          </p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-2 bg-[#E9E6D7]/10 hover:bg-[#E9E6D7] hover:text-black border border-[#E9E6D7]/20 text-[#E9E6D7] text-xs font-bold uppercase tracking-widest transition-all"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  // --- Main Form ---
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-lg bg-[#050505] border border-[#E9E6D7]/20 shadow-[0_0_50px_-10px_rgba(233,230,215,0.05)] relative flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Header */}
        <div className="border-b border-[#E9E6D7]/10 p-6 bg-[#0a0a0a]">
          <div className="flex items-center gap-2 mb-2 text-[#E9E6D7]/60">
            <Terminal size={16} />
            <span className="text-xs font-mono">init_profile.sh</span>
          </div>
          <h1 className="text-2xl font-bold text-[#E9E6D7] tracking-tight">
            CLAIM USERNAME
          </h1>
          <p className="text-[#E9E6D7]/50 text-xs mt-1 leading-relaxed max-w-sm">
            Establish your unique handle on the network. This identifier is
            permanent and cannot be altered later.
          </p>
        </div>

        <div className="p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="username" className={labelClasses}>
                Desired Handle
              </label>
              <div className="relative group">
                <div className="absolute top-4 left-4 text-[#E9E6D7]/30 group-focus-within:text-[#E9E6D7] transition-colors">
                  <User size={18} />
                </div>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="enter_username"
                  className={inputClasses}
                  disabled={loading}
                  autoComplete="off"
                  autoFocus
                />
                <div className="absolute right-4 top-4">
                  {username.length > 0 && username.length < 3 ? (
                    <div className="text-red-500 text-[10px] font-mono">
                      TOO_SHORT
                    </div>
                  ) : username.length > 0 ? (
                    <div className="text-green-500/50 text-[10px] font-mono">
                      VALID_FMT
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="flex items-start gap-2 mt-2 px-1">
                <div className="mt-0.5 text-[#E9E6D7]/40">
                  <Cpu size={10} />
                </div>
                <p className="text-[10px] text-[#E9E6D7]/40 leading-tight">
                  Requirements: 3-20 characters. Alphanumeric & underscores
                  only.
                </p>
              </div>
            </div>

            {error && (
              <div className="bg-red-900/10 border border-red-900/30 p-3 flex items-start gap-3 animate-in slide-in-from-top-2 fade-in">
                <AlertCircle
                  className="text-red-400 shrink-0 mt-0.5"
                  size={16}
                />
                <div className="space-y-1">
                  <p className="text-red-400 text-xs font-bold uppercase tracking-wide">
                    Error
                  </p>
                  <p className="text-red-300/80 text-xs font-mono">{error}</p>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full group relative overflow-hidden bg-[#E9E6D7] hover:bg-white text-black h-12 flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  <span className="text-xs font-bold uppercase tracking-widest">
                    Registering...
                  </span>
                </>
              ) : (
                <>
                  <span className="text-xs font-bold uppercase tracking-widest">
                    Confirm Handle
                  </span>
                  <ArrowRight
                    size={16}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer decoration */}
        <div className="bg-[#0a0a0a] border-t border-[#E9E6D7]/10 p-3 flex justify-between items-center text-[9px] text-[#E9E6D7]/20 uppercase tracking-widest font-mono">
          <span>Sys.Id: {sysId}</span>
          <span>Secure_Mode: ON</span>
        </div>
      </div>
    </div>
  );
}
</file>

<file path="components/sidebar.tsx">
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
</file>

<file path=".gitignore">
# See https://help.github.com/articles/ignoring-files/ for more about ignoring files.

# dependencies
/node_modules
/.pnp
.pnp.*
.yarn/*
!.yarn/patches
!.yarn/plugins
!.yarn/releases
!.yarn/versions

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*

# env files (can opt-in for committing if needed)
.env*

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts

/lib/generated/prisma
</file>

<file path="app/api/user/profile/route.ts">
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt(session.userId);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        pfp: true,
        banner: true,
        leetcode: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: user });
  } catch (err: any) {
    console.error("Error fetching user profile:", err);
    return NextResponse.json(
      { error: "Failed to fetch profile", message: err.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt(session.userId);
    const body = await request.json();
    const { pfp, banner, leetcode } = body;

    // Validate that we are only receiving strings
    const dataToUpdate: { pfp?: string; banner?: string; leetcode?: string } = {};
    if (typeof pfp === 'string') {
      dataToUpdate.pfp = pfp;
    }
    if (typeof banner === 'string') {
      dataToUpdate.banner = banner;
    }
    if (typeof leetcode === 'string') {
      dataToUpdate.leetcode = leetcode;
    }

    if (Object.keys(dataToUpdate).length === 0) {
       return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
    });

    return NextResponse.json({ success: true, data: updatedUser });
  } catch (err: any) {
    console.error("Error updating user profile:", err);
    return NextResponse.json(
      { error: "Failed to update profile", message: err.message },
      { status: 500 }
    );
  }
}
</file>

<file path="app/connections/page.tsx">
"use client";

import { useState, useEffect } from "react";
import { Search, User, Users } from "lucide-react"; // Import Users
import Sidebar from "@/components/sidebar";
import Link from "next/link";
import { useSession } from "next-auth/react"; // Import useSession
import { useRouter } from "next/navigation"; // Import useRouter

interface UserType {
  id: number;
  name: string | null;
  username: string;
  pfp?: string | null;
}

export default function ConnectionsPage() {
  const [activeTab, setActiveTab] = useState<"followers" | "following">(
    "followers"
  );
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { status } = useSession();
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  // Fetch data based on tab and query
  async function fetchConnections(
    tab: "followers" | "following",
    search?: string
  ) {
    // Don't fetch if not authenticated
    if (status !== "authenticated") {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      let endpoint = `/api/user/connections?type=${tab}`;
      if (search) {
        endpoint += `&q=${encodeURIComponent(search)}`;
      }
      const res = await fetch(endpoint);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to fetch connections");

      setUsers(data.data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }

  // Fetch data when tab changes or on initial load
  useEffect(() => {
    fetchConnections(activeTab, query || undefined);
  }, [activeTab, status, query]); // <-- Added query to dependency array

  // Developer card (re-usable)
  const DeveloperCard = ({ dev }: { dev: UserType }) => (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 transition-all hover:border-[#E9E6D7] cursor-pointer">
      <div className="flex items-center gap-4">
        {dev.pfp ? (
          <img
            src={dev.pfp}
            alt={dev.username}
            className="w-12 h-12 rounded-full border border-neutral-700 object-cover"
          />
        ) : (
          <div className="shrink-0 w-12 h-12 bg-neutral-800 rounded-full flex items-center justify-center border border-neutral-700">
            <span className="text-xl font-semibold text-[#E9E6D7]">
              {dev.name?.charAt(0) || dev.username.charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        <div>
          <h3 className="text-lg font-semibold text-[#E9E6D7]">
            {dev.name || "Unnamed Developer"}
          </h3>
          <p className="text-sm text-neutral-400">@{dev.username}</p>
        </div>
      </div>
    </div>
  );

  // Show loading skeleton while checking auth
  if (status === "loading") {
    return (
      <div className="flex bg-black text-[#E9E6D7] min-h-screen">
        <Sidebar />
        <main className="flex-1 p-8 md:p-12">
          <p className="text-neutral-500">Loading...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex bg-black text-[#E9E6D7] min-h-screen">
      {/* --- Sidebar --- */}
      <Sidebar />

      {/* --- Main Content --- */}
      <main className="flex-1 relative min-h-screen p-8 md:p-12 overflow-hidden">
        {/* ... (Background Gradient Blobs) ... */}
        <div className="absolute inset-0 z-0 opacity-40">
          <div className="absolute -top-20 -left-20 w-96 h-96 bg-purple-900 rounded-full filter blur-3xl opacity-30 animate-pulse"></div>
          <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-blue-900 rounded-full filter blur-3xl opacity-30 animate-pulse [animation-delay:-3s]"></div>
        </div>

        {/* Page Content */}
        <div className="relative z-10 max-w-6xl mx-auto">
          {/* Header */}
          <h1 className="text-4xl font-bold mb-3">Your Connections</h1>
          <p className="text-lg text-neutral-400 mb-8">
            Manage your followers and the developers you follow.
          </p>

          {/* Search Bar */}
          <div className="relative w-full mb-8">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && fetchConnections(activeTab, query)
              }
              placeholder={`Search ${activeTab}...`}
              className="w-full p-4 pl-12 bg-neutral-900/50 border border-neutral-800 rounded-lg text-[#E9E6D7] placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#E9E6D7]"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
          </div>

          {/* Tabs */}
          <nav className="border-b border-neutral-800 mb-8">
            <ul className="flex gap-8">
              <li
                className={`pb-3 cursor-pointer flex items-center gap-2 ${
                  activeTab === "followers"
                    ? "text-[#E9E6D7] font-semibold border-b-2 border-white"
                    : "text-neutral-500"
                }`}
                onClick={() => {
                  setActiveTab("followers");
                  setQuery(""); // Clear search when changing tabs
                }}
              >
                <User className="w-4 h-4" />
                Followers
              </li>
              <li
                className={`pb-3 cursor-pointer flex items-center gap-2 ${
                  activeTab === "following"
                    ? "text-[#E9E6D7] font-semibold border-b-2 border-white"
                    : "text-neutral-500"
                }`}
                onClick={() => {
                  setActiveTab("following");
                  setQuery(""); // Clear search when changing tabs
                }}
              >
                <Users className="w-4 h-4" />
                Following
              </li>
            </ul>
          </nav>

          {/* Grid Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <p className="text-neutral-500">Loading...</p>
            ) : error ? (
              <p className="text-red-500">{error}</p>
            ) : users.length > 0 ? (
              users.map((dev) => (
                <Link href={`/${dev.username}`} key={dev.id}>
                  <DeveloperCard dev={dev} />
                </Link>
              ))
            ) : (
              <p className="text-neutral-500 col-span-full text-center">
                No {activeTab} found{query && ' matching your search'}.
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
</file>

<file path="app/timeline/page.tsx">
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Briefcase,
  FolderGit2,
  ExternalLink,
  Github,
  Clock,
  Terminal,
  Activity,
  AlertCircle,
  Search,
  ArrowLeft,
} from "lucide-react";

interface UserInfo {
  name: string | null;
  username: string;
  pfp: string | null;
}

interface ProjectItem {
  id: number;
  title: string;
  description: string | null;
  link: string | null;
  gitlink: string | null;
  createdAt: string;
  user: UserInfo;
}

interface WorkExpItem {
  id: number;
  title: string;
  companyName: string | null;
  description: string | null;
  duration: string | null;
  image: string | null;
  createdAt: string;
  user: UserInfo;
}

type FeedItem =
  | { type: "project"; item: ProjectItem }
  | { type: "workexp"; item: WorkExpItem };

export default function TimelinePage() {
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
      return;
    }

    if (status !== "authenticated") return;

    const fetchFeed = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/timeline");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to fetch feed");
        setFeed(data.data || []);
        setError(null);
      } catch (err: any) {
        setError(err.message || "Failed to fetch feed");
        setFeed([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFeed();
  }, [status, router]);

  const pageBg = "bg-black";

  const renderFeed = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <Loader2 className="animate-spin text-[#E9E6D7]/40" size={32} />
          <div className="flex items-center gap-2 text-[#E9E6D7]/40 text-xs font-mono uppercase tracking-widest animate-pulse">
            <Activity size={12} />
            <span>Syncing Network Activity...</span>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-900/10 border border-red-900/30 p-6 flex flex-col items-center gap-3 text-red-400 max-w-lg mx-auto">
          <AlertCircle size={24} />
          <p className="text-sm font-bold uppercase tracking-wide">
            Connection Error
          </p>
          <p className="text-xs font-mono opacity-70">{error}</p>
        </div>
      );
    }

    if (feed.length === 0) {
      return (
        <div className="border border-dashed border-[#E9E6D7]/20 p-12 text-center bg-[#0a0a0a] max-w-2xl mx-auto mt-8">
          <div className="flex justify-center mb-4 text-[#E9E6D7]/20">
            <Terminal size={48} strokeWidth={1} />
          </div>
          <h3 className="text-[#E9E6D7] font-bold text-sm uppercase tracking-widest mb-2">
            Timeline Empty
          </h3>
          <p className="text-[#E9E6D7]/50 text-xs max-w-xs mx-auto mb-6 leading-relaxed">
            Follow other developers to populate your stream with their latest
            projects and career updates.
          </p>
          <Link href="/search">
            <button className="flex items-center gap-2 mx-auto px-5 py-2.5 bg-[#E9E6D7] hover:bg-white text-black text-xs font-bold uppercase tracking-wider transition-all hover:scale-[1.02]">
              <Search size={14} />
              <span>Explore Network</span>
            </button>
          </Link>
        </div>
      );
    }

    return (
      <div className="space-y-8 relative max-w-3xl mx-auto">
        <div className="absolute left-6 top-0 bottom-0 w-px bg-[#E9E6D7]/10 md:left-8 z-0"></div>

        {feed.map((feedItem, index) => {
          const isProject = feedItem.type === "project";
          const key = isProject
            ? `proj-${feedItem.item.id}`
            : `work-${feedItem.item.id}`;

          return (
            <div
              key={key}
              className="relative z-10 pl-16 md:pl-20 animate-in fade-in slide-in-from-bottom-4 duration-500"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="absolute left-4 md:left-6 top-6 -translate-x-1/2 w-4 h-4 bg-[#0a0a0a] border border-[#E9E6D7]/30 flex items-center justify-center rounded-sm shadow-[0_0_10px_rgba(233,230,215,0.1)]">
                <div
                  className={`w-1.5 h-1.5 ${
                    isProject ? "bg-blue-400" : "bg-emerald-400"
                  }`}
                ></div>
              </div>

              {isProject ? (
                <TimelineProjectCard project={feedItem.item} />
              ) : (
                <TimelineWorkExpCard workExp={feedItem.item} />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  if (status === "loading") {
    return (
      <div
        className={`flex flex-col ${pageBg} text-[#E9E6D7] min-h-screen items-center justify-center`}
      >
        <Loader2 className="animate-spin opacity-20" size={32} />
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen ${pageBg} text-[#E9E6D7] font-sans selection:bg-[#E9E6D7]/20`}
    >
      <main className="relative min-h-screen p-6 md:p-12 overflow-x-hidden">
        <div
          className="fixed inset-0 z-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, #E9E6D7 1px, transparent 0)",
            backgroundSize: "40px 40px",
          }}
        ></div>

        <header className="relative z-20 max-w-4xl mx-auto mb-12 flex items-center justify-between border-b border-[#E9E6D7]/10 pb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Link
                href="/"
                className="p-2 -ml-2 hover:bg-[#E9E6D7]/10 rounded-full transition-colors text-[#E9E6D7]/60 hover:text-[#E9E6D7]"
              >
                <ArrowLeft size={20} />
              </Link>
              <h1 className="text-3xl font-bold tracking-tight text-[#E9E6D7]">
                ACTIVITY FEED
              </h1>
            </div>
            <p className="text-[#E9E6D7]/40 text-xs font-mono pl-12">
              Network Updates • <span className="text-blue-400">Live</span>
            </p>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#E9E6D7]/60">
                System Status
              </span>
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-mono text-emerald-400">
                  ONLINE
                </span>
              </div>
            </div>
          </div>
        </header>

        <div className="relative z-10 max-w-4xl mx-auto">{renderFeed()}</div>
      </main>
    </div>
  );
}

// --- Feed Item Card Components ---

function TimelineProjectCard({ project }: { project: ProjectItem }) {
  return (
    <div className="bg-[#050505] border border-[#E9E6D7]/10 p-6 group hover:border-[#E9E6D7]/30 transition-all duration-300 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-16 h-16 bg-linear-to-bl from-[#E9E6D7]/5 to-transparent pointer-events-none"></div>

      <CardHeader user={project.user} timestamp={project.createdAt} type="Project" />

      <div className="mt-5 pl-11">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <h3 className="text-xl font-bold text-[#E9E6D7] group-hover:text-white transition-colors tracking-tight">
              {project.title}
            </h3>
            <div className="flex items-center gap-2 mt-1.5 text-blue-400/80 text-[10px] font-bold uppercase tracking-wider">
              <FolderGit2 size={12} />
              <span>New Project</span>
            </div>
          </div>
        </div>

        {project.description && (
          <p className="text-sm text-[#E9E6D7]/60 leading-relaxed mb-5 font-light max-w-2xl">
            {project.description}
          </p>
        )}

        <div className="flex flex-wrap gap-3 pt-5 border-t border-[#E9E6D7]/5">
          {project.link && (
            <a
              href={project.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-[#E9E6D7]/5 hover:bg-[#E9E6D7] hover:text-black border border-[#E9E6D7]/10 text-[#E9E6D7]/80 text-[10px] font-bold uppercase tracking-wider transition-all"
            >
              <ExternalLink size={12} />
              <span>Live Demo</span>
            </a>
          )}
          {project.gitlink && (
            <a
              href={project.gitlink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-[#E9E6D7]/5 hover:bg-[#E9E6D7] hover:text-black border border-[#E9E6D7]/10 text-[#E9E6D7]/80 text-[10px] font-bold uppercase tracking-wider transition-all"
            >
              <Github size={12} />
              <span>Source Code</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function TimelineWorkExpCard({ workExp }: { workExp: WorkExpItem }) {
  return (
    <div className="bg-[#050505] border border-[#E9E6D7]/10 p-6 group hover:border-[#E9E6D7]/30 transition-all duration-300 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-16 h-16 bg-linear-to-bl from-[#E9E6D7]/5 to-transparent pointer-events-none"></div>

      <CardHeader
        user={workExp.user}
        timestamp={workExp.createdAt}
        type="Experience"
      />

      <div className="mt-5 pl-11 flex flex-col md:flex-row gap-6">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-[#E9E6D7] group-hover:text-white transition-colors tracking-tight">
            {workExp.title}
          </h3>

          <div className="flex items-center gap-2 mt-1.5 mb-4 text-emerald-400/80 text-[10px] font-bold uppercase tracking-wider">
            <Briefcase size={12} />
            <span>Career Update</span>
            <span className="text-[#E9E6D7]/20">•</span>
            <span className="text-[#E9E6D7]/60">{workExp.companyName}</span>
          </div>

          {workExp.duration && (
            <p className="text-[10px] font-mono text-[#E9E6D7]/40 mb-4 bg-[#E9E6D7]/5 inline-block px-2 py-1 border border-[#E9E6D7]/5">
              {workExp.duration}
            </p>
          )}

          {workExp.description && (
            <p className="text-sm text-[#E9E6D7]/60 leading-relaxed font-light max-w-2xl">
              {workExp.description}
            </p>
          )}
        </div>

        {workExp.image && (
          <div className="shrink-0 hidden sm:block">
            <img
              src={workExp.image}
              alt={workExp.companyName || workExp.title}
              className="w-20 h-20 rounded-sm object-cover border border-[#E9E6D7]/10 bg-white/5 grayscale group-hover:grayscale-0 transition-all duration-500"
            />
          </div>
        )}
      </div>
    </div>
  );
}

function CardHeader({
  user,
  timestamp,
}: {
  user: UserInfo;
  timestamp: string;
  type: string;
}) {
  const timeAgo = (date: string) => {
    const seconds = Math.floor(
      (new Date().getTime() - new Date(date).getTime()) / 1000
    );
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "Y";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "MO";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "D";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "H";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "M";
    return "<1M";
  };

  const userImage = user.pfp || "/default-avatar.png";
  const userFirstInitial =
    user.name?.charAt(0) || user.username.charAt(0).toUpperCase();

  return (
    <div className="flex items-start justify-between">
      <Link href={`/${user.username}`} className="no-underline">
        <div className="flex items-center gap-3 group/user cursor-pointer">
          {user.pfp ? (
            <img
              src={userImage}
              alt={user.username}
              className="w-9 h-9 rounded-sm border border-[#E9E6D7]/20 object-cover group-hover/user:border-[#E9E6D7] transition-all"
            />
          ) : (
            <div className="shrink-0 w-9 h-9 bg-[#E9E6D7]/5 rounded-sm flex items-center justify-center border border-[#E9E6D7]/20 group-hover/user:bg-[#E9E6D7] group-hover/user:text-black transition-all">
              <span className="text-xs font-bold font-mono">
                {userFirstInitial}
              </span>
            </div>
          )}

          <div className="flex flex-col">
            <h4 className="text-xs font-bold text-[#E9E6D7] group-hover/user:underline decoration-[#E9E6D7]/40 underline-offset-4 mb-0.5">
              {user.name || user.username}
            </h4>
            <span className="text-[10px] text-[#E9E6D7]/40 font-mono">
              @{user.username}
            </span>
          </div>
        </div>
      </Link>

      <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#E9E6D7]/30 uppercase tracking-widest bg-[#E9E6D7]/5 px-2 py-1 rounded-sm">
        <Clock size={10} />
        <span>{timeAgo(timestamp)} AGO</span>
      </div>
    </div>
  );
}
</file>

<file path="app/layout.tsx">
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Providers from "./povider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Devora",
  description: "",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
</file>

<file path="components/UpdateNameModal.tsx">
"use client";

import { useState } from "react";
import { Loader2, X, User, Terminal, Check } from "lucide-react";

interface UpdateNameModalProps {
  currentName: string;
  onClose: (needsUpdate?: boolean) => void;
}

export default function UpdateNameModal({ currentName, onClose }: UpdateNameModalProps) {
  const [name, setName] = useState(currentName);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Name cannot be empty.");
      return;
    }
    if (name.trim() === currentName) {
      onClose();
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update name");
      }

      onClose(true);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- Theme Constants ---
  const offWhite = "#E9E6D7";
  const inputClasses = "w-full p-3 bg-[#0a0a0a] border border-[#E9E6D7]/20 rounded-none focus:outline-none focus:border-[#E9E6D7] focus:ring-1 focus:ring-[#E9E6D7] transition-all text-[#E9E6D7] placeholder-[#E9E6D7]/30 text-sm";
  const labelClasses = "block text-[10px] font-bold text-[#E9E6D7]/50 uppercase tracking-widest mb-1.5";

  return (
    <div className="fixed inset-0 backdrop-blur-xl bg-black/80 flex items-center justify-center z-60 p-4 animate-in fade-in duration-200">
      <form
        onSubmit={handleSubmit}
        className="bg-[#050505] w-full max-w-md border border-[#E9E6D7]/20 shadow-2xl relative flex flex-col"
        style={{ boxShadow: '0 0 40px -10px rgba(233, 230, 215, 0.1)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E9E6D7]/10 px-5 py-3 bg-[#050505]/95 backdrop-blur-md">
           <div className="flex items-center gap-2">
              <Terminal size={14} className="text-[#E9E6D7]/60" />
              <h2 className="text-sm font-bold tracking-tight text-[#E9E6D7]">
                UPDATE IDENTITY
              </h2>
           </div>
           <button
            type="button"
            onClick={() => onClose()}
            className="text-[#E9E6D7]/60 hover:text-[#E9E6D7] transition-colors p-1"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-1">
             <div className="flex items-center gap-2 mb-4 text-[#E9E6D7]/40 text-xs font-mono">
                <span>user_config.json</span>
                <span>/</span>
                <span>display_name</span>
             </div>

            <div className="relative group">
               <div className="absolute top-3 left-3 text-[#E9E6D7]/40 group-focus-within:text-[#E9E6D7] transition-colors">
                  <User size={16} />
               </div>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`${inputClasses} pl-10`}
                placeholder="Enter new display name"
                disabled={loading}
                autoFocus
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-900/10 border border-red-900/30 text-red-400 p-3 text-xs flex items-center gap-2">
              <span className="w-1 h-1 bg-red-500 rounded-full animate-pulse"/>
              {error}
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 flex items-center justify-center gap-2 text-black font-bold text-xs tracking-wider uppercase disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.01] active:scale-[0.99]"
              style={{ backgroundColor: offWhite }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Confirm Changes</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
</file>

<file path="app/[username]/page.tsx">
// app/[username]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Sidebar from "@/components/sidebar";
import PublicProfileHeader from "@/components/PublicProfileHeader";
import WorkExperience from "@/components/WorkExperience";
import Projects from "@/components/Projects";
import GitHub from "@/components/GitHub";
import LeetCodeStatsCard from "@/components/Leetcode";
import RightSidebar from "@/components/RightSidebar";
import GithubPublic from "@/components/PublicGitData";
import { Loader2 } from "lucide-react";

interface UserProfile {
  id: number;
  name: string | null;
  username: string;
  pfp: string | null;
  banner: string | null;
  gitdata: any;
  pdata: any;
  projects: any[];
  workExp: any[];
  _count: {
    followers: number;
    following: number;
  };
  isFollowedByCurrentUser: boolean;
  isCurrentUser: boolean;
}

export default function UserProfilePage() {
  const params = useParams();

  // Safely derive a string username from params
  const rawUsername = params.username;
  const username =
    (Array.isArray(rawUsername) ? rawUsername[0] : rawUsername) ?? "";

  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!username) return;

    const fetchUserData = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `/api/user?username=${encodeURIComponent(username)}`
        );
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "User not found");
        }

        setUser(data.data);
        setError(null);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [username]);

  return (
    <div className="flex bg-black text-[#E9E6D7] min-h-screen">
      <Sidebar />

      <main className="flex-1 ml-20 p-8 overflow-y-auto">
        {loading && (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="animate-spin h-8 w-8 text-[#E9E6D7]" />
          </div>
        )}

        {error && !loading && (
          <div className="flex justify-center items-center h-64">
            <p className="text-red-500">{error}</p>
          </div>
        )}

        {user && !loading && !error && (
          <div className="w-full">
            <PublicProfileHeader
              user={user}
              isFollowedByCurrentUser={user.isFollowedByCurrentUser}
              isCurrentUser={user.isCurrentUser}
              followerCount={user._count.followers}
              followingCount={user._count.following}
            />

            {/* Main Content Area */}
            <div className="mt-20">
              <main className="flex-1 bg-black min-h-screen text-[#E9E6D7]">
                <div className="flex justify-start">
                  <div className="max-w-4xl">
                    <section className="mt-6 w-full min-w-[850px] max-w-5xl space-y-8">
                      <WorkExperience workExpData={user.workExp} />
                      <Projects projectsData={user.projects} />

                      {/* Public GitHub card – username is guaranteed string here */}
                      <GithubPublic username={username} />

                      <LeetCodeStatsCard
                        leetcodeUsername={user.pdata?.socials?.leetcode}
                      />
                    </section>
                  </div>
                  <div>
                    <RightSidebar pdata={user.pdata} />
                  </div>
                </div>
              </main>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
</file>

<file path="components/ConnectGitHub.tsx">
"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { Loader2 ,Github} from "lucide-react";

export default function ConnectGitHub() {
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    setLoading(true);
    try {
      // Set cookie to indicate account linking intent (if user is logged in)
      try {
        await fetch("/api/auth/link-github");
      } catch (error) {
        // If this fails, we'll fall back to email matching
        console.log(error + "Could not set linking cookie, will use email matching");
      }
      
      // Sign in with GitHub - the auth callback will link the account
      // After OAuth, NextAuth will redirect back and session will be updated
      await signIn("github", { 
        callbackUrl: window.location.href,
        redirect: true 
      });
    } catch (error) {
      console.error("Error connecting GitHub:", error);
      setLoading(false);
    }
  };

  return (
    <div className="p-6 border border-gray-800 rounded-xl bg-black/40 mb-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="text-[#E9E6D7] font-semibold text-lg mb-1">GitHub Integration</h3>
          <p className="text-sm text-[#E9E6D7] max-w-xl">
            Link your GitHub account to automatically display your repositories, contribution graphs, and developer statistics on your profile.
          </p>
        </div>

        <button
          onClick={handleConnect}
          disabled={loading}
          className="shrink-0 flex items-center justify-center gap-3 bg-[#E9E6D7] hover:bg-white text-black px-6 py-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed group/btn hover:scale-[1.01] min-w-[180px]"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              <span className="text-xs font-bold uppercase tracking-wider">Syncing...</span>
            </>
          ) : (
            <>
              <Github size={18} className="fill-current" />
              <span className="text-xs font-bold uppercase tracking-wider">Connect Account</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
</file>

<file path="components/Projects.tsx">
"use client";

import { useState, useEffect } from "react";
import { 
  FolderGit2, 
  Plus, 
  Loader2, 
  Globe, 
  Github, 
  ArrowUpRight,
  LayoutGrid,
  Terminal,
  X
} from "lucide-react";

interface Project {
  id?: number;
  title: string;
  description?: string;
  link?: string;
  gitlink?: string;
  createdAt?: string;
}

interface ProjectsProps {
  projectsData?: Project[];
}

export default function Projects({ projectsData }: ProjectsProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newProject, setNewProject] = useState({
    title: "",
    description: "",
    link: "",
    gitlink: "",
  });

  useEffect(() => {
    if (projectsData) {
      setProjects(projectsData);
      setLoading(false);
      return;
    }

    const fetchProjects = async () => {
      try {
        const res = await fetch("/api/projects");
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || "Failed to fetch projects");

        setProjects(data.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [projectsData]);

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.title.trim()) {
      setError("Project title is required");
      return;
    }

    try {
      setAdding(true);
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProject),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add project");

      setProjects((prev) => [data.data, ...prev]);
      setNewProject({ title: "", description: "", link: "", gitlink: "" });
      setShowForm(false);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  };

  // --- Theme Constants ---
  const inputClasses = "w-full p-3 bg-[#0a0a0a] border border-[#E9E6D7]/20 rounded-none focus:outline-none focus:border-[#E9E6D7] focus:ring-1 focus:ring-[#E9E6D7] transition-all text-[#E9E6D7] placeholder-[#E9E6D7]/30 text-sm";
  const labelClasses = "block text-[10px] font-bold text-[#E9E6D7]/50 uppercase tracking-widest mb-1.5";

  if (loading)
    return (
      <div className="w-full h-40 bg-[#0a0a0a] border border-[#E9E6D7]/20 flex flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-[#E9E6D7]/40" size={24} />
        <span className="text-xs text-[#E9E6D7]/60 tracking-wider uppercase animate-pulse">Loading Projects...</span>
      </div>
    );

  return (
    <section id="projects" className="w-full text-[#E9E6D7]">
      
      {/* Header Section */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#E9E6D7]/10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#E9E6D7]/5 text-[#E9E6D7] rounded-sm">
            <LayoutGrid size={18} />
          </div>
          <div>
            <h2 className="text-[#E9E6D7] font-bold text-sm tracking-tight uppercase">Selected Works</h2>
            <p className="text-[10px] text-[#E9E6D7]/40 uppercase tracking-widest mt-0.5">Portfolio & Experiments</p>
          </div>
        </div>

        {/* Add Button (Only if owner) */}
        {!projectsData && (
          <button
            onClick={() => setShowForm(!showForm)}
            className={`flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all ${
              showForm 
                ? "bg-red-900/20 text-red-400 hover:bg-red-900/30" 
                : "bg-[#E9E6D7] text-black hover:bg-white"
            }`}
          >
            {showForm ? (
              <>
                <X size={12} />
                <span>Cancel</span>
              </>
            ) : (
              <>
                <Plus size={12} />
                <span>Add Project</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Add Project Form */}
      {showForm && !projectsData && (
        <div className="mb-8 bg-[#050505] border border-[#E9E6D7]/20 p-6 animate-in fade-in slide-in-from-top-4 duration-200">
           <div className="flex items-center gap-2 mb-4 text-[#E9E6D7]/60">
              <Terminal size={14} />
              <span className="text-xs font-mono">new_project_entry.json</span>
           </div>
           
           <form onSubmit={handleAddProject} className="space-y-4">
            <div>
              <label className={labelClasses}>Project Title</label>
              <input
                type="text"
                placeholder="Ex: AI Image Generator"
                className={inputClasses}
                value={newProject.title}
                onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
              />
            </div>
            
            <div>
              <label className={labelClasses}>Description</label>
              <textarea
                placeholder="What did you build? What stack did you use?"
                className={`${inputClasses} h-24 resize-none`}
                value={newProject.description}
                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClasses}>Live Demo URL</label>
                <input
                  type="text"
                  placeholder="https://..."
                  className={inputClasses}
                  value={newProject.link}
                  onChange={(e) => setNewProject({ ...newProject, link: e.target.value })}
                />
              </div>
              <div>
                <label className={labelClasses}>GitHub Repo URL</label>
                <input
                  type="text"
                  placeholder="https://github.com/..."
                  className={inputClasses}
                  value={newProject.gitlink}
                  onChange={(e) => setNewProject({ ...newProject, gitlink: e.target.value })}
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={adding}
                className="w-full flex justify-center items-center gap-2 bg-[#E9E6D7] hover:bg-white text-black py-3 text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50"
              >
                {adding ? (
                  <>
                    <Loader2 className="animate-spin" size={14} />
                    <span>Processing...</span>
                  </>
                ) : (
                  "Create Entry"
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {error && (
        <div className="mb-6 p-3 bg-red-900/10 border border-red-900/30 text-red-400 text-xs flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
          {error}
        </div>
      )}

      {/* Project Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {projects.length > 0 ? (
          projects.map((project) => (
            <div
              key={project.id}
              className="group bg-[#0a0a0a] border border-[#E9E6D7]/10 p-5 flex flex-col justify-between hover:border-[#E9E6D7]/40 transition-all hover:translate-y-0.5 duration-300"
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 bg-[#E9E6D7]/5 text-[#E9E6D7] rounded-sm group-hover:bg-[#E9E6D7] group-hover:text-black transition-colors duration-300">
                    <FolderGit2 size={18} />
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-x-2 group-hover:translate-x-0">
                    {project.link && (
                      <a 
                        href={project.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-1.5 hover:bg-[#E9E6D7] hover:text-black text-[#E9E6D7]/60 transition-colors"
                      >
                        <ArrowUpRight size={16} />
                      </a>
                    )}
                    {project.gitlink && (
                      <a 
                        href={project.gitlink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-1.5 hover:bg-[#E9E6D7] hover:text-black text-[#E9E6D7]/60 transition-colors"
                      >
                        <Github size={16} />
                      </a>
                    )}
                  </div>
                </div>

                <h3 className="text-[#E9E6D7] font-bold text-lg mb-2 group-hover:text-white transition-colors">
                  {project.title}
                </h3>
                
                {project.description && (
                  <p className="text-[#E9E6D7]/60 text-sm leading-relaxed line-clamp-3">
                    {project.description}
                  </p>
                )}
              </div>

              {/* Links Footer (Always visible version if you prefer, currently using hover icons top right) */}
              <div className="mt-5 pt-4 border-t border-[#E9E6D7]/5 flex gap-4 text-xs font-mono text-[#E9E6D7]/40">
                 {project.gitlink && (
                    <div className="flex items-center gap-1.5">
                       <Github size={12} />
                       <span>Source</span>
                    </div>
                 )}
                 {project.link && (
                    <div className="flex items-center gap-1.5">
                       <Globe size={12} />
                       <span>Live</span>
                    </div>
                 )}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full border border-dashed border-[#E9E6D7]/20 rounded-lg p-12 text-center bg-[#0a0a0a]/50">
            <p className="text-[#E9E6D7]/40 text-sm">No projects cataloged yet.</p>
            {!projectsData && (
              <button 
                onClick={() => setShowForm(true)}
                className="mt-4 text-[#E9E6D7] text-xs font-bold uppercase tracking-wider underline underline-offset-4 hover:text-white"
              >
                Initialize First Project
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
</file>

<file path="components/PublicProfileHeader.tsx">
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
          className="absolute right-10 bottom-6 bg-gray-700 text-[#E9E6D7] font-semibold px-4 py-2 rounded-lg shadow-md transition flex items-center gap-2"
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
          className="absolute right-10 bottom-6 bg-gray-700 hover:bg-gray-600 text-[#E9E6D7] font-semibold px-4 py-2 rounded-lg shadow-md transition active:scale-95"
        >
          Unfollow
        </button>
      );
    }

    // Show Follow button
    return (
      <button
        onClick={handleFollow}
        className="absolute right-10 bottom-6 bg-[#E9E6D7]  text-black font-semibold px-4 py-2 rounded-lg shadow-md transition active:scale-95"
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
        <h2 className="text-2xl font-bold text-[#E9E6D7]">{userName}</h2>
        <p className="text-[#E9E6D7] text-sm">@{username}</p>
        <div className="flex gap-4 mt-1">
          <span className="text-sm text-gray-300">
            <strong className="text-[#E9E6D7]">{currentFollowerCount}</strong> Followers
          </span>
          <span className="text-sm text-gray-300">
            <strong className="text-[#E9E6D7]">{followingCount}</strong> Following
          </span>
        </div>
      </div>

      {/* Follow/Unfollow Button */}
      {renderFollowButton()}
    </div>
  );
}
</file>

<file path="components/RightSidebar.tsx">
"use client";

import { useEffect, useState } from "react";
import { 
  Github, 
  Linkedin, 
  Twitter, 
  Globe, 
  Mail, 
  Terminal, 
  Cpu, 
  Network, 
  User, 
  Loader2,
  AlertCircle 
} from "lucide-react";

interface Pdata {
  about?: string;
  devstats?: string;
  stack?: string;
  socials?: {
    github?: string;
    linkedin?: string;
    twitter?: string;
    portfolio?: string;
    email?: string;
  };
}

interface SidebarProps {
  pdata?: Pdata | null;
}

export default function RightSidebar({ pdata: pdataProp }: SidebarProps) {
  const [pdata, setPdata] = useState<Pdata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (pdataProp) {
      setPdata(pdataProp);
      setLoading(false);
      return;
    }

    async function fetchPdata() {
      try {
        const res = await fetch("/api/pdata");
        if (!res.ok) throw new Error("Failed to fetch personal data");
        const json = await res.json();
        setPdata(json.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchPdata();
  }, [pdataProp]);

  // --- Theme Constants ---
  const cardClass = "bg-[#0a0a0a] border border-[#E9E6D7]/10 p-5 hover:border-[#E9E6D7]/30 transition-colors group";
  const headerClass = "text-[10px] font-bold text-[#E9E6D7]/50 uppercase tracking-widest mb-3 flex items-center gap-2";
  const textClass = "text-[#E9E6D7]/80 text-sm leading-relaxed font-light";

  if (loading)
    return (
      <aside className="hidden lg:flex w-80 flex-col gap-4 ml-8 sticky top-24">
        <div className={`${cardClass} h-40 flex flex-col items-center justify-center gap-3 animate-pulse`}>
           <Loader2 className="animate-spin text-[#E9E6D7]/20" size={24} />
           <span className="text-[10px] text-[#E9E6D7]/40 uppercase tracking-widest">Loading Bio...</span>
        </div>
      </aside>
    );

  if (error)
    return (
      <aside className="hidden lg:block w-80 ml-8 sticky top-24">
        <div className="bg-red-900/10 border border-red-900/30 p-4 flex items-center gap-3 text-red-400">
           <AlertCircle size={18} />
           <span className="text-xs">Failed to load profile.</span>
        </div>
      </aside>
    );

  if (!pdata)
    return (
      <aside className="hidden lg:block w-80 ml-8 sticky top-24">
         <div className="border border-dashed border-[#E9E6D7]/20 p-8 text-center">
            <p className="text-[#E9E6D7]/40 text-xs uppercase tracking-widest">No Profile Data</p>
         </div>
      </aside>
    );

  const socials = pdata.socials || {};

  return (
    <aside className="hidden lg:flex w-80 flex-col gap-5 ml-8 sticky top-24 h-fit pb-10">
      
      {/* About Section */}
      <div className={cardClass}>
        <div className={headerClass}>
          <User size={12} />
          <span>About</span>
        </div>
        <div className="relative">
            <div className="absolute -left-3 top-0 bottom-0 w-1px bg-[#E9E6D7]/10"></div>
            <p className={textClass}>
            {pdata.about || "No biography available."}
            </p>
        </div>
      </div>

      {/* Developer Stats */}
      {pdata.devstats && (
        <div className={cardClass}>
          <div className={headerClass}>
            <Terminal size={12} />
            <span>Dev Stats</span>
          </div>
          <div className="bg-[#050505] border border-[#E9E6D7]/10 p-3 font-mono text-xs text-[#E9E6D7]/70 whitespace-pre-line leading-relaxed">
            {pdata.devstats}
          </div>
        </div>
      )}

      {/* Tech Stack */}
      {pdata.stack && (
        <div className={cardClass}>
          <div className={headerClass}>
            <Cpu size={12} />
            <span>Tech Stack</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {pdata.stack.split(",").map((tech) => (
              <span
                key={tech.trim()}
                className="bg-[#E9E6D7]/5 border border-[#E9E6D7]/10 text-[#E9E6D7]/80 text-[10px] uppercase font-bold px-2 py-1 tracking-wider hover:bg-[#E9E6D7] hover:text-black transition-colors cursor-default"
              >
                {tech.trim()}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Social Links */}
      <div className={cardClass}>
        <div className={headerClass}>
          <Network size={12} />
          <span>Connect</span>
        </div>
        <div className="flex flex-col gap-1">
          {socials.github && (
            <SocialLink icon={<Github size={14} />} label="GitHub" url={socials.github} />
          )}
          {socials.twitter && (
            <SocialLink icon={<Twitter size={14} />} label="Twitter" url={socials.twitter} />
          )}
          {socials.linkedin && (
            <SocialLink icon={<Linkedin size={14} />} label="LinkedIn" url={socials.linkedin} />
          )}
          {socials.portfolio && (
            <SocialLink icon={<Globe size={14} />} label="Portfolio" url={socials.portfolio} />
          )}
          {socials.email && (
            <SocialLink icon={<Mail size={14} />} label="Email" url={`mailto:${socials.email}`} />
          )}
          
          {/* Fallback if empty */}
          {!socials.github && !socials.twitter && !socials.linkedin && !socials.portfolio && !socials.email && (
             <span className="text-[#E9E6D7]/30 text-xs italic">No social links added.</span>
          )}
        </div>
      </div>

    </aside>
  );
}

/** 🔗 Helper Component for Social Links */
function SocialLink({
  icon,
  label,
  url,
}: {
  icon: React.ReactNode;
  label: string;
  url: string;
}) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group/link flex items-center justify-between p-2 hover:bg-[#E9E6D7] hover:text-black transition-all text-[#E9E6D7]/60"
    >
      <div className="flex items-center gap-3">
         {icon}
         <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
      </div>
      <span className="opacity-0 group-hover/link:opacity-100 -translate-x-2 group-hover/link:translate-x-0 transition-all text-[10px]">
         →
      </span>
    </a>
  );
}
</file>

<file path="components/WorkExperience.tsx">
"use client";

import { useState, useEffect } from "react";
import { 
  Briefcase, 
  Plus, 
  Loader2, 
  Terminal, 
  X,
  Calendar,
  Building2
} from "lucide-react";

interface WorkExp {
  id?: number;
  title: string;
  duration?: string;
  description?: string;
  companyName?: string;
  image?: string;
  createdAt?: string;
}

interface ExperienceProps {
  workExpData?: WorkExp[];
}

export default function Experience({ workExpData }: ExperienceProps) {
  const [experiences, setExperiences] = useState<WorkExp[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newExp, setNewExp] = useState({
    title: "",
    duration: "",
    companyName: "",
    description: "",
    image: "",
  });

  useEffect(() => {
    if (workExpData) {
      setExperiences(workExpData);
      setLoading(false);
      return;
    }

    const fetchExperience = async () => {
      try {
        const res = await fetch("/api/workexp");
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || "Failed to fetch work experience");

        setExperiences(data.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchExperience();
  }, [workExpData]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExp.title.trim()) {
      setError("Title is required");
      return;
    }

    try {
      setAdding(true);
      const res = await fetch("/api/workexp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newExp),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add work experience");

      setExperiences((prev) => [data.data, ...prev]);
      setNewExp({ title: "", duration: "", companyName: "", description: "", image: "" });
      setShowForm(false);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  };

  // --- Theme Constants ---
  const inputClasses = "w-full p-3 bg-[#0a0a0a] border border-[#E9E6D7]/20 rounded-none focus:outline-none focus:border-[#E9E6D7] focus:ring-1 focus:ring-[#E9E6D7] transition-all text-[#E9E6D7] placeholder-[#E9E6D7]/30 text-sm";
  const labelClasses = "block text-[10px] font-bold text-[#E9E6D7]/50 uppercase tracking-widest mb-1.5";

  if (loading)
    return (
      <div className="w-full h-40 bg-[#0a0a0a] border border-[#E9E6D7]/20 flex flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-[#E9E6D7]/40" size={24} />
        <span className="text-xs text-[#E9E6D7]/60 tracking-wider uppercase animate-pulse">Loading History...</span>
      </div>
    );

  return (
    <section id="experience" className="w-full text-[#E9E6D7]">
      
      {/* Header Section */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#E9E6D7]/10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#E9E6D7]/5 text-[#E9E6D7] rounded-sm">
            <Briefcase size={18} />
          </div>
          <div>
            <h2 className="text-[#E9E6D7] font-bold text-sm tracking-tight uppercase">Career History</h2>
            <p className="text-[10px] text-[#E9E6D7]/40 uppercase tracking-widest mt-0.5">Professional Timeline</p>
          </div>
        </div>

        {/* Add Button (Only if owner) */}
        {!workExpData && (
          <button
            onClick={() => setShowForm(!showForm)}
            className={`flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all ${
              showForm 
                ? "bg-red-900/20 text-red-400 hover:bg-red-900/30" 
                : "bg-[#E9E6D7] text-black hover:bg-white"
            }`}
          >
            {showForm ? (
              <>
                <X size={12} />
                <span>Cancel</span>
              </>
            ) : (
              <>
                <Plus size={12} />
                <span>Add Role</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Add Experience Form */}
      {showForm && !workExpData && (
        <div className="mb-8 bg-[#050505] border border-[#E9E6D7]/20 p-6 animate-in fade-in slide-in-from-top-4 duration-200">
           <div className="flex items-center gap-2 mb-4 text-[#E9E6D7]/60">
              <Terminal size={14} />
              <span className="text-xs font-mono">new_position_entry.json</span>
           </div>
           
           <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClasses}>Job Title</label>
                <input
                  type="text"
                  placeholder="Ex: Senior Engineer"
                  className={inputClasses}
                  value={newExp.title}
                  onChange={(e) => setNewExp({ ...newExp, title: e.target.value })}
                />
              </div>
              <div>
                <label className={labelClasses}>Company Name</label>
                <input
                  type="text"
                  placeholder="Ex: Acme Corp"
                  className={inputClasses}
                  value={newExp.companyName}
                  onChange={(e) => setNewExp({ ...newExp, companyName: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className={labelClasses}>Duration</label>
              <input
                type="text"
                placeholder="Ex: Jan 2023 - Present"
                className={inputClasses}
                value={newExp.duration}
                onChange={(e) => setNewExp({ ...newExp, duration: e.target.value })}
              />
            </div>
            
            <div>
              <label className={labelClasses}>Description</label>
              <textarea
                placeholder="Key responsibilities and achievements..."
                className={`${inputClasses} h-24 resize-none`}
                value={newExp.description}
                onChange={(e) => setNewExp({ ...newExp, description: e.target.value })}
              />
            </div>

            <div>
              <label className={labelClasses}>Company Logo URL (Optional)</label>
              <input
                type="text"
                placeholder="https://..."
                className={inputClasses}
                value={newExp.image}
                onChange={(e) => setNewExp({ ...newExp, image: e.target.value })}
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={adding}
                className="w-full flex justify-center items-center gap-2 bg-[#E9E6D7] hover:bg-white text-black py-3 text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50"
              >
                {adding ? (
                  <>
                    <Loader2 className="animate-spin" size={14} />
                    <span>Processing...</span>
                  </>
                ) : (
                  "Add Position"
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {error && (
        <div className="mb-6 p-3 bg-red-900/10 border border-red-900/30 text-red-400 text-xs flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
          {error}
        </div>
      )}

      {/* Experience List */}
      <div className="flex flex-col gap-4">
        {experiences.length > 0 ? (
          experiences.map((exp) => (
            <div
              key={exp.id}
              className="group bg-[#0a0a0a] border border-[#E9E6D7]/10 p-5 hover:border-[#E9E6D7]/40 transition-all duration-300"
            >
              <div className="flex flex-col sm:flex-row gap-5 justify-between items-start">
                
                {/* Main Content */}
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono text-[#E9E6D7]/50 uppercase tracking-wider mb-1">
                    {exp.companyName && (
                      <span className="flex items-center gap-1.5 text-[#E9E6D7]">
                        <Building2 size={10} />
                        {exp.companyName}
                      </span>
                    )}
                    {exp.duration && (
                      <>
                        <span className="text-[#E9E6D7]/20">•</span>
                        <span className="flex items-center gap-1.5">
                          <Calendar size={10} />
                          {exp.duration}
                        </span>
                      </>
                    )}
                  </div>

                  <h3 className="text-[#E9E6D7] font-bold text-lg group-hover:text-white transition-colors">
                    {exp.title}
                  </h3>
                  
                  {exp.description && (
                    <p className="text-[#E9E6D7]/60 text-sm leading-relaxed max-w-2xl">
                      {exp.description}
                    </p>
                  )}
                </div>

                {/* Optional Image */}
                {exp.image && (
                  <div className="hidden sm:block shrink-0">
                    <img
                      src={exp.image}
                      alt={exp.title}
                      className="w-16 h-16 object-contain rounded-sm border border-[#E9E6D7]/10 bg-white/5 p-1"
                    />
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="border border-dashed border-[#E9E6D7]/20 rounded-lg p-12 text-center bg-[#0a0a0a]/50">
            <p className="text-[#E9E6D7]/40 text-sm">No professional history recorded.</p>
            {!workExpData && (
              <button 
                onClick={() => setShowForm(true)}
                className="mt-4 text-[#E9E6D7] text-xs font-bold uppercase tracking-wider underline underline-offset-4 hover:text-white"
              >
                Add First Role
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
</file>

<file path="prisma/schema.prisma">
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        Int       @id @default(autoincrement())
  name      String?
  username  String?   @unique
  pfp       String?
  banner    String?
  email     String?   @unique
  github    String?
  leetcode  String?
  googleId  String?   @unique
  githubId  String?   @unique
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  accounts  Account[]
  following Follow[]  @relation("Following")
  followers Follow[]  @relation("Followers")
  gitdata   Gitdata?
  pdata     Pdata?
  projects  Project[] @relation("UserProjects")
  workExp   WorkExp[] @relation("UserWorkExp")
}

model Gitdata {
  id                    Int      @id @default(autoincrement())
  repos                 Int?
  commits               Int?
  followers             Int?
  following             Int?
  stars                 Int?
  userId                Int?     @unique
  accountAge            Int?
  commitHistory         Json?
  contributionsNotOwned Int?
  contributionsThisYear Int?
  lastSynced            DateTime @default(now()) @updatedAt
  privateRepos          Int?
  totalContributions    Int?
  user                  User?    @relation(fields: [userId], references: [id])
}

model Pdata {
  id       Int     @id @default(autoincrement())
  about    String?
  devstats String?
  stack    String?
  socials  Json?
  userId   Int?    @unique
  user     User?   @relation(fields: [userId], references: [id])
}

model WorkExp {
  id          Int      @id @default(autoincrement())
  title       String
  duration    String?
  description String?
  companyName String?
  image       String?
  userId      Int?
  createdAt   DateTime @default(now())
  user        User?    @relation("UserWorkExp", fields: [userId], references: [id])
}

model Project {
  id          Int      @id @default(autoincrement())
  title       String
  link        String?
  description String?
  gitlink     String?
  userId      Int?
  createdAt   DateTime @default(now())
  user        User?    @relation("UserProjects", fields: [userId], references: [id])
}

model Follow {
  followerId  Int
  followingId Int
  createdAt   DateTime @default(now())
  follower    User     @relation("Following", fields: [followerId], references: [id], onDelete: Cascade)
  following   User     @relation("Followers", fields: [followingId], references: [id], onDelete: Cascade)

  @@id([followerId, followingId])
  @@index([followerId])
  @@index([followingId])
}

model Account {
  id                Int     @id @default(autoincrement())
  userId            Int
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}
</file>

<file path="types/next-auth.d.ts">
import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    userId?: string;
    username?: string | null;
    hasGitHub?: boolean;
    hasGoogle?: boolean;
    accessToken?: string;
    user?: DefaultSession["user"] & {
      banner?: string | null;
      followersCount?: number;
      followingCount?: number;
      leetcode?: string | null;
    };
  }
  }


declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    accessToken?: string;
  }
}


  interface GoogleProfile {
    sub: string;
    name?: string;
    email?: string;
    picture?: string;
  }
  
  interface GithubProfile {
    id: number;
    name?: string;
    login?: string;
    email?: string | null;
    avatar_url?: string;
  }
  
  type OAuthProfile = GoogleProfile | GithubProfile;
</file>

<file path="app/page.tsx">
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
</file>

<file path="components/DashboardContent.tsx">
"use client";

// 1. Import React hooks
import React, { useState, useEffect } from "react";
import WorkExperience from "./WorkExperience";
import Projects from "./Projects";
import GitHub from "./GitHub";
import LeetCodeStatsCard from "./Leetcode";
import RightSidebar from "./RightSidebar";
import { useSession } from "next-auth/react";

// 2. Define a type for pdata (can be expanded if needed)
interface Pdata {
  about?: string;
  devstats?: string;
  stack?: string;
  socials?: {
    github?: string;
    linkedin?: string;
    twitter?: string;
    portfolio?: string;
    email?: string;
    leetcode?: string | null;
  };
}

// 3. Add a helper function to extract username from URL or direct username
function extractLeetCodeUsername(input: string | null | undefined): string | null {
  if (!input) {
    return null;
  }
  try {
    // Check if it's a full URL
    if (input.includes("leetcode.com")) {
      const url = new URL(input);
      // Get the pathname (e.g., "/username/") and split it
      const pathParts = url.pathname.split('/').filter(part => part.length > 0);
      // The username is usually the first part of the path
      return pathParts[0] || null;
    }
    // Otherwise, assume it's just the username
    return input.trim();
  } catch (e) {
    // If URL parsing fails (e.g., just "username"), return it
    return input.trim();
  }
}

export default function DashboardContent() {
  const [activeTab, setActiveTab] = useState<
    "work" | "projects" | "github" | "leetcode"
  >("work");
  const {data:session}= useSession()
  const leetuser = session?.user?.leetcode

  // 4. Add state to hold pdata
  const [pdata, setPdata] = useState<Pdata | null>(null);
  const [loadingPdata, setLoadingPdata] = useState(true);

  // 5. Add useEffect to fetch pdata for the logged-in user
  useEffect(() => {
    async function fetchPdata() {
      try {
        const res = await fetch("/api/pdata"); // API route from your files
        if (!res.ok) throw new Error("Failed to fetch personal data");
        const json = await res.json();
        setPdata(json.data);
      } catch (err: any) {
        console.error(err.message);
      } finally {
        setLoadingPdata(false);
      }
    }
    fetchPdata();
  }, []); // Runs once on component mount

  const renderContent = () => {
    switch (activeTab) {
      case "work":
        return <WorkExperience />;
      case "projects":
        return <Projects />;
      case "github":
        return (
          <div>
            <GitHub />
          </div>
        );
      case "leetcode":
        // 6. Extract and pass the username prop
        if (loadingPdata) {
          return <div>Loading LeetCode data...</div>;
        }
        
        return <LeetCodeStatsCard leetcodeUsername={leetuser} />; // Pass the prop
      default:
        return null;
    }
  };

  return (
    <main className="flex-1 bg-black min-h-screen text-[#E9E6D7]">
      <div className="flex justify-start">
        <div className="pt-  max-w-4xl">
          {/* Profile info */}

          {/* Tabs */}
          <nav className="border-b border-neutral-800 ">
            <ul className="flex gap-8">
              <li
                className={`pb-3 cursor-pointer ${
                  activeTab === "work"
                    ? "text-[#E9E6D7] font-semibold border-b-2 border-white"
                    : "text-neutral-500"
                }`}
                onClick={() => setActiveTab("work")}
              >
                Work Experience
              </li>
              <li
                className={`pb-3 cursor-pointer ${
                  activeTab === "projects"
                    ? "text-[#E9E6D7] font-semibold border-b-2 border-white"
                    : "text-neutral-500"
                }`}
                onClick={() => setActiveTab("projects")}
              >
                Projects
              </li>
              <li
                className={`pb-3 cursor-pointer ${
                  activeTab === "github"
                    ? "text-[#E9E6D7] font-semibold border-b-2 border-white"
                    : "text-neutral-500"
                }`}
                onClick={() => setActiveTab("github")}
              >
                GitHub
              </li>
              <li
                className={`pb-3 cursor-pointer ${
                  activeTab === "leetcode"
                    ? "text-[#E9E6D7] font-semibold border-b-2 border-white"
                    : "text-neutral-500"
                }`}
                onClick={() => setActiveTab("leetcode")}
              >
                Leetcode
              </li>
            </ul>
          </nav>

          {/* Render selected content */}
          <section className="mt-6 w-full min-w-[850px] max-w-5xl">
            {renderContent()}
          </section>
        </div>
        <div>
          {/* 7. Pass the fetched pdata to RightSidebar */}
          <RightSidebar pdata={pdata} />
        </div>
      </div>
    </main>
  );
}
</file>

<file path="app/search/page.tsx">
"use client";

import { useState, useEffect } from "react";
import { Search, User, FolderGit2, Code } from "lucide-react";
import Sidebar from "@/components/sidebar";
import Link from "next/link"; // 1. Import the Link component

interface UserType {
  id: number;
  name: string | null;
  username: string;
  pfp?: string | null;
}

export default function DiscoverPage() {
  const [activeTab, setActiveTab] = useState<"developers" | "projects">(
    "developers"
  );
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  // ✅ Fixed endpoint: should be /api/users not /api/user
  async function fetchUsers(search?: string) {
    try {
      setLoading(true);
      const endpoint = search
        ? `/api/user?q=${encodeURIComponent(search)}`
        : `/api/user`;
      const res = await fetch(endpoint);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to fetch users");

      setUsers(data.data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  // ... (static projectData remains the same) ...
  const projectData = [
    {
      title: "AI Code Assistant",
      description: "An AI-powered assistant that reviews and suggests code.",
      tech: ["OpenAI API", "Next.js", "Tailwind CSS"],
    },
    {
      title: "Decentralized Identity System",
      description: "A blockchain-based identity verification protocol.",
      tech: ["Rust", "Solidity", "Web3.js"],
    },
  ];


  // Developer card (live data)
  const DeveloperCard = ({ dev }: { dev: UserType }) => (
    // 2. Added "cursor-pointer" to make it feel interactive
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 transition-all hover:border-[#E9E6D7] cursor-pointer">
      <div className="flex items-center gap-4">
        {dev.pfp ? (
          <img
            src={dev.pfp}
            alt={dev.username}
            className="w-12 h-12 rounded-full border border-neutral-700 object-cover"
          />
        ) : (
          <div className="shrink-0 w-12 h-12 bg-neutral-800 rounded-full flex items-center justify-center border border-neutral-700">
            <span className="text-xl font-semibold text-[#E9E6D7]">
              {dev.name?.charAt(0) || dev.username.charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        <div>
          <h3 className="text-lg font-semibold text-[#E9E6D7]">
            {dev.name || "Unnamed Developer"}
          </h3>
          <p className="text-sm text-neutral-400">@{dev.username}</p>
        </div>
      </div>
    </div>
  );

  // ... (ProjectCard component remains the same) ...



  return (
    <div className="flex bg-black text-[#E9E6D7] min-h-screen">
      {/* --- Sidebar --- */}
      <Sidebar />

      {/* --- Main Discover Content --- */}
      <main className="flex-1 relative min-h-screen p-8 md:p-12 overflow-hidden">
        {/* ... (Background Gradient Blobs remain the same) ... */}
        <div className="absolute inset-0 z-0 opacity-40">
          <div className="absolute -top-20 -left-20 w-96 h-96 bg-purple-900 rounded-full filter blur-3xl opacity-30 animate-pulse"></div>
          <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-blue-900 rounded-full filter blur-3xl opacity-30 animate-pulse [animation-delay:-3s]"></div>
        </div>

        {/* Page Content */}
        <div className="relative z-10 max-w-6xl mx-auto">
          {/* ... (Header, Search, and Tabs remain the same) ... */}
          <h1 className="text-4xl font-bold mb-3">Discover</h1>
          <p className="text-lg text-neutral-400 mb-8">
           find talented developers, and get inspired.
          </p>

          <div className="relative w-full mb-8">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchUsers(query)}
              placeholder="Search for developers by name or username..."
              className="w-full p-4 pl-12 bg-neutral-900/50 border border-neutral-800 rounded-lg text-[#E9E6D7] placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#E9E6D7]"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
          </div>

          <nav className="border-b border-neutral-800 mb-8">
            <ul className="flex gap-8">
              <li
                className={`pb-3 cursor-pointer flex items-center gap-2 ${
                  activeTab === "developers"
                    ? "text-[#E9E6D7] font-semibold border-b-2 border-white"
                    : "text-neutral-500"
                }`}
                onClick={() => setActiveTab("developers")}
              >
                <User className="w-4 h-4" />
                Developers
              </li>
              
            </ul>
          </nav>


          {/* Grid Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeTab === "developers" && (
              <>
                {loading ? (
                  <p className="text-neutral-500">Loading developers...</p>
                ) : error ? (
                  <p className="text-red-500">{error}</p>
                ) : users.length > 0 ? (
                  // 3. Wrap the DeveloperCard in a Link component
                  users.map((dev) => (
                    <Link href={`/${dev.username}`} key={dev.id}>
                      <DeveloperCard dev={dev} />
                    </Link>
                  ))
                ) : (
                  <p className="text-neutral-500 col-span-full text-center">
                    No developers found.
                  </p>
                )}
              </>
            )}

            
          </div>
        </div>
      </main>
    </div>
  );
}
</file>

<file path="components/GitHub.tsx">
"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { 
  GitMerge, 
  GitBranch, 
  User, 
  CheckCircle2, 
  RefreshCw, 
  Plus, 
  Star, 
  Github as GithubIcon,
  AlertCircle
} from "lucide-react";  

interface GithubProps {
  gitData?: any; // Optional prop for public view
}

export default function Github({ gitData: gitDataProp }: GithubProps) {
  const [gitData, setGitData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (gitDataProp) {
      setGitData(gitDataProp);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const res = await fetch("/api/gitdata/sync", { method: "GET" });
        const data = await res.json();

        // Treat "not found" as an empty state instead of an error to keep the UI usable
        if (res.status === 404) {
          setGitData(null);
          return;
        }

        if (!res.ok) throw new Error(data.error || "Failed to fetch data");

        setGitData(data.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [gitDataProp]);

  const handleSync = async () => {
    try {
      setSyncing(true);
      const res = await fetch("/api/gitdata/sync", { method: "POST" });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to sync data");

      setGitData(data.data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSyncing(false);
    }
  };

  // --- Theme Constants ---
  const offWhite = "#E9E6D7";
  const labelClass = "text-[10px] font-bold text-[#E9E6D7]/50 uppercase tracking-widest";
  const cardClass = "bg-[#050505] border border-[#E9E6D7]/10 p-4 flex flex-col items-center justify-center gap-1 transition-all hover:border-[#E9E6D7]/30 group";
  const valueClass = "text-xl font-bold text-[#E9E6D7] font-mono group-hover:scale-105 transition-transform";

  // --- Loading State ---
  if (loading)
    return (
      <div className="w-full h-48 bg-[#0a0a0a] border border-[#E9E6D7]/20 flex flex-col items-center justify-center gap-3">
        <RefreshCw className="animate-spin text-[#E9E6D7]/40" size={24} />
        <span className="text-xs text-[#E9E6D7]/60 tracking-wider uppercase animate-pulse">
          Fetching Git Data...
        </span>
      </div>
    );

  // --- Error State ---
  if (error)
    return (
      <div className="w-full bg-[#0a0a0a] border border-red-900/30 p-6 flex flex-col items-center justify-center gap-3 text-center">
        <div className="p-2 bg-red-900/10 rounded-full text-red-400">
          <AlertCircle size={20} />
        </div>

        <span className="text-[#E9E6D7] text-sm">{error}</span>

        {/* If it's YOUR profile (no gitDataProp), show Login with GitHub */}
        {!gitDataProp && (
          <button
            onClick={() => signIn("github", { callbackUrl: window.location.href })}
            className="mt-2 flex items-center gap-2 px-4 py-2 bg-[#E9E6D7] text-black text-xs font-bold uppercase tracking-wider transition-all hover:bg-white"
          >
            <GithubIcon size={16} />
            <span>Login with GitHub</span>
          </button>
        )}

        {/* If viewing someone else’s public card and their fetch failed */}
        {gitDataProp && (
          <p className="text-xs text-[#E9E6D7]/50">
            GitHub data is currently unavailable.
          </p>
        )}
      </div>
    );

  // --- Empty State ---
  if (!gitData)
    return (
      <div className="w-full bg-[#0a0a0a] border border-[#E9E6D7]/20 p-8 flex flex-col items-center justify-center gap-4 text-center group hover:border-[#E9E6D7]/40 transition-colors">
        <div className="text-[#E9E6D7]/20 group-hover:text-[#E9E6D7]/40 transition-colors">
          <GithubIcon size={32} />
        </div>

        {!gitDataProp ? (
          <>
            <div className="space-y-1">
              <p className="text-[#E9E6D7] font-medium">No GitHub Data Linked</p>
              <p className="text-xs text-[#E9E6D7]/50">Sync your account to display stats.</p>
            </div>
            <button
              onClick={handleSync}
              className="flex items-center gap-2 px-4 py-2 bg-[#E9E6D7] hover:bg-white text-black text-xs font-bold uppercase tracking-wider transition-all hover:scale-[1.02]"
            >
              <Plus size={14} />
              <span>Sync Now</span>
            </button>
          </>
        ) : (
          <p className="text-[#E9E6D7]/50 text-sm">
            No GitHub data available for this user.
          </p>
        )}
      </div>
    );

  const { repos, followers, following, totalContributions, stars } = gitData;

  // --- Main UI ---
  return (
    <div className="w-full bg-[#0a0a0a] border border-[#E9E6D7]/20 p-5 flex flex-col gap-5 hover:border-[#E9E6D7]/40 transition-all relative">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#E9E6D7]/5 text-[#E9E6D7] rounded-sm">
            <GithubIcon size={18} />
          </div>
          <div>
            <h2 className="text-[#E9E6D7] font-bold text-sm tracking-tight">GITHUB ACTIVITY</h2>
            <p className="text-[10px] text-[#E9E6D7]/40 uppercase tracking-widest mt-0.5">
              Live Metrics
            </p>
          </div>
        </div>

        {/* Sync Button (Only if not viewing someone else's profile) */}
        {!gitDataProp && (
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#E9E6D7] hover:bg-white text-black text-[10px] font-bold uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {syncing ? (
              <>
                <RefreshCw size={12} className="animate-spin" />
                <span>Syncing</span>
              </>
            ) : (
              <>
                <RefreshCw size={12} />
                <span>Sync</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Repos */}
        <div className={cardClass}>
          <div className="text-[#E9E6D7]/30 mb-1">
            <GitBranch size={14} />
          </div>
          <span className={valueClass}>{repos ?? 0}</span>
          <span className={labelClass}>Repos</span>
        </div>

        {/* Stars */}
        <div className={cardClass}>
          <div className="text-[#E9E6D7]/30 mb-1">
            <Star size={14} />
          </div>
          <span className={valueClass}>{stars ?? 0}</span>
          <span className={labelClass}>Stars</span>
        </div>

        {/* Followers */}
        <div className={cardClass}>
          <div className="text-[#E9E6D7]/30 mb-1">
            <User size={14} />
          </div>
          <span className={valueClass}>{followers ?? 0}</span>
          <span className={labelClass}>Followers</span>
        </div>

        {/* Following */}
        <div className={cardClass}>
          <div className="text-[#E9E6D7]/30 mb-1">
            <User size={14} />
          </div>
          <span className={valueClass}>{following ?? 0}</span>
          <span className={labelClass}>Following</span>
        </div>
      </div>

      {/* Contribution Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-[#E9E6D7]/10">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={14} className="text-[#E9E6D7]" />
          <span className="text-xs font-medium text-[#E9E6D7]">
            {totalContributions ?? 0}{" "}
            <span className="text-[#E9E6D7]/50">Contributions</span>
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-[#E9E6D7]/30">
          <GitMerge size={12} />
          <span className="text-[10px] uppercase tracking-widest">Synced Recently</span>
        </div>
      </div>
    </div>
  );
}
</file>

<file path="components/Leetcode.tsx">
"use client";

import { useEffect, useState } from "react";
 import { useSession } from "next-auth/react"; 
import { 
  Trophy, 
  TrendingUp, 
  Award, 
  Loader2, 
  Code2, 
  Zap, 
  Target,
  AlertCircle,
  Terminal
} from "lucide-react";

interface LeetCodeProps {
  leetcodeUsername?: string | null;
}

export default function LeetCodeStatsCard({ leetcodeUsername }: LeetCodeProps) {
  const { data: session } = useSession(); // Removed for preview environment

  
  const [data, setData] = useState<any>(null);
  const [badgesData, setBadgesData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUser() {
      let username = leetcodeUsername;

      if (username === undefined && session?.username) {
        try {
          const res = await fetch(`/api/user?username=${session.username}`);
          if (res.ok) {
            const json = await res.json();
            if (json.success && json.data) {
              username = json.data.leetcode; 
            }
          }
        } catch (err) {
          console.error("Failed to fetch user profile:", err);
        }
      }

      if (!username) {
        setLoading(false);
        if (leetcodeUsername === null) {
          setError("No LeetCode username found for this user.");
        } else {
          setError(null);
        }
        return;
      }

      try {
        setLoading(true);
        const [profileRes, badgesRes] = await Promise.all([
          fetch(`https://backendpoint-alpha.vercel.app/${username}/profile`),
          fetch(`https://backendpoint-alpha.vercel.app/${username}/badges`),
        ]);

        if (!profileRes.ok || !badgesRes.ok)
          throw new Error("Failed to fetch data (user may not exist or API is down)");

        const profileData = await profileRes.json();
        const badgesData = await badgesRes.json();

        setData(profileData);
        setBadgesData(badgesData);
        setError(null);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (leetcodeUsername !== undefined || session?.username) {
        fetchUser();
    } else if (leetcodeUsername === undefined && session === null) {
        // Just stop loading if we don't have a username and no session to fall back on
        setLoading(false);
    }
  }, [leetcodeUsername, session]);

  // --- Theme Constants ---
  const cardBaseClass = "bg-[#0a0a0a] border border-[#E9E6D7]/10 p-5 flex flex-col justify-between hover:border-[#E9E6D7]/30 transition-all duration-300 group relative overflow-hidden";
  const labelClass = "text-[10px] font-bold text-[#E9E6D7]/40 uppercase tracking-widest mb-1";
  const headerClass = "flex items-center gap-2 text-[#E9E6D7]/60 mb-4 pb-2 border-b border-[#E9E6D7]/10";
  const headerIconClass = "w-4 h-4";

  if (loading)
    return (
      <div className="w-full h-48 bg-[#0a0a0a] border border-[#E9E6D7]/20 flex flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-[#E9E6D7]/40" size={24} />
        <span className="text-xs text-[#E9E6D7]/60 tracking-wider uppercase animate-pulse">Fetching LeetCode Data...</span>
      </div>
    );
  
  if (error)
    return (
      <div className="w-full bg-red-900/10 border border-red-900/30 p-6 flex items-center justify-center gap-3 text-red-400">
        <AlertCircle size={20} />
        <span className="text-sm font-medium">{error}</span>
      </div>
    );
  
  if (!data)
    return (
      <div className="w-full border border-dashed border-[#E9E6D7]/20 p-8 text-center bg-[#0a0a0a]">
        <Code2 className="mx-auto text-[#E9E6D7]/20 mb-3" size={32} />
        <p className="text-[#E9E6D7]/40 text-xs uppercase tracking-widest">No LeetCode Data Linked</p>
      </div>
    );

  // Derived values
  const totalSolved = data.easySolved + data.mediumSolved + data.hardSolved;
  const easyPercent = data.totalEasy ? Math.round((data.easySolved / data.totalEasy) * 100) : 0;
  const mediumPercent = data.totalMedium ? Math.round((data.mediumSolved / data.totalMedium) * 100) : 0;
  const hardPercent = data.totalHard ? Math.round((data.hardSolved / data.totalHard) * 100) : 0;
  
  const totalQuestions = data.totalEasy + data.totalMedium + data.totalHard;
  const progressOverall = totalQuestions > 0 ? Math.min(Math.round((totalSolved / totalQuestions) * 100), 100) : 0;

  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 text-[#E9E6D7] overflow-hidden">
      
      {/* Card 1 - Stats Overview */}
      <div className={cardBaseClass}>
        <div>
          <div className={headerClass}>
            <Trophy className={headerIconClass} />
            <span className="text-xs font-bold uppercase tracking-wider">Solved Problems</span>
          </div>

          <div className="mb-6">
            <div className="text-4xl font-mono font-bold text-[#E9E6D7] mb-1">{totalSolved ?? 0}</div>
            <div className="w-full h-1 bg-[#E9E6D7]/10 mt-2">
              <div 
                className="h-full bg-[#E9E6D7] transition-all duration-1000 ease-out" 
                style={{ width: `${progressOverall}%` }} 
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[9px] uppercase tracking-widest text-[#E9E6D7]/40">Total Progress</span>
              <span className="text-[9px] font-mono text-[#E9E6D7]/60">{progressOverall}%</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <StatBox label="Easy" value={data.easySolved} total={data.totalEasy} color="text-emerald-400" />
            <StatBox label="Medium" value={data.mediumSolved} total={data.totalMedium} color="text-yellow-400" />
            <StatBox label="Hard" value={data.hardSolved} total={data.totalHard} color="text-rose-400" />
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-[#E9E6D7]/5 flex items-center justify-between text-[10px] text-[#E9E6D7]/30 uppercase tracking-widest">
           <span>Live Data</span>
           <span>Sync: {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
        </div>
      </div>

      {/* Card 2 - Global Rank & Skills */}
      <div className={cardBaseClass}>
        <div>
           <div className={headerClass}>
            <TrendingUp className={headerIconClass} />
            <span className="text-xs font-bold uppercase tracking-wider">Ranking & Skills</span>
          </div>

          <div className="bg-[#E9E6D7]/5 border border-[#E9E6D7]/10 p-4 mb-5 group-hover:bg-[#E9E6D7]/10 transition-colors">
            <div className={labelClass}>Global Rank</div>
            <div className="text-2xl font-mono font-bold text-[#E9E6D7]">
              #{Number(data.ranking).toLocaleString() ?? "N/A"}
            </div>
          </div>

          <div className="space-y-4">
            <SkillBar label="Algorithms" percent={Math.min(easyPercent + 20, 100)} icon={<Zap size={10}/>} />
            <SkillBar label="Data Structs" percent={Math.min(mediumPercent, 100)} icon={<Terminal size={10}/>} />
            <SkillBar label="SQL / DB" percent={Math.min(hardPercent, 100)} icon={<Target size={10}/>} />
          </div>
        </div>
      </div>

      {/* Card 3 - Badges */}
      <div className={cardBaseClass}>
        <div>
          <div className={headerClass}>
            <Award className={headerIconClass} />
            <span className="text-xs font-bold uppercase tracking-wider">Recent Badges</span>
          </div>

          {badgesData?.badges && Array.isArray(badgesData.badges) ? (
            badgesData.badges.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {badgesData.badges.slice(0, 8).map((badge: any) => (
                  <div
                    key={badge.id}
                    className={`flex flex-col items-center justify-center text-center p-3 border transition-all duration-300 ${
                      badgesData.activeBadge?.id === badge.id
                        ? "bg-[#E9E6D7]/10 border-[#E9E6D7]/50 text-[#E9E6D7]"
                        : "bg-transparent border-[#E9E6D7]/10 text-[#E9E6D7]/60 hover:border-[#E9E6D7]/30 hover:text-[#E9E6D7]"
                    }`}
                  >
                    {badge.icon && badge.icon.startsWith("http") ? (
                         <img src={badge.icon} alt="badge" className="w-8 h-8 mb-2 opacity-80" /> 
                    ) : (
                         <Award className="w-6 h-6 mb-2 opacity-50" />
                    )}
                    <span className="text-[9px] uppercase font-bold tracking-tight leading-tight line-clamp-2">
                      {badge.displayName}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-32 flex items-center justify-center text-[#E9E6D7]/30 text-xs italic">
                No badges earned yet
              </div>
            )
          ) : (
             <div className="space-y-2">
                {[1,2,3,4].map(i => (
                    <div key={i} className="h-8 bg-[#E9E6D7]/5 animate-pulse w-full"></div>
                ))}
             </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Sub Components ---

function StatBox({ label, value, total, color }: { label: string; value: number; total: number; color?: string }) {
  return (
    <div className="flex flex-col p-2 bg-[#E9E6D7]/5 border border-[#E9E6D7]/5 hover:border-[#E9E6D7]/20 transition-colors">
      <span className={`text-[10px] uppercase tracking-widest mb-1 ${color || "text-[#E9E6D7]/60"}`}>{label}</span>
      <span className="text-lg font-mono font-bold text-[#E9E6D7] leading-none">{value}</span>
      <span className="text-[9px] text-[#E9E6D7]/30 font-mono mt-1">/ {total}</span>
    </div>
  );
}

function SkillBar({ label, percent, icon }: { label: string; percent: number; icon: React.ReactNode }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5 text-[#E9E6D7]/60">
        <div className="flex items-center gap-1.5">
            {icon}
            <span className="text-[10px] uppercase tracking-widest font-bold">{label}</span>
        </div>
        <span className="text-[10px] font-mono">{percent}%</span>
      </div>
      <div className="w-full h-1 bg-[#E9E6D7]/10">
        <div
          className="h-full bg-[#E9E6D7] opacity-60 transition-all duration-500"
          style={{ width: `${percent}%` }}
        ></div>
      </div>
    </div>
  );
}
</file>

<file path="components/UpdateProfileForm.tsx">
"use client";

import { useState, useEffect, useRef } from "react";
import { 
  X, 
  Upload, 
  Github, 
  Linkedin, 
  Twitter, 
  Globe, 
  Code2, 
  User, 
  Cpu, 
  Loader2 
} from "lucide-react";

interface UpdateProfileFormProps {
  onClose: () => void;
}

interface PdataForm {
  about: string;
  devstats: string;
  stack: string;
  socials: {
    github: string;
    linkedin: string;
    twitter: string;
    portfolio: string;
  };
}

export default function UpdateProfileForm({ onClose }: UpdateProfileFormProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State for Pdata fields
  const [formData, setFormData] = useState<PdataForm>({
    about: "",
    devstats: "",
    stack: "",
    socials: { github: "", linkedin: "", twitter: "", portfolio: "" },
  });

  // State for User Schema fields
  const [leetcodeUsername, setLeetcodeUsername] = useState("");

  // File Upload State
  const [pfpFile, setPfpFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [pfpUrl, setPfpUrl] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Refs for custom file triggers
  const pfpInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/pdata");
        if (res.ok) {
          const data = await res.json();
          if (data?.data) {
            setFormData({
              about: data.data.about || "",
              devstats: data.data.devstats || "",
              stack: data.data.stack || "",
              socials: data.data.socials || { github: "", linkedin: "", twitter: "", portfolio: "" },
            });
          }
        }
        const userRes = await fetch("/api/user/profile");
        if (userRes.ok) {
          const userData = await userRes.json();
          if (userData?.data?.leetcode) {
            setLeetcodeUsername(userData.data.leetcode);
          }
        }
      } catch (err: any) {
        setError(err.message || "Failed to load data");
      }
    }
    fetchData();
  }, []);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  function handleSocialChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      socials: { ...prev.socials, [name]: value },
    }));
  }

  const handleFileUpload = async (file: File): Promise<string | null> => {
    try {
      const timestamp = Math.round(new Date().getTime() / 1000);
      const paramsToSign = {
        timestamp: timestamp,
        upload_preset: "devora_uploads",
      };

      const sigRes = await fetch("/api/upload-signature", {
        method: "POST",
        body: JSON.stringify({ paramsToSign }),
      });
      const { signature } = await sigRes.json();

      const formData = new FormData();
      formData.append("file", file);
      formData.append("timestamp", timestamp.toString());
      formData.append("signature", signature);
      formData.append("upload_preset", "devora_uploads");
      formData.append("api_key", process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY as string);

      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME as string;
      const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

      const uploadRes = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        const errorData = await uploadRes.json();
        throw new Error(`Cloudinary upload failed: ${errorData.error.message}`);
      }

      const uploadData = await uploadRes.json();
      return uploadData.secure_url;
    } catch (err: any) {
      console.error("File upload error:", err);
      setError(err.message || "Failed to upload image");
      return null;
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setUploading(false);
    setError(null);

    let newPfpUrl = null;
    let newBannerUrl = null;

    try {
      setUploading(true);
      if (pfpFile) {
        newPfpUrl = await handleFileUpload(pfpFile);
        if (newPfpUrl) setPfpUrl(newPfpUrl);
      }
      if (bannerFile) {
        newBannerUrl = await handleFileUpload(bannerFile);
        if (newBannerUrl) setBannerUrl(newBannerUrl);
      }
      setUploading(false);

      if ((pfpFile && !newPfpUrl) || (bannerFile && !newBannerUrl)) {
        throw new Error(error || "Image upload failed. Please try again.");
      }

      const pdataRes = await fetch("/api/pdata", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const pdataData = await pdataRes.json();
      if (!pdataRes.ok) throw new Error(pdataData.error || "Failed to update personal data");

      const profileUpdateData: { pfp?: string; banner?: string; leetcode?: string } = {};
      if (newPfpUrl) profileUpdateData.pfp = newPfpUrl;
      if (newBannerUrl) profileUpdateData.banner = newBannerUrl;
      if (leetcodeUsername !== undefined) {
        profileUpdateData.leetcode = leetcodeUsername;
      }

      if (Object.keys(profileUpdateData).length > 0) {
        const userRes = await fetch("/api/user/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(profileUpdateData),
        });
        const userData = await userRes.json();
        if (!userRes.ok) throw new Error(userData.error || "Failed to update user profile");
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
        window.location.reload();
      }, 1000);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setUploading(false);
    }
  }

  // --- Styles ---
  const offWhite = "#E9E6D7";
  // Reduced padding (p-2.5) and smaller text for compact feel
  const inputBaseClasses = "w-full p-2.5 pl-9 bg-[#0a0a0a] border border-[#E9E6D7]/20 rounded-none focus:outline-none focus:border-[#E9E6D7] focus:ring-1 focus:ring-[#E9E6D7] transition-all text-[#E9E6D7] placeholder-[#E9E6D7]/30 text-sm";
  const textareaClasses = "w-full p-2.5 bg-[#0a0a0a] border border-[#E9E6D7]/20 rounded-none focus:outline-none focus:border-[#E9E6D7] focus:ring-1 focus:ring-[#E9E6D7] transition-all text-[#E9E6D7] placeholder-[#E9E6D7]/30 text-sm resize-none";
  const labelClasses = "block text-[10px] font-bold text-[#E9E6D7]/60 mb-1.5 uppercase tracking-wider";
  
  return (
    <div className="fixed inset-0 backdrop-blur-xl bg-black/80 flex items-center justify-center z-50 p-2 animate-in fade-in duration-200">
      <div 
        className="bg-[#050505] w-full max-w-5xl max-h-[95vh] overflow-y-auto border border-[#E9E6D7]/20 shadow-2xl relative flex flex-col"
        style={{ boxShadow: '0 0 40px -10px rgba(233, 230, 215, 0.1)' }}
      >
        
        {/* Compact Header */}
        <div className="sticky top-0 z-10 bg-[#050505]/95 backdrop-blur-md border-b border-[#E9E6D7]/10 px-5 py-3 flex items-center justify-between">
          <div className="flex items-baseline gap-3">
            <h2 className="text-lg font-bold tracking-tight" style={{ color: offWhite }}>
              Edit Profile
            </h2>
            <p className="text-[10px] text-[#E9E6D7]/50 uppercase tracking-widest hidden sm:block">Update Persona</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-[#E9E6D7]/10 rounded-full transition-colors text-[#E9E6D7]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Compact Body - Reduced padding and gaps */}
        <form onSubmit={handleSubmit} className="flex-1 p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            
            {/* COLUMN 1: Visual Assets & Stack */}
            <div className="space-y-5">
              
              {/* Image Uploaders - Now Side by Side */}
              <div>
                <h3 className={labelClasses}>Visual Assets</h3>
                <div className="flex gap-3">
                  {/* PFP Upload */}
                  <div 
                    onClick={() => pfpInputRef.current?.click()}
                    className="group relative flex-1 h-24 border border-dashed border-[#E9E6D7]/30 hover:border-[#E9E6D7] transition-all cursor-pointer bg-[#0a0a0a] flex flex-col items-center justify-center gap-1.5"
                  >
                     <input
                      ref={pfpInputRef}
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={(e) => setPfpFile(e.target.files ? e.target.files[0] : null)}
                    />
                    <div className="p-1.5 bg-[#E9E6D7]/5 rounded-full group-hover:bg-[#E9E6D7] group-hover:text-black transition-colors text-[#E9E6D7]">
                      <User size={16} />
                    </div>
                    <span className="text-[10px] text-[#E9E6D7]/60 group-hover:text-[#E9E6D7] truncate max-w-20">
                      {pfpFile ? "Selected" : "Avatar"}
                    </span>
                  </div>

                  {/* Banner Upload */}
                  <div 
                    onClick={() => bannerInputRef.current?.click()}
                    className="group relative flex-2 h-24 border border-dashed border-[#E9E6D7]/30 hover:border-[#E9E6D7] transition-all cursor-pointer bg-[#0a0a0a] flex flex-col items-center justify-center gap-1.5"
                  >
                    <input
                      ref={bannerInputRef}
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={(e) => setBannerFile(e.target.files ? e.target.files[0] : null)}
                    />
                    <div className="flex items-center gap-1.5 text-[#E9E6D7]/60 group-hover:text-[#E9E6D7] transition-colors">
                      <Upload size={14} />
                      <span className="text-[10px]">{bannerFile ? "Image Selected" : "Upload Banner"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stack */}
              <div>
                <h3 className={labelClasses}>Tech Stack</h3>
                <div className="relative">
                  <div className="absolute top-2.5 left-2.5 text-[#E9E6D7]/40">
                    <Cpu size={14} />
                  </div>
                  <textarea
                    name="stack"
                    value={formData.stack}
                    onChange={handleChange}
                    className={`${textareaClasses} pl-9 h-24`}
                    placeholder="Next.js, TS, Rust..."
                  />
                </div>
              </div>
            </div>

            {/* COLUMN 2: Details */}
            <div className="space-y-5">
              <div>
                <h3 className={labelClasses}>About You</h3>
                <div className="relative">
                  {/* Reduced height from h-64 to h-32/h-40 */}
                  <textarea
                    name="about"
                    value={formData.about}
                    onChange={handleChange}
                    className={`${textareaClasses} h-54`} 
                    placeholder="Tell your story. What are you building?"
                  />
                </div>
              </div>

              <div>
                <h3 className={labelClasses}>Developer Stats</h3>
                <div className="relative">
                  <textarea
                    name="devstats"
                    value={formData.devstats}
                    onChange={handleChange}
                    className={`${textareaClasses} h-20 font-mono text-xs leading-relaxed`}
                    placeholder={"Exp: 4 Years\nShipped: 12"}
                  />
                </div>
              </div>
            </div>

            {/* COLUMN 3: Presence */}
            <div className="space-y-5 flex flex-col h-full">
              <div>
                <h3 className={labelClasses}>Social Presence</h3>
                <div className="space-y-2.5">
                  
                  {/* LeetCode */}
                  <div className="relative group">
                    <div className="absolute top-2.5 left-2.5 text-[#E9E6D7]/40 group-focus-within:text-[#E9E6D7] transition-colors">
                      <Code2 size={14} />
                    </div>
                    <input
                      type="text"
                      value={leetcodeUsername}
                      onChange={(e) => setLeetcodeUsername(e.target.value)}
                      placeholder="LeetCode User"
                      className={inputBaseClasses}
                    />
                  </div>

                  {/* GitHub */}
                  <div className="relative group">
                    <div className="absolute top-2.5 left-2.5 text-[#E9E6D7]/40 group-focus-within:text-[#E9E6D7] transition-colors">
                      <Github size={14} />
                    </div>
                    <input
                      type="url"
                      name="github"
                      value={formData.socials.github}
                      onChange={handleSocialChange}
                      placeholder="GitHub URL"
                      className={inputBaseClasses}
                    />
                  </div>

                  {/* LinkedIn */}
                  <div className="relative group">
                    <div className="absolute top-2.5 left-2.5 text-[#E9E6D7]/40 group-focus-within:text-[#E9E6D7] transition-colors">
                      <Linkedin size={14} />
                    </div>
                    <input
                      type="url"
                      name="linkedin"
                      value={formData.socials.linkedin}
                      onChange={handleSocialChange}
                      placeholder="LinkedIn URL"
                      className={inputBaseClasses}
                    />
                  </div>

                  {/* Twitter */}
                  <div className="relative group">
                    <div className="absolute top-2.5 left-2.5 text-[#E9E6D7]/40 group-focus-within:text-[#E9E6D7] transition-colors">
                      <Twitter size={14} />
                    </div>
                    <input
                      type="url"
                      name="twitter"
                      value={formData.socials.twitter}
                      onChange={handleSocialChange}
                      placeholder="Twitter URL"
                      className={inputBaseClasses}
                    />
                  </div>

                  {/* Portfolio */}
                  <div className="relative group">
                    <div className="absolute top-2.5 left-2.5 text-[#E9E6D7]/40 group-focus-within:text-[#E9E6D7] transition-colors">
                      <Globe size={14} />
                    </div>
                    <input
                      type="url"
                      name="portfolio"
                      value={formData.socials.portfolio}
                      onChange={handleSocialChange}
                      placeholder="Portfolio URL"
                      className={inputBaseClasses}
                    />
                  </div>
                </div>
              </div>

              <div className="flex-1"></div>

              {/* Messages & Actions */}
              <div className="space-y-2 pt-4 border-t border-[#E9E6D7]/10">
                {error && (
                  <div className="bg-red-900/10 border border-red-900/30 text-red-400 p-2 text-xs flex items-center gap-2">
                     <span className="w-1 h-1 bg-red-500 rounded-full animate-pulse"/>
                     {error}
                  </div>
                )}
                {success && (
                  <div className="bg-[#E9E6D7]/10 border border-[#E9E6D7]/20 text-[#E9E6D7] p-2 text-xs flex items-center gap-2">
                    <span className="w-1 h-1 bg-[#E9E6D7] rounded-full"/>
                    Updated successfully.
                  </div>
                )}
                
                <button
                  type="submit"
                  disabled={loading || uploading}
                  className="w-full h-10 flex items-center justify-center gap-2 text-black font-bold text-xs tracking-wider uppercase disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.01] active:scale-[0.99]"
                  style={{ backgroundColor: offWhite }}
                >
                  {(loading || uploading) ? (
                    <>
                      <Loader2 className="animate-spin" size={14} />
                      {uploading ? "Uploading..." : "Saving..."}
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
</file>

<file path="lib/auth.ts">
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import type { Session, Account, Profile } from "next-auth";
import type { AuthOptions } from "next-auth";
import type { JWT } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { OAuthProfile } from "@/types/next-auth";
import { cookies } from "next/headers";
import { Prisma } from "@prisma/client";

export const authOptions: AuthOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
      authorization: {
        params: {
          scope: "read:user user:email repo",
        },
      },
      httpOptions: {
        timeout: 10000,
      },
    }),

    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_SECRET!,
      httpOptions: {
        timeout: 10000,
      },
    }),
  ],

  callbacks: {
    async signIn({ account, profile }) {
      if (!account || !profile) return false;

      const provider = account.provider;
      const oauth = profile as OAuthProfile;

      let providerId: string;
      let email: string | null = null;
      let name: string | null = null;
      let pfp: string | null = null;
      // Initialize banner (Standard OAuth providers usually don't send a banner, so this stays null)
      let banner: string | null = null;

      const isGoogle = "sub" in oauth;
      const providerIdField: "googleId" | "githubId" = isGoogle
        ? "googleId"
        : "githubId";

      if (isGoogle) {
        providerId = oauth.sub;
        email = oauth.email ?? null;
        name = oauth.name ?? null;
        pfp = oauth.picture ?? null;
      } else {
        providerId = oauth.id.toString();
        email = oauth.email ?? null;
        name = oauth.name ?? oauth.login ?? null;
        pfp = oauth.avatar_url ?? null;
      }

      // Explicit account linking using cookie
      if (provider === "github") {
        try {
          const cookieStore = await cookies();
          const linkUserId = cookieStore.get("link_account_user_id")?.value;

          if (linkUserId) {
            const userToLink = await prisma.user.findUnique({
              where: { id: parseInt(linkUserId) },
            });

            if (userToLink && !userToLink.githubId) {
              await prisma.user.update({
                where: { id: userToLink.id },
                data: {
                  githubId: providerId,
                  name: userToLink.name ?? name,
                  pfp: userToLink.pfp ?? pfp,
                  // We don't overwrite banner here to preserve existing user banner if they have one
                },
              });

              cookieStore.delete("link_account_user_id");
              return true;
            }
          }
        } catch {}
      }

      // 1. Lookup by provider
      let user = await prisma.user.findUnique({
        where: { [providerIdField]: providerId } as any, // safe here only
      });

      if (user) return true;

      // 2. Lookup by email
      if (email) {
        user = await prisma.user.findUnique({
          where: { email },
        });

        if (user) {
          await prisma.user.update({
            where: { id: user.id },
            data: { [providerIdField]: providerId },
          });

          return true;
        }
      }

      // 3. Create new user
      await prisma.user.create({
        data: {
          [providerIdField]: providerId,
          email,
          name,
          pfp,
          banner, // Added banner here
        },
      });

      return true;
    },

    async jwt({ token, account, profile }) {
      if (account) {
        if (account.access_token) {
          token.accessToken = account.access_token;
        }

        if (profile) {
          const oauth = profile as OAuthProfile;
          const provider = account.provider;

          let providerId: string;
          let email: string | null = null;

          if ("sub" in oauth) {
            providerId = oauth.sub;
            email = oauth.email ?? null;
          } else {
            providerId = oauth.id.toString();
            email = oauth.email ?? null;
          }

          // ---- FIXED: EXPLICIT, TYPE-SAFE WHERE INPUT ----
          let whereInput: Prisma.UserWhereUniqueInput | null = null;

          if (provider === "google") {
            whereInput = { googleId: providerId };
          } else if (provider === "github") {
            whereInput = { githubId: providerId };
          } else if (email) {
            whereInput = { email };
          }

          if (!whereInput) return token;

          // Lookup by provider
          let user = await prisma.user.findUnique({
            where: whereInput,
            select: { id: true },
          });

          // Fallback email
          if (!user && email) {
            user = await prisma.user.findUnique({
              where: { email },
              select: { id: true },
            });
          }

          if (user) {
            token.userId = String(user.id);
          }
        }
      }

      return token;
    },

    async session({ token, session }) {
      if (token.userId) {
        const user = await prisma.user.findUnique({
          where: { id: parseInt(token.userId) },
          select: {
            id: true,
            username: true,
            name: true,
            email: true,
            githubId: true,
            googleId: true,
            pfp: true,
            banner: true,
            leetcode: true,
            _count: {
              select: {
                followers: true,
                following: true,
              },
            },
          },
        });

        if (user) {
          session.userId = String(user.id);
          session.username = user.username;
          session.hasGitHub = !!user.githubId;
          session.hasGoogle = !!user.googleId;

          session.user = {
            ...session.user,
            name: user.name ?? session.user?.name,
            email: user.email ?? session.user?.email,
            image: user.pfp ?? session.user?.image,
            banner: user.banner ?? session.user?.banner, 
            followersCount: user._count.followers,
            followingCount: user._count.following,
          };
        }
      }

      session.accessToken = token.accessToken as string;
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};
</file>

<file path="components/Dashboard.tsx">
"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import UpdateProfileForm from "./UpdateProfileForm";
import DashboardContent from "./DashboardContent";
import { Pencil } from "lucide-react";
import UpdateNameModal from "./UpdateNameModal";

export default function Dashboard() {
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);

  const { data: session, update } = useSession();

  const userName = session?.user?.name || "User";
  const username = session?.username || "username_not_set";
  const userImage = session?.user?.image || "/default-avatar.png";
  const userBanner = (session?.user as any)?.banner as string | undefined;

  const followers = session?.user?.followersCount ?? 0;
  const following = session?.user?.followingCount ?? 0;

  const handleProfileModalClose = async (needsUpdate?: boolean) => {
    setIsProfileModalOpen(false);
    if (needsUpdate) {
      await update();
    }
  };

  const handleNameModalClose = async (needsUpdate?: boolean) => {
    setIsNameModalOpen(false);
    if (needsUpdate) {
      await update();
    }
  };

  return (
    <div className="w-full">
      {/* ===== Banner + Profile Header Section ===== */}
      {/* ===== Banner Section ===== */}
<div className="relative w-full">
  {/* Banner */}
  {userBanner ? (
    <img
      src={userBanner}
      alt={`${userName}'s banner`}
      className="w-full h-48 object-cover"
    />
  ) : (
    <div className="w-full h-48 bg-linear-to-r from-gray-700 via-gray-800 to-black" />
  )}

  {/* PROFILE HEADER BLOCK */}
  <div className="absolute bottom-0 left-0 w-full px-10 pb-4 flex items-end gap-6">

    {/* Profile Picture */}
    <div className="-mb-10">
      <div className="h-28 w-28 rounded-full overflow-hidden border-4 border-gray-900 shadow-lg bg-black">
        <img
          src={userImage}
          alt={userName}
          className="h-full w-full object-cover"
        />
      </div>
    </div>

    {/* User Text Section */}
    <div className="flex flex-col">
      <div className="flex items-center gap-2">
        <h2 className="text-2xl font-bold text-[#E9E6D7]">{userName}</h2>

        <button
          onClick={() => setIsNameModalOpen(true)}
          className="text-[#E9E6D7] hover:text-white transition"
        >
          <Pencil className="w-4 h-4" />
        </button>
      </div>

      <p className="text-[#E9E6D7] text-sm">@{username}</p>

      <div className="flex gap-4 mt-1">
        <span className="text-sm text-gray-300">
          <strong className="text-[#E9E6D7]">{followers}</strong> Followers
        </span>
        <span className="text-sm text-gray-300">
          <strong className="text-[#E9E6D7]">{following}</strong> Following
        </span>
      </div>
    </div>

    {/* Edit Profile button aligned to the right */}
    <div className="ml-auto mb-2">
      <button
        onClick={() => setIsProfileModalOpen(true)}
        className="bg-[#E9E6D7] hover:bg-gray-600 text-black hover:text-white font-semibold px-4 py-2 rounded-lg shadow-md transition active:scale-95"
      >
        Edit Profile
      </button>
    </div>
  </div>
</div>


      {/* Push content down to avoid overlap with header */}
      <div className="mt-20">
        {isProfileModalOpen && (
          <UpdateProfileForm onClose={handleProfileModalClose} />
        )}

        {isNameModalOpen && (
          <UpdateNameModal onClose={handleNameModalClose} currentName={userName} />
        )}

        <DashboardContent />
      </div>
    </div>
  );
}
</file>

<file path="package.json">
{
  "name": "startup",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint"
  },
  "dependencies": {
    "@prisma/client": "^6.19.0",
    "axios": "^1.13.2",
    "cloudinary": "^2.8.0",
    "dotenv": "^17.2.3",
    "lucide-react": "^0.553.0",
    "next": "16.0.7",
    "next-auth": "^4.24.13",
    "next-cloudinary": "^6.17.5",
    "prisma": "^6.19.0",
    "react": "19.2.0",
    "react-dom": "19.2.0",
    "react-icons": "^5.5.0"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "baseline-browser-mapping": "^2.9.4",
    "eslint": "^9",
    "eslint-config-next": "16.0.1",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
}
</file>

</files>
