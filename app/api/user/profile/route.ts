import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt(session.userId);
    const body = await request.json();
    const { pfp, banner } = body;

    // Validate that we are only receiving strings
    const dataToUpdate: { pfp?: string; banner?: string } = {};
    if (typeof pfp === 'string') {
      dataToUpdate.pfp = pfp;
    }
    if (typeof banner === 'string') {
      dataToUpdate.banner = banner;
    }

    if (Object.keys(dataToUpdate).length === 0) {
       return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
    });

    return NextResponse.json({ success: true, data: updatedUser });
  } catch (err: any) {
    console.error("Error updating user profile:", err);
    return NextResponse.json(
      { error: "Failed to update profile", message: err.message },
      { status: 500 }
    );
  }
}