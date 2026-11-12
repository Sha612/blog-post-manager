import { PlusIcon } from "lucide-react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { Suspense } from "react";
import { ApiStatus } from "@/components/api-status";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "Blog Post Manager", template: "%s · Blog Post Manager" },
  description: "Create, read, update and delete blog posts.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:ring-2 focus:ring-ring"
        >
          Skip to content
        </a>
        <header className="border-b">
          <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-4 px-4">
            <Link href="/" className="font-semibold tracking-tight">
              Blog Post Manager
            </Link>
            <Button asChild size="sm">
              <Link href="/posts/new">
                <PlusIcon aria-hidden="true" />
                New post
              </Link>
            </Button>
          </div>
        </header>

        <main
          id="main"
          className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-8"
        >
          {children}
        </main>

        <footer className="border-t">
          <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-4 text-sm text-muted-foreground">
            <span>NestJS · Next.js · PostgreSQL</span>
            <Suspense fallback={<span>Checking API…</span>}>
              <ApiStatus />
            </Suspense>
          </div>
        </footer>

        <Toaster richColors closeButton />
      </body>
    </html>
  );
}
