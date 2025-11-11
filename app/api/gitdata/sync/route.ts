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

