import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import {Pdata,ApiResponse} from "@/types"

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.userId)
      return NextResponse.json<ApiResponse<null>>({success:false, error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: parseInt(session.userId) },
    });

    if (!user)
      return NextResponse.json<ApiResponse<null>>({success:false, error: "User not found" }, { status: 404 });

    const pdata = await prisma.pdata.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id },
    });

    return NextResponse.json<ApiResponse<Pdata>>({ success: true, data: pdata });
  } catch (err: any) {
    console.error("Error fetching personal data:", err);
    return NextResponse.json<ApiResponse<null>>(
      { success:false,error: "Failed to fetch personal data", message: err.message },
      { status: 500 }
    );
  }
}



export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.userId) {
      return NextResponse.json<ApiResponse<null>>({ success:false,error: "Unauthorized" }, { status: 401 });
    }

    // Convert userId from string to Int for Prisma
    const userId = parseInt(session.userId);

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json<ApiResponse<null>>({ success:false,error: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    const { about, devstats, stack, socials } = body;

    // Validate incoming data
    if (
      typeof about !== "string" &&
      typeof devstats !== "string" &&
      typeof stack !== "string" &&
      typeof socials !== "object"
    ) {
      return NextResponse.json(
        { error: "Invalid data format" },
        { status: 400 }
      );
    }

    // ✅ Upsert ensures the record exists or is created
    const updated = await prisma.pdata.upsert({
      where: { userId },
      update: { about, devstats, stack, socials },
      create: { userId, about, devstats, stack, socials },
    });

    return NextResponse.json<ApiResponse<Pdata>>({ success: true, data: updated });
  } catch (err: any) {
    console.error("Error updating personal data:", err);
    return NextResponse.json<ApiResponse<null>>(
      { success:false,error: "Failed to update personal data", message: err.message },
      { status: 500 }
    );
  }
}

