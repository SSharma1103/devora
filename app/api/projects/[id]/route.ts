import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const project = await prisma.project.findFirst({
      where: {
        id: parseInt(params.id),
        userId: parseInt(session.userId),
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: project });
  } catch  {
    console.error("Error fetching project:");
    return NextResponse.json(
      { error: "Failed to fetch project" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, link, description, gitlink } = body;

    // Verify project belongs to user
    const existingProject = await prisma.project.findFirst({
      where: {
        id: parseInt(params.id),
        userId: parseInt(session.userId),
      },
    });

    if (!existingProject) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    const project = await prisma.project.update({
      where: { id: parseInt(params.id) },
      data: {
        ...(title !== undefined && { title }),
        ...(link !== undefined && { link }),
        ...(description !== undefined && { description }),
        ...(gitlink !== undefined && { gitlink }),
      },
    });

    return NextResponse.json({ success: true, data: project });
  } catch {
    console.error("Error updating project:");
    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify project belongs to user
    const existingProject = await prisma.project.findFirst({
      where: {
        id: parseInt(params.id),
        userId: parseInt(session.userId),
      },
    });

    if (!existingProject) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    await prisma.project.delete({
      where: { id: parseInt(params.id) },
    });

    return NextResponse.json({ success: true, message: "Project deleted" });
  } catch {
    console.error("Error deleting project:");
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 }
    );
  }
}

