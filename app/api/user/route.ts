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