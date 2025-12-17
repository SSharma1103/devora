import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { ApiResponse ,WorkExp } from "@/types";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const workExp = await prisma.workExp.findMany({
      where: { userId: parseInt(session.userId) },
      orderBy: { id: "desc" },
    });

    return NextResponse.json<ApiResponse<WorkExp[]>>({ success: true, data: workExp });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json<ApiResponse<null>>(
      { success: false,error: "Failed to fetch work experience", message:errorMessage },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, duration, description, companyName, image } = body;

    if (!title) {
      return NextResponse.json<ApiResponse<null>>(
        
        
        { success: false,error: "Title is required" , message:'Title is required'},
        { status: 400 }
      );
    }

    const workExp = await prisma.workExp.create({
      data: {
        title,
        duration: duration || null,
        description: description || null,
        companyName: companyName || null,
        image: image || null,
        userId: parseInt(session.userId),
      },
    });

    return NextResponse.json<ApiResponse<WorkExp>>({ success: true, data: workExp }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating work experience:", error);
    return NextResponse.json(
      { error: "Failed to create work experience", message: error.message },
      { status: 500 }
    );
  }
}

