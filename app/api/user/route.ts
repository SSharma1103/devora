import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/users
 * - Get user by username (if ?username= is provided)
 * - Get all users (if no query provided)
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get("username");
    const query = searchParams.get("q"); // optional: for partial search

    // 🔹 If username provided → get single user
    if (username) {
      const user = await prisma.user.findUnique({
        where: { username },
        include: {
          pdata: true,
          gitdata: true,
          projects: true,
          workExp: true,
        },
      });

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      return NextResponse.json({ success: true, data: user });
    }

    // 🔹 If q provided → partial search by username or name
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

      return NextResponse.json({ success: true, data: users });
    }

    // 🔹 Default → return all users (safe subset)
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
