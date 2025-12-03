

const apiKey = process.env.STABILITY_API_KEY;

if (!apiKey) {
  console.warn(
    "STABILITY_API_KEY is not set. Image generation will fail until you configure it."
  );
}

type GenerationMode = "text-to-image" | "image-to-image";

export async function generateWithStability(params: {
  instruction: string;
  imageBytes?: Buffer;
  mimeType?: string;
}): Promise<string> {
  const { instruction, imageBytes, mimeType } = params;

  if (!apiKey) {
    throw new Error("STABILITY_API_KEY is missing in environment variables.");
  }

  const mode: GenerationMode = imageBytes ? "image-to-image" : "text-to-image";

  const fullPrompt =
    mode === "image-to-image"
      ? `
You are editing the provided product photo.

Apply ONLY these changes: ${instruction}

Keep the same product, shape, camera angle and proportions.
Do NOT change the object identity.
Do NOT add extra objects, people, text, or logos.
Just adjust background, colors and lighting to match the request.
`.trim()
      : `
Generate a clean, high-quality, realistic e-commerce product photo.

Follow this instruction: ${instruction}

The result should be sharp, well lit, and professional, suitable for product listings or ads.
`.trim();

  const formData = new FormData();
  formData.append("prompt", fullPrompt);
  formData.append("output_format", "png");
  formData.append("mode", mode);
  formData.append("model", "sd3-medium");

  
  if (mode === "text-to-image") {
    formData.append("aspect_ratio", "1:1");
  }

  if (imageBytes) {
    const blob = new Blob([imageBytes], {
      type: mimeType || "image/png",
    });
    formData.append("image", blob, "input-image.png");
    formData.append("strength", "0.25"); 
  }

  try {
    const response = await fetch(
      "https://api.stability.ai/v2beta/stable-image/generate/sd3",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: "image/*",
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new Error(
        `Stability API error ${response.status}: ${
          errorText || "Unknown error from Stability"
        }`
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString("base64");

    return `data:image/png;base64,${base64}`;
  } catch (err: any) {
    console.error("Stability API error:", err);
    const message = err?.message || String(err);
    throw new Error("Stability image generation failed: " + message);
  }
}
