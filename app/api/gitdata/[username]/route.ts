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
