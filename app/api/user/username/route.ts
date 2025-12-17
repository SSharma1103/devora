import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { ApiResponse } from "@/types";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.userId) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { username: rawUsername } = await request.json();

    if (!rawUsername || typeof rawUsername !== "string") {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Username is required" },
        { status: 400 }
      );
    }

    // Normalize username: trim and convert to lowercase
    const username = rawUsername.trim().toLowerCase();

    if (!username) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Username cannot be empty" },
        { status: 400 }
      );
    }
    // Check if user already has a username
    const user = await prisma.user.findUnique({
      where: { id: parseInt(session.userId) },
      select: { username: true },
    });

    if (user?.username) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Username has already been set" },
        { status: 400 }
      );
    }

    // Check if username is already taken
    const existingUser = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });

    if (existingUser) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Username is already taken" },
        { status: 409 }
      );
    }

    // Update user with username
    await prisma.user.update({
      where: { id: parseInt(session.userId) },
      data: { username },
    });

    return NextResponse.json<ApiResponse<{ username: string }>>({
      success: true,
      data: { username },
    });
  } catch (error) {
    console.error("Error setting username:", error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
