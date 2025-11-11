import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

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

    return NextResponse.json({ success: true, data: workExp });
  } catch (error: any) {
    console.error("Error fetching work experience:", error);
    return NextResponse.json(
      { error: "Failed to fetch work experience", message: error.message },
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
      return NextResponse.json(
        { error: "Title is required" },
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

    return NextResponse.json({ success: true, data: workExp }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating work experience:", error);
    return NextResponse.json(
      { error: "Failed to create work experience", message: error.message },
      { status: 500 }
    );
  }
}

