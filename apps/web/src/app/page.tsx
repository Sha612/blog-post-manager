import { Suspense } from "react";
import { ApiStatus } from "@/components/api-status";

export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Blog Post Manager</h1>
      <Suspense
        fallback={<span className="text-sm text-neutral-500">Checking API…</span>}
      >
        <ApiStatus />
      </Suspense>
    </main>
  );
}
