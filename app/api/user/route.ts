import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ApiResponse, User } from "@/types";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get("username");
    const query = searchParams.get("q");

    // --- Get the current logged-in user's session (if any) ---
    const session = await getServerSession(authOptions);
    const currentUserId = session?.userId ? parseInt(session.userId) : null;

    // 🔹 CASE 1: If username provided → get single user (Full Profile)
    if (username) {
      const user = await prisma.user.findUnique({
        where: { username },
        include: {
          pdata: true,
          gitdata: true,
          projects: true,
          workExp: true,
          _count: {
            select: {
              followers: true,
              following: true,
            },
          },
        },
      });

      if (!user) {
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: "User not found" }, 
          { status: 404 }
        );
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

      // We return the User + extra boolean fields.
      // TypeScript infers this complex return type automatically here.
      return NextResponse.json({
        success: true,
        data: {
          ...user,
          isFollowedByCurrentUser,
          isCurrentUser,
        },
      });
    }

    // 🔹 CASE 2: If q provided → partial search (Limited Fields)
    if (query) {
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

      // FIX: Use Pick to match the 4 selected fields
      return NextResponse.json<ApiResponse<Pick<User, "id" | "name" | "username" | "pfp">[]>>({ 
        success: true, 
        data: users 
      });
    }

    // 🔹 CASE 3: Default → return recent users (Limited Fields)
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

    // FIX: Use Pick to match the 5 selected fields
    return NextResponse.json<ApiResponse<Pick<User, "id" | "name" | "username" | "pfp" | "createdAt">[]>>({ 
      success: true, 
      data: allUsers 
    });

  } catch (err: any) {
    console.error("Error fetching users:", err);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Failed to fetch users", message: err.message },
      { status: 500 }
    );
  }
}