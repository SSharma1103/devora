import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { ApiResponse ,WorkExp } from "@/types";

// Define the type for the route context
type RouteParams = { params: Promise<{ id: string }> };

export async function GET(
  request: Request,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    // 1. Await the params object
    const { id } = await params;

    if (!session?.userId) {
      return NextResponse.json<ApiResponse<null>>(
        { success:false,error: "Unauthorized" },
        { status: 401 }
      );
    }

    const workExp = await prisma.workExp.findFirst({
      where: {
        id: parseInt(id), // Use the awaited ID
        userId: parseInt(session.userId),
      },
    });

    if (!workExp) {
      return NextResponse.json<ApiResponse<null>>(
        { success:false,error: "Work experience not found" },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<WorkExp>>({ success: true, data: workExp });
  } catch (error: any) {
    console.error("Error fetching work experience:", error);
    return NextResponse.json<ApiResponse<null>>(
      { success:false,error: "Failed to fetch work experience", message: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    // 1. Await the params object
    const { id } = await params;

    if (!session?.userId) {
      return NextResponse.json<ApiResponse<null>>(
        { success:false,error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, duration, description, companyName, image } = body;

    // Verify work experience belongs to user
    const existingWorkExp = await prisma.workExp.findFirst({
      where: {
        id: parseInt(id), // Use the awaited ID
        userId: parseInt(session.userId),
      },
    });

    if (!existingWorkExp) {
      return NextResponse.json<ApiResponse<null>>(
        { success:false,error: "Work experience not found" },
        { status: 404 }
      );
    }

    const workExp = await prisma.workExp.update({
      where: { id: parseInt(id) },
      data: {
        ...(title !== undefined && { title }),
        ...(duration !== undefined && { duration }),
        ...(description !== undefined && { description }),
        ...(companyName !== undefined && { companyName }),
        ...(image !== undefined && { image }),
      },
    });

    return NextResponse.json<ApiResponse<WorkExp>>({ success: true, data: workExp });
  } catch (error: any) {
    console.error("Error updating work experience:", error);
    return NextResponse.json<ApiResponse<null>>(
      { success:false,error: "Failed to update work experience", message: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    // 1. Await the params object
    const { id } = await params;

    if (!session?.userId) {
      return NextResponse.json<ApiResponse<null>>(
        { success:false,error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify work experience belongs to user
    const existingWorkExp = await prisma.workExp.findFirst({
      where: {
        id: parseInt(id), // Use the awaited ID
        userId: parseInt(session.userId),
      },
    });

    if (!existingWorkExp) {
      return NextResponse.json<ApiResponse<null>>(
        { success:false ,error: "Work experience not found" },
        { status: 404 }
      );
    }

    await prisma.workExp.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json<ApiResponse<null>>({ success: true, message: "Work experience deleted" });
  } catch (error: any) {
    console.error("Error deleting work experience:", error);
    return NextResponse.json<ApiResponse<null>>(
      { success:false,error: "Failed to delete work experience", message: error.message },
      { status: 500 }
    );
  }
}