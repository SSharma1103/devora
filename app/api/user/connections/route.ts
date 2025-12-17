import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { ApiResponse,User,BasicUser } from "@/types";

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
      return NextResponse.json<ApiResponse<null>>({ success:false,error: "Unauthorized" }, { status: 401 });
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

    
    let users: BasicUser[];

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
      return NextResponse.json<ApiResponse<null>>(
        { success:false,error: "Invalid type. Must be 'followers' or 'following'." },
        { status: 400 }
      );
    }

    return NextResponse.json<ApiResponse<BasicUser[]>>({ success: true, data: users });
  } catch (err: any) {
    console.error("Error fetching connections:", err);
    return NextResponse.json<ApiResponse<null>>(
      { success:false,error: "Failed to fetch connections", message: err.message },
      { status: 500 }
    );
  }
}