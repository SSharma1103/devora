import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { ApiResponse, User } from "@/types";

// GET: Fetches only specific profile fields
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.userId) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Unauthorized" }, 
        { status: 401 }
      );
    }

    const userId = parseInt(session.userId);

    // We select only specific fields to reduce payload size
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        pfp: true,
        banner: true,
        leetcode: true,
      },
    });

    if (!user) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "User not found" }, 
        { status: 404 }
      );
    }

    // We use Pick<User, ...> because 'user' variable only has these 3 properties, not the full User type
    return NextResponse.json<ApiResponse<Pick<User, "pfp" | "banner" | "leetcode">>>({ 
      success: true, 
      data: user 
    });

  } catch (err: any) {
    console.error("Error fetching user profile:", err);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Failed to fetch profile", message: err.message },
      { status: 500 }
    );
  }
}

// PATCH: Updates profile and returns the FULL user object
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.userId) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Unauthorized" }, 
        { status: 401 }
      );
    }

    const userId = parseInt(session.userId);
    const body = await request.json();
    const { pfp, banner, leetcode } = body;

    // Validate inputs
    const dataToUpdate: { pfp?: string; banner?: string; leetcode?: string } = {};
    
    if (typeof pfp === 'string') dataToUpdate.pfp = pfp;
    if (typeof banner === 'string') dataToUpdate.banner = banner;
    if (typeof leetcode === 'string') dataToUpdate.leetcode = leetcode;

    if (Object.keys(dataToUpdate).length === 0) {
       return NextResponse.json<ApiResponse<null>>(
         { success: false, error: "No valid fields to update" }, 
         { status: 400 }
       );
    }

    // Update the user
    // Note: We do NOT use 'select' here, so Prisma returns the FULL user object.
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
    });

    // Since 'updatedUser' has all fields, we can safely use the full <User> type here
    return NextResponse.json<ApiResponse<User>>({ 
      success: true, 
      data: updatedUser 
    });

  } catch (err: any) {
    console.error("Error updating user profile:", err);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Failed to update profile", message: err.message },
      { status: 500 }
    );
  }
}