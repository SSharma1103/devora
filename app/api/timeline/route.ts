import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { 
  ApiResponse, 
  FeedItem, 
  ProjectItem, 
  WorkExpItem 
} from "@/types";

export async function GET() {
  try {
    // 1. Authentication Check
    const session = await getServerSession(authOptions);
    const currentUserId = session?.userId ? parseInt(session.userId) : null;

    if (!currentUserId) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Unauthorized" }, 
        { status: 401 }
      );
    }

    // 2. Find all users the current user is following
    const following = await prisma.follow.findMany({
      where: { followerId: currentUserId },
      select: { followingId: true },
    });
    
    const followingIds = following.map((f) => f.followingId);

    // Optimization: If following no one, return empty immediately
    if (followingIds.length === 0) {
      return NextResponse.json<ApiResponse<FeedItem[]>>({ 
        success: true, 
        data: [] 
      });
    }

    // 3. Get the latest projects from those users
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
      take: 20,
    });

    // 4. Get the latest work experiences from those users
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
      take: 20,
    });

    // 5. Map Projects to Feed Item Structure (Fix applied here)
    const mappedProjects: ProjectItem[] = projects.map((project) => ({
      type: "project",
      timestamp: project.createdAt,
      item: {
        ...project,
        // The '!' asserts that user is not null, fixing the type error
        user: project.user! 
      },
    }));

    // 6. Map Work Experience to Feed Item Structure (Fix applied here)
    const mappedWorkExps: WorkExpItem[] = workExps.map((workExp) => ({
      type: "workexp",
      timestamp: workExp.createdAt,
      item: {
        ...workExp,
        // The '!' asserts that user is not null, fixing the type error
        user: workExp.user! 
      },
    }));

    // 7. Combine, Sort (Newest First), and Slice
    const feed: FeedItem[] = [...mappedProjects, ...mappedWorkExps]
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 30);

    // 8. Return Response
    return NextResponse.json<ApiResponse<FeedItem[]>>({ 
      success: true, 
      data: feed 
    });

  } catch (err: any) {
    console.error("Error fetching timeline:", err);
    return NextResponse.json<ApiResponse<null>>(
      { 
        success: false, 
        error: "Failed to fetch timeline", 
        message: err.message 
      },
      { status: 500 }
    );
  }
}