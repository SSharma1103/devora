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