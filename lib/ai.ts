// lib/ai.ts

const apiKey = process.env.STABILITY_API_KEY;

if (!apiKey) {
  console.warn(
    "STABILITY_API_KEY is not set. Image generation will fail until you configure it."
  );
}

type GenerationMode = "text-to-image" | "image-to-image";

/**
 * Generate or edit a product-style marketing image using Stability SD3.
 *
 * - If `imageBytes` is provided => image-to-image (edit)
 * - If not => text-to-image (pure generation)
 *
 * Returns a base64 data URL ready to use in <img src="...">
 */
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

  const fullPrompt = `
Generate a clean, high-quality, realistic e-commerce product photo.

User edit instruction:

${instruction}

The result should be sharp, well lit, and professional, suitable for product listings or ads.
`.trim();

  const formData = new FormData();
  formData.append("prompt", fullPrompt);
  formData.append("output_format", "png");
  formData.append("mode", mode);
  formData.append("model", "sd3-medium"); // or "sd3-large", etc.

  // ❗ aspect_ratio is ONLY allowed for text-to-image mode
  if (mode === "text-to-image") {
    formData.append("aspect_ratio", "1:1");
  }

  // If editing an existing image, attach it and strength
  if (imageBytes) {
    const blob = new Blob([imageBytes], {
      type: mimeType || "image/png",
    });
    formData.append("image", blob, "input-image.png");
    // Controls how much the prompt changes the original (0–1)
    formData.append("strength", "0.35");
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

    if (message.includes("401") || message.includes("403")) {
      throw new Error(
        "Stability API key is invalid or unauthorized. Double-check STABILITY_API_KEY."
      );
    }
    if (message.includes("429")) {
      throw new Error(
        "Stability rate limit or quota reached. Please check your Stability dashboard."
      );
    }

    throw new Error("Stability image generation failed: " + message);
  }
}
