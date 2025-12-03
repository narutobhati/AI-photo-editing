// app/api/edit-image/route.ts
import { NextRequest, NextResponse } from "next/server";
import { generateWithStability } from "@/lib/ai";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const prompt = formData.get("prompt");
    const image = formData.get("image");

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'prompt' field" },
        { status: 400 }
      );
    }

    let imageBytes: Buffer | undefined = undefined;
    let mimeType: string | undefined = undefined;

    // If an image was uploaded, convert it to bytes for Stability
    if (image && image instanceof File && image.size > 0) {
      const arrBuf = await image.arrayBuffer();
      imageBytes = Buffer.from(arrBuf);
      mimeType = image.type || "image/png";
    }

    const imageUrl = await generateWithStability({
      instruction: prompt,
      imageBytes,
      mimeType,
    });

    return NextResponse.json({ imageUrl }, { status: 200 });
  } catch (err: any) {
    console.error("Error in /api/edit-image:", err);
    return NextResponse.json(
      {
        error:
          err?.message ||
          "Unexpected error while generating image with Stability.",
      },
      { status: 500 }
    );
  }
}
