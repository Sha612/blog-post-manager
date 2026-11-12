import "server-only";
import { getApiUrl } from "@/lib/server-env";
import { ApiError } from "./api-error";

const TIMEOUT_MS = 5_000;

/**
 * Calls the NestJS API from the server. Responses are never cached, so
 * every render shows current data. Any failure, including an unreachable
 * API or a timeout, is thrown as an ApiError.
 */
export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("accept", "application/json");
  if (init.body !== undefined) {
    headers.set("content-type", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(`${getApiUrl()}${path}`, {
      ...init,
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    throw ApiError.unreachable();
  }

  if (response.status === 204) {
    return undefined as T;
  }
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw ApiError.fromResponse(response.status, body);
  }
  return body as T;
}
