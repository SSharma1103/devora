import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { ApiResponse } from "@/types";

// POST /api/user/follow - Follow a user
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const currentUserId = session?.userId ? parseInt(session.userId) : null;

    if (!currentUserId) {
      return NextResponse.json<ApiResponse<null>>({ success:false ,error: "Unauthorized" }, { status: 401 });
    }

    const { targetUserId } = await request.json();

    if (!targetUserId || typeof targetUserId !== 'number') {
      return NextResponse.json<ApiResponse<null>>({ success:false,error: "targetUserId is required and must be a number" }, { status: 400 });
    }

    if (currentUserId === targetUserId) {
      return NextResponse.json<ApiResponse<null>>({ success:false,error: "You cannot follow yourself" }, { status: 400 });
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
      return NextResponse.json<ApiResponse<null>>({ success:false,error: "Already following" }, { status: 409 });
    }

    // Create the follow relationship
    await prisma.follow.create({
      data: {
        followerId: currentUserId,
        followingId: targetUserId,
      },
    });

    return NextResponse.json<ApiResponse<null>>({ success: true, message: "Successfully followed user" }, { status: 201 });

  } catch (error) {
    console.error("Error following user:", error);
    return NextResponse.json<ApiResponse<null>>({success:false, error: "Internal server error" }, { status: 500 });
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
      return NextResponse.json<ApiResponse<null>>({ success:false,error: "targetUserId is required" }, { status: 400 });
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
      return NextResponse.json<ApiResponse<null>>({success:false, error: "Not following" }, { status: 404 });
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

    return NextResponse.json<ApiResponse<null>>({ success: true, message: "Successfully unfollowed user" });

  } catch (error) {
    console.error("Error unfollowing user:", error);
    return NextResponse.json<ApiResponse<null>>({ success:false,error: "Internal server error" }, { status: 500 });
  }
}