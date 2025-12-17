import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { ApiResponse , Project } from "@/types";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.userId) {
      return NextResponse.json<ApiResponse<null>>(
        { success:false ,error: "Unauthorized" },
        { status: 401 }
      );
    }

    const projects = await prisma.project.findMany({
      where: { userId: parseInt(session.userId) },
      orderBy: { id: "desc" },
    });

    return NextResponse.json<ApiResponse<Project[]>>({ success: true, data: projects });
  } catch {
    console.error("Error fetching projects:");
    return NextResponse.json<ApiResponse<null>>(
      { success:false ,error: "Failed to fetch projects"},
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.userId) {
      return NextResponse.json<ApiResponse<null>>(
        { success:false,error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, link, description, gitlink } = body;

    if (!title) {
      return NextResponse.json<ApiResponse<null>>(
        { success:false ,error: "Title is required" },
        { status: 400 }
      );
    }

    const project = await prisma.project.create({
      data: {
        title,
        link: link || null,
        description: description || null,
        gitlink: gitlink || null,
        userId: parseInt(session.userId),
      },
    });

    return NextResponse.json<ApiResponse<Project>>({ success: true, data: project }, { status: 201 });
  } catch {
    console.error("Error creating project:");
    return NextResponse.json<ApiResponse<null>>(
      { success:false,error: "Failed to create project" },
      { status: 500 }
    );
  }
}

