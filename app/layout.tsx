// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Product Image Editor",
  description: "Simple AI-powered product image editor demo using Gemini",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
        <div className="max-w-4xl mx-auto px-4 py-8">{children}</div>
      </body>
    </html>
  );
}
