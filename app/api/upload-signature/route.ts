// app/api/upload-signature/route.ts
import { v2 as cloudinary } from "cloudinary";
import { NextResponse } from "next/server";
import { ApiResponse } from "@/types";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET, 
  secure: true,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { paramsToSign } = body;

    if (paramsToSign.upload_preset !== "devora_uploads") {
       throw new Error("Upload preset name mismatch");
    }

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET as string 
    );

    // === FIX IS HERE ===
    // 1. Add the Generic Type: <ApiResponse<{ signature: string }>>
    // 2. Wrap the result in 'data' and add 'success: true'
    return NextResponse.json<ApiResponse<{ signature: string }>>({ 
      success: true, 
      data: { signature } 
    });

  } catch (error: any) {
    console.error("Error generating upload signature:", error);
    return NextResponse.json<ApiResponse<null>>(
      // Ensure specific error message is passed if available
      { success: false, error: error.message || "Failed to generate signature" },
      { status: 500 }
    );
  }
}