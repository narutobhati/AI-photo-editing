"use client";

import { useState, useEffect } from "react";

type GenerationState = "idle" | "loading" | "error" | "success";

type LightboxImage = {
  src: string;
  title: string;
  downloadable?: boolean;
};

export default function HomePage() {
  const [prompt, setPrompt] = useState("");
  const [inputImageFile, setInputImageFile] = useState<File | null>(null);
  const [inputImagePreview, setInputImagePreview] = useState<string | null>(
    null
  );
  const [outputImageUrl, setOutputImageUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<GenerationState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // For full-screen preview
  const [lightboxImage, setLightboxImage] = useState<LightboxImage | null>(
    null
  );

  useEffect(() => {
    if (!inputImageFile) {
      setInputImagePreview(null);
      return;
    }
    const objectUrl = URL.createObjectURL(inputImageFile);
    setInputImagePreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [inputImageFile]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setInputImageFile(file);
    setOutputImageUrl(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage(null);
    setOutputImageUrl(null);

    try {
      const formData = new FormData();
      formData.append("prompt", prompt);
      if (inputImageFile) {
        formData.append("image", inputImageFile);
      }

      const res = await fetch("/api/edit-image", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Request failed with ${res.status}`);
      }

      const data: { imageUrl: string } = await res.json();
      setOutputImageUrl(data.imageUrl);
      setStatus("success");
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Something went wrong");
      setStatus("error");
    }
  };

  return (
    <main className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          AI Product Image Editor
        </h1>
        <p className="text-sm text-slate-300">
          Upload a product image (optional), describe your desired edit in plain
          English (e.g.{" "}
          <span className="italic">
            “put it on a white studio background with soft shadows”
          </span>
          ), and let AI generate a marketing-ready asset.
        </p>
      </header>

      <section className="grid gap-6 md:grid-cols-2">
        {/* Left side: controls */}
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-lg"
        >
          <div className="space-y-2">
            <label className="text-sm font-medium">Product image (optional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="block w-full text-sm file:mr-4 file:rounded-md file:border-0 file:bg-sky-600 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white hover:file:bg-sky-500"
            />
            <p className="text-xs text-slate-400">
              You can upload an image to edit it, or leave this empty to let AI
              generate one from scratch.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Edit instruction</label>
            <textarea
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder='Example: "Place this shoe on a clean white background with a soft drop shadow"'
              required
            />
          </div>

          <button
            type="submit"
            disabled={status === "loading"}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === "loading" ? (
              <>
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-slate-200 border-t-transparent" />
                Generating…
              </>
            ) : (
              "Generate edited image"
            )}
          </button>

          {status === "error" && errorMessage && (
            <p className="text-xs text-red-400">Error: {errorMessage}</p>
          )}
        </form>

        {/* Right side: previews */}
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            
            <div className="space-y-2">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Original
              </h2>
              <div className="flex aspect-square items-center justify-center overflow-hidden rounded-2xl border border-dashed border-slate-700 bg-slate-900/60">
                {inputImagePreview ? (
                  <img
                    src={inputImagePreview}
                    alt="Original upload preview"
                    className="h-full w-full cursor-zoom-in object-cover"
                    onClick={() =>
                      setLightboxImage({
                        src: inputImagePreview,
                        title: "Original image",
                        downloadable: false,
                      })
                    }
                  />
                ) : (
                  <span className="text-xs text-slate-500">No image selected</span>
                )}
              </div>
            </div>

            {/* AI Output */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  AI Output
                </h2>
                {outputImageUrl && (
                  <a
                    href={outputImageUrl}
                    download="ai-generated-image.png"
                    className="rounded-md bg-slate-800 px-2 py-1 text-[10px] font-medium text-slate-100 hover:bg-slate-700"
                  >
                    Download
                  </a>
                )}
              </div>
              <div className="flex aspect-square items-center justify-center overflow-hidden rounded-2xl border border-slate-700 bg-slate-900/60">
                {status === "loading" && (
                  <span className="text-xs text-slate-400">
                    Generating your image…
                  </span>
                )}
                {outputImageUrl && (
                  <img
                    src={outputImageUrl}
                    alt="AI edited result"
                    className="h-full w-full cursor-zoom-in object-cover"
                    onClick={() =>
                      setLightboxImage({
                        src: outputImageUrl,
                        title: "AI generated image",
                        downloadable: true,
                      })
                    }
                  />
                )}
                {!outputImageUrl && status !== "loading" && (
                  <span className="text-xs text-slate-500">
                    Result will appear here
                  </span>
                )}
              </div>
            </div>
          </div>

          {status === "success" && (
            <p className="text-xs text-emerald-400">
              AI edit complete. Click the image to view full size or download
              the output.
            </p>
          )}
        </div>
      </section>

  

      {/* Lightbox / Fullscreen preview */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 py-8"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="relative max-h-full max-w-4xl"
            onClick={(e) => e.stopPropagation()} // prevent closing when clicking on image
          >
            <div className="mb-2 flex items-center justify-between gap-4">
              <span className="text-xs font-medium text-slate-200">
                {lightboxImage.title}
              </span>
              <div className="flex items-center gap-2">
                {lightboxImage.downloadable && (
                  <a
                    href={lightboxImage.src}
                    download="ai-generated-image.png"
                    className="rounded-md bg-slate-800 px-3 py-1 text-xs font-medium text-slate-100 hover:bg-slate-700"
                  >
                    Download
                  </a>
                )}
                <button
                  onClick={() => setLightboxImage(null)}
                  className="rounded-full bg-slate-900/80 px-2.5 py-1 text-xs font-medium text-slate-200 hover:bg-slate-800"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="max-h-[80vh] overflow-auto rounded-2xl border border-slate-700 bg-slate-950">
              <img
                src={lightboxImage.src}
                alt={lightboxImage.title}
                className="h-full w-full object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
