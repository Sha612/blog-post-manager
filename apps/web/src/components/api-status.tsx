import { getApiUrl } from "@/lib/server-env";
async function isApiOnline(): Promise<boolean> {
  try {
    const response = await fetch(`${getApiUrl()}/health`, {
      cache: "no-store",
      signal: AbortSignal.timeout(2_000),
    });
    return response.ok;
  } catch {
    return false;
  }
}
/** Live API status, rendered on the server at request time. */
export async function ApiStatus() {
  const online = await isApiOnline();
  return (
    <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
      <span
        aria-hidden="true"
        className={`size-2 rounded-full ${online ? "bg-emerald-500" : "bg-red-500"}`}
      />
      {online ? "API online" : "API offline"}
    </span>
  );
}
